from fastapi import FastAPI
from typing import List, Any, Union
import json

from agent_recommender.schemas import RecommendRequest, RecommendResponse
from agent_recommender.agent import agent
from agent_recommender.agent_lite import (
    RecommendRequestMsg,
    RecommendResponseMsg,
    CourseInLite,
)

from uagents.query import query
from uagents.resolver import RulesBasedResolver

app = FastAPI(title="Professor Recommender Gateway")

RESOLVER = RulesBasedResolver({agent.address: "http://127.0.0.1:8000/submit"})
PROTOCOL_NAME = "professor_recommender_protocol"

@app.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
    try:
        # Convert to lite format
        lite_courses: List[CourseInLite] = [
            CourseInLite(course=c.course, instructors=[i.dict() for i in c.instructors])
            for c in req.courses
        ]
        message = RecommendRequestMsg(preference_tags=req.preference_tags, courses=lite_courses)

        # Query the agent
        resp: Union[RecommendResponseMsg, Any] = await query(
            agent.address, message, RESOLVER, PROTOCOL_NAME
        )

        # Debug print to uvicorn console
        try:
            print("\n=== DEBUG: Agent reply ===")
            print("Type:", type(resp))
            payload = resp.dict() if hasattr(resp, "dict") else (
                resp.model_dump() if hasattr(resp, "model_dump") else str(resp)
            )
            print("Payload:", json.dumps(payload, indent=2) if isinstance(payload, (dict, list)) else payload)
            print("==========================\n")
        except Exception as log_err:
            print(f"[DEBUG] pretty-print failed: {log_err}")

        # Handle response
        if isinstance(resp, RecommendResponseMsg):
            return RecommendResponse(recommendations=resp.recommendations)

        return RecommendResponse(
            recommendations=[f"Unexpected reply type: {type(resp).__name__}", str(resp)]
        )

    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"\n=== ERROR in /recommend ===\n{error_detail}\n==========================\n")
        return RecommendResponse(recommendations=[f"Error communicating with agent: {e}"])
