from app.api.routes.files import router as files_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.operations import router as operations_router
from app.api.routes.system import router as system_router
from app.api.routes.batch import router as batch_router
from app.api.routes.presets import router as presets_router
from app.api.routes.pipelines import router as pipelines_router

__all__ = [
    "files_router",
    "jobs_router",
    "operations_router",
    "system_router",
    "batch_router",
    "presets_router",
    "pipelines_router",
]
