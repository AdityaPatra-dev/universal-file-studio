import uuid
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.models.pipeline import Pipeline
from app.models.file_record import FileRecord
from app.models.job import Job, JobStatus
from app.schemas.pipeline_schema import (
    PipelineCreate, PipelineUpdate, PipelineResponse, PipelineExecuteRequest,
    PipelineBatchExecuteRequest, PipelineValidationResponse, PipelineValidationIssue
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
    },
    {
        "name": "Comic / Manga: ZIP to WebP to PDF",
        "description": "Extract image archive, optimize all pages into WebP, and compile into a single ordered PDF book",
        "steps": [
            {"operation": "archive_extract", "parameters": {}},
            {"operation": "image_convert", "parameters": {"format": "webp", "quality": 85}},
            {"operation": "images_to_pdf", "parameters": {"quality": 85, "compress": "jpeg"}}
        ]
    },
    {
        "name": "Archive to Single PDF Book",
        "description": "Extract scanned images or comic book from ZIP/CBZ and compile directly into PDF",
        "steps": [
            {"operation": "archive_to_pdf", "parameters": {"quality": 85, "compress": "jpeg"}}
        ]
    },
    {
        "name": "ZIP to WebP Compressed Archive",
        "description": "Extract image archive, compress all pages into modern WebP format, and repackage into ZIP",
        "steps": [
            {"operation": "archive_extract", "parameters": {}},
            {"operation": "image_convert", "parameters": {"format": "webp", "quality": 80}},
            {"operation": "archive_create", "parameters": {"format": "zip"}}
        ]
    }
]

@router.get("", response_model=List[PipelineResponse])
@router.get("/", response_model=List[PipelineResponse])
async def list_pipelines(db: AsyncSession = Depends(get_db)):
    stmt = select(Pipeline).order_by(Pipeline.id)
    res = await db.execute(stmt)
    pipelines = list(res.scalars().all())

    existing_names = {p.name for p in pipelines}
    added = False
    for bp in BUILTIN_PIPELINES:
        if bp["name"] not in existing_names:
            db.add(Pipeline(**bp))
            added = True

    if added:
        await db.commit()
        stmt = select(Pipeline).order_by(Pipeline.id)
        res = await db.execute(stmt)
        pipelines = list(res.scalars().all())

    return pipelines

@router.post("", response_model=PipelineResponse)
@router.post("/", response_model=PipelineResponse)
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

@router.post("/validate", response_model=PipelineValidationResponse)
async def validate_pipeline(payload: PipelineCreate):
    from app.processors.specs import OPERATION_SPECS

    issues = []
    steps = payload.steps or []

    if not steps:
        return PipelineValidationResponse(valid=False, issues=[
            PipelineValidationIssue(step=0, operation="", severity="error", message="Pipeline must contain at least one step.")
        ])

    for i in range(len(steps) - 1):
        cur_step = steps[i]
        next_step = steps[i + 1]
        cur_op = cur_step.get("operation", "")
        next_op = next_step.get("operation", "")

        cur_spec = OPERATION_SPECS.get(cur_op)
        next_spec = OPERATION_SPECS.get(next_op)

        if not cur_spec:
            issues.append(PipelineValidationIssue(
                step=i + 1, operation=cur_op, severity="warning",
                message=f"Operation '{cur_op}' has no static spec declared."
            ))
            continue
        if not next_spec:
            issues.append(PipelineValidationIssue(
                step=i + 2, operation=next_op, severity="warning",
                message=f"Operation '{next_op}' has no static spec declared."
            ))
            continue

        output_cat = cur_spec.get("produces", {}).get("category", "")
        accepted_cats = next_spec.get("accepts", {}).get("categories", [])

        # Compatibility check
        if output_cat == "directory":
            next_accepts_dir = (
                next_spec.get("accepts", {}).get("directory", False)
                or next_spec.get("batch_capable", False)
                or "directory" in accepted_cats
            )
            if not next_accepts_dir:
                issues.append(PipelineValidationIssue(
                    step=i + 2, operation=next_op, severity="error",
                    message=f"Step {i+2} ({next_op}) cannot process directory output produced by Step {i+1} ({cur_op})."
                ))
        elif output_cat and accepted_cats and output_cat not in accepted_cats and "directory" not in accepted_cats and output_cat != "same":
            issues.append(PipelineValidationIssue(
                step=i + 2, operation=next_op, severity="error",
                message=f"Step {i+2} ({next_op}) expects input in {accepted_cats}, but Step {i+1} ({cur_op}) produces '{output_cat}'."
            ))

    has_errors = any(issue.severity == "error" for issue in issues)
    return PipelineValidationResponse(valid=not has_errors, issues=issues)

@router.post("/{pipeline_id}/batch-execute", response_model=List[JobResponse])
async def batch_execute_pipeline(
    pipeline_id: int,
    payload: PipelineBatchExecuteRequest,
    db: AsyncSession = Depends(get_db)
):
    p_stmt = select(Pipeline).where(Pipeline.id == pipeline_id)
    p_res = await db.execute(p_stmt)
    pipeline = p_res.scalar_one_or_none()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    if not payload.file_ids:
        raise HTTPException(status_code=400, detail="file_ids cannot be empty")

    jobs = []
    batch_tag = f"batch_{pipeline_id}_{uuid.uuid4().hex[:8]}"
    for fid in payload.file_ids:
        f_stmt = select(FileRecord).where(FileRecord.id == fid)
        f_res = await db.execute(f_stmt)
        file_rec = f_res.scalar_one_or_none()
        if not file_rec:
            continue

        parameters = {
            "pipeline_id": pipeline.id,
            "pipeline_name": pipeline.name,
            "steps": pipeline.steps,
            "batch_tag": batch_tag,
            "on_error": payload.on_error,
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
        jobs.append(job)

    await db.commit()
    for job in jobs:
        await db.refresh(job)
        await job_manager.enqueue_job(job.id)

    return jobs

@router.get("/{pipeline_id}/export")
async def export_pipeline(pipeline_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Pipeline).where(Pipeline.id == pipeline_id)
    res = await db.execute(stmt)
    pipeline = res.scalar_one_or_none()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    from datetime import timezone
    return {
        "ufs_pipeline_version": "1.0",
        "name": pipeline.name,
        "description": pipeline.description,
        "steps": pipeline.steps,
        "exported_at": datetime.now(timezone.utc).isoformat()
    }

@router.post("/import", response_model=PipelineResponse)
async def import_pipeline(payload: PipelineCreate, db: AsyncSession = Depends(get_db)):
    p = Pipeline(
        name=payload.name,
        description=payload.description,
        steps=payload.steps
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p

