#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

# venv
if [[ -d .venv ]]; then source .venv/bin/activate; fi

# env
source agent_recommender/scripts/env.local.sh

uvicorn agent_recommender.main:app --host "${API_HOST:-0.0.0.0}" --port "${API_PORT:-5057}"
