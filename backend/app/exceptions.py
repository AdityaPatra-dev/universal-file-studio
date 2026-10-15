from typing import Optional

class UFSBaseException(Exception):
    """Base exception for Universal File Studio with structured error response."""
    status_code: int = 500
    error_code: str = "ERR_INTERNAL"
    default_message: str = "An internal processing error occurred."

    def __init__(self, message: Optional[str] = None):
        self.message = message or self.default_message
        super().__init__(self.message)


class EngineNotInstalledError(UFSBaseException, RuntimeError):
    """Required processing engine is not installed on the host."""
    status_code = 501
    error_code = "ERR_ENGINE_MISSING"
    default_message = "Required engine is not installed on the system."


class FileTooLargeError(UFSBaseException, ValueError):
    """File exceeds maximum configured upload size."""
    status_code = 413
    error_code = "ERR_FILE_TOO_LARGE"
    default_message = "File exceeds maximum upload size."


class ArchiveBombError(UFSBaseException, ValueError):
    """Suspicious or malicious nested archive expansion detected."""
    status_code = 400
    error_code = "ERR_ARCHIVE_BOMB"
    default_message = "Suspicious archive detected. Operation aborted."


class PathTraversalError(UFSBaseException, ValueError):
    """Invalid file path or directory escape sequence."""
    status_code = 403
    error_code = "ERR_PATH_TRAVERSAL"
    default_message = "Invalid file path specified."


class SubprocessTimeoutError(UFSBaseException, TimeoutError):
    """Execution took longer than allowed timeout limit."""
    status_code = 504
    error_code = "ERR_TIMEOUT"
    default_message = "The operation took too long and was terminated."
