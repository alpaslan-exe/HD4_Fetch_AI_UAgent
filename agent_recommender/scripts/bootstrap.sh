#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

# venv
if [[ ! -d .venv ]]; then
  python -m venv .venv
fi
source .venv/bin/activate

# install from ROOT requirements.txt
pip install -r requirements.txt
echo "Bootstrap complete."
