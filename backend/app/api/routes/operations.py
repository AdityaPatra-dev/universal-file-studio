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
            "name": "Convert Document",
            "engine": "libreoffice",
            "category": "document",
            "description": "Convert office documents to PDF, DOCX, ODT, TXT, or HTML",
            "parameters": [
                {"name": "format", "type": "select", "options": ["pdf", "docx", "odt", "rtf", "txt", "html"], "default": "pdf"}
            ]
        })
        ops.append({
            "id": "spreadsheet_convert",
            "name": "Convert Spreadsheet",
            "engine": "libreoffice",
            "category": "spreadsheet",
            "description": "Convert spreadsheets to CSV, PDF, XLSX, or ODS",
            "parameters": [
                {"name": "format", "type": "select", "options": ["csv", "pdf", "xlsx", "ods"], "default": "csv"}
            ]
        })
        ops.append({
            "id": "presentation_convert",
            "name": "Convert Presentation",
            "engine": "libreoffice",
            "category": "presentation",
            "description": "Convert presentation slides to PDF, PPTX, or ODP",
            "parameters": [
                {"name": "format", "type": "select", "options": ["pdf", "pptx", "odp"], "default": "pdf"}
            ]
        })

    # Text / Markdown operations
    ops.append({
        "id": "markdown_convert",
        "name": "Convert Markdown",
        "engine": "pandoc",
        "category": "text",
        "description": "Convert Markdown document to HTML, PDF, or TXT",
        "parameters": [
            {"name": "format", "type": "select", "options": ["html", "pdf", "txt", "docx"], "default": "html"}
        ]
    })
    ops.append({
        "id": "text_convert",
        "name": "Convert Text Format",
        "engine": "pandoc",
        "category": "text",
        "description": "Convert text and markup formats",
        "parameters": [
            {"name": "format", "type": "select", "options": ["txt", "html", "md"], "default": "txt"}
        ]
    })
    ops.append({
        "id": "ebook_convert",
        "name": "Convert eBook (EPUB)",
        "engine": "pandoc",
        "category": "document",
        "description": "Convert EPUB eBook to PDF, DOCX, HTML, or Markdown",
        "parameters": [
            {"name": "format", "type": "select", "options": ["pdf", "docx", "html", "md", "txt", "odt"], "default": "pdf"}
        ]
    })

    # Advanced Utilities (Phase 5)
    ops.append({
        "id": "strip_metadata",
        "name": "Strip Metadata (Privacy Clean)",
        "engine": "imagemagick",
        "category": "general",
        "description": "Remove all EXIF, GPS, camera data, author info, and personal metadata",
        "parameters": []
    })
    ops.append({
        "id": "file_hash",
        "name": "Calculate Checksums",
        "engine": "system",
        "category": "general",
        "description": "Compute SHA-256, MD5, SHA-1, SHA-512, and CRC32 cryptographic digests",
        "parameters": [
            {"name": "format", "type": "select", "options": ["txt", "json"], "default": "txt"}
        ]
    })
    ops.append({
        "id": "inspect_metadata",
        "name": "Inspect Deep Metadata",
        "engine": "system",
        "category": "general",
        "description": "Extract full structural and codec metadata report into JSON",
        "parameters": []
    })
    ops.append({
        "id": "ocr_image",
        "name": "OCR Extract Text",
        "engine": "tesseract",
        "category": "image",
        "description": "Extract printed or handwritten text from image using OCR",
        "parameters": [
            {"name": "language", "type": "select", "options": ["eng", "fra", "deu", "spa"], "default": "eng"},
            {"name": "format", "type": "select", "options": ["txt", "pdf"], "default": "txt"}
        ]
    })
    ops.append({
        "id": "ocr_pdf",
        "name": "Extract PDF Text (OCR)",
        "engine": "tesseract",
        "category": "pdf",
        "description": "Extract complete text from PDF document",
        "parameters": [
            {"name": "language", "type": "select", "options": ["eng", "fra", "deu", "spa"], "default": "eng"}
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
    cat = file_rec.category

    # Match category or allow cross-document operations
    matching = []
    for op in all_ops:
        op_cat = op.get("category")
        if op_cat == cat or op_cat == "general":
            matching.append(op)
        elif cat in ["document", "text"] and op_cat in ["document", "text"]:
            matching.append(op)

    return matching
