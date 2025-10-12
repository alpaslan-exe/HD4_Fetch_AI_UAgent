from __future__ import annotations
import os

# API server port for FastAPI
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "5057"))

# uAgents (Bureau) host/port used by the query client
QUERY_SERVER = os.getenv("QUERY_SERVER", "http://127.0.0.1:8000")

# Protocol names (must match agent)
PROTOCOL_NAME_V1 = "professor_recommender_protocol"
PROTOCOL_NAME_V2 = "professor_recommender_protocol_v2"

# Scoring constants (for direct / debug endpoints; agent v2 uses LLM)
RECO_ALPHA = float(os.getenv("RECO_ALPHA", "0.65"))
MAX_EVALS = int(os.getenv("MAX_EVALS", "5"))

# Optional public endpoint (for Agentverse/ASI)
PUBLIC_ENDPOINT = os.getenv("PUBLIC_ENDPOINT")  # e.g. "https://your-domain/submit"
PUBLISH_MANIFEST = os.getenv("PUBLISH_MANIFEST", "false").lower() in {"1","true","yes"}
