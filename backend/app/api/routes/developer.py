import sys
from typing import Dict, Any, List
from fastapi import APIRouter, Request, Depends
from app.config import settings
from app.engines.manager import EngineManager
from app.processors.registry import processor_registry
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/developer", tags=["developer"])

@router.get("/info")
async def get_developer_info(request: Request) -> Dict[str, Any]:
    """
    Returns developer diagnostics, capabilities, and system specifications.
    """
    engines = EngineManager.list_all()
    installed_engines = [e.name for e in engines if e.installed]
    
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": {
            "python_version": sys.version,
            "os": sys.platform,
            "host": settings.HOST,
            "port": settings.PORT,
            "api_prefix": settings.API_V1_STR,
        },
        "docs": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": f"{settings.API_V1_STR}/developer/openapi.json",
        },
        "websocket": {
            "stream_endpoint": "/ws",
            "scoped_endpoint": "/ws/jobs/{job_id}",
            "supported_events": [
                "job:progress",
                "job:completed",
                "job:failed",
                "job:cancelled",
                "engine:status",
                "connected",
                "subscribed"
            ]
        },
        "engines": {
            "total_registered": len(engines),
            "installed_count": len(installed_engines),
            "installed": installed_engines,
        },
        "cli": {
            "binary": "ufs",
            "module": "python -m app.cli",
            "commands": ["status", "engines", "convert", "hash", "strip-metadata", "ocr", "pipeline", "jobs", "serve"]
        }
    }


@router.get("/openapi.json")
async def get_custom_openapi(request: Request) -> Dict[str, Any]:
    """
    Direct endpoint exporting the active OpenAPI schema dictionary.
    """
    return request.app.openapi()


@router.get("/events")
async def get_event_schemas() -> Dict[str, Any]:
    """
    Returns the schema definitions for all real-time WebSocket events.
    """
    return {
        "job:progress": {
            "description": "Emitted continuously as background engine processes file chunks.",
            "fields": {
                "job_id": "string (UUID)",
                "percent": "float (0.0 to 100.0)",
                "current_file": "string",
                "speed": "string",
                "eta_seconds": "integer"
            }
        },
        "job:completed": {
            "description": "Emitted when a processing job terminates successfully.",
            "fields": {
                "job_id": "string (UUID)",
                "output_path": "string",
                "duration": "float (seconds)",
                "input_size": "integer (bytes)",
                "output_size": "integer (bytes)"
            }
        },
        "job:failed": {
            "description": "Emitted when a job encounters a subprocess or processing error.",
            "fields": {
                "job_id": "string (UUID)",
                "error": "string",
                "detail": "string (traceback / stderr)"
            }
        },
        "job:cancelled": {
            "description": "Emitted when an active job is explicitly terminated by user.",
            "fields": {
                "job_id": "string (UUID)"
            }
        },
        "engine:status": {
            "description": "Emitted when an engine status changes or is rescanned.",
            "fields": {
                "engine_name": "string",
                "status": "string (installed | missing)"
            }
        }
    }


@router.post("/test-event")
async def trigger_test_event(event_type: str = "ping", message: str = "Test broadcast") -> Dict[str, Any]:
    """
    Triggers a developer test packet over WebSocket broadcast.
    """
    payload = {"message": message, "sender": "developer_test_api"}
    await ws_manager.broadcast(f"test:{event_type}", payload)
    return {"status": "broadcasted", "event": f"test:{event_type}", "payload": payload}
