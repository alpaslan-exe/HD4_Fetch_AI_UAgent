# agent_recommender/main.py
from fastapi import FastAPI
from typing import List, Any, Union
import os
import json
import traceback
from base64 import b64decode

from agent_recommender.schemas import RecommendRequest, RecommendResponse
from agent_recommender.agent import agent  # your Agent + Protocol live here
from agent_recommender.agent_lite import (
    RecommendRequestMsg,
    RecommendResponseMsg,
    CourseInLite,
)
from agent_recommender.scoring import base_score, naive_keyword_match, blend_score
from agent_recommender.config import MAX_EVALS

from uagents.query import query
from uagents.resolver import RulesBasedResolver

try:
    # Some uAgents builds expose Envelope here
    from uagents.types import Envelope  # type: ignore
except Exception:  # pragma: no cover
    Envelope = None  # type: ignore


app = FastAPI(title="Professor Recommender Gateway (uAgents-compatible)")

# Make sure the global client knows where the Bureau is (agent runs on :8000)
os.environ.setdefault("QUERY_SERVER", "http://127.0.0.1:8000")

# Must match the Protocol name you used in agent.py
PROTOCOL_NAME = "professor_recommender_protocol"

# Resolver mapping (many builds require /submit)
RESOLVER = RulesBasedResolver({agent.address: "http://127.0.0.1:8000/submit"})


def _dump_model(m: Any) -> dict:
    """Pydantic v2/v1 compatible dump."""
    if hasattr(m, "model_dump"):
        return m.model_dump()
    if hasattr(m, "dict"):
        return m.dict()
    return dict(m)


def _safe_float(x, default=0.0) -> float:
    try:
        return float(x)
    except Exception:
        return float(default)


async def await_query_tolerant(address: str, msg: Any) -> Any:
    """
    Try multiple uAgents query() signatures to handle version deltas.
    Order matters; we fall through on TypeError signature mismatches.
    """
    # 1) Newer style: keywords for protocol + resolver
    try:
        return await query(address, msg, protocol=PROTOCOL_NAME, resolver=RESOLVER)
    except TypeError:
        pass
    # 2) Positional: resolver third, protocol fourth
    try:
        return await query(address, msg, RESOLVER, PROTOCOL_NAME)
    except TypeError:
        pass
    # 3) Mixed: protocol third, resolver kw
    try:
        return await query(address, msg, PROTOCOL_NAME, resolver=RESOLVER)
    except TypeError:
        pass
    # 4) Resolver only (can return MsgStatus or Envelope depending on build)
    try:
        return await query(address, msg, resolver=RESOLVER)
    except TypeError:
        pass
    # 5) Absolute fallback: bare query (global QUERY_SERVER must be set)
    return await query(address, msg)


def _unwrap_envelope(resp: Any) -> Union[None, RecommendResponse]:
    """
    If resp is an Envelope, decode its payload (base64 JSON) and
    extract {"recommendations": [...]}. Returns a RecommendResponse or None.
    """
    if Envelope is None or not isinstance(resp, Envelope):
        return None
    try:
        raw = b64decode(resp.payload).decode("utf-8", errors="ignore")
        data = json.loads(raw)
        recs = data.get("recommendations")
        if isinstance(recs, list) and all(isinstance(x, str) for x in recs):
            return RecommendResponse(recommendations=recs)
        # Fallback: stringify decoded payload if it isn't the expected shape
        return RecommendResponse(recommendations=[str(data)])
    except Exception as de:
        return RecommendResponse(
            recommendations=[f"[GATEWAY] failed to decode envelope: {type(de).__name__}: {de}"]
        )


@app.get("/health")
async def health():
    return {"status": "ok", "agent_address": agent.address}


@app.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
    """
    Full path via uAgents. Requires the agent to be running on :8000.
    """
    # Convert API models -> wire models
    lite_courses: List[CourseInLite] = [
        CourseInLite(course=c.course, instructors=[_dump_model(i) for i in c.instructors])
        for c in req.courses
    ]
    message = RecommendRequestMsg(preference_tags=req.preference_tags, courses=lite_courses)

    try:
        resp: Any = await await_query_tolerant(agent.address, message)

        # --- DEBUG to uvicorn console ---
        try:
            print("\n=== DEBUG: Agent reply ===")
            print("Type:", type(resp))
            payload = (
                resp.dict() if hasattr(resp, "dict")
                else resp.model_dump() if hasattr(resp, "model_dump")
                else str(resp)
            )
            print("Payload:", json.dumps(payload, indent=2) if isinstance(payload, (dict, list)) else payload)
            print("==========================\n")
        except Exception as log_err:
            print(f"[DEBUG] pretty-print failed: {log_err}")

        # Direct model (best case)
        if isinstance(resp, RecommendResponseMsg):
            return RecommendResponse(recommendations=resp.recommendations)

        # Envelope reply (common on some builds)
        maybe = _unwrap_envelope(resp)
        if maybe is not None:
            return maybe

        # Anything else—surface it for visibility
        return RecommendResponse(
            recommendations=[f"Unexpected reply type: {type(resp).__name__}", str(resp)]
        )

    except Exception as e:
        print("\n[TRACEBACK /recommend]\n" + traceback.format_exc())
        return RecommendResponse(recommendations=[f"[GATEWAY] {type(e).__name__}: {e}"])


@app.post("/recommend_direct", response_model=RecommendResponse)
async def recommend_direct(req: RecommendRequest):
    """
    Debug path: bypasses uAgents completely. Useful to prove the scorer works.
    Only FastAPI needs to be running for this endpoint.
    """
    try:
        recs: List[str] = []
        pref_tags = [str(t) for t in (req.preference_tags or [])]
        for c in req.courses:
            scored = []
            for i in c.instructors:
                rating = _safe_float(i.score_overall, 0.0)
                take_again = _safe_float(i.would_take_again_pct, 0.0)
                difficulty = _safe_float(i.difficulty, 3.0)
                reviews = [str(r) for r in (i.recent_evals or [])][:MAX_EVALS]

                b = base_score(rating, take_again, difficulty)
                m = naive_keyword_match(pref_tags, reviews)
                s = blend_score(b, m)
                scored.append((s, i))

            if scored:
                scored.sort(key=lambda t: t[0], reverse=True)
                top = scored[0][1]
                recs.append(f"For {c.course}: take {top.name} (score {top.score_overall})")
            else:
                recs.append(f"No instructors found for {c.course}.")

        return RecommendResponse(recommendations=recs)
    except Exception as e:
        print("\n[TRACEBACK /recommend_direct]\n" + traceback.format_exc())
        return RecommendResponse(recommendations=[f"[DIRECT] {type(e).__name__}: {e}"])
