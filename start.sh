#!/bin/bash
# SkipQ Start Script - starts PostgreSQL, Backend, and Frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PG_DATA="$HOME/pgdata"
PG_BIN="/usr/lib/postgresql/12/bin"
BACKEND_DIR="$SCRIPT_DIR/Backend"
FRONTEND_DIR="$SCRIPT_DIR/Frontend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Starting SkipQ ===${NC}"

# 1. Start PostgreSQL (user-level cluster on port 5433)
if "$PG_BIN/pg_isready" -h "$PG_DATA/sockets" -p 5433 &>/dev/null; then
    echo -e "${YELLOW}PostgreSQL already running on port 5433${NC}"
else
    echo "Starting PostgreSQL on port 5433..."
    "$PG_BIN/pg_ctl" -D "$PG_DATA" -l "$PG_DATA/logfile" start
fi

# 2. Start Django Backend
if curl -s -o /dev/null http://localhost:8000/api/ 2>/dev/null; then
    echo -e "${YELLOW}Backend already running on port 8000${NC}"
else
    echo "Starting Django backend on 0.0.0.0:8000..."
    cd "$BACKEND_DIR"
    source .venv/bin/activate
    nohup python manage.py runserver 0.0.0.0:8000 > "$BACKEND_DIR/server.log" 2>&1 &
    echo "Backend PID: $!"
fi

# 3. Start Vite Frontend
if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo -e "${YELLOW}Frontend already running on port 3000${NC}"
else
    echo "Starting Vite frontend on 0.0.0.0:3000..."
    cd "$FRONTEND_DIR"
    nohup npm run dev > "$FRONTEND_DIR/frontend.log" 2>&1 &
    echo "Frontend PID: $!"
fi

# Wait and verify
sleep 3
IP=$(hostname -I | awk '{print $1}')
echo ""
echo -e "${GREEN}=== SkipQ is running ===${NC}"
echo -e "  Frontend:  http://${IP}:3000"
echo -e "  Backend:   http://${IP}:8000/api/"
echo -e "  PostgreSQL: port 5433"
