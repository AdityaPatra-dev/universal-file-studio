import os
from typing import List, Optional
from pathlib import Path
from app.engines.wrappers.base import BaseEngine, ProcessResult

class SevenZipEngine(BaseEngine):
    name = "7z"

    def _get_bin(self) -> str:
        info = self.get_info()
        return info.path if info and info.path else "7z"

    async def create(
        self,
        target_archive: str,
        source_paths: List[str],
        password: Optional[str] = None
    ) -> ProcessResult:
        cmd = [self._get_bin(), "a", target_archive]
        if password:
            cmd.append(f"-p{password}")
        cmd.extend(source_paths)
        return await self.execute(cmd)

    async def extract(
        self,
        archive_path: str,
        output_dir: str,
        password: Optional[str] = None
    ) -> ProcessResult:
        os.makedirs(output_dir, exist_ok=True)
        cmd = [self._get_bin(), "x", archive_path, f"-o{output_dir}", "-y"]
        if password:
            cmd.append(f"-p{password}")
        return await self.execute(cmd)

    async def list(self, archive_path: str) -> List[str]:
        cmd = [self._get_bin(), "l", archive_path]
        res = await self.execute(cmd)
        files = []
        if res.success:
            for line in res.stdout.splitlines():
                parts = line.strip().split()
                if len(parts) >= 6 and not line.startswith("---") and not line.startswith("Date"):
                    files.append(parts[-1])
        return files

    async def test(self, archive_path: str) -> ProcessResult:
        cmd = [self._get_bin(), "t", archive_path]
        return await self.execute(cmd)

    async def add(self, archive_path: str, source_paths: List[str]) -> ProcessResult:
        cmd = [self._get_bin(), "u", archive_path]
        cmd.extend(source_paths)
        return await self.execute(cmd)

    async def remove(self, archive_path: str, files_to_remove: List[str]) -> ProcessResult:
        cmd = [self._get_bin(), "d", archive_path]
        cmd.extend(files_to_remove)
        return await self.execute(cmd)

sevenzip_engine = SevenZipEngine()
