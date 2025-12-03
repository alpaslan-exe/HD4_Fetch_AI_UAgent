#!/bin/bash

# HD4 Scheduler - Start Recommender Agent
# This script starts the professor recommendation AI agent

echo "🤖 Starting HD4 Professor Recommender Agent..."
echo ""
echo "This agent provides AI-powered professor recommendations based on:"
echo "  • Your preference tags (engaging, clear, helpful, etc.)"
echo "  • Professor ratings and reviews"
echo "  • Student feedback and would-take-again percentages"
echo ""
echo "Agent will run on: http://127.0.0.1:8003"
echo ""
echo "Press Ctrl+C to stop the agent"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$(dirname "$0")"
uv run python -m agent_recommender.agent


