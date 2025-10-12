from pydantic import BaseModel
from typing import List


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


class RecommendResponse(BaseModel):
    recommendations: List[str]