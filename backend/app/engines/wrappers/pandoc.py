from typing import Optional
from app.engines.wrappers.base import BaseEngine, ProcessResult

class PandocEngine(BaseEngine):
    name = "pandoc"

    async def convert(
        self,
        input_path: str,
        output_path: str,
        format_from: Optional[str] = None,
        format_to: Optional[str] = None
    ) -> ProcessResult:
        cmd = ["pandoc", input_path, "-o", output_path]
        if format_from:
            cmd.extend(["-f", format_from])
        if format_to:
            cmd.extend(["-t", format_to])
        return await self.execute(cmd)

pandoc_engine = PandocEngine()

