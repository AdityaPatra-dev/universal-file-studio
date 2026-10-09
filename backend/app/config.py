import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory: /home/.../universal-file-studio
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = PROJECT_ROOT / "storage"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Universal File Studio"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{STORAGE_DIR}/ufs.db"
    
    # Storage Paths
    UPLOAD_DIR: str = str(STORAGE_DIR / "uploads")
    OUTPUT_DIR: str = str(STORAGE_DIR / "outputs")
    TEMP_DIR: str = str(STORAGE_DIR / "temp")
    THUMBNAIL_DIR: str = str(STORAGE_DIR / "thumbnails")
    
    # Upload & Concurrency
    MAX_UPLOAD_SIZE_MB: int = 4096  # 4 GB
    MAX_CONCURRENT_JOBS: int = 4
    SUBPROCESS_TIMEOUT_SECONDS: int = 3600
    
    # Local Server
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    DEBUG: bool = True
    
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

