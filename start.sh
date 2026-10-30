#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
else
    echo "Virtual environment not found. Please run ./scripts/setup.sh first."
    exit 1
fi

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"

echo "Starting Universal File Studio on http://${HOST}:${PORT} ..."
echo "Accessible locally at http://127.0.0.1:${PORT}"
echo "Accessible from mobile / LAN at http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo '0.0.0.0'):${PORT}"
PYTHONPATH=backend uvicorn app.main:app --host "$HOST" --port "$PORT" --reload

