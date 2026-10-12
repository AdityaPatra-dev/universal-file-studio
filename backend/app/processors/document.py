import os
import shutil
import tempfile
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

from app.engines.wrappers.base import ProcessResult
from app.engines.wrappers.libreoffice import libreoffice_engine
from app.engines.wrappers.pandoc import pandoc_engine
from app.processors.base import BaseProcessor

class DocumentProcessor(BaseProcessor):
    """
    Handles all document, spreadsheet, presentation, and markdown/text transformations.
    Routes to LibreOffice for office docs (DOCX, XLSX, PPTX, ODT, ODS, ODP, PDF)
    and Pandoc / internal markup engines for Markdown and text documents.
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
        in_ext = in_p.suffix.lower()

        # 1. Markdown / Text conversion
        if operation in ["markdown_convert", "text_convert"]:
            target_fmt = parameters.get("format") or parameters.get("target_format") or ("html" if in_ext in [".md", ".markdown"] else "txt")
            target_fmt = target_fmt.lstrip(".")
            out_file = str(output_dir / f"{in_p.stem}_{job_id[:8]}.{target_fmt}")

            # If converting to PDF or DOCX and LibreOffice is available, use LibreOffice
            if target_fmt in ["pdf", "docx", "odt"] and libreoffice_engine.is_installed():
                return await self._convert_via_libreoffice(in_p, output_dir, job_id, target_fmt)

            # Try Pandoc / internal markup processor
            res = await pandoc_engine.convert(
                input_path=str(in_p),
                output_path=out_file,
                format_from="markdown" if in_ext in [".md", ".markdown"] else None,
                format_to=target_fmt
            )

            # If pandoc couldn't convert to the requested format, fallback to LibreOffice
            if not res.success and libreoffice_engine.is_installed():
                return await self._convert_via_libreoffice(in_p, output_dir, job_id, target_fmt)

            return out_file, res

        # 2. Spreadsheet conversion (XLSX, XLS, ODS, CSV)
        elif operation in ["spreadsheet_convert", "convert_spreadsheet"]:
            target_fmt = parameters.get("format") or parameters.get("target_format")
            if not target_fmt:
                target_fmt = "csv" if in_ext in [".xlsx", ".xls", ".ods"] else "pdf"
            target_fmt = target_fmt.lstrip(".")
            return await self._convert_via_libreoffice(in_p, output_dir, job_id, target_fmt)

        # 3. Presentation conversion (PPTX, PPT, ODP)
        elif operation in ["presentation_convert", "convert_presentation"]:
            target_fmt = parameters.get("format") or parameters.get("target_format") or "pdf"
            target_fmt = target_fmt.lstrip(".")
            return await self._convert_via_libreoffice(in_p, output_dir, job_id, target_fmt)

        # 4. General Document conversion (DOC, DOCX, ODT, RTF, TXT, HTML)
        else:
            target_fmt = parameters.get("format") or parameters.get("target_format") or "pdf"
            target_fmt = target_fmt.lstrip(".")
            return await self._convert_via_libreoffice(in_p, output_dir, job_id, target_fmt)

    async def _convert_via_libreoffice(
        self,
        in_p: Path,
        output_dir: Path,
        job_id: str,
        target_fmt: str
    ) -> Tuple[str, ProcessResult]:
        """Runs LibreOffice headless conversion in a dedicated temporary directory and moves output."""
        temp_dir = Path(tempfile.mkdtemp(prefix="ufs_doc_conv_"))
        final_out_path = str(output_dir / f"{in_p.stem}_{job_id[:8]}.{target_fmt}")

        try:
            res = await libreoffice_engine.convert(
                input_path=str(in_p),
                output_dir=str(temp_dir),
                format=target_fmt
            )

            if not res.success:
                return final_out_path, res

            expected_lo_output = temp_dir / f"{in_p.stem}.{target_fmt}"
            if expected_lo_output.exists():
                output_dir.mkdir(parents=True, exist_ok=True)
                shutil.move(str(expected_lo_output), final_out_path)
                return final_out_path, res

            # Check if any file was generated in temp_dir
            generated_files = list(temp_dir.glob(f"*.{target_fmt}"))
            if generated_files:
                output_dir.mkdir(parents=True, exist_ok=True)
                shutil.move(str(generated_files[0]), final_out_path)
                return final_out_path, res

            return final_out_path, ProcessResult(
                returncode=1,
                stdout=res.stdout,
                stderr=f"LibreOffice succeeded but expected output file {expected_lo_output.name} was not found.",
                success=False,
                command=res.command
            )
        finally:
            if temp_dir.exists():
                shutil.rmtree(temp_dir, ignore_errors=True)

document_processor = DocumentProcessor()
