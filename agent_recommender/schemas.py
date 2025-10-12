from __future__ import annotations
from typing import List
from pydantic import BaseModel

# ----- Shared -----
class Instructor(BaseModel):
    name: str
    recent_evals: List[str]
    score_overall: float
    would_take_again_pct: float
    difficulty: float

class CourseIn(BaseModel):
    course: str
    instructors: List[Instructor]

class RecommendRequest(BaseModel):
    preference_tags: List[str]
    courses: List[CourseIn]

# ----- v1 (string list) -----
class RecommendResponse(BaseModel):
    recommendations: List[str]

# ----- v2 (structured) -----
class CourseRecommendation(BaseModel):
    professor_name: str
    recommendation_justification_done_with_llm_reasoning: str
    professor_score: float

class CourseOut(BaseModel):
    course: str
    instructors: List[Instructor]
    recommendation: CourseRecommendation

class RecommendV2Response(BaseModel):
    courses: List[CourseOut]
