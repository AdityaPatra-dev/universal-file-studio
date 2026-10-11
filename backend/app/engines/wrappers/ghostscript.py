from typing import Optional
from app.engines.wrappers.base import BaseEngine, ProcessResult

class GhostscriptEngine(BaseEngine):
    name = "ghostscript"

    def _get_bin(self) -> str:
        info = self.get_info()
        return info.path if info and info.path else "gs"

    async def optimize(self, input_path: str, output_path: str) -> ProcessResult:
        cmd = [
            self._get_bin(),
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            f"-sOutputFile={output_path}",
            input_path
        ]
        return await self.execute(cmd)

    async def compress(
        self,
        input_path: str,
        output_path: str,
        quality_setting: str = "ebook"  # screen (lowest), ebook (medium), printer (high), prepress (highest)
    ) -> ProcessResult:
        cmd = [
            self._get_bin(),
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS=/{quality_setting}",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            f"-sOutputFile={output_path}",
            input_path
        ]
        return await self.execute(cmd)

    async def pdf_a(
        self,
        input_path: str,
        output_path: str,
        version: str = "2b"
    ) -> ProcessResult:
        cmd = [
            self._get_bin(),
            "-dPDFA=2",
            "-sColorConversionStrategy=UseDeviceIndependentColor",
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            f"-sOutputFile={output_path}",
            input_path
        ]
        return await self.execute(cmd)

ghostscript_engine = GhostscriptEngine()

