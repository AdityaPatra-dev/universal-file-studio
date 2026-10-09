from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import List, Dict, Any

class PipelineBase(BaseModel):
    name: str
    description: str = ""
    steps: List[Dict[str, Any]] = Field(default_factory=list)

class PipelineCreate(PipelineBase):
    pass

class PipelineResponse(PipelineBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

