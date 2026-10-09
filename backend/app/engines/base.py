from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timezone
import asyncio

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

@dataclass
class EngineCapability:
    formats: List[str] = field(default_factory=list)
    encoders: List[str] = field(default_factory=list)
    decoders: List[str] = field(default_factory=list)
    languages: List[str] = field(default_factory=list)
    extras: Dict[str, Any] = field(default_factory=dict)

@dataclass
class EngineInfo:
    name: str
    installed: bool
    version: Optional[str] = None
    path: Optional[str] = None
    capabilities: EngineCapability = field(default_factory=EngineCapability)
    detected_at: datetime = field(default_factory=utc_now)

class CapabilityRegistry:
    """Central registry storing the detected capabilities of all engines."""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CapabilityRegistry, cls).__new__(cls)
            cls._instance.engines: Dict[str, EngineInfo] = {}
        return cls._instance
        
    def register(self, info: EngineInfo):
        self.engines[info.name] = info
        
    def get(self, name: str) -> Optional[EngineInfo]:
        return self.engines.get(name)
        
    def is_installed(self, name: str) -> bool:
        engine = self.get(name)
        return engine is not None and engine.installed

    def get_all(self) -> Dict[str, EngineInfo]:
        return self.engines

class EngineDetector(ABC):
    name: str
    
    @abstractmethod
    async def detect(self) -> EngineInfo:
        """Detect the engine, version, and capabilities."""
        pass
        
    async def _run_command(self, cmd: List[str], timeout: int = 10) -> Tuple[int, str, str]:
        """Utility to run a command asynchronously and capture output."""
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)
            return (
                process.returncode or 0,
                stdout.decode('utf-8', errors='replace'),
                stderr.decode('utf-8', errors='replace')
            )
        except (FileNotFoundError, asyncio.TimeoutError):
            return -1, "", ""
        except Exception as e:
            return -1, "", str(e)

