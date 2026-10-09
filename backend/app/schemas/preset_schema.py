from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Dict, Any

class PresetBase(BaseModel):
    name: str
    description: str = ""
    operation: str
    engine: str = "auto"
    parameters: Dict[str, Any] = Field(default_factory=dict)
    is_default: bool = False

class PresetCreate(PresetBase):
    pass

class PresetResponse(PresetBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

