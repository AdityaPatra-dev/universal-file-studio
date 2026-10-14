from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.models.pipeline import Pipeline
from app.models.file_record import FileRecord
from app.models.job import Job, JobStatus
from app.schemas.pipeline_schema import (
    PipelineCreate, PipelineUpdate, PipelineResponse, PipelineExecuteRequest
)
from app.schemas.job_schema import JobResponse
from app.jobs.manager import job_manager

router = APIRouter(prefix="/pipelines", tags=["pipelines"])

BUILTIN_PIPELINES = [
    {
        "name": "Video Privacy Clean & WebM",
        "description": "Strip camera/device metadata and transcode video to lightweight WebM format",
        "steps": [
            {"operation": "strip_metadata", "parameters": {}},
            {"operation": "video_convert", "parameters": {"format": "webm", "crf": 28}}
        ]
    },
    {
        "name": "Markdown to PDF Publisher",
        "description": "Compile markdown formatting into HTML and render standard PDF document",
        "steps": [
            {"operation": "markdown_convert", "parameters": {"format": "html"}},
            {"operation": "document_convert", "parameters": {"format": "pdf"}}
        ]
    },
    {
        "name": "Image Sanitize & WebP",
        "description": "Scrub EXIF and GPS tags, then encode to modern WebP 80% format",
        "steps": [
            {"operation": "strip_metadata", "parameters": {}},
            {"operation": "image_convert", "parameters": {"format": "webp", "quality": 80}}
        ]
    },
    {
        "name": "Video Audio Rip & Sanitize",
        "description": "Extract MP3 audio track from video and remove author tags",
        "steps": [
            {"operation": "extract_audio", "parameters": {"format": "mp3", "bitrate": 192}},
            {"operation": "strip_metadata", "parameters": {}}
        ]
    }
]

@router.get("", response_model=List[PipelineResponse])
async def list_pipelines(db: AsyncSession = Depends(get_db)):
    stmt = select(Pipeline).order_by(Pipeline.id)
    res = await db.execute(stmt)
    pipelines = res.scalars().all()

    if not pipelines:
        for bp in BUILTIN_PIPELINES:
            db.add(Pipeline(**bp))
        await db.commit()
        stmt = select(Pipeline).order_by(Pipeline.id)
        res = await db.execute(stmt)
        pipelines = res.scalars().all()

    return pipelines

@router.post("", response_model=PipelineResponse)
async def create_pipeline(payload: PipelineCreate, db: AsyncSession = Depends(get_db)):
    p = Pipeline(
        name=payload.name,
        description=payload.description,
        steps=payload.steps
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p

@router.get("/{pipeline_id}", response_model=PipelineResponse)
async def get_pipeline(pipeline_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Pipeline).where(Pipeline.id == pipeline_id)
    res = await db.execute(stmt)
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return p

@router.put("/{pipeline_id}", response_model=PipelineResponse)
async def update_pipeline(
    pipeline_id: int,
    payload: PipelineUpdate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Pipeline).where(Pipeline.id == pipeline_id)
    res = await db.execute(stmt)
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    if payload.name is not None:
        p.name = payload.name
    if payload.description is not None:
        p.description = payload.description
    if payload.steps is not None:
        p.steps = payload.steps

    await db.commit()
    await db.refresh(p)
    return p

@router.delete("/{pipeline_id}")
async def delete_pipeline(pipeline_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Pipeline).where(Pipeline.id == pipeline_id)
    res = await db.execute(stmt)
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    await db.delete(p)
    await db.commit()
    return {"success": True, "message": f"Pipeline {pipeline_id} deleted"}

@router.post("/{pipeline_id}/execute", response_model=JobResponse)
async def execute_pipeline(
    pipeline_id: int,
    payload: PipelineExecuteRequest,
    db: AsyncSession = Depends(get_db)
):
    # Verify pipeline exists
    p_stmt = select(Pipeline).where(Pipeline.id == pipeline_id)
    p_res = await db.execute(p_stmt)
    pipeline = p_res.scalar_one_or_none()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    # Verify file exists
    f_stmt = select(FileRecord).where(FileRecord.id == payload.file_id)
    f_res = await db.execute(f_stmt)
    file_rec = f_res.scalar_one_or_none()
    if not file_rec:
        raise HTTPException(status_code=404, detail="File not found")

    # Enqueue pipeline execution job
    parameters = {
        "pipeline_id": pipeline.id,
        "pipeline_name": pipeline.name,
        "steps": pipeline.steps,
        **payload.parameters
    }

    job = Job(
        file_id=file_rec.id,
        operation="pipeline_execute",
        engine_used="pipeline",
        parameters=parameters,
        input_path=file_rec.upload_path,
        status=JobStatus.PENDING,
        progress_percent=0.0
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    await job_manager.enqueue_job(job.id)
    await db.refresh(job)
    return job
