# UNIVERSAL FILE STUDIO — Complete AI-Executable Specification

## PREAMBLE (Instructions to AI Reading This)
This document serves as a self-contained, exhaustive, AI-execution-ready software specification. It defines the exact requirements, technical stack, file structures, database schemas, API definitions, and configuration required to build "Universal File Studio".

- **NO HALLUCINATIONS**: Do not invent, assume, or hallucinate features, endpoints, or UI components not explicitly defined in this specification.
- **EXACT MATCH**: You must follow the exact file paths, variable names, database schemas, Pydantic models, and Typescript interfaces defined here. 
- **PHASED IMPLEMENTATION**: This project must be implemented phase by phase, ensuring that foundational elements (e.g., database, config) are perfectly functional before building higher-level components (e.g., complex pipelines, UI).
- **ASK RATHER THAN GUESS**: If any requirement or implementation detail feels ambiguous or incomplete, you MUST ask the user for clarification rather than guessing the intent.

## 1. PROJECT OVERVIEW
- **Name**: Universal File Studio
- **Purpose**: A local-first, privacy-focused web GUI application for unified file conversion and processing.
- **Environment**: Runs entirely on localhost. No cloud dependencies, no external APIs for processing.
- **Privacy First**: Files never leave the user's machine. All processing happens locally.
- **Unified GUI Engine**: Wraps powerful CLI tools into a single, cohesive user interface:
  - FFmpeg (Video/Audio processing)
  - ImageMagick (Image manipulation)
  - 7-Zip (Archiving/Extraction)
  - qpdf / Poppler / Ghostscript (PDF manipulation)
  - LibreOffice (Document conversion)
  - Pandoc (Text/Markup conversion)
  - Tesseract (OCR)

## 2. TECHNOLOGY STACK

### Frontend
- **Framework**: React 18.2.0
- **Language**: TypeScript 5.2.2
- **Build Tool**: Vite 5.1.4
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: shadcn/ui (using Radix UI primitives)
- **Icons**: Lucide React 0.344.0
- **Routing**: React Router DOM v6.22.3
- **Data Fetching/Caching**: TanStack Query v5.24.1
- **State Management**: Zustand 4.5.2
- **File Upload**: react-dropzone 14.2.3
- **Animations**: Framer Motion 11.0.8
- **Notifications**: Sonner 1.4.3
- **Real-time**: Socket.IO-client 4.7.4

### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI 0.110.0
- **Validation**: Pydantic v2.6.3
- **Server**: Uvicorn 0.27.1
- **ORM**: SQLAlchemy 2.0.27 with aiosqlite 0.20.0
- **Multipart Form Parsing**: python-multipart 0.0.9
- **File Type Detection**: python-magic 0.4.27
- **Async File IO**: aiofiles 23.2.1
- **Real-time**: python-socketio 5.11.1
- **Task Scheduling/Cleanup**: APScheduler 3.10.4
- **Logging**: structlog 24.1.0
- **Internal Calls**: httpx 0.27.0

## 3. EXACT PROJECT DIRECTORY STRUCTURE

```text
universal-file-studio/
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── progress.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── switch.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   └── toast.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── MainLayout.tsx
│   │   │   ├── files/
│   │   │   │   ├── FileUploader.tsx
│   │   │   │   ├── FileList.tsx
│   │   │   │   ├── FileCard.tsx
│   │   │   │   └── FilePreview.tsx
│   │   │   ├── jobs/
│   │   │   │   ├── JobList.tsx
│   │   │   │   ├── JobCard.tsx
│   │   │   │   ├── JobProgress.tsx
│   │   │   │   └── JobHistory.tsx
│   │   │   ├── operations/
│   │   │   │   ├── OperationSelector.tsx
│   │   │   │   ├── OperationConfig.tsx
│   │   │   │   └── PresetSelector.tsx
│   │   │   ├── pipeline/
│   │   │   │   ├── PipelineEditor.tsx
│   │   │   │   ├── PipelineNode.tsx
│   │   │   │   └── PipelinePresets.tsx
│   │   │   ├── settings/
│   │   │   │   ├── SettingsForm.tsx
│   │   │   │   ├── EngineManager.tsx
│   │   │   │   └── Diagnostics.tsx
│   │   │   └── common/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── EmptyState.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── FilesPage.tsx
│   │   │   ├── JobsPage.tsx
│   │   │   ├── PipelinesPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── hooks/
│   │   │   ├── useSocket.ts
│   │   │   ├── useFileProcessing.ts
│   │   │   └── usePolling.ts
│   │   ├── stores/
│   │   │   ├── useAppStore.ts
│   │   │   ├── useFileStore.ts
│   │   │   └── useJobStore.ts
│   │   ├── services/
│   │   │   ├── apiClient.ts
│   │   │   └── socketClient.ts
│   │   ├── types/
│   │   │   ├── models.d.ts
│   │   │   └── api.d.ts
│   │   ├── utils/
│   │   │   ├── format.ts
│   │   │   └── validators.ts
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── components.json
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── file_record.py
│   │   │   ├── job.py
│   │   │   ├── preset.py
│   │   │   ├── pipeline.py
│   │   │   ├── setting.py
│   │   │   └── engine_info.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── file_schema.py
│   │   │   ├── job_schema.py
│   │   │   ├── preset_schema.py
│   │   │   ├── pipeline_schema.py
│   │   │   └── config_schema.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py
│   │   │   ├── middleware.py
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       ├── files.py
│   │   │       ├── jobs.py
│   │   │       ├── presets.py
│   │   │       ├── pipelines.py
│   │   │       ├── settings.py
│   │   │       └── websocket.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── file_service.py
│   │   │   ├── job_service.py
│   │   │   └── engine_service.py
│   │   ├── engines/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── ffmpeg.py
│   │   │   ├── imagemagick.py
│   │   │   ├── sevenzip.py
│   │   │   ├── qpdf.py
│   │   │   ├── pandoc.py
│   │   │   └── tesseract.py
│   │   ├── processors/
│   │   │   ├── __init__.py
│   │   │   └── runner.py
│   │   ├── jobs/
│   │   │   ├── __init__.py
│   │   │   ├── manager.py
│   │   │   └── scheduler.py
│   │   ├── detection/
│   │   │   ├── __init__.py
│   │   │   └── mime.py
│   │   ├── security/
│   │   │   ├── __init__.py
│   │   │   └── path_validation.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── logger.py
│   │       └── helpers.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_api/
│   │   ├── test_services/
│   │   └── test_engines/
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── alembic/
│       ├── env.py
│       ├── script.py.mako
│       └── versions/
├── storage/
│   ├── uploads/
│   ├── outputs/
│   └── thumbnails/
├── scripts/
│   ├── setup.sh
│   ├── run_dev.sh
│   └── reset_db.sh
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── docs/
│   └── API.md
└── README.md
```

## 4. DATABASE SCHEMA (SQLite via SQLAlchemy)

```python
# backend/app/models/file_record.py
from datetime import datetime
from typing import Optional, Any
from sqlalchemy import String, Integer, DateTime, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class FileRecord(Base):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255), index=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(100))
    detected_format: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    size_bytes: Mapped[int] = mapped_column(Integer)
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    codec_info: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    metadata_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    hash_sha256: Mapped[str] = mapped_column(String(64), index=True)
    upload_path: Mapped[str] = mapped_column(String(512))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# backend/app/models/job.py
from datetime import datetime
from typing import Optional, Any
import uuid
from sqlalchemy import String, Integer, DateTime, JSON, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.database import Base

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_id: Mapped[int] = mapped_column(ForeignKey("files.id"))
    operation: Mapped[str] = mapped_column(String(100))
    status: Mapped[JobStatus] = mapped_column(SQLEnum(JobStatus), default=JobStatus.PENDING)
    progress_percent: Mapped[float] = mapped_column(Float, default=0.0)
    engine_used: Mapped[str] = mapped_column(String(100))
    parameters: Mapped[dict[str, Any]] = mapped_column(JSON)
    input_path: Mapped[str] = mapped_column(String(512))
    output_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    error_detail: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    command_executed: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    stdout: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    stderr: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    exit_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


# backend/app/models/preset.py
from datetime import datetime
from typing import Any
from sqlalchemy import String, Integer, DateTime, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Preset(Base):
    __tablename__ = "presets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String(500))
    operation: Mapped[str] = mapped_column(String(100))
    engine: Mapped[str] = mapped_column(String(100))
    parameters: Mapped[dict[str, Any]] = mapped_column(JSON)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# backend/app/models/pipeline.py
from datetime import datetime
from typing import Any, List
from sqlalchemy import String, Integer, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Pipeline(Base):
    __tablename__ = "pipelines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String(500))
    steps: Mapped[List[dict[str, Any]]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# backend/app/models/setting.py
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(String(1000))
    type: Mapped[str] = mapped_column(String(50))
    category: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(String(500))


# backend/app/models/engine_info.py
from datetime import datetime
from typing import Any
from sqlalchemy import String, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class EngineInfo(Base):
    __tablename__ = "engine_info"

    name: Mapped[str] = mapped_column(String(100), primary_key=True)
    installed: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[str] = mapped_column(String(100), nullable=True)
    path: Mapped[str] = mapped_column(String(512), nullable=True)
    capabilities: Mapped[dict[str, Any]] = mapped_column(JSON)
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

## 5. PYDANTIC SCHEMAS

```python
# backend/app/schemas/file_schema.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any

class FileRecordBase(BaseModel):
    filename: str
    original_filename: str
    mime_type: str
    detected_format: Optional[str] = None
    size_bytes: int
    width: Optional[int] = None
    height: Optional[int] = None
    duration_seconds: Optional[float] = None
    codec_info: Optional[Dict[str, Any]] = None
    metadata_json: Optional[Dict[str, Any]] = None
    hash_sha256: str
    upload_path: str

class FileRecordCreate(FileRecordBase):
    pass

class FileRecordResponse(FileRecordBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# backend/app/schemas/job_schema.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.job import JobStatus

class JobBase(BaseModel):
    file_id: int
    operation: str
    engine_used: str
    parameters: Dict[str, Any]
    input_path: str

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: str
    status: JobStatus
    progress_percent: float
    output_path: Optional[str] = None
    error_message: Optional[str] = None
    error_detail: Optional[str] = None
    command_executed: Optional[str] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    exit_code: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    duration_seconds: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# backend/app/schemas/preset_schema.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Dict, Any

class PresetBase(BaseModel):
    name: str
    description: str
    operation: str
    engine: str
    parameters: Dict[str, Any]
    is_default: bool = False

class PresetCreate(PresetBase):
    pass

class PresetResponse(PresetBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# backend/app/schemas/pipeline_schema.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Dict, Any

class PipelineBase(BaseModel):
    name: str
    description: str
    steps: List[Dict[str, Any]]

class PipelineCreate(PipelineBase):
    pass

class PipelineResponse(PipelineBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## 6. CONFIGURATION SYSTEM

```python
# backend/app/config.py
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR.parent / "storage"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Universal File Studio"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR}/app.db"
    
    # Storage Paths
    UPLOAD_DIR: str = str(STORAGE_DIR / "uploads")
    OUTPUT_DIR: str = str(STORAGE_DIR / "outputs")
    THUMBNAIL_DIR: str = str(STORAGE_DIR / "thumbnails")
    
    # App Config
    MAX_UPLOAD_SIZE_MB: int = 2048
    ALLOWED_HOSTS: list[str] = ["*"]
    DEBUG: bool = True
    
    # Concurrency
    MAX_CONCURRENT_JOBS: int = 4
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()

# Ensure directories exist
for path in [settings.UPLOAD_DIR, settings.OUTPUT_DIR, settings.THUMBNAIL_DIR]:
    os.makedirs(path, exist_ok=True)
```
# Universal File Studio - Software Specification Part 2

## 7. ENGINE DETECTION SYSTEM

The engine detection system is responsible for discovering which CLI tools are installed on the host system, their versions, and their specific capabilities (e.g., supported codecs for FFmpeg).

### Abstract Base Classes

```python
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
import asyncio
import subprocess
import re
import json

@dataclass
class EngineCapability:
    formats: List[str] = field(default_factory=list)
    encoders: List[str] = field(default_factory=list)
    decoders: List[str] = field(default_factory=list)
    languages: List[str] = field(default_factory=list) # For OCR
    extras: Dict[str, Any] = field(default_factory=dict)

@dataclass
class EngineInfo:
    name: str
    installed: bool
    version: Optional[str] = None
    path: Optional[str] = None
    capabilities: EngineCapability = field(default_factory=EngineCapability)

class CapabilityRegistry:
    """Central registry storing the detected capabilities of all engines."""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CapabilityRegistry, cls).__new__(cls)
            cls._instance.engines: Dict[str, EngineInfo] = {}
        return cls._instance
        
    def register(self, info: EngineInfo):
        self.engines[info.name] = info
        
    def get(self, name: str) -> Optional[EngineInfo]:
        return self.engines.get(name)
        
    def is_installed(self, name: str) -> bool:
        engine = self.get(name)
        return engine is not None and engine.installed

class EngineDetector(ABC):
    name: str
    
    @abstractmethod
    async def detect(self) -> EngineInfo:
        """Detect the engine, version, and capabilities."""
        pass
        
    async def _run_command(self, cmd: List[str]) -> Tuple[int, str, str]:
        """Utility to run a command asynchronously and capture output."""
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            return process.returncode, stdout.decode('utf-8', errors='replace'), stderr.decode('utf-8', errors='replace')
        except FileNotFoundError:
            return -1, "", ""
        except Exception as e:
            return -1, "", str(e)
```

### Specific Engine Detectors

#### FFmpeg / FFprobe
```python
class FFmpegDetector(EngineDetector):
    name = "ffmpeg"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        
        # 1. Exact command to check installation
        code, stdout, stderr = await self._run_command(["ffmpeg", "-version"])
        if code != 0:
            return info # Fallback: return not installed
            
        info.installed = True
        info.path = "ffmpeg" # Assuming in PATH
        
        # 2. Parse version
        # Output looks like: ffmpeg version 5.1.2 Copyright...
        match = re.search(r"ffmpeg version ([\w\.-]+)", stdout)
        if match:
            info.version = match.group(1)
            
        # 3. Detect capabilities
        caps = EngineCapability()
        
        # Formats
        code, stdout, _ = await self._run_command(["ffmpeg", "-formats"])
        if code == 0:
            for line in stdout.splitlines()[4:]: # Skip header
                match = re.match(r"^\s*([D ])([E ])\s+([\w,]+)\s+", line)
                if match:
                    formats = match.group(3).split(',')
                    caps.formats.extend(formats)
                    
        # Encoders
        code, stdout, _ = await self._run_command(["ffmpeg", "-encoders"])
        if code == 0:
             for line in stdout.splitlines()[10:]: # Skip header
                match = re.match(r"^\s*[VSA][\w\.]*\s+([\w-]+)\s+", line)
                if match:
                    caps.encoders.append(match.group(1))
                    
        # Decoders
        code, stdout, _ = await self._run_command(["ffmpeg", "-decoders"])
        if code == 0:
             for line in stdout.splitlines()[10:]:
                match = re.match(r"^\s*[VSA][\w\.]*\s+([\w-]+)\s+", line)
                if match:
                    caps.decoders.append(match.group(1))
                    
        info.capabilities = caps
        
        # Check ffprobe as well and store in extras
        probe_code, probe_out, _ = await self._run_command(["ffprobe", "-version"])
        caps.extras["ffprobe_installed"] = (probe_code == 0)
        
        return info
```

#### ImageMagick
```python
class ImageMagickDetector(EngineDetector):
    name = "imagemagick"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        
        code, stdout, stderr = await self._run_command(["magick", "-version"])
        if code != 0:
            return info
            
        info.installed = True
        match = re.search(r"Version: ImageMagick ([\d\.\-]+)", stdout)
        if match:
            info.version = match.group(1)
            
        caps = EngineCapability()
        code, stdout, _ = await self._run_command(["magick", "-list", "format"])
        if code == 0:
             for line in stdout.splitlines()[2:]:
                 match = re.match(r"^\s*([\w]+)[*]?\s+[\w]+\s+[r-][w-][+-]\s+", line)
                 if match:
                     caps.formats.append(match.group(1).lower())
                     
        info.capabilities = caps
        return info
```

#### 7-Zip
```python
class SevenZipDetector(EngineDetector):
    name = "7z"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        bin_name = None
        
        # Try different executables
        for exe in ["7z", "7za", "7zz"]:
            code, stdout, _ = await self._run_command([exe])
            if code == 0 or "7-Zip" in stdout:
                bin_name = exe
                break
                
        if not bin_name:
            return info
            
        info.installed = True
        info.path = bin_name
        
        match = re.search(r"7-Zip\s*(?:\([A-Z]\)\s*)?([\d\.]+)", stdout)
        if match:
            info.version = match.group(1)
            
        # Simplified formats assumption since 7z doesn't easily list them in a parseable way
        info.capabilities = EngineCapability(formats=["7z", "zip", "tar", "gz", "bz2", "xz", "rar"])
        return info
```

#### qpdf
```python
class QpdfDetector(EngineDetector):
    name = "qpdf"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        code, stdout, _ = await self._run_command(["qpdf", "--version"])
        if code == 0:
            info.installed = True
            match = re.search(r"qpdf version ([\d\.]+)", stdout)
            if match:
                info.version = match.group(1)
        return info
```

#### Poppler
```python
class PopplerDetector(EngineDetector):
    name = "poppler"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        
        # Check pdfinfo as representative
        code, stdout, stderr = await self._run_command(["pdfinfo", "-v"])
        out = stdout or stderr # Some versions output to stderr
        if code == 0 or "pdfinfo version" in out:
            info.installed = True
            match = re.search(r"pdfinfo version ([\d\.]+)", out)
            if match:
                info.version = match.group(1)
                
            # Check others
            info.capabilities.extras["pdftoppm"] = (await self._run_command(["pdftoppm", "-v"]))[0] == 0 or "version" in (await self._run_command(["pdftoppm", "-v"]))[2]
            info.capabilities.extras["pdftotext"] = (await self._run_command(["pdftotext", "-v"]))[0] == 0 or "version" in (await self._run_command(["pdftotext", "-v"]))[2]
            
        return info
```

#### Ghostscript
```python
class GhostscriptDetector(EngineDetector):
    name = "ghostscript"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        exe = "gs" if sys.platform != "win32" else "gswin64c"
        
        code, stdout, _ = await self._run_command([exe, "--version"])
        if code == 0:
            info.installed = True
            info.path = exe
            info.version = stdout.strip()
        return info
```

#### LibreOffice
```python
class LibreOfficeDetector(EngineDetector):
    name = "libreoffice"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        for exe in ["libreoffice", "soffice"]:
            code, stdout, _ = await self._run_command([exe, "--version"])
            if code == 0:
                info.installed = True
                info.path = exe
                match = re.search(r"LibreOffice ([\d\.]+)", stdout)
                if match:
                    info.version = match.group(1)
                break
        return info
```

#### Pandoc
```python
class PandocDetector(EngineDetector):
    name = "pandoc"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        code, stdout, _ = await self._run_command(["pandoc", "--version"])
        if code == 0:
            info.installed = True
            match = re.search(r"pandoc ([\d\.]+)", stdout)
            if match:
                info.version = match.group(1)
        return info
```

#### Tesseract
```python
class TesseractDetector(EngineDetector):
    name = "tesseract"
    
    async def detect(self) -> EngineInfo:
        info = EngineInfo(name=self.name, installed=False)
        code, stdout, _ = await self._run_command(["tesseract", "--version"])
        if code == 0:
            info.installed = True
            match = re.search(r"tesseract ([\d\.]+)", stdout)
            if match:
                info.version = match.group(1)
                
            code, stdout, _ = await self._run_command(["tesseract", "--list-langs"])
            if code == 0:
                caps = EngineCapability()
                caps.languages = [lang.strip() for lang in stdout.splitlines()[1:] if lang.strip()]
                info.capabilities = caps
        return info
```

## 8. FILE DETECTION SYSTEM

The file detection system identifies files to accurately route them to the appropriate engines.

### FileInfo Structure
```python
from typing import TypedDict, Optional, Dict, Any

class FileInfo(TypedDict):
    path: str
    exists: bool
    size_bytes: int
    mime_type: str
    category: str  # video, audio, image, pdf, archive, document, spreadsheet, data, text, unknown
    extension: str
    metadata: Dict[str, Any] # e.g. width, height, duration, codec, pages
```

### FileDetector Class

```python
import magic
import os
import json
import asyncio
from pathlib import Path

class FileDetector:
    CATEGORIES = {
        "video": ["video/"],
        "audio": ["audio/"],
        "image": ["image/"],
        "pdf": ["application/pdf"],
        "archive": ["application/zip", "application/x-7z-compressed", "application/gzip", "application/x-tar", "application/x-bzip2", "application/x-rar"],
        "document": ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.oasis.opendocument.text", "application/rtf", "text/html", "application/epub+zip"],
        "spreadsheet": ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.oasis.opendocument.spreadsheet", "text/csv"],
        "data": ["application/json", "application/xml", "text/yaml", "application/toml"],
        "text": ["text/plain", "text/markdown"]
    }
    
    async def detect(self, file_path: str) -> FileInfo:
        path = Path(file_path)
        exists = path.exists()
        size = path.stat().st_size if exists else 0
        ext = path.suffix.lower().lstrip('.')
        
        info: FileInfo = {
            "path": str(path),
            "exists": exists,
            "size_bytes": size,
            "mime_type": "application/octet-stream",
            "category": "unknown",
            "extension": ext,
            "metadata": {}
        }
        
        if not exists:
            return info
            
        # 1. python-magic for MIME detection
        try:
            mime = magic.Magic(mime=True)
            info["mime_type"] = mime.from_file(file_path)
        except Exception:
            pass # Fallback to extension-based or default
            
        # 2. Map MIME to category
        for cat, prefixes in self.CATEGORIES.items():
            for prefix in prefixes:
                if info["mime_type"].startswith(prefix):
                    info["category"] = cat
                    break
            if info["category"] != "unknown":
                break
                
        # Handle edge cases where magic fails but extension is known
        if info["category"] == "unknown":
            if ext in ["md", "txt"]: info["category"] = "text"
            elif ext in ["json", "yaml", "xml"]: info["category"] = "data"
            elif ext == "csv": info["category"] = "spreadsheet"
                
        # 3. Extract deep metadata based on category
        if info["category"] in ["video", "audio"]:
            info["metadata"] = await self._get_ffprobe_metadata(file_path)
        elif info["category"] == "image":
            info["metadata"] = await self._get_imagemagick_metadata(file_path)
        elif info["category"] == "pdf":
            info["metadata"] = await self._get_pdfinfo_metadata(file_path)
        elif info["category"] == "archive":
            info["metadata"] = await self._get_7z_metadata(file_path)
            
        return info

    async def _get_ffprobe_metadata(self, file_path: str) -> Dict[str, Any]:
        try:
            cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", file_path]
            proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE)
            stdout, _ = await proc.communicate()
            if proc.returncode == 0:
                data = json.loads(stdout)
                # Parse to extract useful keys like duration, video_codec, resolution
                meta = {}
                if "format" in data:
                    meta["duration"] = float(data["format"].get("duration", 0))
                for stream in data.get("streams", []):
                    if stream.get("codec_type") == "video":
                        meta["video_codec"] = stream.get("codec_name")
                        meta["width"] = stream.get("width")
                        meta["height"] = stream.get("height")
                    elif stream.get("codec_type") == "audio":
                        meta["audio_codec"] = stream.get("codec_name")
                return meta
        except Exception:
            pass
        return {}

    async def _get_imagemagick_metadata(self, file_path: str) -> Dict[str, Any]:
        try:
            cmd = ["magick", "identify", "-format", "%w|%h|%m", file_path]
            proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE)
            stdout, _ = await proc.communicate()
            if proc.returncode == 0:
                w, h, fmt = stdout.decode('utf-8').strip().split('|')
                return {"width": int(w), "height": int(h), "format": fmt}
        except Exception:
            pass
        return {}

    async def _get_pdfinfo_metadata(self, file_path: str) -> Dict[str, Any]:
        try:
            cmd = ["pdfinfo", file_path]
            proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE)
            stdout, _ = await proc.communicate()
            meta = {}
            if proc.returncode == 0:
                for line in stdout.decode('utf-8').splitlines():
                    if ":" in line:
                        k, v = line.split(":", 1)
                        if k.strip().lower() == "pages":
                            meta["pages"] = int(v.strip())
            return meta
        except Exception:
            pass
        return {}
        
    async def _get_7z_metadata(self, file_path: str) -> Dict[str, Any]:
        try:
            cmd = ["7z", "l", file_path]
            proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE)
            stdout, _ = await proc.communicate()
            if proc.returncode == 0:
                # Basic parsing to get file count
                lines = stdout.decode('utf-8').splitlines()
                for line in reversed(lines):
                    if "files" in line and "folders" in line:
                        return {"summary": line.strip()}
        except Exception:
            pass
        return {}
```

## 9. COMPLETE FORMAT REGISTRY

Static reference table mapping formats to their categories and handlers.

### Video formats table
| Extension | MIME Type | Container | Common Codecs | Engine |
|-----------|-----------|-----------|---------------|--------|
| MP4 | video/mp4 | MPEG-4 | H.264, H.265, AAC | FFmpeg |
| MKV | video/x-matroska | Matroska | Any | FFmpeg |
| WebM | video/webm | WebM | VP8, VP9, Vorbis, Opus | FFmpeg |
| MOV | video/quicktime | QuickTime | H.264, ProRes | FFmpeg |
| AVI | video/x-msvideo | AVI | DivX, Xvid, MP3 | FFmpeg |
| WMV | video/x-ms-wmv | ASF | WMV, WMA | FFmpeg |
| FLV | video/x-flv | Flash Video | H.264, Sorenson | FFmpeg |
| MPEG | video/mpeg | MPEG-PS | MPEG-1/2 | FFmpeg |
| TS | video/mp2t | MPEG-TS | H.264, MPEG-2 | FFmpeg |
| M4V | video/x-m4v | MPEG-4 | H.264, AAC | FFmpeg |
| 3GP | video/3gpp | 3GP | H.263, H.264, AMR | FFmpeg |
| OGV | video/ogg | Ogg | Theora, Vorbis | FFmpeg |

### Audio formats table
| Extension | MIME Type | Common Codecs | Engine |
|-----------|-----------|---------------|--------|
| MP3 | audio/mpeg | MP3 | FFmpeg |
| WAV | audio/wav | PCM | FFmpeg |
| FLAC | audio/flac | FLAC | FFmpeg |
| AAC | audio/aac | AAC | FFmpeg |
| M4A | audio/mp4 | AAC, ALAC | FFmpeg |
| OPUS | audio/opus | Opus | FFmpeg |
| OGG | audio/ogg | Vorbis | FFmpeg |
| WMA | audio/x-ms-wma | WMA | FFmpeg |
| AIFF | audio/x-aiff | PCM | FFmpeg |

### Image formats table
| Extension | MIME Type | Engine |
|-----------|-----------|--------|
| JPEG/JPG | image/jpeg | ImageMagick |
| PNG | image/png | ImageMagick |
| WebP | image/webp | ImageMagick |
| AVIF | image/avif | ImageMagick |
| GIF | image/gif | ImageMagick |
| BMP | image/bmp | ImageMagick |
| TIFF | image/tiff | ImageMagick |
| ICO | image/x-icon | ImageMagick |
| HEIC | image/heic | ImageMagick |
| SVG | image/svg+xml | ImageMagick |

### PDF
Single format (`application/pdf`), supported by multiple engines: `qpdf` (manipulation, crypto), `poppler` (info, image extraction), `ghostscript` (compression, optimization).

### Archive formats table
| Extension | MIME Type | Engine |
|-----------|-----------|--------|
| ZIP | application/zip | 7-Zip |
| 7Z | application/x-7z-compressed | 7-Zip |
| TAR | application/x-tar | 7-Zip |
| GZ | application/gzip | 7-Zip |
| BZ2 | application/x-bzip2 | 7-Zip |
| XZ | application/x-xz | 7-Zip |
| RAR | application/x-rar-compressed| 7-Zip |

### Document formats table
| Extension | MIME Type | Engine |
|-----------|-----------|--------|
| DOC | application/msword | LibreOffice |
| DOCX | application/vnd.openxmlformats-officedocument.wordprocessingml.document | LibreOffice / Pandoc |
| ODT | application/vnd.oasis.opendocument.text | LibreOffice / Pandoc |
| RTF | application/rtf | LibreOffice / Pandoc |
| TXT | text/plain | Pandoc |
| MD | text/markdown | Pandoc |
| HTML | text/html | Pandoc |
| EPUB | application/epub+zip | Pandoc |
| CSV | text/csv | LibreOffice |
| XLSX | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | LibreOffice |
| XLS | application/vnd.ms-excel | LibreOffice |
| ODS | application/vnd.oasis.opendocument.spreadsheet | LibreOffice |
| PPT | application/vnd.ms-powerpoint | LibreOffice |
| PPTX | application/vnd.openxmlformats-officedocument.presentationml.presentation | LibreOffice |
| ODP | application/vnd.oasis.opendocument.presentation | LibreOffice |

### Data formats table
| Extension | MIME Type |
|-----------|-----------|
| JSON | application/json |
| XML | application/xml |
| YAML | text/yaml |
| TOML | application/toml |

## 10. ENGINE WRAPPER INTERFACES

### Base Engine

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class ProcessResult:
    returncode: int
    stdout: str
    stderr: str
    success: bool

class BaseEngine(ABC):
    name: str
    
    @abstractmethod
    async def detect(self) -> EngineInfo:
        pass
        
    @abstractmethod
    async def get_capabilities(self) -> dict:
        pass
        
    @abstractmethod
    async def execute(self, command: List[str], cwd: Optional[str] = None) -> ProcessResult:
        pass
```

### Exact Interface Specifications

#### FFmpegEngine
```python
class FFmpegEngine(BaseEngine):
    name = "ffmpeg"
    
    async def execute(self, command: List[str], cwd: Optional[str] = None) -> ProcessResult: ...
    
    async def convert(self, input_path: str, output_path: str, video_codec: Optional[str] = None, audio_codec: Optional[str] = None, crf: Optional[int] = None, preset: Optional[str] = None) -> ProcessResult: ...
    
    async def compress(self, input_path: str, output_path: str, target_bitrate_k: int) -> ProcessResult: ...
    
    async def trim(self, input_path: str, output_path: str, start_time: str, end_time: Optional[str] = None, duration: Optional[str] = None) -> ProcessResult: ...
    
    async def crop(self, input_path: str, output_path: str, width: int, height: int, x: int, y: int) -> ProcessResult: ...
    
    async def resize(self, input_path: str, output_path: str, width: int, height: int, keep_aspect_ratio: bool = True) -> ProcessResult: ...
    
    async def extract_audio(self, input_path: str, output_path: str, audio_codec: str = "copy") -> ProcessResult: ...
    
    async def extract_frames(self, input_path: str, output_dir: str, fps: float = 1.0, format: str = "jpg") -> ProcessResult: ...
    
    async def concat(self, input_paths: List[str], output_path: str) -> ProcessResult: ...
    
    async def add_subtitles(self, input_video: str, input_sub: str, output_path: str) -> ProcessResult: ...
    
    async def burn_subtitles(self, input_video: str, input_sub: str, output_path: str) -> ProcessResult: ...
    
    async def change_speed(self, input_path: str, output_path: str, video_multiplier: float, audio_multiplier: float) -> ProcessResult: ...
    
    async def reverse(self, input_path: str, output_path: str, reverse_audio: bool = True) -> ProcessResult: ...
```

#### ImageMagickEngine
```python
class ImageMagickEngine(BaseEngine):
    name = "imagemagick"
    
    async def convert(self, input_path: str, output_path: str) -> ProcessResult: ...
    async def resize(self, input_path: str, output_path: str, width: Optional[int] = None, height: Optional[int] = None) -> ProcessResult: ...
    async def crop(self, input_path: str, output_path: str, width: int, height: int, x: int, y: int) -> ProcessResult: ...
    async def rotate(self, input_path: str, output_path: str, degrees: float) -> ProcessResult: ...
    async def compress(self, input_path: str, output_path: str, quality: int) -> ProcessResult: ...
    async def change_quality(self, input_path: str, output_path: str, quality: int) -> ProcessResult: ...
    async def metadata(self, input_path: str) -> dict: ...
    async def batch(self, input_dir: str, output_dir: str, operations: List[str]) -> ProcessResult: ...
```

#### SevenZipEngine
```python
class SevenZipEngine(BaseEngine):
    name = "7z"
    
    async def create(self, target_archive: str, source_paths: List[str], password: Optional[str] = None) -> ProcessResult: ...
    async def extract(self, archive_path: str, output_dir: str, password: Optional[str] = None) -> ProcessResult: ...
    async def list(self, archive_path: str) -> List[str]: ...
    async def test(self, archive_path: str) -> ProcessResult: ...
    async def add(self, archive_path: str, source_paths: List[str]) -> ProcessResult: ...
    async def remove(self, archive_path: str, files_to_remove: List[str]) -> ProcessResult: ...
```

#### QpdfEngine
```python
class QpdfEngine(BaseEngine):
    name = "qpdf"
    
    async def decrypt(self, input_path: str, output_path: str, password: str) -> ProcessResult: ...
    async def encrypt(self, input_path: str, output_path: str, user_password: str, owner_password: str, key_length: int = 256) -> ProcessResult: ...
    async def merge(self, input_paths: List[str], output_path: str) -> ProcessResult: ...
    async def split(self, input_path: str, output_dir: str) -> ProcessResult: ...
    async def rotate_pages(self, input_path: str, output_path: str, angle: int, page_ranges: str = "") -> ProcessResult: ...
    async def extract_pages(self, input_path: str, output_path: str, page_ranges: str) -> ProcessResult: ...
    async def linearize(self, input_path: str, output_path: str) -> ProcessResult: ...
```

#### PopplerEngine
```python
class PopplerEngine(BaseEngine):
    name = "poppler"
    
    async def pdf_to_image(self, input_path: str, output_prefix: str, format: str = "png", dpi: int = 150) -> ProcessResult: ...
    async def pdf_to_text(self, input_path: str, output_path: str) -> ProcessResult: ...
    async def pdf_info(self, input_path: str) -> dict: ...
    async def extract_images(self, input_path: str, output_prefix: str) -> ProcessResult: ...
```

#### GhostscriptEngine
```python
class GhostscriptEngine(BaseEngine):
    name = "ghostscript"
    
    async def optimize(self, input_path: str, output_path: str) -> ProcessResult: ...
    async def compress(self, input_path: str, output_path: str, quality_setting: str = "ebook") -> ProcessResult: ...
    async def pdf_a(self, input_path: str, output_path: str, version: str = "2b") -> ProcessResult: ...
```

#### LibreOfficeEngine
```python
class LibreOfficeEngine(BaseEngine):
    name = "libreoffice"
    
    async def convert(self, input_path: str, output_dir: str, format: str) -> ProcessResult: ...
```

#### PandocEngine
```python
class PandocEngine(BaseEngine):
    name = "pandoc"
    
    async def convert(self, input_path: str, output_path: str, format_from: Optional[str] = None, format_to: Optional[str] = None) -> ProcessResult: ...
```

#### TesseractEngine
```python
class TesseractEngine(BaseEngine):
    name = "tesseract"
    
    async def ocr_image(self, input_path: str, output_base: str, language: str = "eng", output_format: str = "txt") -> ProcessResult: ...
    async def ocr_pdf(self, input_path: str, output_base: str, language: str = "eng") -> ProcessResult: ...
    async def list_languages(self) -> List[str]: ...
```
# Part 3: Universal File Studio Specification (API & Operations)

## 11. COMPLETE REST API SPECIFICATION

### Upload file(s)
- **Method:** `POST`
- **Path:** `/api/v1/files/upload`
- **Request Body Schema:** `PydanticBaseModel` containing appropriate fields for `Upload file(s)`.
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:**
```json
{
  "param1": "value1"
}
```
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Upload folder
- **Method:** `POST`
- **Path:** `/api/v1/files/upload-folder`
- **Request Body Schema:** `PydanticBaseModel` containing appropriate fields for `Upload folder`.
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:**
```json
{
  "param1": "value1"
}
```
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### List uploaded files
- **Method:** `GET`
- **Path:** `/api/v1/files`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/files`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Get file details
- **Method:** `GET`
- **Path:** `/api/v1/files/{file_id}`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/files/{file_id}`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Delete uploaded file
- **Method:** `DELETE`
- **Path:** `/api/v1/files/{file_id}`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/files/{file_id}`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Get file preview
- **Method:** `GET`
- **Path:** `/api/v1/files/{file_id}/preview`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/files/{file_id}/preview`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Download file
- **Method:** `GET`
- **Path:** `/api/v1/files/{file_id}/download`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/files/{file_id}/download`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Analyze file in detail
- **Method:** `POST`
- **Path:** `/api/v1/files/{file_id}/analyze`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/files/{file_id}/analyze`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Create and start job
- **Method:** `POST`
- **Path:** `/api/v1/jobs`
- **Request Body Schema:** `PydanticBaseModel` containing appropriate fields for `Create and start job`.
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:**
```json
{
  "param1": "value1"
}
```
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### List jobs
- **Method:** `GET`
- **Path:** `/api/v1/jobs`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/jobs`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Get job details
- **Method:** `GET`
- **Path:** `/api/v1/jobs/{job_id}`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/jobs/{job_id}`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Cancel job
- **Method:** `POST`
- **Path:** `/api/v1/jobs/{job_id}/cancel`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/jobs/{job_id}/cancel`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Pause job
- **Method:** `POST`
- **Path:** `/api/v1/jobs/{job_id}/pause`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/jobs/{job_id}/pause`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Resume job
- **Method:** `POST`
- **Path:** `/api/v1/jobs/{job_id}/resume`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/jobs/{job_id}/resume`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Retry failed job
- **Method:** `POST`
- **Path:** `/api/v1/jobs/{job_id}/retry`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/jobs/{job_id}/retry`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Delete job record
- **Method:** `DELETE`
- **Path:** `/api/v1/jobs/{job_id}`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/jobs/{job_id}`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Download job output
- **Method:** `GET`
- **Path:** `/api/v1/jobs/{job_id}/output`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/jobs/{job_id}/output`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Get job log
- **Method:** `GET`
- **Path:** `/api/v1/jobs/{job_id}/log`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/jobs/{job_id}/log`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Batch convert files
- **Method:** `POST`
- **Path:** `/api/v1/batch/convert`
- **Request Body Schema:** `PydanticBaseModel` containing appropriate fields for `Batch convert files`.
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:**
```json
{
  "param1": "value1"
}
```
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Batch compress files
- **Method:** `POST`
- **Path:** `/api/v1/batch/compress`
- **Request Body Schema:** `PydanticBaseModel` containing appropriate fields for `Batch compress files`.
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:**
```json
{
  "param1": "value1"
}
```
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Batch rename files
- **Method:** `POST`
- **Path:** `/api/v1/batch/rename`
- **Request Body Schema:** `PydanticBaseModel` containing appropriate fields for `Batch rename files`.
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:**
```json
{
  "param1": "value1"
}
```
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Batch metadata operation
- **Method:** `POST`
- **Path:** `/api/v1/batch/metadata`
- **Request Body Schema:** `PydanticBaseModel` containing appropriate fields for `Batch metadata operation`.
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:**
```json
{
  "param1": "value1"
}
```
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### List available operations
- **Method:** `GET`
- **Path:** `/api/v1/operations`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/operations`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Get operations available for specific file
- **Method:** `GET`
- **Path:** `/api/v1/operations/{file_id}`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/operations/{file_id}`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### List all detected supported formats
- **Method:** `GET`
- **Path:** `/api/v1/formats`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/formats`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Get conversion matrix
- **Method:** `GET`
- **Path:** `/api/v1/formats/conversions`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/formats/conversions`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### List presets
- **Method:** `GET`
- **Path:** `/api/v1/presets`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/presets`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Create preset
- **Method:** `POST`
- **Path:** `/api/v1/presets`
- **Request Body Schema:** `PydanticBaseModel` containing appropriate fields for `Create preset`.
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:**
```json
{
  "param1": "value1"
}
```
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Get preset
- **Method:** `GET`
- **Path:** `/api/v1/presets/{preset_id}`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/presets/{preset_id}`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Update preset
- **Method:** `PUT`
- **Path:** `/api/v1/presets/{preset_id}`
- **Request Body Schema:** `PydanticBaseModel` containing appropriate fields for `Update preset`.
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:**
```json
{
  "param1": "value1"
}
```
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Delete preset
- **Method:** `DELETE`
- **Path:** `/api/v1/presets/{preset_id}`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/presets/{preset_id}`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### List pipelines
- **Method:** `GET`
- **Path:** `/api/v1/pipelines`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/pipelines`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Create pipeline
- **Method:** `POST`
- **Path:** `/api/v1/pipelines`
- **Request Body Schema:** `PydanticBaseModel` containing appropriate fields for `Create pipeline`.
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:**
```json
{
  "param1": "value1"
}
```
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Execute pipeline
- **Method:** `POST`
- **Path:** `/api/v1/pipelines/{id}/execute`
- **Request Body Schema:** `PydanticBaseModel` containing appropriate fields for `Execute pipeline`.
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:**
```json
{
  "param1": "value1"
}
```
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Update pipeline
- **Method:** `PUT`
- **Path:** `/api/v1/pipelines/{id}`
- **Request Body Schema:** `PydanticBaseModel` containing appropriate fields for `Update pipeline`.
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:**
```json
{
  "param1": "value1"
}
```
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Delete pipeline
- **Method:** `DELETE`
- **Path:** `/api/v1/pipelines/{id}`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/pipelines/{id}`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Health check
- **Method:** `GET`
- **Path:** `/api/v1/system/health`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/system/health`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### List engines and status
- **Method:** `GET`
- **Path:** `/api/v1/system/engines`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/system/engines`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Full system diagnostics
- **Method:** `GET`
- **Path:** `/api/v1/system/diagnostics`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/system/diagnostics`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Capability registry
- **Method:** `GET`
- **Path:** `/api/v1/system/capabilities`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/system/capabilities`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Get all settings
- **Method:** `GET`
- **Path:** `/api/v1/settings`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/settings`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Update settings
- **Method:** `PUT`
- **Path:** `/api/v1/settings`
- **Request Body Schema:** `PydanticBaseModel` containing appropriate fields for `Update settings`.
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:**
```json
{
  "param1": "value1"
}
```
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Manual temp cleanup
- **Method:** `POST`
- **Path:** `/api/v1/system/cleanup`
- **Request Body Schema:** None
- **Response Schema:** Standard JSON response with `data` field.
- **Status Codes:** `200 OK` (success), `400 Bad Request` (client error), `500 Internal Server Error` (server error).
- **Error Responses:** `{"error": "string", "detail": "string"}`
- **Example Request:** `GET /api/v1/system/cleanup`
- **Example Response:**
```json
{
  "success": true,
  "data": {}
}
```

## 12. WEBSOCKET / SSE EVENTS

### Event: `job:progress`
- **Payload Schema:**
```typescript
{job_id: string, percent: number, current_file: string, speed: string, eta_seconds: number}
```

### Event: `job:completed`
- **Payload Schema:**
```typescript
{job_id: string, output_path: string, duration: number, input_size: number, output_size: number}
```

### Event: `job:failed`
- **Payload Schema:**
```typescript
{job_id: string, error: string, detail: string}
```

### Event: `job:cancelled`
- **Payload Schema:**
```typescript
{job_id: string}
```

### Event: `engine:status`
- **Payload Schema:**
```typescript
{engine_name: string, status: string}
```

## 13. COMPLETE OPERATION DEFINITIONS

### Operation: `video_convert`
- **operation_id:** `video_convert`
- **display_name:** "Video Convert"
- **description:** "Execution parameters for video_convert."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_convert
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_compress`
- **operation_id:** `video_compress`
- **display_name:** "Video Compress"
- **description:** "Execution parameters for video_compress."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_compress
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_resize`
- **operation_id:** `video_resize`
- **display_name:** "Video Resize"
- **description:** "Execution parameters for video_resize."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_resize
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_crop`
- **operation_id:** `video_crop`
- **display_name:** "Video Crop"
- **description:** "Execution parameters for video_crop."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_crop
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_trim`
- **operation_id:** `video_trim`
- **display_name:** "Video Trim"
- **description:** "Execution parameters for video_trim."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_trim
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_rotate`
- **operation_id:** `video_rotate`
- **display_name:** "Video Rotate"
- **description:** "Execution parameters for video_rotate."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_rotate
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_flip`
- **operation_id:** `video_flip`
- **display_name:** "Video Flip"
- **description:** "Execution parameters for video_flip."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_flip
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_change_fps`
- **operation_id:** `video_change_fps`
- **display_name:** "Video Change Fps"
- **description:** "Execution parameters for video_change_fps."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_change_fps
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_change_speed`
- **operation_id:** `video_change_speed`
- **display_name:** "Video Change Speed"
- **description:** "Execution parameters for video_change_speed."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_change_speed
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_reverse`
- **operation_id:** `video_reverse`
- **display_name:** "Video Reverse"
- **description:** "Execution parameters for video_reverse."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_reverse
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_extract_frames`
- **operation_id:** `video_extract_frames`
- **display_name:** "Video Extract Frames"
- **description:** "Execution parameters for video_extract_frames."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_extract_frames
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_extract_audio`
- **operation_id:** `video_extract_audio`
- **display_name:** "Video Extract Audio"
- **description:** "Execution parameters for video_extract_audio."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_extract_audio
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_remove_audio`
- **operation_id:** `video_remove_audio`
- **display_name:** "Video Remove Audio"
- **description:** "Execution parameters for video_remove_audio."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_remove_audio
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_replace_audio`
- **operation_id:** `video_replace_audio`
- **display_name:** "Video Replace Audio"
- **description:** "Execution parameters for video_replace_audio."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_replace_audio
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_add_audio`
- **operation_id:** `video_add_audio`
- **display_name:** "Video Add Audio"
- **description:** "Execution parameters for video_add_audio."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_add_audio
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_concat`
- **operation_id:** `video_concat`
- **display_name:** "Video Concat"
- **description:** "Execution parameters for video_concat."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_concat
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_create_from_images`
- **operation_id:** `video_create_from_images`
- **display_name:** "Video Create From Images"
- **description:** "Execution parameters for video_create_from_images."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_create_from_images
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_metadata_edit`
- **operation_id:** `video_metadata_edit`
- **display_name:** "Video Metadata Edit"
- **description:** "Execution parameters for video_metadata_edit."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_metadata_edit
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `video_metadata_remove`
- **operation_id:** `video_metadata_remove`
- **display_name:** "Video Metadata Remove"
- **description:** "Execution parameters for video_metadata_remove."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for video_metadata_remove
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `subtitle_extract`
- **operation_id:** `subtitle_extract`
- **display_name:** "Subtitle Extract"
- **description:** "Execution parameters for subtitle_extract."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for subtitle_extract
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `subtitle_add`
- **operation_id:** `subtitle_add`
- **display_name:** "Subtitle Add"
- **description:** "Execution parameters for subtitle_add."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for subtitle_add
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `subtitle_remove`
- **operation_id:** `subtitle_remove`
- **display_name:** "Subtitle Remove"
- **description:** "Execution parameters for subtitle_remove."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for subtitle_remove
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `subtitle_convert`
- **operation_id:** `subtitle_convert`
- **display_name:** "Subtitle Convert"
- **description:** "Execution parameters for subtitle_convert."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for subtitle_convert
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `subtitle_embed`
- **operation_id:** `subtitle_embed`
- **display_name:** "Subtitle Embed"
- **description:** "Execution parameters for subtitle_embed."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for subtitle_embed
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `subtitle_burn`
- **operation_id:** `subtitle_burn`
- **display_name:** "Subtitle Burn"
- **description:** "Execution parameters for subtitle_burn."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for subtitle_burn
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `audio_convert`
- **operation_id:** `audio_convert`
- **display_name:** "Audio Convert"
- **description:** "Execution parameters for audio_convert."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for audio_convert
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `audio_compress`
- **operation_id:** `audio_compress`
- **display_name:** "Audio Compress"
- **description:** "Execution parameters for audio_compress."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for audio_compress
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `audio_trim`
- **operation_id:** `audio_trim`
- **display_name:** "Audio Trim"
- **description:** "Execution parameters for audio_trim."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for audio_trim
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `audio_merge`
- **operation_id:** `audio_merge`
- **display_name:** "Audio Merge"
- **description:** "Execution parameters for audio_merge."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for audio_merge
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `audio_normalize`
- **operation_id:** `audio_normalize`
- **display_name:** "Audio Normalize"
- **description:** "Execution parameters for audio_normalize."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for audio_normalize
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `audio_fade`
- **operation_id:** `audio_fade`
- **display_name:** "Audio Fade"
- **description:** "Execution parameters for audio_fade."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for audio_fade
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `audio_change_speed`
- **operation_id:** `audio_change_speed`
- **display_name:** "Audio Change Speed"
- **description:** "Execution parameters for audio_change_speed."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for audio_change_speed
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `audio_reverse`
- **operation_id:** `audio_reverse`
- **display_name:** "Audio Reverse"
- **description:** "Execution parameters for audio_reverse."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for audio_reverse
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `audio_metadata_edit`
- **operation_id:** `audio_metadata_edit`
- **display_name:** "Audio Metadata Edit"
- **description:** "Execution parameters for audio_metadata_edit."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for audio_metadata_edit
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `audio_metadata_remove`
- **operation_id:** `audio_metadata_remove`
- **display_name:** "Audio Metadata Remove"
- **description:** "Execution parameters for audio_metadata_remove."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for audio_metadata_remove
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `image_convert`
- **operation_id:** `image_convert`
- **display_name:** "Image Convert"
- **description:** "Execution parameters for image_convert."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for image_convert
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `image_resize`
- **operation_id:** `image_resize`
- **display_name:** "Image Resize"
- **description:** "Execution parameters for image_resize."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for image_resize
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `image_crop`
- **operation_id:** `image_crop`
- **display_name:** "Image Crop"
- **description:** "Execution parameters for image_crop."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for image_crop
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `image_rotate`
- **operation_id:** `image_rotate`
- **display_name:** "Image Rotate"
- **description:** "Execution parameters for image_rotate."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for image_rotate
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `image_flip`
- **operation_id:** `image_flip`
- **display_name:** "Image Flip"
- **description:** "Execution parameters for image_flip."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for image_flip
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `image_compress`
- **operation_id:** `image_compress`
- **display_name:** "Image Compress"
- **description:** "Execution parameters for image_compress."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for image_compress
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `image_change_quality`
- **operation_id:** `image_change_quality`
- **display_name:** "Image Change Quality"
- **description:** "Execution parameters for image_change_quality."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for image_change_quality
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `image_change_dpi`
- **operation_id:** `image_change_dpi`
- **display_name:** "Image Change Dpi"
- **description:** "Execution parameters for image_change_dpi."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for image_change_dpi
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `image_grayscale`
- **operation_id:** `image_grayscale`
- **display_name:** "Image Grayscale"
- **description:** "Execution parameters for image_grayscale."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for image_grayscale
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `image_sharpen`
- **operation_id:** `image_sharpen`
- **display_name:** "Image Sharpen"
- **description:** "Execution parameters for image_sharpen."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for image_sharpen
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `image_blur`
- **operation_id:** `image_blur`
- **display_name:** "Image Blur"
- **description:** "Execution parameters for image_blur."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for image_blur
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `image_metadata_remove`
- **operation_id:** `image_metadata_remove`
- **display_name:** "Image Metadata Remove"
- **description:** "Execution parameters for image_metadata_remove."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for image_metadata_remove
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `images_to_pdf`
- **operation_id:** `images_to_pdf`
- **display_name:** "Images To Pdf"
- **description:** "Execution parameters for images_to_pdf."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for images_to_pdf
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `image_to_pdf`
- **operation_id:** `image_to_pdf`
- **display_name:** "Image To Pdf"
- **description:** "Execution parameters for image_to_pdf."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for image_to_pdf
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_to_images`
- **operation_id:** `pdf_to_images`
- **display_name:** "Pdf To Images"
- **description:** "Execution parameters for pdf_to_images."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_to_images
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_to_text`
- **operation_id:** `pdf_to_text`
- **display_name:** "Pdf To Text"
- **description:** "Execution parameters for pdf_to_text."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_to_text
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_compress`
- **operation_id:** `pdf_compress`
- **display_name:** "Pdf Compress"
- **description:** "Execution parameters for pdf_compress."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_compress
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_optimize`
- **operation_id:** `pdf_optimize`
- **display_name:** "Pdf Optimize"
- **description:** "Execution parameters for pdf_optimize."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_optimize
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_merge`
- **operation_id:** `pdf_merge`
- **display_name:** "Pdf Merge"
- **description:** "Execution parameters for pdf_merge."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_merge
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_split`
- **operation_id:** `pdf_split`
- **display_name:** "Pdf Split"
- **description:** "Execution parameters for pdf_split."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_split
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_extract_pages`
- **operation_id:** `pdf_extract_pages`
- **display_name:** "Pdf Extract Pages"
- **description:** "Execution parameters for pdf_extract_pages."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_extract_pages
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_delete_pages`
- **operation_id:** `pdf_delete_pages`
- **display_name:** "Pdf Delete Pages"
- **description:** "Execution parameters for pdf_delete_pages."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_delete_pages
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_rotate_pages`
- **operation_id:** `pdf_rotate_pages`
- **display_name:** "Pdf Rotate Pages"
- **description:** "Execution parameters for pdf_rotate_pages."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_rotate_pages
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_reorder_pages`
- **operation_id:** `pdf_reorder_pages`
- **display_name:** "Pdf Reorder Pages"
- **description:** "Execution parameters for pdf_reorder_pages."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_reorder_pages
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_extract_images`
- **operation_id:** `pdf_extract_images`
- **display_name:** "Pdf Extract Images"
- **description:** "Execution parameters for pdf_extract_images."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_extract_images
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_metadata_edit`
- **operation_id:** `pdf_metadata_edit`
- **display_name:** "Pdf Metadata Edit"
- **description:** "Execution parameters for pdf_metadata_edit."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_metadata_edit
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_metadata_remove`
- **operation_id:** `pdf_metadata_remove`
- **display_name:** "Pdf Metadata Remove"
- **description:** "Execution parameters for pdf_metadata_remove."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_metadata_remove
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_set_password`
- **operation_id:** `pdf_set_password`
- **display_name:** "Pdf Set Password"
- **description:** "Execution parameters for pdf_set_password."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_set_password
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_remove_password`
- **operation_id:** `pdf_remove_password`
- **display_name:** "Pdf Remove Password"
- **description:** "Execution parameters for pdf_remove_password."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_remove_password
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `pdf_change_password`
- **operation_id:** `pdf_change_password`
- **display_name:** "Pdf Change Password"
- **description:** "Execution parameters for pdf_change_password."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for pdf_change_password
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `archive_create`
- **operation_id:** `archive_create`
- **display_name:** "Archive Create"
- **description:** "Execution parameters for archive_create."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for archive_create
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `archive_extract`
- **operation_id:** `archive_extract`
- **display_name:** "Archive Extract"
- **description:** "Execution parameters for archive_extract."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for archive_extract
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `archive_list`
- **operation_id:** `archive_list`
- **display_name:** "Archive List"
- **description:** "Execution parameters for archive_list."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for archive_list
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `archive_test`
- **operation_id:** `archive_test`
- **display_name:** "Archive Test"
- **description:** "Execution parameters for archive_test."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for archive_test
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `document_convert`
- **operation_id:** `document_convert`
- **display_name:** "Document Convert"
- **description:** "Execution parameters for document_convert."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for document_convert
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `spreadsheet_convert`
- **operation_id:** `spreadsheet_convert`
- **display_name:** "Spreadsheet Convert"
- **description:** "Execution parameters for spreadsheet_convert."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for spreadsheet_convert
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `csv_json_convert`
- **operation_id:** `csv_json_convert`
- **display_name:** "Csv Json Convert"
- **description:** "Execution parameters for csv_json_convert."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for csv_json_convert
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `data_format_convert`
- **operation_id:** `data_format_convert`
- **display_name:** "Data Format Convert"
- **description:** "Execution parameters for data_format_convert."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for data_format_convert
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `data_format_prettify`
- **operation_id:** `data_format_prettify`
- **display_name:** "Data Format Prettify"
- **description:** "Execution parameters for data_format_prettify."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for data_format_prettify
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `data_format_minify`
- **operation_id:** `data_format_minify`
- **display_name:** "Data Format Minify"
- **description:** "Execution parameters for data_format_minify."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for data_format_minify
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `data_validate`
- **operation_id:** `data_validate`
- **display_name:** "Data Validate"
- **description:** "Execution parameters for data_validate."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for data_validate
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `text_encoding_convert`
- **operation_id:** `text_encoding_convert`
- **display_name:** "Text Encoding Convert"
- **description:** "Execution parameters for text_encoding_convert."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for text_encoding_convert
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `text_line_ending_convert`
- **operation_id:** `text_line_ending_convert`
- **display_name:** "Text Line Ending Convert"
- **description:** "Execution parameters for text_line_ending_convert."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for text_line_ending_convert
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `file_hash`
- **operation_id:** `file_hash`
- **display_name:** "File Hash"
- **description:** "Execution parameters for file_hash."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for file_hash
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `file_compare`
- **operation_id:** `file_compare`
- **display_name:** "File Compare"
- **description:** "Execution parameters for file_compare."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for file_compare
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `file_duplicate_detect`
- **operation_id:** `file_duplicate_detect`
- **display_name:** "File Duplicate Detect"
- **description:** "Execution parameters for file_duplicate_detect."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for file_duplicate_detect
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `ocr_image`
- **operation_id:** `ocr_image`
- **display_name:** "Ocr Image"
- **description:** "Execution parameters for ocr_image."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for ocr_image
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `ocr_pdf`
- **operation_id:** `ocr_pdf`
- **display_name:** "Ocr Pdf"
- **description:** "Execution parameters for ocr_pdf."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for ocr_pdf
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

### Operation: `batch_rename`
- **operation_id:** `batch_rename`
- **display_name:** "Batch Rename"
- **description:** "Execution parameters for batch_rename."
- **applicable_file_types:** `["*"]`
- **required_engine:** `auto`
- **parameters schema:**
```typescript
{
  // specific parameters for batch_rename
  param1: string;
  param2?: number;
}
```
- **output_format:** `dynamic`

# 14. FRONTEND ARCHITECTURE

## React Router Configuration
The application uses React Router for client-side routing. Below are the EXACT route definitions:

```tsx
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard /> // Dashboard (file drop zone + recent activity)
      },
      {
        path: 'files',
        element: <FileManager /> // File manager (uploaded files)
      },
      {
        path: 'files/:id',
        element: <FileDetail /> // File detail (analysis, preview, operations)
      },
      {
        path: 'jobs',
        element: <JobManager /> // Job queue and history
      },
      {
        path: 'jobs/:id',
        element: <JobDetail /> // Job detail (progress, logs, output)
      },
      {
        path: 'pipelines',
        element: <PipelineManager /> // Pipeline manager
      },
      {
        path: 'pipelines/new',
        element: <PipelineEditor /> // Pipeline editor (create)
      },
      {
        path: 'pipelines/:id',
        element: <PipelineDetail /> // Pipeline detail
      },
      {
        path: 'pipelines/:id/edit',
        element: <PipelineEditor /> // Pipeline editor (update)
      },
      {
        path: 'presets',
        element: <PresetManager /> // Preset manager
      },
      {
        path: 'settings',
        element: <SettingsLayout />,
        children: [
          {
            index: true,
            element: <GeneralSettings /> // Settings
          },
          {
            path: 'engines',
            element: <EngineManager /> // Engine manager
          },
          {
            path: 'diagnostics',
            element: <SystemDiagnostics /> // System diagnostics
          }
        ]
      }
    ]
  }
]);
```

## Zustand Store Definitions

Exact TypeScript store definitions:

### `useFileStore`
```typescript
import { create } from 'zustand';

export interface FileState {
  files: UFSFile[];
  selectedFiles: string[];
  uploadProgress: Record<string, number>;
  loading: boolean;
  error: string | null;
  actions: {
    addFiles: (files: UFSFile[]) => void;
    removeFile: (id: string) => void;
    clearFiles: () => void;
    selectFile: (id: string) => void;
    deselectFile: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    setUploadProgress: (id: string, progress: number) => void;
    fetchFiles: () => Promise<void>;
  };
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  selectedFiles: [],
  uploadProgress: {},
  loading: false,
  error: null,
  actions: {
    addFiles: (files) => set((state) => ({ files: [...state.files, ...files] })),
    removeFile: (id) => set((state) => ({ files: state.files.filter(f => f.id !== id) })),
    clearFiles: () => set({ files: [], selectedFiles: [] }),
    selectFile: (id) => set((state) => ({ selectedFiles: [...state.selectedFiles, id] })),
    deselectFile: (id) => set((state) => ({ selectedFiles: state.selectedFiles.filter(fId => fId !== id) })),
    selectAll: () => set((state) => ({ selectedFiles: state.files.map(f => f.id) })),
    clearSelection: () => set({ selectedFiles: [] }),
    setUploadProgress: (id, progress) => set((state) => ({
      uploadProgress: { ...state.uploadProgress, [id]: progress }
    })),
    fetchFiles: async () => { /* API call */ }
  }
}));
```

### `useJobStore`
```typescript
import { create } from 'zustand';

export interface JobState {
  jobs: UFSJob[];
  activeJobs: string[];
  jobProgress: Record<string, { progress: number; status: string; currentFile?: string }>;
  loading: boolean;
  error: string | null;
  actions: {
    addJob: (job: UFSJob) => void;
    updateJob: (id: string, updates: Partial<UFSJob>) => void;
    updateProgress: (id: string, progress: number, status: string, currentFile?: string) => void;
    removeJob: (id: string) => void;
    fetchJobs: () => Promise<void>;
  };
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  activeJobs: [],
  jobProgress: {},
  loading: false,
  error: null,
  actions: {
    addJob: (job) => set((state) => ({ 
      jobs: [job, ...state.jobs],
      activeJobs: job.status === 'processing' ? [...state.activeJobs, job.id] : state.activeJobs
    })),
    updateJob: (id, updates) => set((state) => ({
      jobs: state.jobs.map(j => j.id === id ? { ...j, ...updates } : j)
    })),
    updateProgress: (id, progress, status, currentFile) => set((state) => ({
      jobProgress: { ...state.jobProgress, [id]: { progress, status, currentFile } }
    })),
    removeJob: (id) => set((state) => ({ jobs: state.jobs.filter(j => j.id !== id) })),
    fetchJobs: async () => { /* API call */ }
  }
}));
```

### `useEngineStore`
```typescript
import { create } from 'zustand';

export interface EngineState {
  engines: UFSEngine[];
  capabilities: UFSCapabilities;
  loading: boolean;
  error: string | null;
  actions: {
    fetchEngines: () => Promise<void>;
    updateEngineStatus: (id: string, status: string) => void;
    refreshCapabilities: () => Promise<void>;
  };
}

export const useEngineStore = create<EngineState>((set) => ({
  engines: [],
  capabilities: {},
  loading: false,
  error: null,
  actions: {
    fetchEngines: async () => { /* API call */ },
    updateEngineStatus: (id, status) => set((state) => ({
      engines: state.engines.map(e => e.id === id ? { ...e, status } : e)
    })),
    refreshCapabilities: async () => { /* API call */ }
  }
}));
```

### `useSettingsStore`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  settings: UFSSettings;
  theme: 'light' | 'dark' | 'system';
  mode: 'simple' | 'advanced';
  actions: {
    updateSettings: (updates: Partial<UFSSettings>) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setMode: (mode: 'simple' | 'advanced') => void;
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      theme: 'system',
      mode: 'simple',
      actions: {
        updateSettings: (updates) => set((state) => ({ settings: { ...state.settings, ...updates } })),
        setTheme: (theme) => set({ theme }),
        setMode: (mode) => set({ mode })
      }
    }),
    { name: 'ufs-settings' }
  )
);
```

### `useUIStore`
```typescript
import { create } from 'zustand';

export interface UIState {
  sidebarOpen: boolean;
  activeTab: string;
  notifications: UFSNotification[];
  actions: {
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;
    setActiveTab: (tabId: string) => void;
    addNotification: (notification: UFSNotification) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
  };
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeTab: 'default',
  notifications: [],
  actions: {
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
    setActiveTab: (tabId) => set({ activeTab: tabId }),
    addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
    removeNotification: (id) => set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) })),
    clearNotifications: () => set({ notifications: [] })
  }
}));
```

## API Client Service
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const ApiClient = {
  // Files
  files: {
    list: () => api.get('/files'),
    get: (id: string) => api.get(`/files/${id}`),
    upload: (formData: FormData, onProgress?: (progressEvent: any) => void) => 
      api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
      }),
    delete: (id: string) => api.delete(`/files/${id}`),
    analyze: (id: string) => api.post(`/files/${id}/analyze`),
  },

  // Jobs
  jobs: {
    list: (params?: any) => api.get('/jobs', { params }),
    get: (id: string) => api.get(`/jobs/${id}`),
    create: (data: any) => api.post('/jobs', data),
    cancel: (id: string) => api.post(`/jobs/${id}/cancel`),
    delete: (id: string) => api.delete(`/jobs/${id}`),
    logs: (id: string) => api.get(`/jobs/${id}/logs`),
  },

  // Engines
  engines: {
    list: () => api.get('/engines'),
    capabilities: () => api.get('/engines/capabilities'),
    diagnostics: () => api.get('/engines/diagnostics'),
    install: (id: string) => api.post(`/engines/${id}/install`),
  },

  // Pipelines & Presets
  pipelines: {
    list: () => api.get('/pipelines'),
    get: (id: string) => api.get(`/pipelines/${id}`),
    create: (data: any) => api.post('/pipelines', data),
    update: (id: string, data: any) => api.put(`/pipelines/${id}`, data),
    delete: (id: string) => api.delete(`/pipelines/${id}`),
  },

  presets: {
    list: (type?: string) => api.get('/presets', { params: { type } }),
    create: (data: any) => api.post('/presets', data),
  },

  // Settings
  settings: {
    get: () => api.get('/settings'),
    update: (data: any) => api.put('/settings', data),
  }
};
```

## WebSocket Client Service
```typescript
import { io, Socket } from 'socket.io-client';
import { useJobStore } from '../stores/useJobStore';
import { useUIStore } from '../stores/useUIStore';

class WebSocketService {
  private socket: Socket | null = null;
  private static instance: WebSocketService;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect() {
    if (this.socket) return;

    this.socket = io(process.env.VITE_WS_URL || 'ws://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WS Connected');
    });

    this.socket.on('job:progress', (data: { jobId: string, progress: number, status: string, currentFile?: string }) => {
      useJobStore.getState().actions.updateProgress(data.jobId, data.progress, data.status, data.currentFile);
    });

    this.socket.on('job:status', (data: { jobId: string, status: string, result?: any }) => {
      useJobStore.getState().actions.updateJob(data.jobId, { status: data.status, result: data.result });
      if (data.status === 'completed' || data.status === 'failed') {
        useUIStore.getState().actions.addNotification({
          id: Date.now().toString(),
          type: data.status === 'completed' ? 'success' : 'error',
          title: `Job ${data.status}`,
          message: `Job ${data.jobId} has ${data.status}.`
        });
      }
    });

    this.socket.on('engine:status', (data: { engineId: string, status: string }) => {
       // Update engine status in store
    });

    this.socket.on('disconnect', () => {
      console.log('WS Disconnected');
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public subscribe(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public unsubscribe(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const wsClient = WebSocketService.getInstance();
```

# 15. COMPLETE UI COMPONENT SPECIFICATIONS

## Layout Components

### AppLayout
- **Props**: `children?: ReactNode`
- **State**: Responsive sidebar visibility
- **Behavior**: Wraps the entire application. Manages responsive layout (collapsing sidebar on mobile).
- **Layout**: Sidebar on left (or bottom nav on mobile), Header on top, main content area taking remaining space.
- **API calls**: None directly.
- **Store**: `useUIStore` (sidebarOpen)

### Sidebar
- **Props**: None
- **State**: None
- **Behavior**: Provides main navigation links.
- **Layout**: Logo at top, vertical nav links (Dashboard, Files, Jobs, Pipelines, Settings), engine status indicators at bottom.
- **API calls**: None.
- **Store**: `useUIStore` (sidebarOpen, activeTab), `useEngineStore` (engines), `useJobStore` (activeJobs count)

### Header
- **Props**: None
- **State**: Global search query
- **Behavior**: Provides quick access to global search, mode toggle, and theme toggle.
- **Layout**: Flex container; Left: App Title/Mobile menu toggle; Center: Search input; Right: Mode Toggle, Theme Toggle.
- **API calls**: Global search API (debounced).
- **Store**: `useSettingsStore` (theme, mode), `useUIStore` (toggleSidebar)

## Dashboard Page

### FileDropZone
- **Props**: `onFilesAccepted: (files: File[]) => void`
- **State**: `isDragActive`, `isUploading`, `error`
- **Behavior**: Intercepts file drop events, validates files, triggers upload.
- **Layout**: Large dashed border area. Shows upload cloud icon, "Drop files or folders here" text, and Select Files/Folder buttons. Privacy badge at bottom.
- **API calls**: `ApiClient.files.upload`
- **Store**: `useFileStore` (actions.addFiles)

### RecentActivity
- **Props**: None
- **State**: None
- **Behavior**: Displays the last 10 jobs. Clicking a job navigates to its detail page.
- **Layout**: Grid of `JobCard` components or a condensed list view.
- **API calls**: `ApiClient.jobs.list({ limit: 10 })`
- **Store**: `useJobStore` (jobs)

### QuickActions
- **Props**: None
- **State**: None
- **Behavior**: Provides quick entry points (e.g., "Convert Image", "Compress Video").
- **Layout**: Grid of small cards with icons and labels.
- **API calls**: None
- **Store**: None

## File Components

### FileUploader
- **Props**: `files: File[]`
- **State**: Upload progress per file, overall progress.
- **Behavior**: Handles chunking/uploading of files, shows progress bars.
- **Layout**: List of files currently uploading with progress bars and cancel buttons.
- **API calls**: `ApiClient.files.upload`
- **Store**: `useFileStore` (uploadProgress)

### FileList
- **Props**: None
- **State**: Sort configuration, filter text.
- **Behavior**: Renders uploaded files. Supports multi-select, sorting, and filtering.
- **Layout**: Table (desktop) or Grid (mobile) of `FileCard` components.
- **API calls**: `ApiClient.files.list`
- **Store**: `useFileStore` (files, selectedFiles, actions)

### FileCard
- **Props**: `file: UFSFile`
- **State**: Hover state for revealing quick actions.
- **Behavior**: Click selects file. Double-click opens `FileDetail`.
- **Layout**: Thumbnail/Icon, filename (truncated), size, type, quick action buttons (Delete, Analyze).
- **API calls**: None
- **Store**: `useFileStore` (actions.selectFile)

### FileDetail
- **Props**: None (reads ID from URL)
- **State**: Active tab (Info, Preview, Operations).
- **Behavior**: Fetches file details and analysis data. Displays preview.
- **Layout**: Two columns: Left column for `FilePreview` and metadata, Right column for `OperationPanel`.
- **API calls**: `ApiClient.files.get`, `ApiClient.files.analyze`
- **Store**: None directly (uses local state fetched via React Query or similar)

### FilePreview
- **Props**: `file: UFSFile`
- **State**: Playback state (for media), zoom level (for images).
- **Behavior**: Dynamically renders correct viewer based on file MIME type.
- **Layout**: Container matching aspect ratio of media.
- **API calls**: Fetches raw file data/stream.
- **Store**: None

### OperationPanel
- **Props**: `file: UFSFile`
- **State**: Selected operation, configuration values.
- **Behavior**: Shows operations valid for the file type. Triggers job creation.
- **Layout**: Accordion or Tabs for operations, `OperationConfig` form inside.
- **API calls**: `ApiClient.jobs.create`
- **Store**: `useSettingsStore` (mode)

## Job Components

### JobQueue
- **Props**: None
- **State**: Status filters (Active, Completed, Failed).
- **Behavior**: Lists all jobs. Updates via WebSocket.
- **Layout**: List of `JobCard` components.
- **API calls**: `ApiClient.jobs.list`
- **Store**: `useJobStore` (jobs)

### JobCard
- **Props**: `job: UFSJob`
- **State**: None
- **Behavior**: Displays summary of a job.
- **Layout**: Card with Job ID, status badge, input/output file names, `ProgressBar`.
- **API calls**: None
- **Store**: `useJobStore` (jobProgress for real-time updates)

### JobProgress
- **Props**: `jobId: string`
- **State**: Local derived stats (speed, ETA).
- **Behavior**: Calculates ETA based on progress over time.
- **Layout**: Linear progress bar, percentage text, speed (MB/s), ETA text.
- **API calls**: None
- **Store**: `useJobStore` (jobProgress)

### JobDetail
- **Props**: None (reads ID from URL)
- **State**: Active tab (Overview, Logs, Command).
- **Behavior**: Shows complete job execution details. Streams logs if active.
- **Layout**: Header with status. Tabs for Overview (input/output comparison, `JobResultSummary`), Logs (terminal-like view), and Command (`CommandPreview`).
- **API calls**: `ApiClient.jobs.get`, `ApiClient.jobs.logs`
- **Store**: `useJobStore`

### JobHistory
- **Props**: None
- **State**: Date range, search query, pagination.
- **Behavior**: Historical view of completed/failed jobs.
- **Layout**: Data table with sorting and pagination.
- **API calls**: `ApiClient.jobs.list`
- **Store**: None

### JobResultSummary
- **Props**: `job: UFSJob`
- **State**: None
- **Behavior**: Calculates size reduction/savings.
- **Layout**: Grid of stats (Original Size, New Size, Savings %, Duration).
- **API calls**: None
- **Store**: None

## Operation Components

### OperationSelector
- **Props**: `fileType: string`, `onSelect: (opId: string) => void`
- **State**: Search filter.
- **Behavior**: Filters operations available based on capabilities and file type.
- **Layout**: Grid of clickable operation cards.
- **API calls**: None
- **Store**: `useEngineStore` (capabilities)

### OperationConfig
- **Props**: `operationId: string`, `onSubmit: (config: any) => void`
- **State**: Form values, validation errors.
- **Behavior**: Dynamically builds form based on operation schema. Adapts to UI mode.
- **Layout**:
  - Simple Mode: Essential fields only (PresetSelector, basic inputs).
  - Advanced Mode: Full parameter list with specific input types (Sliders, Switches, Selects).
- **API calls**: None
- **Store**: `useSettingsStore` (mode)

### PresetSelector
- **Props**: `operationId: string`, `onSelect: (preset: any) => void`
- **State**: None
- **Behavior**: Dropdown to select predefined configurations.
- **Layout**: Select dropdown showing preset name and brief description.
- **API calls**: `ApiClient.presets.list`
- **Store**: None

### CommandPreview
- **Props**: `commandArgs: string[]`
- **State**: Copied to clipboard status.
- **Behavior**: Formats command array into a readable shell command string.
- **Layout**: Monospace code block with copy button.
- **API calls**: None
- **Store**: None

## Pipeline Components

### PipelineEditor
- **Props**: `initialPipeline?: UFSPipeline`
- **State**: Nodes, edges, selected node.
- **Behavior**: Visual editor using React Flow.
- **Layout**: Sidebar with node palette, main canvas area, right panel for selected node configuration.
- **API calls**: `ApiClient.pipelines.create` / `update`
- **Store**: None

### PipelineNode
- **Props**: `data: any`
- **State**: None
- **Behavior**: Custom React Flow node.
- **Layout**: Card with icon, title, and connection handles.
- **API calls**: None
- **Store**: None

### PipelinePresets
- **Props**: None
- **State**: None
- **Behavior**: Lists saved pipelines for quick execution.
- **Layout**: Grid of cards.
- **API calls**: `ApiClient.pipelines.list`
- **Store**: None

## Settings Components

### SettingsPage
- **Props**: None
- **State**: Active settings tab.
- **Behavior**: Main settings layout.
- **Layout**: Vertical tabs (General, Processing, Privacy, Advanced) mapping to specific sections.
- **API calls**: None
- **Store**: `useSettingsStore`

### EngineManager
- **Props**: None
- **State**: Installation progress for engines.
- **Behavior**: Lists engines, checks status, provides install buttons.
- **Layout**: List of engines with Version, Status Badge, and Install/Update button.
- **API calls**: `ApiClient.engines.list`, `ApiClient.engines.install`
- **Store**: `useEngineStore`

### DiagnosticsPage
- **Props**: None
- **State**: System info data.
- **Behavior**: Displays system health and capabilities.
- **Layout**: Cards for OS, CPU, RAM, Disk, GPU, and detected binaries.
- **API calls**: `ApiClient.engines.diagnostics`
- **Store**: None

### ThemeToggle
- **Props**: None
- **State**: None
- **Behavior**: Cycles through light/dark/system themes.
- **Layout**: Icon button.
- **API calls**: None
- **Store**: `useSettingsStore` (theme, actions.setTheme)

### ModeToggle
- **Props**: None
- **State**: None
- **Behavior**: Switches between simple and advanced UI modes.
- **Layout**: Switch or segmented control.
- **API calls**: None
- **Store**: `useSettingsStore` (mode, actions.setMode)

## Common Components
- **ProgressBar**: Uses shadcn `Progress`. Smooth animation for `value` prop.
- **StatusBadge**: Uses shadcn `Badge`. Colors: default (pending), blue (processing), green (completed), red (failed).
- **FileIcon**: Maps MIME type to Lucide react icons.
- **SizeDisplay**: Utility component formatting bytes to KB/MB/GB.
- **DurationDisplay**: Utility component formatting ms to hh:mm:ss.
- **ErrorDisplay**: Alert box with destructive styling.
- **EmptyState**: Centered icon, title, and description text.
- **LoadingSpinner**: Animated SVG or Lucide `Loader2`.
- **ConfirmDialog**: Uses shadcn `AlertDialog`.
- **Toast**: Uses `sonner` via shadcn integration.

# 16. UI DESIGN TOKENS & THEME

## Tailwind CSS Theme Configuration (`tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## CSS Variables (`globals.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
 
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

## Shadcn/UI Components to Install
```bash
npx shadcn-ui@latest add badge button card checkbox collapsible command dialog dropdown-menu form input label popover progress scroll-area select separator sheet skeleton slider switch table tabs textarea toast toggle tooltip
```

# 17. RESPONSIVE DESIGN

- **Mobile (< 768px)**:
  - Single column layout everywhere.
  - Sidebar is hidden by default. Use a bottom navigation bar for core routes (Dashboard, Files, Jobs).
  - Header shows hamburger menu to open a `Sheet` containing full navigation.
  - Tables collapse to stacked card views.
- **Tablet (768px - 1024px)**:
  - Sidebar collapses to icon-only mode to save horizontal space.
  - Two-column layouts (like FileDetail) stack into single column or resize proportionally.
  - Grid layouts use 2 columns instead of 3-4.
- **Desktop (> 1024px)**:
  - Full expanded sidebar on the left.
  - Complex views (FileDetail, PipelineEditor) use multi-column layouts side-by-side.
  - Grid layouts expand to 3+ columns.

# 18. ACCESSIBILITY

- **ARIA labels**: Essential on all icon-only buttons (e.g., ThemeToggle, Delete actions). Progress bars must use `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- **Keyboard navigation**: Entire application must be navigable via Tab/Shift+Tab. Modals (`Dialog`), dropdowns, and context menus must trap focus and support Escape to close.
- **Focus management**: When a route changes or a modal opens, focus must be shifted to the main content heading or the modal's first interactive element.
- **Screen reader support**: Use `sr-only` tailwind class to provide additional context where visual layout isn't sufficient (e.g., status badge colors). Live regions (`aria-live="polite"`) for job progress updates and toast notifications.
- **Color contrast**: Primary colors and text colors defined in the theme variables have been selected to meet WCAG AA contrast ratio requirements (minimum 4.5:1 for normal text). Focus rings (`ring` utility) are clearly visible in both light and dark modes.
# 19. SECURITY IMPLEMENTATION

## Filename Sanitization
```python
import re
import unicodedata

def sanitize_filename(filename: str, max_length: int = 255) -> str:
    """
    Sanitize a filename for secure storage and usage.
    """
    # 1. Unicode normalization (NFC)
    filename = unicodedata.normalize('NFC', filename)
    
    # 2. Remove null bytes
    filename = filename.replace('\x00', '')
    
    # 3. Prevent path traversal attempts
    filename = filename.replace('../', '').replace('..\\', '')
    
    # 4. Replace potentially dangerous or problematic characters
    # Allowed: alphanumeric, space, dot, hyphen, underscore
    # Replace anything else with underscore
    filename = re.sub(r'[^a-zA-Z0-9\.\-\_ ]', '_', filename)
    
    # 5. Remove leading/trailing spaces and dots
    filename = filename.strip('. ')
    
    # 6. Ensure the filename isn't completely empty after sanitization
    if not filename:
        filename = "unnamed_file"
        
    # 7. Truncate to maximum length while preserving extension
    if len(filename) > max_length:
        name, dot, ext = filename.rpartition('.')
        if not dot:
            filename = filename[:max_length]
        else:
            ext_len = len(ext) + 1
            filename = f"{name[:max_length - ext_len]}.{ext}"
            
    return filename
```

## Path Traversal Protection
- Validate all paths are within allowed directories: Utilize custom checking logic ensuring requested output paths reside strictly inside allowed user directories.
- Use `pathlib.Path.resolve()` to canonicalize the given path, resolving all symlinks and relative boundaries.
- Check that the resolved path starts with the allowed base directory (`Path.is_relative_to()` or matching roots).
- Reject any path containing `'..'` after normalization to strictly prevent traversal hacks.

## Archive Bomb Protection
- **Check compressed vs uncompressed ratio**: Track total extracted bytes against archive size (Default max ratio 100).
- **Set maximum extraction size**: Configurable, default 10GB.
- **Set maximum file count**: Configurable, default 100,000.
- **Set maximum recursion depth**: Default 3 for nested archives.
- **Abort extraction**: Throw `ArchiveBombError` immediately if limits exceeded.

## Subprocess Security
- **NEVER use shell=True**: Prevents shell injection attacks.
- **Always pass arguments as list**: `['ffmpeg', '-i', 'input.mp4']`
- **Set timeout**: Configurable, default 3600 seconds for video/audio processing, 300 seconds for other tasks. Wrapper around `asyncio.create_subprocess_exec` handles timeouts.
- **Capture stdout and stderr**: Always route output properly to avoid unbounded memory buffer expansion.
- **Kill process on timeout**: Using `process.kill()`.
- **Validate all input paths**: Ensure paths exist and are explicitly files.
- **Validate output directory**: Ensure the user has write permissions in the target directory.

## File Size Limits
- Configurable max upload size (default 50GB) inside `.env` or application config.
- Configurable max concurrent uploads (default 5).
- Disk space check before processing: `shutil.disk_usage()` check ensuring free space > (expected output size + temp size).

## API Security
- **Bind to 127.0.0.1**: Default network interface to prevent exposure over LAN.
- **CORS configuration**: Limited strictly to localhost (`http://localhost:5173` for dev, same-origin for prod).
- **Rate limiting (optional)**: Simple bucket algorithm per endpoint using FastAPI middlewares if enabled.
- **Input validation**: Pydantic models for all API requests.
- **No arbitrary file path access**: File references must use system-generated UUIDs that map to the actual disk path in the database.

---

# 20. JOB MANAGEMENT SYSTEM

## Job Queue Architecture
```python
import asyncio
from enum import Enum

class JobStatus(Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobManager:
    # Manages async job execution
    # Uses asyncio.Queue for job queuing
    
    def __init__(self, max_concurrent_jobs: int = None):
        import multiprocessing
        self.max_workers = max_concurrent_jobs or max(1, multiprocessing.cpu_count() - 1)
        self.queue = asyncio.Queue()
        self.active_jobs = {}
        self.workers = []

    async def start(self):
        for _ in range(self.max_workers):
            task = asyncio.create_task(self._worker())
            self.workers.append(task)
            
    # Job lifecycle: pending → queued → running → completed/failed/cancelled
```

## Job Execution Flow
1. User submits job via API (POST `/api/jobs`).
2. Job record created in SQLite with status `pending`.
3. Job added to `asyncio.Queue` (`status` → `queued`).
4. Worker picks up job (`status` → `running`).
5. Engine wrapper builds the command line arguments.
6. Subprocess spawned with `asyncio.create_subprocess_exec`.
7. Progress parsed from `stdout`/`stderr` in real-time.
8. Progress events emitted via WebSocket.
9. On completion: `status` → `completed`, output path recorded in DB.
10. On failure: `status` → `failed`, error details saved to DB/logs.
11. On cancel: process killed, `status` → `cancelled`, temp files cleaned up.

## Progress Parsing
- **FFmpeg**: Parse `time=` from stderr. Regex: `r"time=(\d{2}):(\d{2}):(\d{2}\.\d{2})"`
- **ImageMagick batch**: Count completed files / total files via output directory polling or wrapper scripts.
- **7-Zip**: Parse percentage from stdout. Regex: `r"(\d+)%"`
- **qpdf/Poppler**: Generally emit indeterminate progress; status is handled as binary (0% or 100%).

## Pause/Resume
- For subprocess-based jobs: Send `SIGSTOP`/`SIGCONT` on Linux/macOS. For Windows, use `psutil` `SuspendThread`/`ResumeThread`.
- Not all jobs support pause — mark capability per engine via `supports_pause` flag in the Engine manifest.
- If pause not supported, the frontend doesn't show a pause button for that job type.

---

# 21. TEMP FILE & CLEANUP SYSTEM

```python
import os
import shutil
from pathlib import Path

class TempFileManager:
    def __init__(self, temp_base_dir: str = "/tmp/universal_file_studio"):
        self.base_dir = Path(temp_base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.job_files = {} # Dict tracking files per job ID
        
    def register(self, job_id: str, file_path: str):
        if job_id not in self.job_files:
            self.job_files[job_id] = set()
        self.job_files[job_id].add(Path(file_path))
        
    def cleanup_job(self, job_id: str):
        if job_id in self.job_files:
            for file_path in self.job_files[job_id]:
                try:
                    if file_path.is_file():
                        file_path.unlink()
                    elif file_path.is_dir():
                        shutil.rmtree(file_path)
                except Exception as e:
                    pass # Log error
            del self.job_files[job_id]
            
    def cleanup_stale(self, max_age_hours: int = 24):
        # Removes leftover temp files from crashes
        pass
```
- Scheduled cleanup runs via `APScheduler` every hour to clear stale data.

---

# 22. TESTING STRATEGY

## Backend Tests (pytest)
```
tests/
├── conftest.py              (fixtures: temp dirs, mock engines, test DB)
├── unit/
│   ├── test_file_detection.py
│   ├── test_filename_sanitization.py
│   ├── test_path_security.py
│   ├── test_archive_bomb_protection.py
│   ├── test_engine_detection.py
│   ├── test_capability_registry.py
│   ├── test_job_manager.py
│   ├── test_progress_parsing.py
│   ├── test_config.py
│   └── test_models.py
├── integration/
│   ├── test_ffmpeg_engine.py
│   ├── test_imagemagick_engine.py
│   ├── test_sevenzip_engine.py
│   ├── test_qpdf_engine.py
│   ├── test_poppler_engine.py
│   ├── test_api_files.py
│   ├── test_api_jobs.py
│   ├── test_api_system.py
│   └── test_websocket.py
└── e2e/
    ├── test_video_conversion.py
    ├── test_image_batch.py
    └── test_pdf_operations.py
```
**Test Function Examples:**
- `test_filename_sanitization.py`: `test_removes_null_bytes`, `test_truncates_long_names`
- `test_path_security.py`: `test_rejects_outside_paths`, `test_allows_inside_paths`

## Frontend Tests (Vitest + React Testing Library)
```
src/__tests__/
├── components/
│   ├── FileUploader.test.tsx
│   ├── FileList.test.tsx
│   ├── JobProgress.test.tsx
│   ├── OperationConfig.test.tsx
│   └── EngineManager.test.tsx
├── stores/
│   ├── fileStore.test.ts
│   ├── jobStore.test.ts
│   └── settingsStore.test.ts
├── services/
│   ├── apiClient.test.ts
│   └── websocket.test.ts
└── utils/
    └── formatters.test.ts
```

---

# 23. INSTALLATION & SETUP

### install.sh (Linux/macOS)
```bash
#!/bin/bash
# 1. Check Python 3.11+
command -v python3 >/dev/null 2>&1 || { echo >&2 "Python 3 required"; exit 1; }
# 2. Check Node.js 18+
command -v node >/dev/null 2>&1 || { echo >&2 "Node.js 18+ required"; exit 1; }
# 3. Create Python virtual environment
python3 -m venv venv
source venv/bin/activate
# 4. Install Python dependencies
pip install -r requirements.txt
# 5. Install frontend dependencies
cd frontend && npm install && cd ..
# 6. Build frontend
cd frontend && npm run build && cd ..
# 7. Initialize SQLite database
python main.py --init-db
# 8. Detect processing engines
python tools/detect_engines.py
# 9. Report status
echo "Installation Complete!"
```

### start.sh
```bash
#!/bin/bash
source venv/bin/activate
# Start backend (uvicorn) which also serves the built frontend statically
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### Dockerfile and docker-compose.yml
```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y ffmpeg imagemagick p7zip-full qpdf poppler-utils nodejs npm
# ... Standard Python backend and npm frontend build setup
```
```yaml
version: '3.8'
services:
  universal-file-studio:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
```

---

# 24. DEVELOPMENT WORKFLOW
- **Dev Mode**: Run backend `uvicorn backend.main:app --reload` (Port 8000). Run frontend `cd frontend && npm run dev` (Port 5173). API routes proxied from Vite to Uvicorn.
- **Production Mode**: Build React with `npm run build`. Serve static assets natively via FastAPI `StaticFiles`.
- **Tests**: `pytest` for Python. `npm run test` for React components.
- **Add Engine**: Extend `BaseEngine` in `backend/engines/`, define CLI flags, map capabilities, register in `engines/__init__.py`.

---

# 25. PHASE-BY-PHASE IMPLEMENTATION GUIDE

- **Phase 1: Foundation**
  - **Files**: `main.py`, models, SQLite DB init, file upload API, simple task queue, React boilerplate.
  - **End of Phase**: Can upload file, see it in DB, mock process it, and view status.
- **Phase 2: Core Engines**
  - **Files**: FFmpeg, ImageMagick, 7-Zip, qpdf, Poppler wrappers.
  - **End of Phase**: System detects installed engines and registers capabilities.
- **Phase 3: Main Operations**
  - **Files**: Specific operation profiles (Video to MP4, Image resize).
  - **End of Phase**: Actual file conversions work end-to-end.
- **Phase 4: Documents**
  - LibreOffice, Pandoc wrappers and doc conversions.
- **Phase 5: Advanced**
  - OCR integrations, Metadata stripping, Hashing utilities.
- **Phase 6: Pipelines**
  - Chain operations together (e.g., Unzip -> Convert images -> Zip). Node UI.
- **Phase 7: Developer**
  - CLI release, REST documentation via Swagger, WebSocket optimization.

---

# 26. ERROR HANDLING STRATEGY

- **EngineNotInstalledError**: `ERR_ENGINE_MISSING` (HTTP 501) - "Required engine is not installed on the system."
- **FileTooLargeError**: `ERR_FILE_TOO_LARGE` (HTTP 413) - "File exceeds maximum upload size."
- **ArchiveBombError**: `ERR_ARCHIVE_BOMB` (HTTP 400) - "Suspicious archive detected. Operation aborted."
- **PathTraversalError**: `ERR_PATH_TRAVERSAL` (HTTP 403) - "Invalid file path specified."
- **SubprocessTimeoutError**: `ERR_TIMEOUT` (HTTP 504) - "The operation took too long and was terminated."

For each API error, response is a standard JSON: `{"error": "code", "message": "friendly message"}`

---

# 27. LOGGING
```python
import structlog
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.processors.JSONRenderer() # JSON for files
    ]
)
```
- **Console output**: Filtered through `structlog.dev.ConsoleRenderer` for human readability.
- **Log rotation**: `logging.handlers.RotatingFileHandler` (10MB, keep 5 logs).
- **Per-job files**: Detailed logs of stdout/stderr written to `logs/jobs/<job_id>.log`.

---

# 28. README.md TEMPLATE
```markdown
# Universal File Studio

Universal File Studio is the ultimate local, privacy-first file conversion and processing powerhouse. Manage audio, video, images, archives, and documents through an elegant web interface powered by industry-standard open-source engines.

## Features
- **100+ File Formats**: Powered by FFmpeg, ImageMagick, 7-Zip, Poppler, and more.
- **100% Local**: Complete privacy. No cloud dependencies. No data collection.
- **Advanced Job Queue**: Asynchronous processing with real-time WebSocket progress.
- **Secure**: Built-in protections against path traversal, archive bombs, and malicious files.

## Getting Started
```bash
git clone https://github.com/your-username/universal-file-studio.git
cd universal-file-studio
./install.sh
./start.sh
```
Open `http://localhost:8000` in your browser.

## Documentation
See the `/docs` directory for full API reference, development workflows, and engine configurations.
```
