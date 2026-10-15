# Universal File Studio (UFS)

> **Universal Local File Processing, Conversion & Multi-Step Pipeline Studio**  
> Complete local-first, privacy-first web application and CLI toolkit for converting, compressing, extracting, analyzing, sanitizing, and transforming files on your own machine.

---

## 🔒 100% Local-First & Privacy Guarantee

- **No Cloud Dependencies**: Files never leave your local machine (`localhost`).
- **Zero External APIs**: All processing is handled by native local CLI engines.
- **Controlled Storage**: Original files remain untouched; converted outputs are safely managed in `storage/outputs`.
- **Automatic Sandbox & Protection**: Safe temporary workspaces, anti-archive-bomb guards, and strict path traversal protection.

---

## ⚙️ Architecture & Tech Stack

### Backend
- **Python 3.11+ / 3.14**
- **FastAPI**: Modern, high-performance async REST API with auto-generated OpenAPI 3.1 docs
- **WebSockets**: Bi-directional real-time progress streaming and lifecycle event telemetry
- **SQLAlchemy 2.0 + aiosqlite**: Asynchronous SQLite database management
- **Pydantic v2**: Strict type safety, input validation, and settings management
- **Async Job Manager**: Background worker queue (`asyncio.Queue`) with concurrency controls
- **Engine Manager**: Dynamic discovery and capability introspection of host CLI tools
- **Standalone CLI (`ufs`)**: Full terminal interface powered by Click

### Frontend
- **React 19 + TypeScript**
- **Vite**: Lightning-fast production bundler
- **Tailwind CSS**: Modern responsive dark UI
- **Lucide Icons**: Clean, consistent icon set
- **Real-Time WebSocket Client**: Instant reactive progress updates without polling latency

---

## 🛠️ Processing Engines Supported

Universal File Studio automatically discovers and interfaces with local engines:

| Engine | Operations | Auto-Detected |
| :--- | :--- | :--- |
| **FFmpeg** | Video/audio conversion, compression, audio extraction, remuxing | ✅ |
| **ImageMagick** | Image conversion, resizing, compression, EXIF stripping | ✅ |
| **7-Zip** | Archive creation & extraction (ZIP, 7Z, TAR, GZ, BZ2, XZ) | ✅ |
| **Poppler** | PDF rendering, PDF info, page extraction, PDF to image | ✅ |
| **Ghostscript** | PDF optimization, compression, PostScript processing | ✅ |
| **LibreOffice** | Isolated profile document conversion (DOCX, XLSX, PPTX to PDF) | ✅ |
| **qpdf** | PDF encryption, linearizing, structure manipulation | Optional |
| **Pandoc** | Markdown, HTML, EPUB, LaTeX markup conversion | Optional / Internal fallback |
| **Tesseract** | Optical Character Recognition (OCR) text extraction | Optional |

---

## 🗺️ Completed Implementation Roadmap (Phases 1 – 7)

- **Phase 1: Foundation (Oct 9–10)**: Core models, SQLite DB, deep file detector, async job manager, initial React GUI.
- **Phase 2: Core Engines (Oct 10)**: Typed wrappers for FFmpeg, ImageMagick, 7-Zip, Poppler, Ghostscript, LibreOffice.
- **Phase 3: Operations & Batch (Oct 11)**: Media processors, multi-file batch conversions, bulk compression, ZIP archiving, operation presets.
- **Phase 4: Documents (Oct 12)**: Isolated LibreOffice user profiles, Pandoc & native markdown parsers, document conversion pipeline.
- **Phase 5: Advanced Inspection (Oct 13)**: Privacy metadata stripping, streaming cryptographic hashes (SHA-256, MD5, SHA-1, CRC-32), local OCR text extraction, Inspector modal.
- **Phase 6: Multi-Step Pipelines (Oct 14)**: Sequential workflow chaining (Step $N \rightarrow N+1$), intermediate workspace isolation, visual node flowchart UI, execution tracking.
- **Phase 7: Developer Hub & CLI (Oct 15)**: Standalone `ufs` CLI binary, WebSocket real-time event broadcasting, Swagger UI & ReDoc documentation, Developer Hub.

---

## 💻 Standalone Developer CLI (`ufs`)

Universal File Studio includes a full-featured terminal CLI executable at `./ufs`:

```bash
# Check server health, storage quotas, and detected engines
./ufs status

# Inspect all detected local binary engines, versions, and paths
./ufs engines

# Convert a file directly to target format
./ufs convert document.md -t html
./ufs convert video.mp4 -t webm

# Compute streaming cryptographic checksums (SHA-256, MD5, SHA-1, CRC-32)
./ufs hash file.zip

# Sanitize privacy metadata and EXIF tags
./ufs strip-metadata photo.jpg

# Extract text using OCR
./ufs ocr scan.png -f text -l eng

# List available multi-step pipeline presets
./ufs pipeline list

# Execute a sequential pipeline chain
./ufs pipeline run 1 input.mp4

# Launch the UFS web server
./ufs serve --host 127.0.0.1 --port 8000
```

---

## 🚀 Quick Start

### 1. Automated Setup
```bash
./install.sh
```
This script will:
1. Create Python virtual environment `.venv`
2. Install all backend dependencies
3. Install frontend dependencies and build the production bundle
4. Initialize the SQLite database and scan all local engines

### 2. Start Application
```bash
./start.sh
```
Open your browser at:
- Web Application: **`http://localhost:8000`**
- Interactive Swagger UI: **`http://localhost:8000/docs`**
- ReDoc Documentation: **`http://localhost:8000/redoc`**
- Real-Time WebSocket Stream: **`ws://localhost:8000/ws`**

---

## 🧪 Automated Test Suite

Run the full pytest suite (41 unit and integration tests):
```bash
source .venv/bin/activate
PYTHONPATH=backend pytest backend/tests/ -v
```

All 41 tests pass cleanly across engines, processors, documents, pipelines, websockets, and CLI runners.

---

## 📁 Directory Structure

```text
universal-file-studio/
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # Header, Sidebar
│   │   │   ├── files/            # FileDropZone, FileList, FileInspectorModal
│   │   │   ├── jobs/             # JobList, JobCard
│   │   │   ├── pipeline/         # PipelineEditor (Visual Flowchart Nodes)
│   │   │   ├── developer/        # DeveloperHub (Swagger, CLI Builder, WS Stream)
│   │   │   └── system/           # EngineManager, Diagnostics, Settings
│   │   ├── services/             # api.ts (REST client), socket.ts (WebSocket client)
│   │   ├── types/                # TypeScript interfaces
│   │   └── App.tsx               # Main SPA router and view coordinator
│   └── dist/                     # Compiled SPA assets
├── backend/                      # FastAPI async backend
│   ├── app/
│   │   ├── api/routes/           # files, jobs, operations, batch, presets, pipelines, websocket, developer
│   │   ├── cli/                  # ufs CLI implementation (Click)
│   │   ├── detection/            # Deep file & metadata detector
│   │   ├── engines/              # Wrappers & Capability Registry
│   │   ├── jobs/                 # Async JobManager & background workers
│   │   ├── models/               # SQLAlchemy SQLite models
│   │   ├── processors/           # Media, document, OCR, hash, metadata & pipeline runner
│   │   ├── schemas/              # Pydantic v2 validation models
│   │   ├── security/             # Path validation & sanitization
│   │   ├── websocket/            # ConnectionManager & broadcast engine
│   │   ├── exceptions.py         # Standardized error codes (Section 26)
│   │   ├── config.py             # Settings & storage paths
│   │   └── database.py           # Async SQLite engine
│   ├── tests/                    # 41 unit and integration tests
│   └── cli.py                    # Backend CLI runner
├── storage/                      # Local data folders
│   ├── uploads/                  # Uploaded files
│   ├── outputs/                  # Converted outputs
│   └── temp/                     # Temporary processing workspace
├── ufs                           # Standalone root CLI executable
├── install.sh                    # Installation entry point
└── start.sh                      # Launch script
```
