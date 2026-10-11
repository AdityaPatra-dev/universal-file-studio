from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple
from pathlib import Path
from app.engines.wrappers.base import ProcessResult

class BaseProcessor(ABC):
    @abstractmethod
    async def process(
        self,
        operation: str,
        input_path: str,
        output_dir: str,
        job_id: str,
        parameters: Dict[str, Any],
        file_info: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, ProcessResult]:
        """
        Executes a specific operation.
        Returns: (output_path, ProcessResult)
        """
        pass

