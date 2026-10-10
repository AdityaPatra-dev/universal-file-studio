# Universal File Studio

> **Universal Local File Processing and Conversion Studio**  
> Complete local-first, privacy-first web application for converting, compressing, extracting, analyzing, and transforming files on your own machine.

---

## 🔒 100% Local-First & Privacy Guarantee

- **No Cloud Uploads**: Files never leave your local machine (`localhost`).
- **No External APIs**: All processing is handled by native local CLI engines.
- **Controlled Storage**: Original files remain untouched; converted outputs are safely managed in `storage/outputs`.
- **Automatic Sandbox**: Safe temporary directories and automatic file tracking.

---

## ⚙️ Architecture & Tech Stack

### Backend
- **Python 3.11+ / 3.14**
- **FastAPI**: Modern, high-performance async REST API
- **SQLAlchemy 2.0 + aiosqlite**: Asynchronous SQLite database management
- **Pydantic v2**: Strict type safety and validation
- **Async Job Manager**: Background worker queue (`asyncio.Queue`) with concurrency controls
- **Engine Manager**: Dynamic discovery of host CLI engines and capabilities

### Frontend
- **React 19 / 18 + TypeScript**
- **Vite**: Lightning-fast bundler
- **Tailwind CSS**: Modern responsive dark UI
- **Lucide Icons**: Clean, consistent icon set

---

## 🛠️ Processing Engines Detected & Supported

The studio automatically detects and integrates with the following engines installed on your system:

| Engine | Primary Operations | Detected Status |
| :--- | :--- | :--- |
| **FFmpeg** | Video/audio conversion, compression, audio extraction, remuxing | Supported |
| **ImageMagick** | Image conversion, resizing, compression, format transformation | Supported |
| **7-Zip** | Archive extraction, compression (ZIP, 7Z, TAR, GZ, BZ2, XZ) | Supported |
| **Poppler** | PDF rendering, PDF info, page extraction, PDF to image | Supported |
| **Ghostscript** | PDF optimization, compression, PostScript handling | Supported |
| **LibreOffice** | Headless document conversion (DOCX, XLSX, PPTX, ODT to PDF) | Supported |
| **qpdf** | PDF encryption, structure transformation, linearization | Optional |
| **Pandoc** | Markdown, HTML, EPUB, LaTeX markup conversion | Optional |
| **Tesseract** | Optical Character Recognition (OCR) | Optional |

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have:
- Python 3.11 or higher
- Node.js 18 or higher

### 2. Setup & Installation
Run the automated installation script:
```bash
./install.sh
```
This will:
1. Create the isolated Python virtual environment `.venv`
2. Install backend dependencies from `backend/requirements.txt`
3. Install frontend dependencies and compile the production web app
4. Initialize SQLite database and scan local engines

### 3. Start the Application
Launch the studio with:
```bash
./start.sh
```
Open your browser at:
👉 **`http://localhost:8000`**

To explore interactive Swagger API documentation, visit:
👉 **`http://localhost:8000/docs`**

---

## 🧪 Running Tests

To run the backend test suite:
```bash
source .venv/bin/activate
PYTHONPATH=backend pytest backend/tests/test_api.py -v
```

---

## 📁 Project Directory Structure

```text
universal-file-studio/
├── frontend/                     # React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # Header, Sidebar
│   │   │   ├── files/            # FileDropZone, FileList, FileProcessModal
│   │   │   ├── jobs/             # JobList, JobCard, Progress
│   │   │   └── system/           # EngineManager, Diagnostics, Settings
│   │   ├── services/             # api.ts client
│   │   ├── types/                # TypeScript interfaces
│   │   └── utils/                # formatters, helpers
│   └── dist/                     # Compiled SPA assets
├── backend/                      # FastAPI async backend
│   ├── app/
│   │   ├── api/routes/           # files, jobs, operations, system
│   │   ├── detection/            # Deep file & metadata detector
│   │   ├── engines/              # Engine detectors & Capability Registry
│   │   ├── jobs/                 # Async JobManager & background workers
│   │   ├── models/               # SQLAlchemy async SQLite models
│   │   ├── schemas/              # Pydantic v2 validation models
│   │   ├── security/             # Path validation & sanitization
│   │   ├── config.py             # Settings & storage paths
│   │   └── database.py           # Async SQLite engine
│   └── tests/                    # Pytest test suite
├── storage/                      # Local data folders
│   ├── uploads/                  # Uploaded files
│   ├── outputs/                  # Converted outputs
│   └── temp/                     # Temporary processing workspace
├── scripts/                      # setup.sh, run_dev.sh
├── install.sh                    # Installation entry point
└── start.sh                      # Launch script
```

---

## 📋 Phase 1 Implementation Summary

✅ **Complete Project Scaffold**: Modular backend and frontend codebase.  
✅ **Dynamic Engine Discovery**: Scans and registers FFmpeg, ImageMagick, 7-Zip, Poppler, Ghostscript, LibreOffice.  
✅ **Deep File Detection**: MIME detection, magic bytes, dimensions, audio/video codecs, duration, page count.  
✅ **Asynchronous Job Engine**: Background queue with concurrency controls, status tracking (`pending`, `queued`, `running`, `completed`, `failed`, `cancelled`), and command logs.  
✅ **Interactive Local Web GUI**: File dropzone (with folder upload support), file manager, operation modal, jobs monitor, engine manager, and hardware diagnostics.  
✅ **100% Verified Tests**: All API endpoints and lifecycle workflows verified with automated tests.
