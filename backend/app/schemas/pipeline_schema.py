from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict

class PipelineStep(BaseModel):
    name: Optional[str] = None
    operation: str
    engine: Optional[str] = None
    parameters: Dict[str, Any] = {}

class PipelineBase(BaseModel):
    name: str
    description: str = ""
    steps: List[Dict[str, Any]]

class PipelineCreate(PipelineBase):
    pass

class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[Dict[str, Any]]] = None

class PipelineResponse(PipelineBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PipelineExecuteRequest(BaseModel):
    file_id: int
    parameters: Dict[str, Any] = {}

class PipelineBatchExecuteRequest(BaseModel):
    file_ids: List[int]
    parameters: Dict[str, Any] = {}
    on_error: str = "skip"  # "stop" | "skip" | "collect"

class PipelineValidationIssue(BaseModel):
    step: int
    operation: str
    severity: str  # "error" | "warning" | "info"
    message: str

class PipelineValidationResponse(BaseModel):
    valid: bool
    issues: List[PipelineValidationIssue] = []
