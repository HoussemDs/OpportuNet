#!/usr/bin/env bash
# ─────────────────────────────────────────────
# Job Intel AI — one-command launcher
# Usage: bash start.sh
# ─────────────────────────────────────────────

echo ""
echo "  ⚡ Job Intel AI"
echo "  ─────────────────────────────"
echo ""

# Start backend
echo "  [1/3] Starting FastAPI backend on port 8000..."
cd "$(dirname "$0")/backend"

pip install -r requirements.txt -q

uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "  ✓ Backend started (PID $BACKEND_PID)"

# Start email worker
echo ""
echo "  [2/3] Starting Email Worker (checking alert@distill.io)..."
python email_worker.py &
WORKER_PID=$!
echo "  ✓ Email Worker started (PID $WORKER_PID)"

# Start frontend
echo ""
echo "  [3/3] Starting React frontend on port 5173..."
cd "$(dirname "$0")/frontend"
npm install --silent
npm run dev &
FRONTEND_PID=$!
echo "  ✓ Frontend started (PID $FRONTEND_PID)"

echo ""
echo "  ─────────────────────────────"
echo "  🌐 Open: http://localhost:5173"
echo "  📡 API:  http://localhost:8000/docs"
echo "  ─────────────────────────────"
echo ""
echo "  Press Ctrl+C to stop all processes"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID $WORKER_PID 2>/dev/null; echo 'Stopped.'" INT TERM
wait
