import json
import asyncio
import mimetypes
from pathlib import Path
from typing import TypedDict, Dict, Any, Optional

class FileInfo(TypedDict):
    path: str
    exists: bool
    size_bytes: int
    mime_type: str
    category: str  # video, audio, image, pdf, archive, document, spreadsheet, data, text, unknown
    extension: str
    detected_format: Optional[str]
    width: Optional[int]
    height: Optional[int]
    duration_seconds: Optional[float]
    codec_info: Optional[Dict[str, Any]]
    metadata: Dict[str, Any]

class FileDetector:
    CATEGORIES = {
        "video": ["video/"],
        "audio": ["audio/"],
        "image": ["image/"],
        "pdf": ["application/pdf"],
        "archive": [
            "application/zip", "application/x-7z-compressed", "application/gzip", 
            "application/x-tar", "application/x-bzip2", "application/x-xz", "application/x-rar"
        ],
        "document": [
            "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
            "application/vnd.oasis.opendocument.text", 
            "application/rtf", 
            "application/epub+zip"
        ],
        "spreadsheet": [
            "application/vnd.ms-excel", 
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
            "application/vnd.oasis.opendocument.spreadsheet", 
            "text/csv"
        ],
        "presentation": [
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.oasis.opendocument.presentation"
        ],
        "data": ["application/json", "application/xml", "text/yaml", "application/toml"],
        "text": ["text/plain", "text/markdown", "text/html"]
    }

    EXTENSION_MAP = {
        "mp4": "video", "mkv": "video", "webm": "video", "mov": "video", "avi": "video", "flv": "video", "wmv": "video",
        "mp3": "audio", "wav": "audio", "flac": "audio", "aac": "audio", "ogg": "audio", "m4a": "audio", "opus": "audio",
        "jpg": "image", "jpeg": "image", "png": "image", "webp": "image", "gif": "image", "avif": "image", "bmp": "image", "tiff": "image", "svg": "image",
        "pdf": "pdf",
        "zip": "archive", "7z": "archive", "tar": "archive", "gz": "archive", "bz2": "archive", "xz": "archive", "rar": "archive",
        "doc": "document", "docx": "document", "odt": "document", "rtf": "document", "epub": "document",
        "xls": "spreadsheet", "xlsx": "spreadsheet", "ods": "spreadsheet", "csv": "spreadsheet",
        "ppt": "presentation", "pptx": "presentation", "odp": "presentation",
        "json": "data", "xml": "data", "yaml": "data", "yml": "data", "toml": "data",
        "txt": "text", "md": "text", "html": "text"
    }

    async def detect(self, file_path: str) -> FileInfo:
        path = Path(file_path)
        exists = path.exists()
        size = path.stat().st_size if exists else 0
        ext = path.suffix.lower().lstrip('.')

        info: FileInfo = {
            "path": str(path),
            "exists": exists,
            "size_bytes": size,
            "mime_type": "application/octet-stream",
            "category": "unknown",
            "extension": ext,
            "detected_format": ext.upper() if ext else None,
            "width": None,
            "height": None,
            "duration_seconds": None,
            "codec_info": None,
            "metadata": {}
        }

        if not exists:
            return info

        # 1. MIME detection
        mime_type = None
        try:
            import magic
            m = magic.Magic(mime=True)
            mime_type = m.from_file(file_path)
        except Exception:
            pass

        if not mime_type:
            mime_type, _ = mimetypes.guess_type(file_path)
            
        if not mime_type:
            mime_type = "application/octet-stream"

        info["mime_type"] = mime_type

        # 2. Map MIME to category
        for cat, prefixes in self.CATEGORIES.items():
            for prefix in prefixes:
                if mime_type.startswith(prefix):
                    info["category"] = cat
                    break
            if info["category"] != "unknown":
                break

        # Fallback to extension if category is unknown or generic octet-stream
        if info["category"] == "unknown" and ext in self.EXTENSION_MAP:
            info["category"] = self.EXTENSION_MAP[ext]

        # 3. Deep metadata extraction
        if info["category"] in ["video", "audio"]:
            await self._enrich_av_metadata(file_path, info)
        elif info["category"] == "image":
            await self._enrich_image_metadata(file_path, info)
        elif info["category"] == "pdf":
            await self._enrich_pdf_metadata(file_path, info)
        elif info["category"] == "archive":
            await self._enrich_archive_metadata(file_path, info)

        return info

    async def _enrich_av_metadata(self, file_path: str, info: FileInfo):
        try:
            cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", file_path]
            proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=10)
            if proc.returncode == 0:
                data = json.loads(stdout.decode('utf-8', errors='replace'))
                meta = {}
                codec_data = {}
                if "format" in data:
                    fmt = data["format"]
                    meta["format_name"] = fmt.get("format_long_name", fmt.get("format_name"))
                    if "duration" in fmt:
                        try:
                            dur = float(fmt["duration"])
                            info["duration_seconds"] = dur
                            meta["duration"] = dur
                        except (ValueError, TypeError):
                            pass
                    if "bit_rate" in fmt:
                        meta["bitrate"] = int(fmt["bit_rate"])

                for stream in data.get("streams", []):
                    c_type = stream.get("codec_type")
                    if c_type == "video" and not info["width"]:
                        info["width"] = stream.get("width")
                        info["height"] = stream.get("height")
                        codec_data["video_codec"] = stream.get("codec_name")
                        codec_data["pix_fmt"] = stream.get("pix_fmt")
                    elif c_type == "audio" and "audio_codec" not in codec_data:
                        codec_data["audio_codec"] = stream.get("codec_name")
                        codec_data["sample_rate"] = stream.get("sample_rate")
                        codec_data["channels"] = stream.get("channels")

                info["codec_info"] = codec_data
                info["metadata"] = meta
        except Exception:
            pass

    async def _enrich_image_metadata(self, file_path: str, info: FileInfo):
        try:
            # Try magick identify
            cmd = ["magick", "identify", "-format", "%w|%h|%m", file_path]
            proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)
            if proc.returncode != 0:
                # Try convert
                cmd = ["convert", "-format", "%w|%h|%m", file_path, "info:"]
                proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
                stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)

            if proc.returncode == 0:
                out_str = stdout.decode('utf-8', errors='replace').strip()
                if "|" in out_str:
                    w, h, fmt = out_str.split("|", 2)
                    info["width"] = int(w)
                    info["height"] = int(h)
                    info["detected_format"] = fmt.strip()
                    info["metadata"] = {"width": int(w), "height": int(h), "format": fmt.strip()}
        except Exception:
            pass

    async def _enrich_pdf_metadata(self, file_path: str, info: FileInfo):
        try:
            cmd = ["pdfinfo", file_path]
            proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)
            if proc.returncode == 0:
                meta = {}
                for line in stdout.decode('utf-8', errors='replace').splitlines():
                    if ":" in line:
                        k, v = line.split(":", 1)
                        key = k.strip().lower()
                        val = v.strip()
                        if key == "pages":
                            meta["pages"] = int(val)
                        elif key in ["title", "author", "creator", "producer", "pdf version"]:
                            meta[key] = val
                info["metadata"] = meta
        except Exception:
            pass

    async def _enrich_archive_metadata(self, file_path: str, info: FileInfo):
        try:
            cmd = ["7z", "l", file_path]
            proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)
            if proc.returncode == 0:
                lines = stdout.decode('utf-8', errors='replace').splitlines()
                meta = {}
                for line in reversed(lines):
                    if "files" in line and "folders" in line:
                        meta["summary"] = line.strip()
                        break
                info["metadata"] = meta
        except Exception:
            pass

file_detector = FileDetector()

