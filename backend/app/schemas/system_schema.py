from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, List, Optional
from datetime import datetime

class EngineStatusResponse(BaseModel):
    name: str
    installed: bool
    version: Optional[str] = None
    path: Optional[str] = None
    capabilities: Dict[str, Any] = {}
    detected_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SystemDiagnosticsResponse(BaseModel):
    os: str
    platform: str
    python_version: str
    cpu_count: int
    cpu_percent: float
    ram_total_gb: float
    ram_available_gb: float
    ram_percent: float
    disk_total_gb: float
    disk_free_gb: float
    disk_percent: float
    storage_paths: Dict[str, str]
    installed_engines: List[EngineStatusResponse]

    model_config = ConfigDict(from_attributes=True)

class SettingResponse(BaseModel):
    key: str
    value: str
    type: str
    category: str
    description: str

    model_config = ConfigDict(from_attributes=True)

class SettingUpdate(BaseModel):
    value: str

