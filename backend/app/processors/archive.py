import os
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
from app.processors.base import BaseProcessor
from app.engines.wrappers.sevenzip import sevenzip_engine
from app.engines.wrappers.base import ProcessResult

class ArchiveProcessor(BaseProcessor):
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
        password = parameters.get("password")

        # 1. Archive Extract
        if operation in ["archive_extract", "extract_archive"]:
            extract_dir = str(out_d / f"{in_p.stem}_extracted_{job_id[:8]}")
            res = await sevenzip_engine.extract(input_path, extract_dir, password=password)
            return extract_dir, res

        # 2. Archive Create
        elif operation in ["archive_create", "create_archive"]:
            fmt = str(parameters.get("format", "zip")).lower().lstrip(".")
            out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.{fmt}")
            if in_p.is_dir():
                items = [str(p) for p in in_p.glob("*")]
                res = await sevenzip_engine.create(out_file, items or [input_path], password=password)
            else:
                res = await sevenzip_engine.create(out_file, [input_path], password=password)
            return out_file, res

        # 3. Archive Test
        elif operation in ["archive_test", "test_archive"]:
            res = await sevenzip_engine.test(input_path)
            return input_path, res

        # 4. Archive List Manifest
        elif operation in ["archive_list", "list_archive"]:
            out_file = str(out_d / f"{in_p.stem}_manifest_{job_id[:8]}.txt")
            cmd = ["7z", "l", "-ba", input_path]
            res = await sevenzip_engine.execute(cmd)
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(res.stdout or "")
            return out_file, res

        # Default fallback
        out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.zip")
        res = await sevenzip_engine.create(out_file, [input_path])
        return out_file, res

archive_processor = ArchiveProcessor()

