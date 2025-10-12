import os

def _f(name: str, default: str) -> float:
    try:
        return float(os.getenv(name, default))
    except Exception:
        return float(default)

# Ensure all are floats at module load time
ALPHA = _f("RECO_ALPHA", "0.65")
W_RATING = _f("RECO_W_RATING", "0.55")
W_TAKE_AGAIN = _f("RECO_W_TAKE_AGAIN", "0.35")
W_DIFFICULTY = _f("RECO_W_DIFFICULTY", "0.20")

MAX_EVALS = int(os.getenv("RECO_MAX_EVALS", "5"))

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "none")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
LLM_TEMPERATURE = _f("LLM_TEMPERATURE", "0.1")
LLM_TIMEOUT = _f("LLM_TIMEOUT", "10")

# Ensure these are floats too
MIN_RATING = 0.0
MAX_RATING = 5.0
MIN_TAKE_AGAIN = 0.0
MAX_TAKE_AGAIN = 100.0
MIN_DIFFICULTY = 1.0
MAX_DIFFICULTY = 5.0