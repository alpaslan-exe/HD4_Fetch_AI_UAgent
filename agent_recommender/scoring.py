from typing import List, Any


def _safe_float(x: Any, default: float = 0.0) -> float:
    """Safely convert any value to float."""
    try:
        return float(x)
    except Exception:
        return float(default)


def _norm(x: float, lo: float, hi: float) -> float:
    """Normalize x to [0,1] range given bounds [lo, hi]."""
    x = _safe_float(x, lo)
    lo = _safe_float(lo, 0.0)
    hi = _safe_float(hi, 1.0)
    if hi == lo:
        return 0.0
    if x < lo:
        x = lo
    elif x > hi:
        x = hi
    return (x - lo) / (hi - lo)


def base_score(rating: Any, take_again_pct: Any, difficulty: Any) -> float:
    """Heuristic base: higher rating & take-again, lower difficulty."""
    # Import here to avoid circular imports and ensure values are loaded
    from agent_recommender.config import (
        MIN_RATING, MAX_RATING,
        MIN_DIFFICULTY, MAX_DIFFICULTY,
        W_RATING, W_TAKE_AGAIN, W_DIFFICULTY
    )

    # Convert all inputs to float
    rating_f = _safe_float(rating, 0.0)
    difficulty_f = _safe_float(difficulty, 3.0)
    take_again_f = _safe_float(take_again_pct, 0.0)

    # Normalize values
    r = _norm(rating_f, MIN_RATING, MAX_RATING)
    d = _norm(difficulty_f, MIN_DIFFICULTY, MAX_DIFFICULTY)  # higher diff = worse
    ta = take_again_f / 100.0

    # Ensure weights are floats (defensive)
    wr = _safe_float(W_RATING, 0.55)
    wta = _safe_float(W_TAKE_AGAIN, 0.35)
    wd = _safe_float(W_DIFFICULTY, 0.20)

    # Calculate score - all operands are now guaranteed floats
    result = (wr * r) + (wta * ta) - (wd * d)
    return float(result)


def naive_keyword_match(tags: List[str], reviews: List[str]) -> float:
    """Light tag-to-review overlap in [0,1], robust to empty inputs."""
    if not tags or not reviews:
        return 0.35

    tks = [str(t).lower() for t in tags]
    blob = " ".join(str(r) for r in reviews).lower()
    hits = sum(1 for t in tks if t in blob)

    # Ensure result is float
    result = 0.25 + (0.15 * float(hits))
    return min(1.0, result)


def blend_score(base: Any, match: Any, alpha: Any = None) -> float:
    """Blend scaled base and match, all coerced to floats."""
    from agent_recommender.config import (
        ALPHA, W_DIFFICULTY, W_RATING, W_TAKE_AGAIN
    )

    # Use provided alpha or default from config
    if alpha is None:
        alpha = ALPHA

    # Convert all to floats
    base_f = _safe_float(base, 0.0)
    match_f = _safe_float(match, 0.5)
    alpha_f = _safe_float(alpha, 0.65)

    # Get weights as floats
    wd = _safe_float(W_DIFFICULTY, 0.20)
    wr = _safe_float(W_RATING, 0.55)
    wta = _safe_float(W_TAKE_AGAIN, 0.35)

    # Calculate range
    lo = -wd
    hi = wr + wta
    rng = (hi - lo) if (hi - lo) != 0.0 else 1.0

    # Normalize base to [0,1]
    base01 = (base_f - lo) / rng
    base01 = max(0.0, min(1.0, base01))

    # Clamp match to [0,1]
    match_f = max(0.0, min(1.0, match_f))

    # Calculate final blend
    result = (alpha_f * base01) + ((1.0 - alpha_f) * match_f)
    return float(result)