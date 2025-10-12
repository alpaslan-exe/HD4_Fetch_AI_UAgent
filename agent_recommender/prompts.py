def build_match_prompt(tags: list[str], reviews: list[str]) -> str:
    """Compact, bounded prompt. The model must return strict JSON."""
    tags_line = ", ".join(tags) if tags else "(no tags provided)"
    joined = "\n- ".join(reviews[:5]) if reviews else "(no recent reviews)"
    return f"""
You are scoring how well a professor's most recent student reviews match a student's preference tags.

Preference tags (student cares about these): {tags_line}

Recent reviews (newest first, up to 5):
- {joined}

Instructions:
1) Infer teaching attributes from the reviews.
2) Score how well the reviews align with the preference tags on a scale 0.0 to 1.0.
3) Return STRICT JSON ONLY in this shape (no prose, no extra keys):

{{
  "match_score": <float 0.0-1.0>,
  "supported_tags": [<up to 3 tags that appear supported by the reviews>],
  "quotes": [<up to 2 short snippets (<=16 words) from reviews supporting the match>]
}}

Be conservative. If reviews are generic or contradictory, score near 0.2–0.4. If they strongly support the tags, score near 0.7–0.9. Never exceed 1.0.
Temperature should be treated as low; avoid creativity. 
"""