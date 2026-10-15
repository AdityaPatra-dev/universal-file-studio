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

echo "Starting Universal File Studio on http://127.0.0.1:8000 ..."
PYTHONPATH=backend uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

