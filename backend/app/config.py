import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory: /home/.../universal-file-studio
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent
_STORAGE_DIR = PROJECT_ROOT / "storage"
STORAGE_DIR = _STORAGE_DIR

class Settings(BaseSettings):
    PROJECT_NAME: str = "Universal File Studio"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{_STORAGE_DIR}/ufs.db"
    
    # Storage Paths
    STORAGE_DIR: str = str(_STORAGE_DIR)
    UPLOAD_DIR: str = str(_STORAGE_DIR / "uploads")
    OUTPUT_DIR: str = str(_STORAGE_DIR / "outputs")
    TEMP_DIR: str = str(_STORAGE_DIR / "temp")
    THUMBNAIL_DIR: str = str(_STORAGE_DIR / "thumbnails")
    
    # Upload & Concurrency
    MAX_UPLOAD_SIZE_MB: int = 4096  # 4 GB
    MAX_CONCURRENT_JOBS: int = 4
    SUBPROCESS_TIMEOUT_SECONDS: int = 3600
    
    # Local Server (binds to 0.0.0.0 for LAN & Mobile Android access)
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ALLOWED_ORIGINS: list[str] = [
        "*"
    ]
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

settings = Settings()

# Ensure storage directories exist
for path in [settings.UPLOAD_DIR, settings.OUTPUT_DIR, settings.TEMP_DIR, settings.THUMBNAIL_DIR]:
    os.makedirs(path, exist_ok=True)

