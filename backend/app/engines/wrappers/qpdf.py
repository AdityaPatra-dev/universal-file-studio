from typing import List, Optional
from app.engines.wrappers.base import BaseEngine, ProcessResult

class QpdfEngine(BaseEngine):
    name = "qpdf"

    async def decrypt(self, input_path: str, output_path: str, password: str) -> ProcessResult:
        cmd = ["qpdf", f"--password={password}", "--decrypt", input_path, output_path]
        return await self.execute(cmd)

    async def encrypt(
        self,
        input_path: str,
        output_path: str,
        user_password: str,
        owner_password: str,
        key_length: int = 256
    ) -> ProcessResult:
        cmd = [
            "qpdf", "--encrypt", user_password, owner_password, str(key_length),
            "--", input_path, output_path
        ]
        return await self.execute(cmd)

    async def merge(self, input_paths: List[str], output_path: str) -> ProcessResult:
        cmd = ["qpdf", "--empty", "--pages"] + input_paths + ["--", output_path]
        return await self.execute(cmd)

    async def split(self, input_path: str, output_pattern: str) -> ProcessResult:
        cmd = ["qpdf", "--split-pages", input_path, output_pattern]
        return await self.execute(cmd)

    async def rotate_pages(
        self,
        input_path: str,
        output_path: str,
        angle: int = 90,
        page_ranges: str = "1-z"
    ) -> ProcessResult:
        cmd = ["qpdf", input_path, f"--rotate=+{angle}:{page_ranges}", output_path]
        return await self.execute(cmd)

    async def extract_pages(
        self,
        input_path: str,
        output_path: str,
        page_ranges: str = "1"
    ) -> ProcessResult:
        cmd = ["qpdf", input_path, f"--pages", ".", page_ranges, "--", output_path]
        return await self.execute(cmd)

    async def linearize(self, input_path: str, output_path: str) -> ProcessResult:
        cmd = ["qpdf", "--linearize", input_path, output_path]
        return await self.execute(cmd)

qpdf_engine = QpdfEngine()
