import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings, PROJECT_ROOT
from app.database import init_db
from app.engines.manager import EngineManager
from app.jobs.manager import job_manager
from app.api.routes import (
    files_router,
    jobs_router,
    operations_router,
    system_router,
    batch_router,
    presets_router,
    pipelines_router,
    websocket_router,
    developer_router
)

tags_metadata = [
    {
        "name": "files",
        "description": "File upload, inspection, checksum calculation, and metadata sanitation.",
    },
    {
        "name": "jobs",
        "description": "Asynchronous background task lifecycle, job queue, cancellations, and logs.",
    },
    {
        "name": "operations",
        "description": "Available media and document processing profiles and dynamic parameter specs.",
    },
    {
        "name": "batch",
        "description": "Multi-file batch conversions, bulk compression, and unified ZIP archives.",
    },
    {
        "name": "presets",
        "description": "Configurable one-click operation configurations.",
    },
    {
        "name": "pipelines",
        "description": "Sequential multi-step workflow chaining and execution.",
    },
    {
        "name": "websocket",
        "description": "Real-time bi-directional progress streaming and job telemetry.",
    },
    {
        "name": "developer",
        "description": "Developer diagnostics, OpenAPI specs, and system telemetry.",
    },
    {
        "name": "system",
        "description": "Engine detection, system diagnostics, settings, and hardware telemetry.",
    },
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[UFS] Initializing SQLite database...")
    await init_db()
    
    print("[UFS] Detecting local engines and capabilities...")
    await EngineManager.scan_and_register_all()
    
    print(f"[UFS] Starting background worker pool (concurrency={settings.MAX_CONCURRENT_JOBS})...")
    job_manager.start_workers(settings.MAX_CONCURRENT_JOBS)
    
    print(f"[UFS] Universal File Studio backend ready at http://{settings.HOST}:{settings.PORT}")
    yield
    
    # Shutdown
    print("[UFS] Shutting down workers...")
    await job_manager.stop_workers()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
# Universal File Studio (UFS) API
**Local-First, Privacy-Focused File Processing Engine**

- 100% localhost execution — files never leave your machine
- Powered by FFmpeg, ImageMagick, 7-Zip, Poppler, LibreOffice, and Tesseract
- Native asynchronous job queue with WebSocket real-time progress streaming
- Standalone CLI interface (`ufs`)
""",
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(websocket_router)
app.include_router(websocket_router, prefix=settings.API_V1_STR)
app.include_router(files_router, prefix=settings.API_V1_STR)
app.include_router(jobs_router, prefix=settings.API_V1_STR)
app.include_router(operations_router, prefix=settings.API_V1_STR)
app.include_router(system_router, prefix=settings.API_V1_STR)
app.include_router(batch_router, prefix=settings.API_V1_STR)
app.include_router(presets_router, prefix=settings.API_V1_STR)
app.include_router(pipelines_router, prefix=settings.API_V1_STR)
app.include_router(developer_router, prefix=settings.API_V1_STR)

# API Info
@app.get("/api/info")
async def api_info():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "api": settings.API_V1_STR,
        "privacy": "Files are processed 100% locally on this device."
    }

# Serve built frontend
frontend_dist = PROJECT_ROOT / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_candidate = frontend_dist / full_path
        if file_candidate.is_file():
            return FileResponse(file_candidate)
        return FileResponse(frontend_dist / "index.html")
