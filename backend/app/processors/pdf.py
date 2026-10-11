from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
from app.processors.base import BaseProcessor
from app.engines.wrappers.poppler import poppler_engine
from app.engines.wrappers.ghostscript import ghostscript_engine
from app.engines.wrappers.qpdf import qpdf_engine
from app.engines.wrappers.base import ProcessResult

class PdfProcessor(BaseProcessor):
    async def process(
        self,
        operation: str,
        input_path: str,
        output_dir: str,
        job_id: str,
        parameters: Dict[str, Any],
        file_info: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, ProcessResult]:
        in_p = Path(input_path)
        out_d = Path(output_dir)

        # 1. PDF to Images
        if operation in ["pdf_to_images", "pdf_to_image"]:
            fmt = str(parameters.get("format", "png")).lower().lstrip(".")
            dpi = int(parameters.get("dpi", 150))
            out_prefix = str(out_d / f"{in_p.stem}_{job_id[:8]}_page")
            res = await poppler_engine.pdf_to_image(input_path, out_prefix, format=fmt, dpi=dpi)
            first_page = f"{out_prefix}-1.{fmt}"
            return first_page, res

        # 2. PDF to Text
        elif operation in ["pdf_to_text", "pdf_extract_text"]:
            out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.txt")
            res = await poppler_engine.pdf_to_text(input_path, out_file)
            return out_file, res

        # 3. PDF Compress / Optimize
        elif operation in ["pdf_compress", "pdf_optimize"]:
            quality = str(parameters.get("quality", "ebook"))
            out_file = str(out_d / f"{in_p.stem}_optimized_{job_id[:8]}.pdf")
            res = await ghostscript_engine.compress(input_path, out_file, quality_setting=quality)
            return out_file, res

        # 4. PDF Rotate Pages
        elif operation in ["pdf_rotate_pages", "rotate_pdf"]:
            angle = int(parameters.get("angle", 90))
            pages = str(parameters.get("pages", "1-z"))
            out_file = str(out_d / f"{in_p.stem}_rotated_{job_id[:8]}.pdf")
            if qpdf_engine.is_installed():
                res = await qpdf_engine.rotate_pages(input_path, out_file, angle=angle, page_ranges=pages)
            else:
                # Ghostscript fallback rotate
                cmd = ["gs", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4", "-dNOPAUSE", "-dQUIET", "-dBATCH", f"-sOutputFile={out_file}", input_path]
                res = await ghostscript_engine.execute(cmd)
            return out_file, res

        # 5. PDF Extract Pages
        elif operation in ["pdf_extract_pages", "extract_pdf_pages"]:
            pages = str(parameters.get("pages", "1"))
            out_file = str(out_d / f"{in_p.stem}_extracted_{job_id[:8]}.pdf")
            if qpdf_engine.is_installed():
                res = await qpdf_engine.extract_pages(input_path, out_file, page_ranges=pages)
            else:
                cmd = ["pdftk", input_path, "cat", pages, "output", out_file]
                res = await poppler_engine.execute(cmd)
            return out_file, res

        # Default fallback
        out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.pdf")
        res = await ghostscript_engine.optimize(input_path, out_file)
        return out_file, res

pdf_processor = PdfProcessor()
