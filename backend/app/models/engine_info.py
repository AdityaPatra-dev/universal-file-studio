from datetime import datetime, timezone
from typing import Any, Optional
from sqlalchemy import String, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class EngineInfo(Base):
    __tablename__ = "engine_info"

    name: Mapped[str] = mapped_column(String(100), primary_key=True)
    installed: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    capabilities: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

