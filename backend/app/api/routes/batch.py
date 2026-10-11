import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.models.file_record import FileRecord
from app.models.job import Job, JobStatus
from app.schemas.batch_schema import BatchConvertRequest, BatchCompressRequest, BatchArchiveRequest, BatchResultResponse
from app.jobs.manager import job_manager
from app.engines.wrappers.sevenzip import sevenzip_engine
from app.config import settings

router = APIRouter(prefix="/batch", tags=["batch"])

@router.post("/convert", response_model=BatchResultResponse)
async def batch_convert(payload: BatchConvertRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(FileRecord).where(FileRecord.id.in_(payload.file_ids))
    res = await db.execute(stmt)
    files = res.scalars().all()
    file_map = {f.id: f for f in files}

    created_jobs = []
    skipped = []
    target_fmt = payload.target_format.lower().lstrip(".")

    for fid in payload.file_ids:
        file_rec = file_map.get(fid)
        if not file_rec:
            skipped.append({"file_id": fid, "reason": "File not found"})
            continue

        cat = file_rec.category
        op_name = None

        if cat == "video":
            op_name = "video_convert"
        elif cat == "audio":
            op_name = "audio_convert"
        elif cat == "image":
            op_name = "image_convert"
        elif cat == "document":
            op_name = "document_convert"
        else:
            skipped.append({"file_id": fid, "reason": f"Category '{cat}' does not support conversion"})
            continue

        job = Job(
            file_id=fid,
            operation=op_name,
            engine_used="auto",
            parameters={**payload.parameters, "format": target_fmt},
            input_path=file_rec.upload_path,
            status=JobStatus.PENDING,
            progress_percent=0.0
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        await job_manager.enqueue_job(job.id)
        created_jobs.append({"job_id": job.id, "file_id": fid, "operation": op_name})

    return BatchResultResponse(
        total_requested=len(payload.file_ids),
        jobs_created=created_jobs,
        skipped_files=skipped
    )

@router.post("/compress", response_model=BatchResultResponse)
async def batch_compress(payload: BatchCompressRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(FileRecord).where(FileRecord.id.in_(payload.file_ids))
    res = await db.execute(stmt)
    files = res.scalars().all()
    file_map = {f.id: f for f in files}

    created_jobs = []
    skipped = []

    for fid in payload.file_ids:
        file_rec = file_map.get(fid)
        if not file_rec:
            skipped.append({"file_id": fid, "reason": "File not found"})
            continue

        cat = file_rec.category
        op_name = None
        params: Dict[str, Any] = {}

        if cat == "video":
            op_name = "video_compress"
            params["crf"] = payload.quality_or_crf or 28
        elif cat == "audio":
            op_name = "audio_compress"
            params["bitrate"] = payload.quality_or_crf or 128
        elif cat == "image":
            op_name = "image_compress"
            params["quality"] = payload.quality_or_crf or 75
        elif cat == "pdf":
            op_name = "pdf_compress"
            params["quality"] = "ebook"
        else:
            skipped.append({"file_id": fid, "reason": f"Category '{cat}' does not support compression"})
            continue

        job = Job(
            file_id=fid,
            operation=op_name,
            engine_used="auto",
            parameters=params,
            input_path=file_rec.upload_path,
            status=JobStatus.PENDING,
            progress_percent=0.0
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        await job_manager.enqueue_job(job.id)
        created_jobs.append({"job_id": job.id, "file_id": fid, "operation": op_name})

    return BatchResultResponse(
        total_requested=len(payload.file_ids),
        jobs_created=created_jobs,
        skipped_files=skipped
    )

@router.post("/archive", response_model=Dict[str, Any])
async def batch_archive(payload: BatchArchiveRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(FileRecord).where(FileRecord.id.in_(payload.file_ids))
    res = await db.execute(stmt)
    files = res.scalars().all()

    if not files:
        raise HTTPException(status_code=400, detail="No valid files selected for archive creation")

    # Packaging multiple files into an archive
    paths = [f.upload_path for f in files]
    archive_id = uuid.uuid4().hex[:8]
    archive_name = payload.archive_name or f"batch_archive_{archive_id}.{payload.archive_format}"
    target_path = f"{settings.OUTPUT_DIR}/{archive_name}"

    res_proc = await sevenzip_engine.create(target_path, paths, password=payload.password)
    if not res_proc.success:
        raise HTTPException(status_code=500, detail=f"Failed to create archive: {res_proc.stdout}")

    return {
        "success": True,
        "archive_filename": archive_name,
        "archive_path": target_path,
        "files_count": len(paths),
        "command": res_proc.command_str
    }

