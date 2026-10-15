import re
import hashlib
import unicodedata
from pathlib import Path
from typing import Union
from app.config import settings

# Characters not allowed in filenames
DANGEROUS_CHARS_REGEX = re.compile(r'[\\/*?:"<>|]')

def sanitize_filename(filename: str) -> str:
    """
    Sanitizes an incoming user filename:
    - Normalizes unicode (NFC)
    - Strips leading/trailing whitespace and dots
    - Removes null bytes and control characters
    - Replaces dangerous characters with underscores
    - Prevents directory traversal tricks ('..')
    - Enforces length limits (max 200 chars)
    """
    if not filename:
        return "unnamed_file"
        
    # Unicode normalize
    filename = unicodedata.normalize("NFC", filename)
    
    # Strip null bytes & control chars
    filename = "".join(ch for ch in filename if ord(ch) >= 32 and ord(ch) != 127)
    
    # Replace dangerous filesystem characters
    filename = DANGEROUS_CHARS_REGEX.sub("_", filename)
    
    # Remove traversal sequences
    filename = filename.replace("..", "_")
    
    # Strip leading/trailing dots/spaces
    filename = filename.strip(". ")
    
    # Fallback if empty
    if not filename:
        filename = "unnamed_file"
        
    # Limit length while keeping extension
    if len(filename) > 200:
        parts = filename.rsplit(".", 1)
        if len(parts) == 2:
            base, ext = parts
            filename = f"{base[:190]}.{ext}"
        else:
            filename = filename[:200]
            
    return filename

def validate_safe_path(target_path: Union[str, Path], allowed_root: Union[str, Path]) -> Path:
    """
    Validates that target_path strictly resolves within allowed_root.
    Raises PathTraversalError if path traversal is detected.
    """
    target = Path(target_path).resolve()
    root = Path(allowed_root).resolve()
    
    try:
        target.relative_to(root)
    except ValueError:
        from app.exceptions import PathTraversalError
        raise PathTraversalError(f"Path traversal detected! Path '{target}' is outside allowed root '{root}'.")
        
    return target

def calculate_sha256(file_path: Union[str, Path], chunk_size: int = 65536) -> str:
    """Calculates SHA-256 hash of a file efficiently using streaming chunks."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(chunk_size):
            sha256.update(chunk)
    return sha256.hexdigest()

