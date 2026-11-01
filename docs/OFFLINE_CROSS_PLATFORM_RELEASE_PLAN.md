# Universal File Studio: 100% Offline Multi-Platform Architecture & Release Plan

> **Goal**: Enable full offline desktop-grade media and document processing directly on Android smartphones and tablets (with zero cloud or laptop dependencies), automate multi-flavor APK releases for GitHub, and package cross-platform releases for Windows, macOS, Linux, and iOS/iPadOS.

---

## 1. Executive Summary & Strategy

Currently, Universal File Studio uses a client-server architecture:
* **Desktop / Hub**: Runs full native binaries (`ffmpeg`, `libreoffice`, `imagemagick`, `tesseract`, `7z`).
* **Mobile (Current)**: Runs lightweight JavaScript engines (`pdf-lib`, `canvas`, `JSZip`, Web Audio) when disconnected from the hub.

To fulfill the requirement of **"running all features directly on the phone 100% offline, regardless of conversion time"**, we will transition the Android application to embed compiled native C++ binaries (`.so`) directly into the APK via the **Android NDK (Native Development Kit)** and native bridge plugins.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ANDROID 100% OFFLINE ARCHITECTURE                    │
└────────────────────────────────────────────────────────────────────────┘

    ┌───────────────────────────────────────────────────────────────┐
    │           React 18 + TypeScript + Tailwind Frontend           │
    │        (Studio Navigation, Parameter Modals, Job Queue)       │
    └───────────────────────────────┬───────────────────────────────┘
                                    │ (Capacitor Plugin Calls)
                                    ▼
    ┌───────────────────────────────────────────────────────────────┐
    │                Capacitor Native Android Bridge                │
    │              (Background Worker & Thread Pool)                │
    └───────┬──────────────┬──────────────┬──────────────┬──────────┘
            │              │              │              │
            ▼              ▼              ▼              ▼
     ┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐
     │ FFmpeg-Kit  ││  Tesseract  ││ ImageMagick ││ 7-Zip Native│
     │  Full GPL   ││   OCR NDK   ││ / Libvips   ││ / Libarchive│
     │ (Video/Aud) ││(Scanned Doc)││ (High-Res)  ││ (7Z/TAR/ZIP)│
     └─────────────┘└─────────────┘└─────────────┘└─────────────┘
            │
            ▼
     ┌──────────────────────────────────────────────────────────┐
     │     Offline Android Document Engine (DOCX/XLSX/PDF)      │
     │     High-Fidelity Native Layout & Formatting Parser      │
     └──────────────────────────────────────────────────────────┘
```

---

## 2. On-Device Engine Specification for Android

| Domain | Native Mobile Engine | Codecs / Features Supported | Added APK Size (Compressed) |
| :--- | :--- | :--- | :---: |
| **Video** | **FFmpegKit (Full GPL)** | H.264, H.265/HEVC, VP8/VP9, AV1, MPEG4, ProRes, MKV, MP4, WebM, AVI, MOV, millisecond-exact trim, resize, bitrate control. | **~32 MB** |
| **Audio** | **FFmpegKit Audio Subsystem** | MP3 (LAME), AAC, FLAC, Opus, OGG, WAV, M4A, multi-track merge, loudness normalization, audio bitrate conversion. | *(Included in FFmpegKit)* |
| **Image** | **Native Libvips / ImageMagick C++** | WebP, AVIF, JPEG, PNG, TIFF, SVG rasterization, smart lossy compression, resize, color filters, EXIF metadata. | **~12 MB** |
| **OCR** | **Tesseract C++ NDK (`tess-two`)** | Offline neural text recognition from photos and scanned documents (`eng.traineddata` + orientation detection). | **~22 MB** |
| **Archive** | **7-Zip C++ NDK (`p7zip`)** | High-compression 7Z (LZMA2), TAR, GZIP, BZIP2, XZ, standard ZIP, password protection. | **~5 MB** |
| **Documents** | **Native Document Converter** | DOCX to PDF, PDF to DOCX, XLSX to PDF/CSV, PPTX to PDF slides with preserved font styles, tables, and alignment. | **~25 MB** |

---

## 3. GitHub Distribution Matrix (Separate Builds for Each Device)

To prevent users from wasting data or storage, we configure Gradle to build separate, optimized `.apk` packages, as well as an all-in-one Universal package:

```
📦 GitHub Release Assets
 ├── 📱 UniversalFileStudio-v1.0.0-arm64-v8a.apk     (~105 MB)  <-- Modern Phones (95% of Users)
 ├── 📱 UniversalFileStudio-v1.0.0-armeabi-v7a.apk   (~98 MB)   <-- Older 32-bit Phones
 ├── 💻 UniversalFileStudio-v1.0.0-x86_64.apk        (~110 MB)  <-- Android Emulators & ChromeOS
 ├── 🌐 UniversalFileStudio-v1.0.0-Universal.apk     (~245 MB)  <-- All-in-One Fat APK
 ├── 📦 UniversalFileStudio-v1.0.0.aab               (~240 MB)  <-- App Bundle for Store/Archival
 ├── 🪟 UniversalFileStudio-Windows-x64.zip          (~140 MB)  <-- Windows Portable + Installer
 ├── 🐧 UniversalFileStudio-Linux-x86_64.AppImage    (~160 MB)  <-- Linux 1-Click Executable
 ├── 🍏 UniversalFileStudio-macOS-Universal.dmg      (~150 MB)  <-- macOS (Intel & Apple Silicon)
 └── 📱 UniversalFileStudio-iOS.zip                  (~30 MB)   <-- Xcode IPA build for iPad/iPhone
```

---

## 4. Multi-Platform Build Strategy

### 🪟 Windows (Windows 10 / 11)
* **Packaging**: PyInstaller + Webview shell (or Electron / Tauri wrapper).
* **Binaries**: Statically bundles Windows builds of `ffmpeg.exe`, `soffice.exe`, `magick.exe`, `tesseract.exe`, and `7z.exe`.
* **Output**: `.exe` Single-file portable executable and Inno Setup installer.

### 🐧 Linux (Ubuntu, Debian, Fedora, Arch)
* **Packaging**: AppImage (portable across any Linux distribution).
* **Dependencies**: System libraries mapped via LD_LIBRARY_PATH with bundled binaries.
* **Output**: `UniversalFileStudio-x86_64.AppImage`.

### 🍏 macOS (Apple Silicon M1-M4 & Intel x86_64)
* **Packaging**: Universal macOS `.app` bundled into `.dmg`.
* **Security**: Entitlements configured for local disk read/write and camera/photo permissions.

### 📱 iPad & iPhone (iOS / iPadOS)
* **Packaging**: Capacitor iOS Project (`frontend/ios`).
* **Distribution**: Xcode Archive (`.ipa`) installable via AltStore / Sideloadly / TestFlight, plus a 1-click **Progressive Web App (PWA)** for instant offline browser installation.

---

## 5. Step-by-Step Implementation Roadmap

### Phase 1: Gradle ABI Splits & Build Setup
1. Configure `frontend/android/app/build.gradle` with `splits { abi { enable true ... } }`.
2. Configure version code calculation based on ABI (ensures clean upgrades).
3. Set up signing configurations for release APKs.

### Phase 2: Android Native Engine Integration
1. **FFmpegKit**: Add `com.arthenica:ffmpeg-kit-full-gpl:6.0-2` to `android/app/build.gradle`.
2. **Tesseract OCR**: Add `com.rmtheis:tess-two` native library and bundle `eng.traineddata` in `android/app/src/main/assets/tessdata/`.
3. **7-Zip / LZMA**: Add native LZMA/libarchive C++ bridge.
4. **ImageMagick**: Integrate Android NDK image filters for multi-format conversion.

### Phase 3: Capacitor Native Bridge (`UniversalNativeEnginePlugin`)
1. Create Java/Kotlin bridge in `frontend/android/app/src/main/java/com/universalfilestudio/app/plugins/`:
   * `runFFmpegCommand(cmd)`
   * `runTesseractOcr(imagePath)`
   * `runArchiveOperation(op, files)`
   * `runDocumentConversion(inputPath, targetFormat)`
2. Expose the native methods to the React frontend in `universalEngine.ts`.

### Phase 4: Native Android Document Engine
1. Integrate native document layout parser and PDF renderer for Word/Excel conversions.
2. Ensure background threading using `AsyncTask` / Kotlin Coroutines with a dedicated foreground notification service so Android does not kill long-running conversions.

### Phase 5: Desktop Packaging (Windows, Linux, macOS)
1. Write PyInstaller desktop spec script bundling Python backend + React UI dist + CLI binaries.
2. Build InnoSetup script for Windows `.exe` and AppImage packaging script for Linux.

### Phase 6: Automated GitHub Actions CI/CD Pipeline
1. Create `.github/workflows/release.yml`.
2. Automatically triggers on Git tags (e.g. `v1.0.0`).
3. Runs parallel build runners:
   * `ubuntu-latest`: Builds all 4 Android APKs + Linux AppImage.
   * `windows-latest`: Builds Windows Portable `.exe`.
   * `macos-latest`: Builds macOS `.dmg` + iOS package.
4. Publishes all binaries as GitHub Release assets ready for 1-click download.

---

## 6. Performance & Battery Safeguards for Mobile

Because desktop engines running on a mobile CPU require significant computation:
* **Background Foreground Service**: Long-running conversions (like 10-minute video encodes) will display a persistent Android notification bar with a live progress percentage, preventing Android from sleeping or killing the process.
* **CPU Throttle Protection**: Video encoding threads are pinned to 2–4 cores (out of 8) to keep the phone responsive and cool.
* **Storage Auto-Cleanup**: Intermediate temporary frames and conversion scratch files are automatically deleted upon job completion.

