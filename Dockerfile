# ==============================================================================
# Universal File Studio - Production Multi-Stage Dockerfile
# Compatible with Linux, Windows (Docker Desktop), and macOS
# Contains all 9 native CLI processing engines:
# FFmpeg, ImageMagick, Pandoc, Poppler, Ghostscript, QPDF, 7-Zip, LibreOffice, Tesseract
# ==============================================================================

# --- Stage 1: Build Modern Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production Multi-Engine Runtime ---
FROM ubuntu:24.04 AS runtime

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOST=0.0.0.0 \
    PORT=8000 \
    PROJECT_NAME="Universal File Studio"

# Install Python & All 9 Processing Engines
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    imagemagick \
    pandoc \
    poppler-utils \
    ghostscript \
    qpdf \
    p7zip-full \
    libreoffice-writer \
    libreoffice-calc \
    tesseract-ocr \
    tesseract-ocr-eng \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Configure ImageMagick security policy to permit PDF operations
RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml 2>/dev/null || true \
    && sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-7/policy.xml 2>/dev/null || true

WORKDIR /app

# Setup dedicated virtualenv for clean Python packaging
RUN python3 -m venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Install backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Copy application source code
COPY backend/ ./backend/
COPY assets/ ./assets/

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Initialize persistent storage directories
RUN mkdir -p storage/uploads storage/outputs storage/temp storage/thumbnails

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/info || exit 1

# Launch FastAPI backend serving API, WebSockets, and SPA frontend
CMD ["python", "-m", "uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]

