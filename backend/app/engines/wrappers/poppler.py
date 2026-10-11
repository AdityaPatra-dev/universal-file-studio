from typing import Dict, Any, List, Optional
from pathlib import Path
from app.engines.wrappers.base import BaseEngine, ProcessResult

class PopplerEngine(BaseEngine):
    name = "poppler"

    async def pdf_to_image(
        self,
        input_path: str,
        output_prefix: str,
        format: str = "png",
        dpi: int = 150
    ) -> ProcessResult:
        # pdftoppm -png -r 150 input.pdf output_prefix
        cmd = ["pdftoppm", f"-{format}", "-r", str(dpi), input_path, output_prefix]
        return await self.execute(cmd)

    async def pdf_to_text(self, input_path: str, output_path: str) -> ProcessResult:
        cmd = ["pdftotext", input_path, output_path]
        return await self.execute(cmd)

    async def pdf_info(self, input_path: str) -> Dict[str, Any]:
        cmd = ["pdfinfo", input_path]
        res = await self.execute(cmd)
        info: Dict[str, Any] = {}
        if res.success:
            for line in res.stdout.splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    info[k.strip().lower().replace(" ", "_")] = v.strip()
        return info

    async def extract_images(self, input_path: str, output_prefix: str) -> ProcessResult:
        cmd = ["pdfimages", "-png", input_path, output_prefix]
        return await self.execute(cmd)

poppler_engine = PopplerEngine()

