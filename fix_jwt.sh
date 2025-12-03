#!/bin/bash

echo "🔧 Fixing JWT package conflict..."
echo ""

# Remove the conflicting jwt package
echo "Removing conflicting 'jwt' package..."
pip uninstall -y jwt

# Install the correct PyJWT package
echo "Installing PyJWT..."
pip install "PyJWT>=2.8.0"

echo ""
echo "✅ JWT package fixed!"
echo ""
echo "Now restart the backend:"
echo "  uv run backend.py"


