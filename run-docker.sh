#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "  Universal File Studio - Docker Container Launcher"
echo "  Runs on Linux, macOS, and Windows (WSL2)"
echo "=========================================================="
echo ""

if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed or not in PATH."
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

mkdir -p storage/uploads storage/outputs storage/temp storage/thumbnails

echo "[1/2] Building and launching Universal File Studio container..."
if docker compose version &> /dev/null; then
    docker compose up --build -d
elif command -v docker-compose &> /dev/null; then
    docker-compose up --build -d
else
    echo "Building Docker image manually..."
    docker build -t universal-file-studio .
    docker run -d --name universal-file-studio -p 8000:8000 -v "$PWD/storage:/app/storage" universal-file-studio
fi

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo "=========================================================="
echo "  Universal File Studio is up and running!"
echo "  - Local PC Access:     http://localhost:8000"
echo "  - Mobile / LAN Access: http://${LOCAL_IP}:8000"
echo "=========================================================="
echo ""
echo "To view live logs: docker compose logs -f"
echo "To stop container: docker compose down"

