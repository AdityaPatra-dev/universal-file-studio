import os
import shutil
import tempfile
import uuid
from pathlib import Path
from typing import Optional
from app.engines.wrappers.base import BaseEngine, ProcessResult

class LibreOfficeEngine(BaseEngine):
    name = "libreoffice"

    def _get_bin(self) -> str:
        info = self.get_info()
        return info.path if info and info.path else "libreoffice"

    async def convert(
        self,
        input_path: str,
        output_dir: str,
        format: str = "pdf",
        filter_name: Optional[str] = None
    ) -> ProcessResult:
        """
        Converts document, spreadsheet, or presentation to target format using headless LibreOffice.
        Uses isolated UserInstallation profile to prevent race conditions during concurrent jobs.
        """
        if not self.is_installed():
            return ProcessResult(
                returncode=127,
                stdout="",
                stderr="LibreOffice is not installed on the system.",
                success=False,
                command=["libreoffice"]
            )

        os.makedirs(output_dir, exist_ok=True)
        temp_profile_dir = Path(tempfile.gettempdir()) / f"ufs_lo_profile_{os.getpid()}_{uuid.uuid4().hex[:8]}"
        temp_profile_dir.mkdir(parents=True, exist_ok=True)

        convert_spec = format if not filter_name else f"{format}:{filter_name}"

        cmd = [
            self._get_bin(),
            "--headless",
            "--invisible",
            "--nologo",
            "--nofirststartwizard",
            f"-env:UserInstallation=file://{temp_profile_dir.as_posix()}",
            "--convert-to", convert_spec,
            "--outdir", output_dir,
            input_path
        ]

        try:
            res = await self.execute(cmd, timeout=300)
            return res
        finally:
            # Clean up isolated user installation profile
            if temp_profile_dir.exists():
                shutil.rmtree(temp_profile_dir, ignore_errors=True)

libreoffice_engine = LibreOfficeEngine()
