import re
import os
import hashlib
import unicodedata
from pathlib import Path
from typing import Union, Iterable, Optional
from app.config import settings

# Characters not allowed in filenames
DANGEROUS_CHARS_REGEX = re.compile(r'[\\/*?:"<>|]')
# Windows reserved filenames (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
WINDOWS_RESERVED_REGEX = re.compile(r'^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$', re.IGNORECASE)

def sanitize_filename(filename: str) -> str:
    """
    Sanitizes an incoming user filename:
    - Normalizes unicode (NFC)
    - Strips leading/trailing whitespace and dots
    - Removes null bytes and control characters
    - Replaces dangerous characters with underscores
    - Prevents directory traversal tricks ('..')
    - Guards against Windows reserved device names (CON, NUL, etc.)
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
    while ".." in filename:
        filename = filename.replace("..", "_")
    
    # Strip leading/trailing dots/spaces
    filename = filename.strip(". ")
    
    # Check Windows reserved device names
    if WINDOWS_RESERVED_REGEX.match(filename):
        filename = f"_{filename}"
        
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

def sanitize_format(format_str: Optional[str], allowed_formats: set[str], default_format: str) -> str:
    """
    Validates and cleans target file format strings against an allowlist,
    strictly blocking path traversal sequences or illegal extensions.
    """
    if not format_str:
        return default_format
    cleaned = str(format_str).lower().strip().lstrip(".")
    # Remove any directory separators or path traversal characters
    cleaned = re.sub(r'[^a-z0-9_]', '', cleaned)
    if cleaned in allowed_formats:
        return cleaned
    return default_format

def validate_safe_path(target_path: Union[str, Path], allowed_root: Union[str, Path, Iterable[Union[str, Path]]]) -> Path:
    """
    Validates that target_path strictly resolves within one of the allowed_roots.
    Raises PathTraversalError if path traversal is detected.
    """
    target = Path(target_path).resolve()
    
    if isinstance(allowed_root, (str, Path)):
        roots = [Path(allowed_root).resolve()]
    else:
        roots = [Path(r).resolve() for r in allowed_root]
        
    for root in roots:
        try:
            target.relative_to(root)
            return target
        except ValueError:
            continue
            
    from app.exceptions import PathTraversalError
    raise PathTraversalError(f"Path traversal detected! Path '{target}' is outside allowed root(s).")

def calculate_sha256(file_path: Union[str, Path], chunk_size: int = 65536) -> str:
    """Calculates SHA-256 hash of a file efficiently using streaming chunks."""
    p = Path(file_path).resolve()
    if not p.exists() or not p.is_file():
        raise FileNotFoundError(f"File '{p}' does not exist or is not a regular file.")
        
    sha256 = hashlib.sha256()
    with open(p, "rb") as f:
        while chunk := f.read(chunk_size):
            sha256.update(chunk)
    return sha256.hexdigest()

