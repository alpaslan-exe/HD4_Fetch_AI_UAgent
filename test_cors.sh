#!/bin/bash

# CORS Testing Script for HD4 Scheduler

echo "========================================"
echo "  HD4 Scheduler CORS Troubleshooting"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if backend is running
echo "Test 1: Checking if backend is running..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running on port 8000${NC}"
else
    echo -e "${RED}✗ Backend is NOT running on port 8000${NC}"
    echo "  Start it with: uv run backend.py"
    exit 1
fi

echo ""

# Test 2: Check CORS headers with OPTIONS request
echo "Test 2: Testing CORS preflight (OPTIONS) request..."
echo "Simulating request from http://localhost:5173"
echo ""

CORS_RESPONSE=$(curl -s -X OPTIONS http://localhost:8000/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1)

if echo "$CORS_RESPONSE" | grep -q "access-control-allow-origin"; then
    echo -e "${GREEN}✓ CORS headers are present${NC}"
    echo "$CORS_RESPONSE" | grep -i "access-control"
else
    echo -e "${RED}✗ CORS headers are missing${NC}"
    echo ""
    echo "Full response:"
    echo "$CORS_RESPONSE"
fi

echo ""
echo ""

# Test 3: Test GET request from different origin
echo "Test 3: Testing GET request with Origin header..."
echo ""

GET_RESPONSE=$(curl -s http://localhost:8000/cors-test \
  -H "Origin: http://localhost:5173" \
  -v 2>&1)

if echo "$GET_RESPONSE" | grep -q "access-control-allow-origin"; then
    echo -e "${GREEN}✓ GET request CORS is working${NC}"
    echo ""
    echo "Response:"
    echo "$GET_RESPONSE" | grep -A 10 "CORS is working"
else
    echo -e "${RED}✗ GET request CORS is not working${NC}"
    echo ""
    echo "Full response:"
    echo "$GET_RESPONSE"
fi

echo ""
echo ""

# Test 4: Check what port Vite is using
echo "Test 4: Checking Vite/Frontend port..."
echo ""

if lsof -i :5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running on port 5173${NC}"
    FRONTEND_PORT=5173
elif lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running on port 3000${NC}"
    FRONTEND_PORT=3000
elif lsof -i :5174 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running on port 5174${NC}"
    FRONTEND_PORT=5174
else
    echo -e "${YELLOW}! Frontend doesn't appear to be running${NC}"
    echo "  Start it with: cd Frontend && npm run dev"
    FRONTEND_PORT="unknown"
fi

echo ""
echo ""

# Test 5: Summary and recommendations
echo "========================================"
echo "  Summary & Recommendations"
echo "========================================"
echo ""

if [ "$FRONTEND_PORT" != "unknown" ]; then
    echo "Your frontend is on: http://localhost:$FRONTEND_PORT"
    echo ""
    
    # Check if this port is in CORS config
    echo "Testing CORS for your frontend port..."
    TEST_CORS=$(curl -s -X OPTIONS http://localhost:8000/api/auth/login \
      -H "Origin: http://localhost:$FRONTEND_PORT" \
      -H "Access-Control-Request-Method: POST" \
      -v 2>&1)
    
    if echo "$TEST_CORS" | grep -q "access-control-allow-origin: http://localhost:$FRONTEND_PORT"; then
        echo -e "${GREEN}✓ CORS is configured for your frontend port${NC}"
    else
        echo -e "${RED}✗ CORS is NOT configured for port $FRONTEND_PORT${NC}"
        echo ""
        echo -e "${YELLOW}Fix:${NC} Add this port to CORS origins in backend.py:"
        echo ""
        echo "allow_origins=["
        echo "    \"http://localhost:5173\","
        echo "    \"http://localhost:$FRONTEND_PORT\",  # Add this line"
        echo "    ..."
        echo "]"
    fi
fi

echo ""
echo ""

# Test 6: Direct test from browser console
echo "========================================"
echo "  Browser Console Test"
echo "========================================"
echo ""
echo "Copy and paste this into your browser console (F12 → Console):"
echo ""
echo -e "${YELLOW}fetch('http://localhost:8000/cors-test')"
echo "  .then(r => r.json())"
echo "  .then(d => console.log('✓ CORS working:', d))"
echo -e "  .catch(e => console.log('✗ CORS error:', e))${NC}"
echo ""
echo "If you see 'CORS working', the backend CORS is configured correctly."
echo ""

echo "========================================"
echo ""
echo "Troubleshooting Steps:"
echo ""
echo "1. Make sure backend is restarted after CORS changes"
echo "   ${YELLOW}Ctrl+C${NC} then ${YELLOW}uv run backend.py${NC}"
echo ""
echo "2. Check your frontend URL matches CORS config"
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo "   CORS config in backend.py line ~548"
echo ""
echo "3. Clear browser cache and hard reload"
echo "   ${YELLOW}Ctrl+Shift+R${NC} or ${YELLOW}Cmd+Shift+R${NC}"
echo ""
echo "4. Check browser console for detailed CORS errors"
echo "   ${YELLOW}F12 → Console tab${NC}"
echo ""
echo "5. If still failing, disable credentials temporarily:"
echo "   In ${YELLOW}Frontend/src/services/api.js${NC}"
echo "   Remove 'credentials: true' from fetch options"
echo ""

