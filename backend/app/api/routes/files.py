import os
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.api.deps import get_db
from app.config import settings
from app.models.file_record import FileRecord
from app.schemas.file_schema import FileRecordResponse, FileAnalyzeResponse
from app.security.path_validation import sanitize_filename, calculate_sha256, validate_safe_path
from app.detection.file_detector import file_detector
from app.engines.base import CapabilityRegistry

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload", response_model=List[FileRecordResponse])
async def upload_files(
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    results = []
    upload_dir = Path(settings.UPLOAD_DIR)

    for upload in files:
        if not upload.filename:
            continue
            
        clean_name = sanitize_filename(upload.filename)
        unique_prefix = uuid.uuid4().hex[:8]
        stored_filename = f"{unique_prefix}_{clean_name}"
        dest_path = upload_dir / stored_filename

        # Stream save
        size_bytes = 0
        with open(dest_path, "wb") as f:
            while chunk := await upload.read(65536):
                size_bytes += len(chunk)
                f.write(chunk)

        # Hash
        sha256 = calculate_sha256(dest_path)

        # Deep file detection
        info = await file_detector.detect(str(dest_path))

        rec = FileRecord(
            filename=clean_name,
            original_filename=upload.filename,
            mime_type=info["mime_type"],
            category=info["category"],
            detected_format=info["detected_format"],
            size_bytes=size_bytes,
            width=info["width"],
            height=info["height"],
            duration_seconds=info["duration_seconds"],
            codec_info=info["codec_info"],
            metadata_json=info["metadata"],
            hash_sha256=sha256,
            upload_path=str(dest_path)
        )
        db.add(rec)
        await db.commit()
        await db.refresh(rec)
        results.append(rec)

    return results

@router.get("", response_model=List[FileRecordResponse])
async def list_files(
    category: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FileRecord).order_by(desc(FileRecord.created_at)).offset(offset).limit(limit)
    if category:
        stmt = stmt.where(FileRecord.category == category)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{file_id}", response_model=FileRecordResponse)
async def get_file(file_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(FileRecord).where(FileRecord.id == file_id)
    res = await db.execute(stmt)
    file_rec = res.scalar_one_or_none()
    if not file_rec:
        raise HTTPException(status_code=404, detail="File not found")
    return file_rec

@router.delete("/{file_id}")
async def delete_file(file_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(FileRecord).where(FileRecord.id == file_id)
    res = await db.execute(stmt)
    file_rec = res.scalar_one_or_none()
    if not file_rec:
        raise HTTPException(status_code=404, detail="File not found")

    # Delete physical file
    try:
        p = Path(file_rec.upload_path)
        if p.exists():
            p.unlink()
    except Exception:
        pass

    await db.delete(file_rec)
    await db.commit()
    return {"success": True, "message": f"File {file_id} deleted."}

@router.get("/{file_id}/download")
async def download_file(file_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(FileRecord).where(FileRecord.id == file_id)
    res = await db.execute(stmt)
    file_rec = res.scalar_one_or_none()
    if not file_rec or not os.path.exists(file_rec.upload_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_rec.upload_path,
        filename=file_rec.filename,
        media_type=file_rec.mime_type
    )

@router.get("/{file_id}/preview")
async def preview_file(file_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(FileRecord).where(FileRecord.id == file_id)
    res = await db.execute(stmt)
    file_rec = res.scalar_one_or_none()
    if not file_rec or not os.path.exists(file_rec.upload_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_rec.upload_path,
        media_type=file_rec.mime_type
    )

@router.post("/{file_id}/analyze", response_model=FileAnalyzeResponse)
async def analyze_file(file_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(FileRecord).where(FileRecord.id == file_id)
    res = await db.execute(stmt)
    file_rec = res.scalar_one_or_none()
    if not file_rec:
        raise HTTPException(status_code=404, detail="File not found")

    # Re-detect file
    info = await file_detector.detect(file_rec.upload_path)
    
    # Update record metadata
    file_rec.metadata_json = info["metadata"]
    if info["width"]:
        file_rec.width = info["width"]
    if info["height"]:
        file_rec.height = info["height"]
    if info["duration_seconds"]:
        file_rec.duration_seconds = info["duration_seconds"]
    if info["codec_info"]:
        file_rec.codec_info = info["codec_info"]

    await db.commit()
    await db.refresh(file_rec)

    # Determine recommended operations
    registry = CapabilityRegistry()
    ops = []
    cat = file_rec.category

    if cat == "video":
        if registry.is_installed("ffmpeg"):
            ops.append({"id": "convert_video", "name": "Convert Video", "formats": ["mp4", "webm", "mkv", "avi"]})
            ops.append({"id": "compress_video", "name": "Reduce File Size", "formats": ["mp4"]})
            ops.append({"id": "extract_audio", "name": "Extract Audio", "formats": ["mp3", "wav", "aac"]})
    elif cat == "image":
        if registry.is_installed("imagemagick"):
            ops.append({"id": "convert_image", "name": "Convert Image", "formats": ["webp", "png", "jpg", "avif", "gif"]})
            ops.append({"id": "resize_image", "name": "Resize Image", "params": ["width", "height"]})
            ops.append({"id": "compress_image", "name": "Compress Image", "params": ["quality"]})
    elif cat == "archive":
        if registry.is_installed("7z"):
            ops.append({"id": "extract_archive", "name": "Extract Archive Contents"})
    elif cat in ["document", "spreadsheet"]:
        if registry.is_installed("libreoffice"):
            ops.append({"id": "convert_document", "name": "Convert to PDF", "formats": ["pdf"]})

    # Default fallback operation
    ops.append({"id": "archive_create", "name": "Compress into ZIP", "formats": ["zip"]})

    return FileAnalyzeResponse(
        file_id=file_rec.id,
        filename=file_rec.filename,
        mime_type=file_rec.mime_type,
        category=file_rec.category,
        detected_format=file_rec.detected_format,
        size_bytes=file_rec.size_bytes,
        hash_sha256=file_rec.hash_sha256,
        metadata=file_rec.metadata_json or {},
        available_operations=ops
    )

