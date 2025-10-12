#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

# venv
if [[ -d .venv ]]; then source .venv/bin/activate; fi

# env
source agent_recommender/scripts/env.local.sh

python -m agent_recommender.agent
