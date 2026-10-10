#!/usr/bin/env bash
set -e

echo "=== Universal File Studio: Initial Setup ==="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3.11+ is required but not found."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js 18+ is required but not found."
    exit 1
fi

echo "[1/4] Setting up Python virtual environment..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "[2/4] Setting up Frontend dependencies..."
cd frontend
npm install
npm run build
cd ..

echo "[3/4] Initializing Storage Directories..."
mkdir -p storage/uploads storage/outputs storage/temp storage/thumbnails

echo "[4/4] Verifying Engine Detection & Database..."
PYTHONPATH=backend python -c "
import asyncio
from app.database import init_db
from app.engines.manager import EngineManager
async def check():
    await init_db()
    engines = await EngineManager.scan_and_register_all()
    print('Detected local engines:', [name for name, e in engines.items() if e.installed])
asyncio.run(check())
"

echo "=== Setup Complete! Run ./start.sh to launch Universal File Studio ==="

