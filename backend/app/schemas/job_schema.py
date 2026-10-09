from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.job import JobStatus

class JobBase(BaseModel):
    file_id: int
    operation: str
    engine_used: str = "auto"
    parameters: Dict[str, Any] = Field(default_factory=dict)

class JobCreate(JobBase):
    pass

class JobResponse(BaseModel):
    id: str
    file_id: int
    operation: str
    status: JobStatus
    progress_percent: float
    engine_used: str
    parameters: Dict[str, Any]
    input_path: str
    output_path: Optional[str] = None
    output_filename: Optional[str] = None
    output_size_bytes: Optional[int] = None
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

