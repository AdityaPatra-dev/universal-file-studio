import os
from typing import Optional
from pathlib import Path
from app.engines.wrappers.base import BaseEngine, ProcessResult

class LibreOfficeEngine(BaseEngine):
    name = "libreoffice"

    def _get_bin(self) -> str:
        info = self.get_info()
        return info.path if info and info.path else "libreoffice"

    async def convert(self, input_path: str, output_dir: str, format: str = "pdf") -> ProcessResult:
        os.makedirs(output_dir, exist_ok=True)
        cmd = [
            self._get_bin(),
            "--headless",
            "--convert-to", format,
            "--outdir", output_dir,
            input_path
        ]
        return await self.execute(cmd, timeout=300)

libreoffice_engine = LibreOfficeEngine()

