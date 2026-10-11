from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class BatchConvertRequest(BaseModel):
    file_ids: List[int]
    target_format: str
    parameters: Dict[str, Any] = Field(default_factory=dict)

class BatchCompressRequest(BaseModel):
    file_ids: List[int]
    quality_or_crf: Optional[int] = None

class BatchArchiveRequest(BaseModel):
    file_ids: List[int]
    archive_format: str = "zip"
    archive_name: Optional[str] = None
    password: Optional[str] = None

class BatchResultResponse(BaseModel):
    total_requested: int
    jobs_created: List[Dict[str, Any]]
    skipped_files: List[Dict[str, Any]] = []
