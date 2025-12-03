#!/bin/bash

# HD4 Scheduler - Full Stack with AI Agent
# This script starts the FastAPI backend, the recommender agent, and the React frontend

echo "🚀 Starting HD4 Scheduler with AI Agent..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    jobs -p | xargs -r kill 2>/dev/null
    exit 0
}

trap cleanup EXIT INT TERM

# Start the recommender agent on port 8003
echo "🤖 Starting AI Recommender Agent on port 8003..."
cd /home/youn/git/HD4_Fetch_AI_UAgent
uv run python -m agent_recommender.agent &
AGENT_PID=$!
echo "   Agent PID: $AGENT_PID"
sleep 2

# Start the FastAPI backend on port 8000
echo ""
echo "🔧 Starting FastAPI Backend on port 8000..."
uv run backend.py &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
sleep 3

# Start the React frontend on port 5173
echo ""
echo "⚛️  Starting React Frontend on port 5173..."
cd Frontend
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "✨ All services started successfully!"
echo ""
echo "📊 Service URLs:"
echo "   🤖 AI Agent:    http://localhost:8003"
echo "   🔧 Backend API: http://localhost:8000"
echo "   📚 API Docs:    http://localhost:8000/docs"
echo "   ⚛️  Frontend:    http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background processes
wait


