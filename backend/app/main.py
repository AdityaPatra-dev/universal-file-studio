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
    pipelines_router
)

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
    description="Universal Local File Processing and Conversion Studio",
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
app.include_router(files_router, prefix=settings.API_V1_STR)
app.include_router(jobs_router, prefix=settings.API_V1_STR)
app.include_router(operations_router, prefix=settings.API_V1_STR)
app.include_router(system_router, prefix=settings.API_V1_STR)
app.include_router(batch_router, prefix=settings.API_V1_STR)
app.include_router(presets_router, prefix=settings.API_V1_STR)
app.include_router(pipelines_router, prefix=settings.API_V1_STR)

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
