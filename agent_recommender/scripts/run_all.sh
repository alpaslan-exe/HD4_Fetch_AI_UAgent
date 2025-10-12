#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

if [[ -d .venv ]]; then source .venv/bin/activate; fi
source agent_recommender/scripts/env.local.sh

# Start agent in background
python -m agent_recommender.agent > .agent.log 2>&1 &
echo $! > .agent.pid
echo "Agent started (PID $(cat .agent.pid)). Logs: .agent.log"

# Start gateway in foreground
uvicorn agent_recommender.main:app --host "${API_HOST:-0.0.0.0}" --port "${API_PORT:-5057}"
