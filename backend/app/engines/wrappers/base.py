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
        return registry.is_installed(self.name)

    def get_info(self) -> Optional[EngineInfo]:
        registry = CapabilityRegistry()
        return registry.get(self.name)

    async def execute(
        self,
        command: List[str],
        cwd: Optional[str] = None,
        timeout: Optional[int] = None
    ) -> ProcessResult:
        if not self.is_installed():
            raise RuntimeError(
                f"Processing engine '{self.name}' is not installed on this system. "
                f"Please install it using your system package manager."
            )

        actual_timeout = timeout or settings.SUBPROCESS_TIMEOUT_SECONDS

        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                cwd=cwd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                process.communicate(),
                timeout=actual_timeout
            )
            rc = process.returncode if process.returncode is not None else 0
            stdout_str = stdout_bytes.decode('utf-8', errors='replace')
            stderr_str = stderr_bytes.decode('utf-8', errors='replace')

            return ProcessResult(
                returncode=rc,
                stdout=stdout_str,
                stderr=stderr_str,
                success=(rc == 0),
                command=command
            )
        except asyncio.TimeoutError:
            try:
                process.kill()
            except Exception:
                pass
            raise TimeoutError(
                f"Engine '{self.name}' operation timed out after {actual_timeout} seconds."
            )
        except Exception as e:
            raise RuntimeError(f"Error executing engine '{self.name}': {str(e)}") from e

