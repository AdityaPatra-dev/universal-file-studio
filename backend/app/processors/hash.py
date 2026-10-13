import hashlib
import json
import zlib
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

from app.engines.wrappers.base import ProcessResult
from app.processors.base import BaseProcessor

class HashProcessor(BaseProcessor):
    """
    Computes cryptographic and integrity checksums using streaming buffers:
    - SHA-256 (NIST standard)
    - MD5 (Legacy validation)
    - SHA-1 (Git/VCS validation)
    - SHA-512 (High security)
    - CRC-32 (Fast integrity checking)
    """

    CHUNK_SIZE = 64 * 1024  # 64 KB

    async def compute_hashes(self, file_path: str) -> Dict[str, str]:
        """Streaming hash calculation over chunks."""
        sha256 = hashlib.sha256()
        md5 = hashlib.md5()
        sha1 = hashlib.sha1()
        sha512 = hashlib.sha512()
        crc = 0

        with open(file_path, "rb") as f:
            while chunk := f.read(self.CHUNK_SIZE):
                sha256.update(chunk)
                md5.update(chunk)
                sha1.update(chunk)
                sha512.update(chunk)
                crc = zlib.crc32(chunk, crc)

        return {
            "sha256": sha256.hexdigest(),
            "md5": md5.hexdigest(),
            "sha1": sha1.hexdigest(),
            "sha512": sha512.hexdigest(),
            "crc32": f"{crc & 0xffffffff:08x}",
        }

    async def process(
        self,
        operation: str,
        input_path: str,
        output_dir: Path,
        job_id: str,
        parameters: Dict[str, Any],
        file_info: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, ProcessResult]:
        in_p = Path(input_path)
        output_dir.mkdir(parents=True, exist_ok=True)
        target_fmt = str(parameters.get("format", "txt")).lower()

        hashes = await self.compute_hashes(str(in_p))

        if target_fmt == "json":
            out_file = str(output_dir / f"{in_p.stem}_{job_id[:8]}_checksums.json")
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump({"filename": in_p.name, **hashes}, f, indent=2)
        else:
            out_file = str(output_dir / f"{in_p.stem}_{job_id[:8]}.sha256")
            manifest = (
                f"# Universal File Studio Checksum Verification\n"
                f"# File: {in_p.name}\n"
                f"SHA256: {hashes['sha256']}\n"
                f"MD5:    {hashes['md5']}\n"
                f"SHA1:   {hashes['sha1']}\n"
                f"CRC32:  {hashes['crc32']}\n"
                f"\n"
                f"# Standard sha256sum format:\n"
                f"{hashes['sha256']}  {in_p.name}\n"
            )
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(manifest)

        return out_file, ProcessResult(
            returncode=0,
            stdout=f"SHA256: {hashes['sha256']} | MD5: {hashes['md5']}",
            stderr="",
            success=True,
            command=["ufs_hasher", str(in_p), out_file]
        )

hash_processor = HashProcessor()
