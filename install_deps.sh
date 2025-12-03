#!/bin/bash

echo "📦 Installing missing dependencies for HD4 Scheduler..."
echo ""

# Install aiohttp (for async HTTP requests to RMP API)
echo "Installing aiohttp..."
pip install "aiohttp>=3.9.0"

# Sync all dependencies with uv (if available)
if command -v uv &> /dev/null; then
    echo ""
    echo "Syncing all dependencies with uv..."
    uv sync
else
    echo ""
    echo "⚠️  'uv' command not found. Dependencies installed via pip only."
fi

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "Now restart the backend:"
echo "  uv run backend.py"


