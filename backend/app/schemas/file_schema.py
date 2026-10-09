from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any

class FileRecordBase(BaseModel):
    filename: str
    original_filename: str
    mime_type: str
    category: str = "unknown"
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

class FileAnalyzeResponse(BaseModel):
    file_id: int
    filename: str
    mime_type: str
    category: str
    detected_format: Optional[str] = None
    size_bytes: int
    hash_sha256: str
    metadata: Dict[str, Any]
    available_operations: list[Dict[str, Any]]

