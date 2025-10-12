#!/usr/bin/env bash
# Source this from other scripts

# ---- ASI:One LLM (OpenAI-compatible) ----
export ASI_ONE_API_KEY="k_2730c0db14f94cdabd79fba69ca9c882826bb663c8d84402bc1e1f0d5c0e3205"
export ASI_ONE_MODEL="asi1-mini"
export ASI_ONE_TEMPERATURE="0.2"
export ASI_ONE_BASE_URL="https://api.asi1.ai/v1"

# ---- Local dev ports ----
export QUERY_SERVER="http://127.0.0.1:8000"   # uAgents Bureau
export API_HOST="0.0.0.0"
export API_PORT="5057"

# ---- Optional public hosting (Agentverse/ASI discoverability) ----
# export PUBLIC_ENDPOINT="https://your-domain/submit"
# export PUBLISH_MANIFEST="true"
