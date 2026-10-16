import os
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.api.deps import get_db
from app.models.job import Job, JobStatus
from app.models.file_record import FileRecord
from app.schemas.job_schema import JobCreate, JobResponse
from app.jobs.manager import job_manager

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.post("", response_model=JobResponse)
async def create_job(payload: JobCreate, db: AsyncSession = Depends(get_db)):
    # Check that file exists
    f_stmt = select(FileRecord).where(FileRecord.id == payload.file_id)
    f_res = await db.execute(f_stmt)
    file_rec = f_res.scalar_one_or_none()
    if not file_rec:
        raise HTTPException(status_code=404, detail="File not found")

    job = Job(
        file_id=payload.file_id,
        operation=payload.operation,
        engine_used=payload.engine_used,
        parameters=payload.parameters,
        input_path=file_rec.upload_path,
        status=JobStatus.PENDING,
        progress_percent=0.0
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Enqueue to background worker
    await job_manager.enqueue_job(job.id)
    await db.refresh(job)
    return job

@router.get("", response_model=List[JobResponse])
async def list_jobs(
    status: Optional[str] = None,
    file_id: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Job).order_by(desc(Job.created_at)).offset(offset).limit(limit)
    if status:
        stmt = stmt.where(Job.status == status)
    if file_id:
        stmt = stmt.where(Job.file_id == file_id)
        
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Job).where(Job.id == job_id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/{job_id}/cancel")
async def cancel_job(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Job).where(Job.id == job_id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    success = await job_manager.cancel_job(job_id)
    return {"success": success, "message": f"Job {job_id} cancellation requested."}

@router.post("/{job_id}/retry", response_model=JobResponse)
async def retry_job(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Job).where(Job.id == job_id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = JobStatus.PENDING
    job.progress_percent = 0.0
    job.error_message = None
    job.error_detail = None
    job.output_path = None
    job.output_filename = None
    job.output_size_bytes = None
    await db.commit()
    await db.refresh(job)

    await job_manager.enqueue_job(job.id)
    await db.refresh(job)
    return job

@router.get("/{job_id}/download")
async def download_job_output(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Job).where(Job.id == job_id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job or not job.output_path or not os.path.exists(job.output_path):
        raise HTTPException(status_code=404, detail="Output file not found or not yet generated.")

    p = Path(job.output_path)
    if p.is_dir():
        import shutil, tempfile
        zip_base = Path(tempfile.gettempdir()) / f"{job.output_filename or p.name}_{job_id[:8]}"
        archive_path = shutil.make_archive(str(zip_base), "zip", str(p))
        return FileResponse(
            path=archive_path,
            filename=f"{job.output_filename or p.name}.zip"
        )

    return FileResponse(
        path=job.output_path,
        filename=job.output_filename or p.name
    )

@router.delete("/{job_id}")
async def delete_job(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Job).where(Job.id == job_id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.output_path and os.path.exists(job.output_path):
        try:
            p = Path(job.output_path)
            if p.is_file():
                p.unlink()
        except Exception:
            pass

    await db.delete(job)
    await db.commit()
    return {"success": True, "message": f"Job {job_id} deleted."}

