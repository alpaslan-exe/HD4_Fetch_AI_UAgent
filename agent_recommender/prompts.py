from __future__ import annotations
from typing import List, Dict, Any

def build_selection_prompt(
    course_name: str,
    preference_tags: List[str],
    instructors: List[Dict[str, Any]],
) -> str:
    """
    Ask the LLM to review ALL instructors for a course and choose the single best fit.
    Return STRICT JSON ONLY in the expected shape.
    """
    tags_line = ", ".join(preference_tags) if preference_tags else "(no tags provided)"

    def _norm(i: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "name": str(i.get("name", "")),
            "score_overall": float(i.get("score_overall", 0.0) or 0.0),
            "would_take_again_pct": float(i.get("would_take_again_pct", 0.0) or 0.0),
            "difficulty": float(i.get("difficulty", 0.0) or 0.0),
            "recent_evals": [str(x) for x in (i.get("recent_evals") or [])][:5],
        }

    compact = [_norm(i) for i in (instructors or [])]

    return f"""
You are recommending the best instructor for the course "{course_name}".
Consider the student's preference tags and ALL instructors below.

Preference tags (student cares about these): {tags_line}

Instructors (JSON array):
{compact}

Instructions:
1) Evaluate ALL instructors holistically (ratings, would-take-again, difficulty fit, and review text vs tags).
2) Choose EXACTLY ONE best instructor by *name* (must match one in the list).
3) Write a short, specific 2–3 sentence justification grounded in the data.
4) Provide a "professor score" (0.0–5.0) reflecting overall suitability for THIS student.
5) Return STRICT JSON ONLY, no extra keys, no commentary outside JSON:

{{
  "recommendation": {{
    "professor name": "<exact name>",
    "recommendation justification (done with llm reasoning)": "<2-3 sentence justification>",
    "professor score": <float 0.0-5.0>
  }}
}}
"""
