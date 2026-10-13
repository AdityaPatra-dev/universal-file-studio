from typing import List, Optional
from app.engines.wrappers.base import BaseEngine, ProcessResult

class TesseractEngine(BaseEngine):
    name = "tesseract"

    async def ocr_image(
        self,
        input_path: str,
        output_base: str,
        language: str = "eng",
        output_format: str = "txt"
    ) -> ProcessResult:
        if not self.is_installed():
            return ProcessResult(
                returncode=127,
                stdout="",
                stderr="Tesseract OCR engine is not installed on the system.",
                success=False,
                command=["tesseract"]
            )
        # tesseract input output_base -l eng [pdf/txt]
        cmd = ["tesseract", input_path, output_base, "-l", language]
        if output_format.lower() == "pdf":
            cmd.append("pdf")
        return await self.execute(cmd)

    async def ocr_pdf(
        self,
        input_path: str,
        output_base: str,
        language: str = "eng"
    ) -> ProcessResult:
        return await self.ocr_image(input_path, output_base, language, output_format="pdf")

    async def list_languages(self) -> List[str]:
        if not self.is_installed():
            return ["eng"]
        cmd = ["tesseract", "--list-langs"]
        res = await self.execute(cmd)
        if res.success:
            return [l.strip() for l in res.stdout.splitlines()[1:] if l.strip()]
        return ["eng"]

tesseract_engine = TesseractEngine()
