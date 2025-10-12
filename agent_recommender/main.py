from __future__ import annotations

import os, json, traceback
from base64 import b64decode
from typing import Any, List, Union

from fastapi import FastAPI

from agent_recommender.config import (
    API_HOST, API_PORT, QUERY_SERVER,
    PROTOCOL_NAME_V1, PROTOCOL_NAME_V2,
    MAX_EVALS,
)
from agent_recommender.schemas import (
    RecommendRequest, RecommendResponse,
    RecommendV2Response, CourseOut, CourseRecommendation, Instructor,
)
from agent_recommender.agent import agent  # pulls agent address
from agent_recommender.agent_lite import (
    CourseInLite,
    # v1
    RecommendRequestMsg, RecommendResponseMsg,
    # v2
    RecommendV2RequestMsg, RecommendV2ResponseMsg,
)
from agent_recommender.scoring import base_score, naive_keyword_match, blend_score

from uagents.query import query
from uagents.resolver import RulesBasedResolver

try:
    from uagents.types import Envelope  # some builds return Envelope
except Exception:
    Envelope = None  # type: ignore

app = FastAPI(title="Professor Recommender Gateway (with v2 LLM)")

# Make sure the global client knows where the Bureau is
os.environ.setdefault("QUERY_SERVER", QUERY_SERVER)

# Resolver: map agent address -> local inbox
RESOLVER = RulesBasedResolver({agent.address: "http://127.0.0.1:8000/submit"})

def _dump(m: Any) -> dict:
    if hasattr(m, "model_dump"): return m.model_dump()
    if hasattr(m, "dict"): return m.dict()
    return dict(m)

async def _query_tolerant(address: str, msg: Any, protocol_name: str) -> Any:
    # try newer signature first
    try:
        return await query(address, msg, protocol=protocol_name, resolver=RESOLVER)
    except TypeError:
        pass
    # positional variants
    try:
        return await query(address, msg, RESOLVER, protocol_name)
    except TypeError:
        pass
    try:
        return await query(address, msg, protocol_name, resolver=RESOLVER)
    except TypeError:
        pass
    # resolver only
    try:
        return await query(address, msg, resolver=RESOLVER)
    except TypeError:
        pass
    # bare query; relies on QUERY_SERVER env
    return await query(address, msg)

def _unwrap_envelope(resp: Any) -> Union[dict, None]:
    if Envelope is None or not isinstance(resp, Envelope):
        return None
    try:
        raw = b64decode(resp.payload).decode("utf-8", errors="ignore")
        return json.loads(raw)
    except Exception:
        return None

@app.get("/health")
async def health():
    return {"status": "ok", "agent_address": agent.address}

# ---------- v1 ----------
@app.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
    lite_courses = [
        CourseInLite(course=c.course, instructors=[_dump(i) for i in c.instructors])
        for c in req.courses
    ]
    message = RecommendRequestMsg(preference_tags=req.preference_tags, courses=lite_courses)
    try:
        resp = await _query_tolerant(agent.address, message, PROTOCOL_NAME_V1)
        # debug print
        try:
            print("\n=== DEBUG v1 reply ===")
            print(type(resp))
            print("======================\n")
        except Exception:
            pass

        if isinstance(resp, RecommendResponseMsg):
            return RecommendResponse(recommendations=resp.recommendations)

        env = _unwrap_envelope(resp)
        if env and "recommendations" in env:
            return RecommendResponse(recommendations=list(env["recommendations"]))

        return RecommendResponse(recommendations=[f"Unexpected reply type: {type(resp).__name__}", str(resp)])
    except Exception as e:
        print("\n[TRACEBACK /recommend]\n" + traceback.format_exc())
        return RecommendResponse(recommendations=[f"[GATEWAY] {type(e).__name__}: {e}"])

# ---------- v2 (LLM makes the choice) ----------
@app.post("/recommend_v2", response_model=RecommendV2Response)
async def recommend_v2(req: RecommendRequest):
    lite_courses = [
        CourseInLite(course=c.course, instructors=[_dump(i) for i in c.instructors])
        for c in req.courses
    ]
    message = RecommendV2RequestMsg(preference_tags=req.preference_tags, courses=lite_courses)
    try:
        resp = await _query_tolerant(agent.address, message, PROTOCOL_NAME_V2)

        # debug print
        try:
            print("\n=== DEBUG v2 reply ===")
            print(type(resp))
            print("======================\n")
        except Exception:
            pass

        if isinstance(resp, RecommendV2ResponseMsg):
            return RecommendV2Response(courses=[
                CourseOut(
                    course=c.course,
                    instructors=[Instructor(**i) for i in c.instructors],
                    recommendation=CourseRecommendation(
                        professor_name=c.recommendation.professor_name,
                        recommendation_justification_done_with_llm_reasoning=c.recommendation.recommendation_justification_done_with_llm_reasoning,
                        professor_score=c.recommendation.professor_score,
                    ),
                )
                for c in resp.courses
            ])

        env = _unwrap_envelope(resp)
        if env and "courses" in env:
            # trust agent's v2 JSON
            return RecommendV2Response(**env)

        return RecommendV2Response(courses=[CourseOut(
            course="UNEXPECTED",
            instructors=[],
            recommendation=CourseRecommendation(
                professor_name="",
                recommendation_justification_done_with_llm_reasoning=f"Unexpected reply type: {type(resp).__name__}",
                professor_score=0.0,
            ),
        )])
    except Exception as e:
        print("\n[TRACEBACK /recommend_v2]\n" + traceback.format_exc())
        return RecommendV2Response(courses=[CourseOut(
            course="EXCEPTION",
            instructors=[],
            recommendation=CourseRecommendation(
                professor_name="",
                recommendation_justification_done_with_llm_reasoning=f"[GATEWAY v2] {type(e).__name__}: {e}",
                professor_score=0.0,
            ),
        )])

# ---------- direct debug (no agent) ----------
@app.post("/recommend_direct", response_model=RecommendResponse)
async def recommend_direct(req: RecommendRequest):
    """
    Basic local scorer to verify the pipeline w/o the agent.
    """
    try:
        recs: List[str] = []
        tags = [str(t) for t in (req.preference_tags or [])]
        for c in req.courses:
            scored = []
            for i in c.instructors:
                b = base_score(i.score_overall, i.would_take_again_pct, i.difficulty)
                m = naive_keyword_match(tags, i.recent_evals)
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
        return RecommendResponse(recommendations=[f"[DIRECT] {type(e).__name__}: {e}"])
