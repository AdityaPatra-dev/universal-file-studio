# Universal File Studio: Desktop Packaging & Multi-Platform Distribution Guide

Universal File Studio is architected for dual-tier operation:
1. **Mobile Standalone**: Self-contained on-device Android engine via Capacitor + FFmpegKit Full GPL + Tesseract 5 + Apache PDFBox + Commons Compress LZMA2.
2. **Desktop & Local Server**: Python FastAPI backend with full system CLI engines (`ffmpeg`, `libreoffice`, `imagemagick`, `tesseract`, `qpdf`, `poppler`, `ghostscript`, `7z`, `pandoc`) paired with the modern React 18 single-page application.

---

## 1. Local Desktop Launchers (Instant 1-Click Run)

### 🪟 Windows (Windows 10 / 11)
Launch by double-clicking [`start.bat`](file:///home/adityapatra/Documents/GitHub/universal-file-studio/start.bat):
1. Automatically verifies or creates Python virtual environment (`.venv`).
2. Installs backend dependencies from `backend/requirements.txt`.
3. Discovers local network IPv4 address.
4. Starts Uvicorn server hosting the API and static React frontend at `http://localhost:8000`.
5. Accessible across your local Wi-Fi from any smartphone or tablet browser.

### 🐧 Linux & 🍏 macOS
Launch via [`start.sh`](file:///home/adityapatra/Documents/GitHub/universal-file-studio/start.sh):
```bash
chmod +x start.sh scripts/setup.sh
./start.sh
```

---

## 2. Docker Containerized Deployment

Run completely isolated in Docker with all 9 CLI engines pre-installed:

```bash
# Build and run container in detached mode
docker-compose up -d --build

# Open the studio in your browser:
# http://localhost:8000
```

The container mounts local directories `./storage` and `./test_samples` for persistent storage and zero data loss between container restarts.

---

## 3. Desktop Native Packaging Options

### Option A: PyInstaller Single-Directory Bundle (Windows / Linux / macOS)
To produce a portable folder that runs without requiring Python to be installed:
```bash
pip install pyinstaller pywebview
pyinstaller --name "UniversalFileStudio" \
  --add-data "frontend/dist:frontend/dist" \
  --add-data "backend/app:app" \
  --icon "frontend/public/favicon.ico" \
  backend/app/main.py
```

### Option B: Tauri v2 Desktop Wrapper
A lightweight Rust-based Tauri shell wrapping `frontend/dist` with native WebView2 (Windows), WebKit (macOS), and WebKitGTK (Linux):
```bash
# In frontend directory
npm install -D @tauri-apps/cli
npx tauri init
npx tauri build
```
Produces:
* **Windows**: `UniversalFileStudio_x64.msi` / `UniversalFileStudio_x64.exe` (~15 MB)
* **Linux**: `universal-file-studio_amd64.deb` / `.AppImage` (~25 MB)
* **macOS**: `UniversalFileStudio.dmg` (~20 MB)

---

## 4. Mobile Releases Summary

| Platform | Format | Output Location | Target |
| :--- | :--- | :--- | :--- |
| **Android APK** | `.apk` (Universal Debug/Release) | `universal-file-studio.apk` | Sideloading, GitHub Releases, Direct Download |
| **Android App Bundle** | `.aab` | `universal-file-studio.aab` | Google Play Store Distribution |
| **Web PWA** | Progressive Web App | `frontend/dist/` | Any modern mobile or desktop browser (offline capable) |
