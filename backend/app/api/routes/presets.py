from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.models.preset import Preset
from app.schemas.preset_schema import PresetCreate, PresetResponse

router = APIRouter(prefix="/presets", tags=["presets"])

BUILTIN_PRESETS = [
    {
        "name": "High Quality Video",
        "description": "High fidelity H.264 video encoding at CRF 18",
        "operation": "video_convert",
        "engine": "ffmpeg",
        "parameters": {"format": "mp4", "crf": 18, "preset": "slow"},
        "is_default": True
    },
    {
        "name": "Web Optimized Video",
        "description": "Lightweight WebM (VP9 + Opus) for modern browsers",
        "operation": "video_convert",
        "engine": "ffmpeg",
        "parameters": {"format": "webm", "crf": 30},
        "is_default": True
    },
    {
        "name": "Mobile Friendly MP4",
        "description": "Balanced H.264 / AAC 720p profile for smartphones",
        "operation": "video_resize",
        "engine": "ffmpeg",
        "parameters": {"width": 1280, "height": 720, "crf": 26},
        "is_default": True
    },
    {
        "name": "WebP Modern Image",
        "description": "Convert image to modern WebP format at 80% quality",
        "operation": "image_convert",
        "engine": "imagemagick",
        "parameters": {"format": "webp", "quality": 80},
        "is_default": True
    },
    {
        "name": "Maximum Image Compression",
        "description": "Heavy size reduction for thumbnails and fast loading",
        "operation": "image_compress",
        "engine": "imagemagick",
        "parameters": {"quality": 60},
        "is_default": True
    },
    {
        "name": "High Fidelity Audio (MP3 320k)",
        "description": "Extract or convert audio to maximum MP3 bitrate",
        "operation": "extract_audio",
        "engine": "ffmpeg",
        "parameters": {"format": "mp3", "bitrate": 320},
        "is_default": True
    },
    {
        "name": "Compress PDF (eBook 150 DPI)",
        "description": "Compress PDF for smooth viewing and email sharing",
        "operation": "pdf_compress",
        "engine": "ghostscript",
        "parameters": {"quality": "ebook"},
        "is_default": True
    },
    {
        "name": "eBook (EPUB) to PDF",
        "description": "Convert EPUB eBook to beautifully formatted PDF document",
        "operation": "document_convert",
        "engine": "auto",
        "parameters": {"format": "pdf"},
        "is_default": True
    },
    {
        "name": "eBook (EPUB) to Word DOCX",
        "description": "Convert EPUB eBook to editable Word document",
        "operation": "document_convert",
        "engine": "pandoc",
        "parameters": {"format": "docx"},
        "is_default": True
    },
    {
        "name": "Comic / Manga (ZIP to PDF)",
        "description": "Extract images from ZIP/CBZ and compile into ordered PDF book",
        "operation": "archive_to_pdf",
        "engine": "imagemagick",
        "parameters": {"quality": 85, "compress": "jpeg"},
        "is_default": True
    },
    {
        "name": "Merge Images to PDF Book",
        "description": "Combine multiple images into a single PDF document in sequence",
        "operation": "images_to_pdf",
        "engine": "imagemagick",
        "parameters": {"quality": 85, "compress": "jpeg"},
        "is_default": True
    },
    {
        "name": "Office Document to PDF",
        "description": "Convert Word / LibreOffice document to standard PDF",
        "operation": "document_convert",
        "engine": "libreoffice",
        "parameters": {"format": "pdf"},
        "is_default": True
    },
    {
        "name": "Spreadsheet to CSV",
        "description": "Extract raw tabular data from Excel/ODS spreadsheet",
        "operation": "spreadsheet_convert",
        "engine": "libreoffice",
        "parameters": {"format": "csv"},
        "is_default": True
    },
    {
        "name": "Presentation to PDF Slides",
        "description": "Convert PowerPoint / Impress slides to PDF handout",
        "operation": "presentation_convert",
        "engine": "libreoffice",
        "parameters": {"format": "pdf"},
        "is_default": True
    },
    {
        "name": "Markdown to Clean HTML",
        "description": "Compile markdown formatting into semantic HTML document",
        "operation": "markdown_convert",
        "engine": "pandoc",
        "parameters": {"format": "html"},
        "is_default": True
    },
    {
        "name": "Privacy Clean (Strip Metadata)",
        "description": "Sanitize media by removing all EXIF, GPS, camera, and author metadata",
        "operation": "strip_metadata",
        "engine": "imagemagick",
        "parameters": {},
        "is_default": True
    },
    {
        "name": "Cryptographic Checksums (SHA-256)",
        "description": "Compute verified cryptographic hashes and integrity manifest",
        "operation": "file_hash",
        "engine": "system",
        "parameters": {"format": "txt"},
        "is_default": True
    },
    {
        "name": "OCR Extract Text",
        "description": "Recognize and extract all textual characters into a text file",
        "operation": "ocr_image",
        "engine": "tesseract",
        "parameters": {"language": "eng", "format": "txt"},
        "is_default": True
    }
]

@router.get("", response_model=List[PresetResponse])
async def list_presets(db: AsyncSession = Depends(get_db)):
    stmt = select(Preset).order_by(Preset.id)
    res = await db.execute(stmt)
    presets = list(res.scalars().all())

    existing_names = {p.name for p in presets}
    added = False
    for bp in BUILTIN_PRESETS:
        if bp["name"] not in existing_names:
            db.add(Preset(**bp))
            added = True

    if added:
        await db.commit()
        stmt = select(Preset).order_by(Preset.id)
        res = await db.execute(stmt)
        presets = list(res.scalars().all())

    return presets

@router.post("", response_model=PresetResponse)
async def create_preset(payload: PresetCreate, db: AsyncSession = Depends(get_db)):
    p = Preset(
        name=payload.name,
        description=payload.description,
        operation=payload.operation,
        engine=payload.engine,
        parameters=payload.parameters,
        is_default=payload.is_default
    )
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p

@router.delete("/{preset_id}")
async def delete_preset(preset_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Preset).where(Preset.id == preset_id)
    res = await db.execute(stmt)
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Preset not found")
    await db.delete(p)
    await db.commit()
    return {"success": True, "message": f"Preset {preset_id} deleted"}

