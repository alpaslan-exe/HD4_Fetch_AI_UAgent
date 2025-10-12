from __future__ import annotations
from typing import List, Dict, Any
from uagents import Model

# Common payload
class CourseInLite(Model):
    course: str
    instructors: List[Dict[str, Any]]

# ===== v1 =====
class RecommendRequestMsg(Model):
    preference_tags: List[str]
    courses: List[CourseInLite]

class RecommendResponseMsg(Model):
    recommendations: List[str]

# ===== v2 =====
# NOTE: separate request class to avoid uAgents "duplicate model" error
class RecommendV2RequestMsg(Model):
    preference_tags: List[str]
    courses: List[CourseInLite]

class CourseRecommendationLite(Model):
    professor_name: str
    recommendation_justification_done_with_llm_reasoning: str
    professor_score: float

class CourseOutLite(Model):
    course: str
    instructors: List[Dict[str, Any]]
    recommendation: CourseRecommendationLite

class RecommendV2ResponseMsg(Model):
    courses: List[CourseOutLite]
