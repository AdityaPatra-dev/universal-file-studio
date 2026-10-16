import os
import re
import tempfile
import shutil
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

        # 1. Images / Archive to Single PDF (e.g. Manga, Comic, Document scans)
        if operation in ["images_to_pdf", "archive_to_pdf", "cbz_to_pdf", "merge_to_pdf"]:
            return await self._convert_images_or_archive_to_pdf(in_p, out_d, job_id, parameters)

        # 2. PDF to Images
        elif operation in ["pdf_to_images", "pdf_to_image"]:
            fmt = str(parameters.get("format", "png")).lower().lstrip(".")
            dpi = int(parameters.get("dpi", 150))
            out_prefix = str(out_d / f"{in_p.stem}_{job_id[:8]}_page")
            res = await poppler_engine.pdf_to_image(input_path, out_prefix, format=fmt, dpi=dpi)
            first_page = f"{out_prefix}-1.{fmt}"
            if not Path(first_page).exists():
                alt_ext = "jpg" if fmt == "jpeg" else ("jpeg" if fmt == "jpg" else fmt)
                if Path(f"{out_prefix}-1.{alt_ext}").exists():
                    first_page = f"{out_prefix}-1.{alt_ext}"
            return first_page, res

        # 3. PDF to Text
        elif operation in ["pdf_to_text", "pdf_extract_text"]:
            out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.txt")
            res = await poppler_engine.pdf_to_text(input_path, out_file)
            return out_file, res

        # 4. PDF Compress / Optimize
        elif operation in ["pdf_compress", "pdf_optimize"]:
            quality = str(parameters.get("quality", "ebook"))
            out_file = str(out_d / f"{in_p.stem}_optimized_{job_id[:8]}.pdf")
            res = await ghostscript_engine.compress(input_path, out_file, quality_setting=quality)
            return out_file, res

        # 5. PDF Merge
        elif operation in ["pdf_merge", "merge_pdf", "merge_pdfs"]:
            return await self._merge_pdfs(in_p, out_d, job_id, parameters)

        # 6. PDF Split
        elif operation in ["pdf_split", "split_pdf"]:
            return await self._split_pdf(in_p, out_d, job_id, parameters)

        # 7. PDF Rotate Pages
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

        # 8. PDF Extract Pages
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

    async def _convert_images_or_archive_to_pdf(
        self,
        in_p: Path,
        out_d: Path,
        job_id: str,
        parameters: Dict[str, Any]
    ) -> Tuple[str, ProcessResult]:
        from app.engines.wrappers.sevenzip import sevenzip_engine
        from app.engines.wrappers.imagemagick import imagemagick_engine

        out_d.mkdir(parents=True, exist_ok=True)
        out_pdf = str(out_d / f"{in_p.stem}_{job_id[:8]}.pdf")
        quality = int(parameters.get("quality", 85))
        compress_type = str(parameters.get("compress", "jpeg")).lower()

        img_exts = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".bmp", ".tiff", ".gif"}
        temp_dir: Optional[Path] = None

        def natural_sort_key(s):
            return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', str(s))]

        try:
            # Case A: Input is an archive (ZIP, CBZ, 7Z, RAR, TAR)
            archive_exts = {".zip", ".cbz", ".7z", ".rar", ".tar", ".gz", ".bz2", ".xz"}
            if in_p.suffix.lower() in archive_exts or (in_p.is_file() and in_p.suffix.lower() not in img_exts):
                temp_dir = Path(tempfile.mkdtemp(prefix="ufs_zip2pdf_"))
                extract_res = await sevenzip_engine.extract(str(in_p), str(temp_dir))
                if not extract_res.success:
                    return out_pdf, extract_res
                image_files = [p for p in temp_dir.rglob("*") if p.suffix.lower() in img_exts]
            # Case B: Input is a directory containing images
            elif in_p.is_dir():
                image_files = [p for p in in_p.rglob("*") if p.suffix.lower() in img_exts]
            # Case C: Input is a single image file
            else:
                image_files = [in_p]

            if not image_files:
                return out_pdf, ProcessResult(
                    returncode=1,
                    stdout="",
                    stderr="No supported image files found to compile into PDF.",
                    success=False,
                    command=["magick", "images_to_pdf"]
                )

            image_files.sort(key=natural_sort_key)

            # Write file list to avoid command line length limits
            list_file_dir = Path(tempfile.mkdtemp(prefix="ufs_imglist_"))
            list_file = list_file_dir / "images.txt"
            with open(list_file, "w", encoding="utf-8") as f:
                for img_p in image_files:
                    f.write(f"{img_p.resolve().as_posix()}\n")

            # Invoke ImageMagick with @list_file
            magick_bin = imagemagick_engine._get_bin()
            cmd = [
                magick_bin,
                f"@{list_file.resolve().as_posix()}",
                "-compress", compress_type,
                "-quality", str(quality),
                out_pdf
            ]

            res = await imagemagick_engine.execute(cmd, timeout=600)
            shutil.rmtree(list_file_dir, ignore_errors=True)

            if res.success and os.path.exists(out_pdf):
                return out_pdf, res
            else:
                return out_pdf, res
        finally:
            if temp_dir and temp_dir.exists():
                shutil.rmtree(temp_dir, ignore_errors=True)

    async def _merge_pdfs(
        self,
        in_p: Path,
        out_d: Path,
        job_id: str,
        parameters: Dict[str, Any]
    ) -> Tuple[str, ProcessResult]:
        out_d.mkdir(parents=True, exist_ok=True)
        out_pdf = str(out_d / f"{in_p.stem}_merged_{job_id[:8]}.pdf")

        if in_p.is_dir():
            pdfs = sorted([p for p in in_p.rglob("*.pdf")], key=lambda x: [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', x.name)])
        else:
            pdfs = [in_p]

        if not pdfs:
            return out_pdf, ProcessResult(
                returncode=1,
                stdout="",
                stderr="No PDF files found to merge.",
                success=False,
                command=["gs", "pdf_merge"]
            )

        if len(pdfs) == 1:
            shutil.copyfile(str(pdfs[0]), out_pdf)
            return out_pdf, ProcessResult(returncode=0, stdout="Single PDF copied", stderr="", success=True, command=["copy", str(pdfs[0]), out_pdf])

        cmd = [
            "gs", "-dBATCH", "-dNOPAUSE", "-q",
            "-sDEVICE=pdfwrite",
            f"-sOutputFile={out_pdf}",
            *[str(p.resolve()) for p in pdfs]
        ]
        res = await ghostscript_engine.execute(cmd, timeout=300)
        return out_pdf, res

    async def _split_pdf(
        self,
        in_p: Path,
        out_d: Path,
        job_id: str,
        parameters: Dict[str, Any]
    ) -> Tuple[str, ProcessResult]:
        split_dir = out_d / f"{in_p.stem}_pages_{job_id[:8]}"
        split_dir.mkdir(parents=True, exist_ok=True)
        out_pattern = str(split_dir / "page_%d.pdf")

        cmd = ["pdfseparate", str(in_p), out_pattern]
        res = await poppler_engine.execute(cmd)
        if not res.success:
            # Fallback using Ghostscript
            cmd_gs = [
                "gs", "-dBATCH", "-dNOPAUSE", "-q",
                "-sDEVICE=pdfwrite",
                f"-sOutputFile={str(split_dir / 'page_%04d.pdf')}",
                str(in_p)
            ]
            res = await ghostscript_engine.execute(cmd_gs)

        return str(split_dir), res

pdf_processor = PdfProcessor()

