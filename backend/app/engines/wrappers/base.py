import os
import signal
import asyncio
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from app.engines.base import CapabilityRegistry, EngineInfo
from app.config import settings

@dataclass
class ProcessResult:
    returncode: int
    stdout: str
    stderr: str
    success: bool
    command: List[str]

    @property
    def command_str(self) -> str:
        return " ".join(self.command)

class BaseEngine(ABC):
    name: str

    def is_installed(self) -> bool:
        registry = CapabilityRegistry()
        if registry.is_installed(self.name):
            return True
        import shutil
        engine_binaries = {
            "pandoc": ["pandoc"],
            "ffmpeg": ["ffmpeg"],
            "imagemagick": ["magick", "convert"],
            "sevenzip": ["7z", "7za", "7zz"],
            "7z": ["7z", "7za", "7zz"],
            "poppler": ["pdftoppm", "pdfinfo"],
            "ghostscript": ["gs"],
            "libreoffice": ["libreoffice", "soffice"],
            "qpdf": ["qpdf"],
            "tesseract": ["tesseract"],
        }
        for bin_name in engine_binaries.get(self.name, [self.name]):
            if shutil.which(bin_name):
                return True
        return False

    def get_info(self) -> Optional[EngineInfo]:
        registry = CapabilityRegistry()
        return registry.get(self.name)

    async def _terminate_subprocess(self, process: asyncio.subprocess.Process) -> None:
        """Kills the entire process group and collects exit status to prevent zombie processes."""
        try:
            if hasattr(os, "killpg") and hasattr(os, "getpgid"):
                os.killpg(os.getpgid(process.pid), signal.SIGKILL)
            else:
                process.kill()
        except Exception:
            try:
                process.kill()
            except Exception:
                pass

        try:
            # Reap exit status so process doesn't become <defunct> zombie
            await asyncio.shield(process.wait())
        except Exception:
            pass

    async def execute(
        self,
        command: List[str],
        cwd: Optional[str] = None,
        timeout: Optional[int] = None
    ) -> ProcessResult:
        if not self.is_installed():
            from app.exceptions import EngineNotInstalledError
            raise EngineNotInstalledError(
                f"Processing engine '{self.name}' is not installed on this system. "
                f"Please install it using your system package manager."
            )

        actual_timeout = timeout or settings.SUBPROCESS_TIMEOUT_SECONDS
        process = None

        try:
            # Start in a new session / process group for clean tree termination
            process = await asyncio.create_subprocess_exec(
                *command,
                cwd=cwd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                start_new_session=True
            )
            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                process.communicate(),
                timeout=actual_timeout
            )
            rc = process.returncode if process.returncode is not None else 0
            # Truncate debug output if excessive to prevent unbounded memory retention
            max_log = 1024 * 1024  # 1 MB
            stdout_str = stdout_bytes[:max_log].decode('utf-8', errors='replace')
            stderr_str = stderr_bytes[:max_log].decode('utf-8', errors='replace')

            return ProcessResult(
                returncode=rc,
                stdout=stdout_str,
                stderr=stderr_str,
                success=(rc == 0),
                command=command
            )
        except asyncio.TimeoutError:
            if process:
                await self._terminate_subprocess(process)
            from app.exceptions import SubprocessTimeoutError
            raise SubprocessTimeoutError(
                f"Engine '{self.name}' operation timed out after {actual_timeout} seconds."
            )
        except asyncio.CancelledError:
            if process:
                await self._terminate_subprocess(process)
            raise
        except Exception as e:
            if process:
                await self._terminate_subprocess(process)
            raise RuntimeError(f"Error executing engine '{self.name}': {str(e)}") from e

