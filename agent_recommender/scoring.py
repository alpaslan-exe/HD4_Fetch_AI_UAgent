from __future__ import annotations
from typing import List

def _f(x, default=0.0) -> float:
    try: return float(x)
    except Exception: return float(default)

def base_score(rating: float, take_again_pct: float, difficulty: float) -> float:
    r = max(0.0, min(_f(rating), 5.0)) / 5.0
    t = max(0.0, min(_f(take_again_pct), 100.0)) / 100.0
    d = 1.0 - max(0.0, min(_f(difficulty), 5.0)) / 5.0
    return 0.5*r + 0.3*t + 0.2*d

def naive_keyword_match(tags: List[str], reviews: List[str]) -> float:
    if not tags: return 0.35
    if not reviews: return 0.35
    text = " ".join(reviews).lower()
    hits = sum(1 for t in tags if t.lower() in text)
    return max(0.1, min(0.9, 0.35 + 0.15*hits))

def blend_score(base: float, match: float, alpha: float = 0.65) -> float:
    try:
        b = float(base); m = float(match); a = float(alpha)
    except Exception:
        b = 0.0; m = 0.0; a = 0.65
    a = max(0.0, min(a, 1.0))
    return (a*b) + ((1.0 - a)*m)
