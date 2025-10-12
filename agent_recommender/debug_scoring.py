from agent_recommender.scoring import base_score, naive_keyword_match, blend_score

CASES = [
    # rating, take_again_pct, difficulty
    ("OK: pure floats", 4.6, 88.0, 3.0),
    ("OK: ints", 4, 75, 2),
    ("OK: numeric strings", "4.6", "88", "3"),
    ("Edge: rating high", 5.5, 88, 3),
    ("Edge: rating low", -1.0, 88, 3),
    ("Edge: take_again >100", 4.2, 150, 3),
    ("Edge: take_again <0", 4.2, -10, 3),
    ("Edge: difficulty high", 4.2, 88, 9.0),
    ("Edge: difficulty low", 4.2, 88, 0.0),
    ("Weird: mixed types", "4", 88.0, "3.0"),
    ("Weird: bad strings", "4.6x", "88%", "easy"),
    ("Weird: None", None, None, None),
]

TAG_REVIEW_CASES = [
    # (label, tags, reviews)
    ("OK: simple", ["gives good feedback", "lecture heavy"], ["Great feedback!", "Long lectures."]),
    ("OK: empty tags", [], ["Great feedback!"]),
    ("OK: empty reviews", ["feedback"], []),
    ("OK: both empty", [], []),
    ("Mixed types in reviews", ["feedback"], ["ok", 123, None, {"note": "text"}]),
]

BLEND_CASES = [
    # (label, base, match, alpha)
    ("OK: typical", 0.5, 0.8, 0.65),
    ("Edge: base out of range", -5.0, 0.6, 0.65),
    ("Edge: match out of range", 0.5, 2.0, 0.65),
    ("Weird: strings", "0.5", "0.8", "0.65"),
    ("Weird: bad strings", "x", "y", "z"),
    ("Weird: None", None, None, None),
]


def show(label, value):
    print(f"{label}: {value!r}   (type={type(value).__name__})")


def test_base_score():
    print("\n=== base_score(rating, take_again_pct, difficulty) ===")
    for label, rating, ta, diff in CASES:
        try:
            val = base_score(rating, ta, diff)
            show(label, val)
        except Exception as e:
            print(f"{label}: EXCEPTION -> {type(e).__name__}: {e}")


def test_naive_keyword_match():
    print("\n=== naive_keyword_match(tags, reviews) ===")
    for label, tags, reviews in TAG_REVIEW_CASES:
        try:
            val = naive_keyword_match(tags, reviews)
            show(label, val)
        except Exception as e:
            print(f"{label}: EXCEPTION -> {type(e).__name__}: {e}")


def test_blend_score():
    print("\n=== blend_score(base, match, alpha) ===")
    for label, base, match, alpha in BLEND_CASES:
        try:
            val = blend_score(base, match, alpha)
            show(label, val)
        except Exception as e:
            print(f"{label}: EXCEPTION -> {type(e).__name__}: {e}")


if __name__ == "__main__":
    test_base_score()
    test_naive_keyword_match()
    test_blend_score()
    print("\nDone.")
