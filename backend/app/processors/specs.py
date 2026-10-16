from typing import Dict, Any, List

OPERATION_SPECS: Dict[str, Dict[str, Any]] = {
    # ------------------- IMAGE OPERATIONS -------------------
    "image_convert": {
        "id": "image_convert",
        "name": "Convert Image",
        "category": "image",
        "engine": "imagemagick",
        "description": "Convert image format to WebP, PNG, JPG, AVIF, TIFF, etc.",
        "accepts": {
            "categories": ["image"],
            "formats": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp", ".avif", ".svg", ".heic", ".heif", ".psd", ".ico"],
            "directory": True,
        },
        "produces": {
            "category": "image",
            "format_from_param": "format",
            "directory": True,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["webp", "png", "jpg", "avif", "tiff", "bmp", "gif"], "default": "webp", "description": "Target image output format"},
            {"name": "quality", "type": "number", "default": 85, "min": 10, "max": 100, "description": "Compression quality (higher = sharper, larger file)"},
        ],
        "batch_capable": True,
    },
    "image_resize": {
        "id": "image_resize",
        "name": "Resize Image",
        "category": "image",
        "engine": "imagemagick",
        "description": "Scale image dimensions",
        "accepts": {
            "categories": ["image"],
            "formats": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp", ".avif"],
            "directory": True,
        },
        "produces": {
            "category": "image",
            "directory": True,
        },
        "parameters": [
            {"name": "width", "type": "number", "default": 1920, "min": 16, "max": 8192, "description": "Target width in pixels"},
            {"name": "height", "type": "number", "default": 1080, "min": 16, "max": 8192, "description": "Target height in pixels"},
        ],
        "batch_capable": True,
    },
    "image_compress": {
        "id": "image_compress",
        "name": "Compress Image",
        "category": "image",
        "engine": "imagemagick",
        "description": "Reduce image file size with aggressive compression",
        "accepts": {
            "categories": ["image"],
            "formats": [".jpg", ".jpeg", ".png", ".webp", ".avif"],
            "directory": True,
        },
        "produces": {
            "category": "image",
            "directory": True,
        },
        "parameters": [
            {"name": "quality", "type": "number", "default": 75, "min": 10, "max": 100, "description": "Target compression quality (10-100)"},
        ],
        "batch_capable": True,
    },
    "image_grayscale": {
        "id": "image_grayscale",
        "name": "Grayscale Image",
        "category": "image",
        "engine": "imagemagick",
        "description": "Convert full-color image to monochrome grayscale",
        "accepts": {
            "categories": ["image"],
            "formats": [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"],
            "directory": True,
        },
        "produces": {
            "category": "image",
            "directory": True,
        },
        "parameters": [],
        "batch_capable": True,
    },
    "image_rotate": {
        "id": "image_rotate",
        "name": "Rotate Image",
        "category": "image",
        "engine": "imagemagick",
        "description": "Rotate image by degrees",
        "accepts": {
            "categories": ["image"],
            "formats": [".jpg", ".jpeg", ".png", ".webp"],
            "directory": True,
        },
        "produces": {
            "category": "image",
            "directory": True,
        },
        "parameters": [
            {"name": "degrees", "type": "select", "options": ["90", "180", "270"], "default": "90", "description": "Rotation angle in degrees clockwise"},
        ],
        "batch_capable": True,
    },
    "image_flip": {
        "id": "image_flip",
        "name": "Flip Image",
        "category": "image",
        "engine": "imagemagick",
        "description": "Mirror image horizontally or vertically",
        "accepts": {
            "categories": ["image"],
            "formats": [".jpg", ".jpeg", ".png", ".webp"],
            "directory": True,
        },
        "produces": {
            "category": "image",
            "directory": True,
        },
        "parameters": [
            {"name": "direction", "type": "select", "options": ["horizontal", "vertical"], "default": "horizontal", "description": "Flip axis"},
        ],
        "batch_capable": True,
    },

    # ------------------- VIDEO OPERATIONS -------------------
    "video_convert": {
        "id": "video_convert",
        "name": "Convert Video",
        "category": "video",
        "engine": "ffmpeg",
        "description": "Transcode video container and codecs",
        "accepts": {
            "categories": ["video"],
            "formats": [".mp4", ".mkv", ".avi", ".webm", ".mov", ".flv", ".wmv", ".m4v", ".3gp", ".ts", ".m2ts"],
            "directory": True,
        },
        "produces": {
            "category": "video",
            "format_from_param": "format",
            "directory": True,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["mp4", "webm", "mkv", "avi", "mov"], "default": "mp4", "description": "Output video format"},
            {"name": "crf", "type": "number", "default": 28, "min": 14, "max": 38, "description": "Constant Rate Factor (lower = higher quality)"},
            {"name": "preset", "type": "select", "options": ["ultrafast", "fast", "medium", "slow"], "default": "medium", "description": "Encoding efficiency profile"},
        ],
        "batch_capable": True,
    },
    "compress_video": {
        "id": "compress_video",
        "name": "Compress Video",
        "category": "video",
        "engine": "ffmpeg",
        "description": "Compress video bitrate and size using CRF mode",
        "accepts": {
            "categories": ["video"],
            "formats": [".mp4", ".mkv", ".avi", ".webm", ".mov"],
            "directory": True,
        },
        "produces": {
            "category": "video",
            "directory": True,
        },
        "parameters": [
            {"name": "crf", "type": "number", "default": 28, "min": 18, "max": 35, "description": "Compression CRF value"},
        ],
        "batch_capable": True,
    },
    "extract_audio": {
        "id": "extract_audio",
        "name": "Extract Audio from Video",
        "category": "video",
        "engine": "ffmpeg",
        "description": "Rip audio soundtrack from video into standalone audio file",
        "accepts": {
            "categories": ["video"],
            "formats": [".mp4", ".mkv", ".avi", ".webm", ".mov", ".flv"],
            "directory": True,
        },
        "produces": {
            "category": "audio",
            "format_from_param": "format",
            "directory": True,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["mp3", "aac", "wav", "flac", "ogg"], "default": "mp3", "description": "Audio output format"},
            {"name": "bitrate", "type": "select", "options": ["128", "192", "256", "320"], "default": "192", "description": "Audio bitrate in kbps"},
        ],
        "batch_capable": True,
    },
    "remove_audio": {
        "id": "remove_audio",
        "name": "Mute / Strip Audio",
        "category": "video",
        "engine": "ffmpeg",
        "description": "Remove all audio streams from video container",
        "accepts": {
            "categories": ["video"],
            "formats": [".mp4", ".mkv", ".avi", ".webm", ".mov"],
            "directory": True,
        },
        "produces": {
            "category": "video",
            "directory": True,
        },
        "parameters": [],
        "batch_capable": True,
    },
    "video_concat": {
        "id": "video_concat",
        "name": "Concatenate Videos",
        "category": "video",
        "engine": "ffmpeg",
        "description": "Merge multiple video clips from an archive/folder into a single seamless video",
        "accepts": {
            "categories": ["video"],
            "formats": [".mp4", ".mkv", ".webm", ".avi", ".mov"],
            "directory": True,
        },
        "produces": {
            "category": "video",
            "format": ".mp4",
            "directory": False,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["mp4", "mkv", "webm"], "default": "mp4", "description": "Target container"},
        ],
        "batch_capable": False,
    },

    # ------------------- AUDIO OPERATIONS -------------------
    "audio_convert": {
        "id": "audio_convert",
        "name": "Convert Audio",
        "category": "audio",
        "engine": "ffmpeg",
        "description": "Transcode audio stream into target codec and container",
        "accepts": {
            "categories": ["audio"],
            "formats": [".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a", ".opus", ".aiff"],
            "directory": True,
        },
        "produces": {
            "category": "audio",
            "format_from_param": "format",
            "directory": True,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["mp3", "wav", "flac", "aac", "ogg"], "default": "mp3", "description": "Target audio format"},
            {"name": "bitrate", "type": "select", "options": ["128", "192", "256", "320"], "default": "192", "description": "Bitrate in kbps"},
        ],
        "batch_capable": True,
    },
    "audio_normalize": {
        "id": "audio_normalize",
        "name": "Normalize Audio Volume",
        "category": "audio",
        "engine": "ffmpeg",
        "description": "Standardize perceived audio loudness using EBU R128 standard",
        "accepts": {
            "categories": ["audio"],
            "formats": [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"],
            "directory": True,
        },
        "produces": {
            "category": "audio",
            "directory": True,
        },
        "parameters": [],
        "batch_capable": True,
    },
    "audio_merge": {
        "id": "audio_merge",
        "name": "Merge Audio Files",
        "category": "audio",
        "engine": "ffmpeg",
        "description": "Concatenate multiple audio tracks into a single sequential audio file",
        "accepts": {
            "categories": ["audio"],
            "formats": [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"],
            "directory": True,
        },
        "produces": {
            "category": "audio",
            "format": ".mp3",
            "directory": False,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["mp3", "wav", "flac", "aac"], "default": "mp3", "description": "Output audio format"},
        ],
        "batch_capable": False,
    },

    # ------------------- ARCHIVE OPERATIONS -------------------
    "archive_extract": {
        "id": "archive_extract",
        "name": "Extract Archive",
        "category": "archive",
        "engine": "7z",
        "description": "Unpack archive contents into directory for downstream batch processing",
        "accepts": {
            "categories": ["archive"],
            "formats": [".zip", ".7z", ".rar", ".tar", ".gz", ".bz2", ".xz", ".cbz", ".cbr", ".tar.gz", ".tgz"],
            "directory": False,
        },
        "produces": {
            "category": "directory",
            "format": "directory",
            "directory": False,
        },
        "parameters": [
            {"name": "password", "type": "text", "default": "", "description": "Decryption password if archive is locked"},
        ],
        "batch_capable": False,
    },
    "archive_create": {
        "id": "archive_create",
        "name": "Create Archive",
        "category": "archive",
        "engine": "7z",
        "description": "Compress input file or entire directory into a ZIP/7Z archive package",
        "accepts": {
            "categories": ["directory", "image", "video", "audio", "document", "text", "archive", "spreadsheet"],
            "formats": [],
            "directory": True,
        },
        "produces": {
            "category": "archive",
            "format_from_param": "format",
            "directory": False,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["zip", "7z"], "default": "zip", "description": "Archive compression format"},
            {"name": "password", "type": "text", "default": "", "description": "Optional archive encryption password"},
        ],
        "batch_capable": False,
    },
    "archive_list": {
        "id": "archive_list",
        "name": "List Archive Manifest",
        "category": "archive",
        "engine": "7z",
        "description": "Extract structured text manifest listing all files inside archive",
        "accepts": {
            "categories": ["archive"],
            "formats": [".zip", ".7z", ".rar", ".tar", ".gz", ".cbz", ".cbr"],
            "directory": False,
        },
        "produces": {
            "category": "text",
            "format": ".txt",
            "directory": False,
        },
        "parameters": [],
        "batch_capable": False,
    },

    # ------------------- PDF OPERATIONS -------------------
    "images_to_pdf": {
        "id": "images_to_pdf",
        "name": "Merge Images to PDF Book",
        "category": "pdf",
        "engine": "imagemagick",
        "description": "Combine multiple sorted images into a single consolidated PDF document",
        "accepts": {
            "categories": ["image"],
            "formats": [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".avif", ".gif"],
            "directory": True,
        },
        "produces": {
            "category": "pdf",
            "format": ".pdf",
            "directory": False,
        },
        "parameters": [
            {"name": "quality", "type": "number", "default": 85, "min": 20, "max": 100, "description": "JPEG compression quality inside PDF"},
            {"name": "compress", "type": "select", "options": ["jpeg", "deflate"], "default": "jpeg", "description": "Internal PDF compression algorithm"},
        ],
        "batch_capable": False,
    },
    "archive_to_pdf": {
        "id": "archive_to_pdf",
        "name": "Archive to Single PDF (Comic/Manga)",
        "category": "pdf",
        "engine": "imagemagick",
        "description": "Directly extract scanned images from ZIP/CBZ and compile into PDF book",
        "accepts": {
            "categories": ["archive"],
            "formats": [".zip", ".cbz", ".7z", ".rar", ".cbr", ".tar"],
            "directory": False,
        },
        "produces": {
            "category": "pdf",
            "format": ".pdf",
            "directory": False,
        },
        "parameters": [
            {"name": "quality", "type": "number", "default": 85, "min": 20, "max": 100, "description": "Compression quality for images"},
            {"name": "compress", "type": "select", "options": ["jpeg", "deflate"], "default": "jpeg", "description": "Compression engine"},
        ],
        "batch_capable": False,
    },
    "pdf_merge": {
        "id": "pdf_merge",
        "name": "Merge PDF Documents",
        "category": "pdf",
        "engine": "ghostscript",
        "description": "Combine multiple PDF documents from folder or batch into one sequential PDF",
        "accepts": {
            "categories": ["pdf"],
            "formats": [".pdf"],
            "directory": True,
        },
        "produces": {
            "category": "pdf",
            "format": ".pdf",
            "directory": False,
        },
        "parameters": [],
        "batch_capable": False,
    },
    "pdf_split": {
        "id": "pdf_split",
        "name": "Split PDF Pages",
        "category": "pdf",
        "engine": "poppler",
        "description": "Extract individual PDF pages or burst into single-page PDFs",
        "accepts": {
            "categories": ["pdf"],
            "formats": [".pdf"],
            "directory": False,
        },
        "produces": {
            "category": "directory",
            "format": "directory",
            "directory": False,
        },
        "parameters": [],
        "batch_capable": False,
    },
    "pdf_compress": {
        "id": "pdf_compress",
        "name": "Compress PDF",
        "category": "pdf",
        "engine": "ghostscript",
        "description": "Optimize and downsample PDF for web or email sharing",
        "accepts": {
            "categories": ["pdf"],
            "formats": [".pdf"],
            "directory": True,
        },
        "produces": {
            "category": "pdf",
            "directory": True,
        },
        "parameters": [
            {"name": "quality", "type": "select", "options": ["ebook", "screen", "printer", "prepress"], "default": "ebook", "description": "Target PDF rendering quality preset"},
        ],
        "batch_capable": True,
    },
    "pdf_to_images": {
        "id": "pdf_to_images",
        "name": "PDF to Images",
        "category": "pdf",
        "engine": "poppler",
        "description": "Render every page of PDF into standalone high-resolution images",
        "accepts": {
            "categories": ["pdf"],
            "formats": [".pdf"],
            "directory": False,
        },
        "produces": {
            "category": "directory",
            "format": "directory",
            "directory": False,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["png", "jpeg", "webp"], "default": "png", "description": "Image rendering format"},
            {"name": "dpi", "type": "number", "default": 150, "min": 72, "max": 600, "description": "Rendering resolution DPI"},
        ],
        "batch_capable": False,
    },
    "pdf_to_text": {
        "id": "pdf_to_text",
        "name": "Extract PDF Text",
        "category": "pdf",
        "engine": "poppler",
        "description": "Extract selectable textual content from PDF into plain text",
        "accepts": {
            "categories": ["pdf"],
            "formats": [".pdf"],
            "directory": True,
        },
        "produces": {
            "category": "text",
            "format": ".txt",
            "directory": True,
        },
        "parameters": [],
        "batch_capable": True,
    },

    # ------------------- DOCUMENT & OFFICE OPERATIONS -------------------
    "document_convert": {
        "id": "document_convert",
        "name": "Convert Document",
        "category": "document",
        "engine": "libreoffice",
        "description": "Convert Word and office documents to PDF, DOCX, ODT, HTML, TXT",
        "accepts": {
            "categories": ["document", "text"],
            "formats": [".docx", ".doc", ".odt", ".rtf", ".txt", ".html", ".htm", ".epub", ".md"],
            "directory": True,
        },
        "produces": {
            "category": "document",
            "format_from_param": "format",
            "directory": True,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["pdf", "docx", "odt", "txt", "html"], "default": "pdf", "description": "Document target format"},
        ],
        "batch_capable": True,
    },
    "spreadsheet_convert": {
        "id": "spreadsheet_convert",
        "name": "Convert Spreadsheet",
        "category": "spreadsheet",
        "engine": "libreoffice",
        "description": "Convert Excel and spreadsheet documents to CSV, PDF, XLSX, ODS",
        "accepts": {
            "categories": ["spreadsheet"],
            "formats": [".xlsx", ".xls", ".ods", ".csv", ".tsv"],
            "directory": True,
        },
        "produces": {
            "category": "spreadsheet",
            "format_from_param": "format",
            "directory": True,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["csv", "pdf", "xlsx", "ods"], "default": "csv", "description": "Spreadsheet target format"},
        ],
        "batch_capable": True,
    },
    "presentation_convert": {
        "id": "presentation_convert",
        "name": "Convert Presentation",
        "category": "presentation",
        "engine": "libreoffice",
        "description": "Convert PowerPoint and slide decks to PDF slides or PPTX",
        "accepts": {
            "categories": ["presentation"],
            "formats": [".pptx", ".ppt", ".odp"],
            "directory": True,
        },
        "produces": {
            "category": "presentation",
            "format_from_param": "format",
            "directory": True,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["pdf", "pptx", "odp"], "default": "pdf", "description": "Slides target format"},
        ],
        "batch_capable": True,
    },
    "markdown_convert": {
        "id": "markdown_convert",
        "name": "Convert Markdown",
        "category": "text",
        "engine": "pandoc",
        "description": "Compile markdown formatting into semantic HTML, PDF, or DOCX",
        "accepts": {
            "categories": ["text"],
            "formats": [".md", ".markdown", ".txt"],
            "directory": True,
        },
        "produces": {
            "category": "document",
            "format_from_param": "format",
            "directory": True,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["html", "pdf", "docx", "txt"], "default": "html", "description": "Target markup/document format"},
        ],
        "batch_capable": True,
    },
    "ebook_convert": {
        "id": "ebook_convert",
        "name": "Convert eBook (EPUB)",
        "category": "document",
        "engine": "pandoc",
        "description": "Convert EPUB eBook to PDF, DOCX, HTML, or Markdown",
        "accepts": {
            "categories": ["document"],
            "formats": [".epub"],
            "directory": True,
        },
        "produces": {
            "category": "document",
            "format_from_param": "format",
            "directory": True,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["pdf", "docx", "html", "md", "txt"], "default": "pdf", "description": "Output format for eBook"},
        ],
        "batch_capable": True,
    },

    # ------------------- OCR OPERATIONS -------------------
    "ocr_image": {
        "id": "ocr_image",
        "name": "OCR Extract Text",
        "category": "ocr",
        "engine": "tesseract",
        "description": "Recognize optical character glyphs and transcribe into text or searchable PDF",
        "accepts": {
            "categories": ["image", "pdf"],
            "formats": [".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".pdf", ".webp"],
            "directory": True,
        },
        "produces": {
            "category": "text",
            "format_from_param": "format",
            "directory": True,
        },
        "parameters": [
            {"name": "language", "type": "select", "options": ["eng", "deu", "fra", "spa", "ita", "jpn", "chi_sim"], "default": "eng", "description": "OCR recognition language"},
            {"name": "format", "type": "select", "options": ["txt", "pdf", "tsv"], "default": "txt", "description": "Extracted format"},
        ],
        "batch_capable": True,
    },

    # ------------------- METADATA & HASH OPERATIONS -------------------
    "strip_metadata": {
        "id": "strip_metadata",
        "name": "Strip Metadata (Privacy Clean)",
        "category": "metadata",
        "engine": "imagemagick",
        "description": "Purge camera EXIF, GPS location coordinates, and author tags",
        "accepts": {
            "categories": ["image", "video", "audio", "pdf"],
            "formats": [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".mkv", ".mp3", ".wav", ".pdf"],
            "directory": True,
        },
        "produces": {
            "category": "same",
            "directory": True,
        },
        "parameters": [],
        "batch_capable": True,
    },
    "file_hash": {
        "id": "file_hash",
        "name": "Calculate Checksum (Hash)",
        "category": "hash",
        "engine": "system",
        "description": "Generate cryptographic SHA-256 and MD5 integrity verification manifests",
        "accepts": {
            "categories": ["image", "video", "audio", "pdf", "archive", "document", "spreadsheet", "text", "data"],
            "formats": [],
            "directory": True,
        },
        "produces": {
            "category": "text",
            "format": ".txt",
            "directory": True,
        },
        "parameters": [
            {"name": "algorithm", "type": "select", "options": ["sha256", "md5", "sha1", "crc32"], "default": "sha256", "description": "Cryptographic digest algorithm"},
        ],
        "batch_capable": True,
    },
}

