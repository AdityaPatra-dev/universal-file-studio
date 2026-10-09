from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.models.file_record import FileRecord
from app.engines.base import CapabilityRegistry

router = APIRouter(prefix="/operations", tags=["operations"])

@router.get("")
async def list_operations() -> List[Dict[str, Any]]:
    registry = CapabilityRegistry()
    ops = []

    if registry.is_installed("ffmpeg"):
        ops.append({
            "id": "video_convert",
            "name": "Convert Video",
            "engine": "ffmpeg",
            "category": "video",
            "description": "Convert video to MP4, WebM, MKV, AVI",
            "parameters": [
                {"name": "format", "type": "select", "options": ["mp4", "webm", "mkv", "avi"], "default": "mp4"}
            ]
        })
        ops.append({
            "id": "compress_video",
            "name": "Compress Video",
            "engine": "ffmpeg",
            "category": "video",
            "description": "Reduce file size with CRF encoding",
            "parameters": [
                {"name": "crf", "type": "number", "default": 28, "min": 18, "max": 35}
            ]
        })
        ops.append({
            "id": "extract_audio",
            "name": "Extract Audio",
            "engine": "ffmpeg",
            "category": "video",
            "description": "Extract audio stream from video",
            "parameters": [
                {"name": "format", "type": "select", "options": ["mp3", "wav", "aac"], "default": "mp3"}
            ]
        })
        ops.append({
            "id": "audio_convert",
            "name": "Convert Audio",
            "engine": "ffmpeg",
            "category": "audio",
            "description": "Convert audio format",
            "parameters": [
                {"name": "format", "type": "select", "options": ["mp3", "wav", "flac", "aac", "ogg"], "default": "mp3"}
            ]
        })

    if registry.is_installed("imagemagick"):
        ops.append({
            "id": "image_convert",
            "name": "Convert Image",
            "engine": "imagemagick",
            "category": "image",
            "description": "Convert image format to WebP, PNG, JPG, AVIF",
            "parameters": [
                {"name": "format", "type": "select", "options": ["webp", "png", "jpg", "avif", "gif"], "default": "webp"}
            ]
        })
        ops.append({
            "id": "resize_image",
            "name": "Resize Image",
            "engine": "imagemagick",
            "category": "image",
            "description": "Scale image dimensions",
            "parameters": [
                {"name": "width", "type": "number", "default": 1920},
                {"name": "height", "type": "number", "default": 1080}
            ]
        })
        ops.append({
            "id": "compress_image",
            "name": "Compress Image",
            "engine": "imagemagick",
            "category": "image",
            "description": "Optimize image quality and file size",
            "parameters": [
                {"name": "quality", "type": "number", "default": 80, "min": 10, "max": 100}
            ]
        })

    if registry.is_installed("7z"):
        ops.append({
            "id": "archive_extract",
            "name": "Extract Archive",
            "engine": "7z",
            "category": "archive",
            "description": "Extract archive contents",
            "parameters": []
        })
        ops.append({
            "id": "archive_create",
            "name": "Create Archive",
            "engine": "7z",
            "category": "general",
            "description": "Compress into ZIP or 7Z archive",
            "parameters": [
                {"name": "format", "type": "select", "options": ["zip", "7z"], "default": "zip"}
            ]
        })

    if registry.is_installed("libreoffice"):
        ops.append({
            "id": "document_convert",
            "name": "Convert Document to PDF",
            "engine": "libreoffice",
            "category": "document",
            "description": "Convert office documents to standard PDF",
            "parameters": [
                {"name": "format", "type": "select", "options": ["pdf"], "default": "pdf"}
            ]
        })

    return ops

@router.get("/file/{file_id}")
async def get_file_operations(file_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(FileRecord).where(FileRecord.id == file_id)
    res = await db.execute(stmt)
    file_rec = res.scalar_one_or_none()
    if not file_rec:
        raise HTTPException(status_code=404, detail="File not found")

    all_ops = await list_operations()
    # Filter operations matching file category or general
    matching = [
        op for op in all_ops 
        if op.get("category") == file_rec.category or op.get("category") == "general"
    ]
    return matching

