from typing import List, Dict, Any
from uagents import Model


class CourseInLite(Model):
    course: str
    instructors: List[Dict[str, Any]]


class RecommendRequestMsg(Model):
    preference_tags: List[str]
    courses: List[CourseInLite]


class RecommendResponseMsg(Model):
    recommendations: List[str]