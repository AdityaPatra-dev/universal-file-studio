import os
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

from app.engines.wrappers.base import ProcessResult
from app.engines.wrappers.tesseract import tesseract_engine
from app.engines.wrappers.poppler import poppler_engine
from app.engines.wrappers.imagemagick import imagemagick_engine
from app.processors.base import BaseProcessor

class OcrProcessor(BaseProcessor):
    """
    Handles Optical Character Recognition (OCR) and text extraction for images and PDFs.
    Uses Tesseract OCR when available, with intelligent Poppler pdftotext fallback for PDFs.
    """

    async def process(
        self,
        operation: str,
        input_path: str,
        output_dir: Path,
        job_id: str,
        parameters: Dict[str, Any],
        file_info: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, ProcessResult]:
        in_p = Path(input_path)
        output_dir.mkdir(parents=True, exist_ok=True)
        lang = str(parameters.get("language", "eng"))
        target_fmt = str(parameters.get("format", "txt")).lower()

        # 1. PDF Text Extraction / OCR
        if in_p.suffix.lower() == ".pdf" or operation in ["ocr_pdf", "pdf_to_text"]:
            out_file = str(output_dir / f"{in_p.stem}_{job_id[:8]}.txt")

            # Try Tesseract if available and requested
            if tesseract_engine.is_installed() and parameters.get("engine") == "tesseract":
                out_base = str(output_dir / f"{in_p.stem}_{job_id[:8]}")
                res = await tesseract_engine.ocr_pdf(str(in_p), out_base, language=lang)
                if res.success and os.path.exists(f"{out_base}.txt"):
                    return f"{out_base}.txt", res

            # Poppler pdftotext fallback (very fast, extracted native text)
            if poppler_engine.is_installed():
                res = await poppler_engine.pdf_to_text(str(in_p), out_file)
                return out_file, res

        # 2. Image OCR
        out_base = str(output_dir / f"{in_p.stem}_{job_id[:8]}")
        out_file = f"{out_base}.{target_fmt}"

        if tesseract_engine.is_installed():
            res = await tesseract_engine.ocr_image(
                input_path=str(in_p),
                output_base=out_base,
                language=lang,
                output_format=target_fmt
            )
            # Tesseract appends .txt or .pdf automatically to output_base
            actual_out = f"{out_base}.{target_fmt}"
            if os.path.exists(actual_out):
                return actual_out, res
            if os.path.exists(f"{out_base}.txt"):
                return f"{out_base}.txt", res
            return out_file, res

        # Graceful fallback report when Tesseract is not installed
        img_meta = await imagemagick_engine.metadata(str(in_p)) if imagemagick_engine.is_installed() else {}
        report_content = (
            f"=== Universal File Studio — OCR Extraction Report ===\n"
            f"File: {in_p.name}\n"
            f"Language Requested: {lang}\n"
            f"Dimensions: {img_meta.get('width', 'Unknown')}x{img_meta.get('height', 'Unknown')}\n\n"
            f"[NOTICE]\n"
            f"Tesseract OCR engine is not currently installed on the host system.\n"
            f"To enable full optical character recognition for images, install Tesseract OCR:\n"
            f"  - Arch/Manjaro: sudo pacman -S tesseract tesseract-data-eng\n"
            f"  - Ubuntu/Debian: sudo apt install tesseract-ocr tesseract-ocr-eng\n"
            f"  - Fedora: sudo dnf install tesseract tesseract-langpack-eng\n"
        )
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(report_content)

        return out_file, ProcessResult(
            returncode=0,
            stdout="OCR report generated (Tesseract not installed on host).",
            stderr="",
            success=True,
            command=["ufs_ocr_reporter", str(in_p), out_file]
        )

ocr_processor = OcrProcessor()
