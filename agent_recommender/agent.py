from __future__ import annotations

import json
from typing import List, Dict, Any

from uagents import Agent, Context, Protocol

from agent_recommender.config import PUBLIC_ENDPOINT, PUBLISH_MANIFEST
from agent_recommender.agent_lite import (
    # v1
    RecommendRequestMsg,
    RecommendResponseMsg,
    # v2
    RecommendV2RequestMsg,
    RecommendV2ResponseMsg,
    CourseOutLite,
    CourseRecommendationLite,
)
from agent_recommender.prompts import build_selection_prompt
from agent_recommender.llm import llm_call

# Configure public endpoint (optional)
endpoints = [PUBLIC_ENDPOINT] if PUBLIC_ENDPOINT else None

agent = Agent(
    name="instructor_recommender",
    seed="prof-reco-seed-dev",
    endpoint=endpoints,
)

protocol_v1 = Protocol(name="professor_recommender_protocol")
protocol_v2 = Protocol(name="professor_recommender_protocol_v2")

@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Agent address: {agent.address}")
    if endpoints:
        ctx.logger.info(f"Public endpoint configured: {endpoints[0]}")

# -------- v1: simple human-readable reply --------
@protocol_v1.on_message(
    model=RecommendRequestMsg,
    replies=RecommendResponseMsg,
    allow_unverified=True,
)
async def handle_request_v1(ctx: Context, sender: str, msg: RecommendRequestMsg):
    try:
        out: List[str] = []
        for course in msg.courses:
            if not course.instructors:
                out.append(f"No instructors found for {course.course}.")
                continue
            best = max(
                course.instructors,
                key=lambda i: float(i.get("score_overall", 0.0) or 0.0),
            )
            out.append(
                f"For {course.course}: take {best.get('name','Unknown')} (score {best.get('score_overall','n/a')})"
            )
        await ctx.send(sender, RecommendResponseMsg(recommendations=out))
    except Exception as e:
        await ctx.send(sender, RecommendResponseMsg(
            recommendations=[f"Agent error: {type(e).__name__}: {e}"]
        ))

# -------- v2: LLM sees ALL instructors & chooses one --------
@protocol_v2.on_message(
    model=RecommendV2RequestMsg,
    replies=RecommendV2ResponseMsg,
    allow_unverified=True,
)
async def handle_request_v2(ctx: Context, sender: str, msg: RecommendV2RequestMsg):
    try:
        pref_tags = msg.preference_tags or []
        out_courses: List[CourseOutLite] = []

        for course in msg.courses:
            inst_list: List[Dict[str, Any]] = course.instructors or []

            if not inst_list:
                out_courses.append(
                    CourseOutLite(
                        course=course.course,
                        instructors=inst_list,
                        recommendation=CourseRecommendationLite(
                            professor_name="",
                            recommendation_justification_done_with_llm_reasoning="No instructors available for this course.",
                            professor_score=0.0,
                        ),
                    )
                )
                continue

            prompt = build_selection_prompt(
                course_name=course.course,
                preference_tags=pref_tags,
                instructors=inst_list,
            )
            llm_text = llm_call(prompt)

            picked_name = ""
            justification = ""
            picked_score = 0.0

            if llm_text:
                try:
                    data = json.loads(llm_text)
                    rec = (data or {}).get("recommendation", {}) or {}
                    picked_name = str(rec.get("professor name", "")).strip()
                    justification = str(rec.get("recommendation justification (done with llm reasoning)", "")).strip()
                    try:
                        picked_score = float(rec.get("professor score", 0.0))
                    except Exception:
                        picked_score = 0.0
                except Exception:
                    justification = "LLM returned non-JSON output; falling back to highest-rated."

            # validate name; fallback to best by metrics
            name_map = {str(i.get("name","")).strip(): i for i in inst_list}
            chosen = name_map.get(picked_name)
            if not chosen:
                chosen = max(
                    inst_list,
                    key=lambda i: (
                        float(i.get("score_overall", 0.0) or 0.0),
                        float(i.get("would_take_again_pct", 0.0) or 0.0),
                    ),
                )
                picked_name = str(chosen.get("name","Unknown"))
                if not justification:
                    justification = f"{picked_name} selected by fallback due to strongest overall metrics."
                if picked_score == 0.0:
                    try:
                        picked_score = float(chosen.get("score_overall", 0.0) or 0.0)
                    except Exception:
                        picked_score = 0.0

            out_courses.append(
                CourseOutLite(
                    course=course.course,
                    instructors=inst_list,  # unchanged input
                    recommendation=CourseRecommendationLite(
                        professor_name=picked_name,
                        recommendation_justification_done_with_llm_reasoning=justification or
                            "Selected as best overall fit given the student's tags and reviews.",
                        professor_score=picked_score,
                    ),
                )
            )

        await ctx.send(sender, RecommendV2ResponseMsg(courses=out_courses))

    except Exception as e:
        await ctx.send(sender, RecommendV2ResponseMsg(
            courses=[CourseOutLite(
                course="ERROR",
                instructors=[],
                recommendation=CourseRecommendationLite(
                    professor_name="",
                    recommendation_justification_done_with_llm_reasoning=f"Agent error: {type(e).__name__}: {e}",
                    professor_score=0.0,
                )
            )]
        ))

# include (and optionally publish) protocols
agent.include(protocol_v1, publish_manifest=PUBLISH_MANIFEST)
agent.include(protocol_v2, publish_manifest=PUBLISH_MANIFEST)

if __name__ == "__main__":
    agent.run()
