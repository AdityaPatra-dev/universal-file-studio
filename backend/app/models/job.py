from datetime import datetime, timezone
from typing import Optional, Any
import uuid
import enum
from sqlalchemy import String, Integer, DateTime, JSON, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

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
    file_id: Mapped[int] = mapped_column(ForeignKey("files.id", ondelete="CASCADE"), index=True)
    operation: Mapped[str] = mapped_column(String(100))
    status: Mapped[JobStatus] = mapped_column(SQLEnum(JobStatus), default=JobStatus.PENDING, index=True)
    progress_percent: Mapped[float] = mapped_column(Float, default=0.0)
    engine_used: Mapped[str] = mapped_column(String(100), default="auto")
    parameters: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    input_path: Mapped[str] = mapped_column(String(512))
    output_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    output_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    output_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    error_detail: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    command_executed: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    stdout: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    stderr: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    exit_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

