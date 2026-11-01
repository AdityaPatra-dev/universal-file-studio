import os
import re
from typing import List, Optional
from pathlib import Path
from app.engines.wrappers.base import BaseEngine, ProcessResult
from app.exceptions import ArchiveBombError

class SevenZipEngine(BaseEngine):
    name = "7z"

    # Maximum allowed uncompressed extraction size: 5 GB
    MAX_UNCOMPRESSED_BYTES = 5 * 1024 * 1024 * 1024
    # Maximum allowed compression expansion ratio: 200 to 1
    MAX_EXPANSION_RATIO = 200

    def _get_bin(self) -> str:
        info = self.get_info()
        return info.path if info and info.path else "7z"

    async def check_archive_safety(self, archive_path: str) -> None:
        """Inspects archive manifest to prevent Zip Bombs and Directory Traversal attacks."""
        cmd = [self._get_bin(), "l", "-slt", archive_path]
        res = await self.execute(cmd)
        if not res.success:
            return

        total_uncompressed = 0
        file_count = 0
        archive_size = os.path.getsize(archive_path) if os.path.exists(archive_path) else 1
        in_files_section = False

        for line in res.stdout.splitlines():
            line = line.strip()
            if line.startswith("----------"):
                in_files_section = True
                continue

            if not in_files_section:
                continue

            if line.startswith("Size = "):
                try:
                    val = int(line.split("=", 1)[1].strip())
                    total_uncompressed += val
                    file_count += 1
                except ValueError:
                    pass
            elif line.startswith("Path = "):
                entry_path = line.split("=", 1)[1].strip()
                if ".." in entry_path or entry_path.startswith("/") or entry_path.startswith("\\"):
                    raise ArchiveBombError(f"Malicious archive entry detected with directory escape: {entry_path}")

        if total_uncompressed > self.MAX_UNCOMPRESSED_BYTES:
            raise ArchiveBombError(
                f"Archive uncompressed size ({total_uncompressed / (1024*1024):.1f}MB) "
                f"exceeds maximum allowed safety limit of {self.MAX_UNCOMPRESSED_BYTES / (1024*1024):.1f}MB."
            )

        if archive_size > 0 and (total_uncompressed / archive_size) > self.MAX_EXPANSION_RATIO and total_uncompressed > 100 * 1024 * 1024:
            raise ArchiveBombError(
                f"Suspicious archive compression ratio ({total_uncompressed / archive_size:.1f}:1). Extraction aborted."
            )

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
        # Pre-extraction security check against bombs and path traversal
        await self.check_archive_safety(archive_path)

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

