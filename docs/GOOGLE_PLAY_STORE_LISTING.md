# Google Play Store Listing & Metadata Guide

**Application:** Universal File Studio  
**Package ID:** `com.universalfilestudio.app`  
**Target Category:** Productivity / Tools  
**Content Rating:** Everyone (PEGI 3)  
**Monetization:** 100% Free & Open Source (No Ads, No Subscriptions, No In-App Purchases)

---

## 1. Store Text Metadata

### App Title (max 30 characters)
`Universal File Studio`

### Short Description (max 80 characters)
`100% Offline Multi-Tool: PDF, Video, Audio, Image & 7Z Archive Studio.`

---

### Full Description (max 4,000 characters)

```text
Universal File Studio is the ultimate on-device, local-first multimedia conversion, editing, and compression suite. Access 102+ desktop-grade tools directly on your phone or tablet with ZERO cloud dependencies, ZERO file size limits, and 100% privacy.

Your files NEVER leave your phone. Everything is processed offline using embedded high-speed C++ engines, including FFmpegKit Full GPL, Tesseract 5 Neural OCR, Apache PDFBox, and Apache Commons LZMA2.

============================================================
🚀 KEY STUDIO DOMAINS & HIGHLIGHTS
============================================================

📄 COMPLETE PDF STUDIO (27 TOOLS)
• Password Encrypt & Decrypt: Genuine AES-128 & AES-256 standard encryption via Apache PDFBox.
• Organize & Transform: Merge multiple PDFs, split page ranges, rotate, and reorder pages.
• Convert Documents: PDF to Word DOCX, PDF to PowerPoint PPTX, PDF to Excel XLSX, and PDF to EPUB.
• Visual Diff Comparison: Perceptual pixel-by-pixel heatmap comparison identifying document divergences.
• PDF Hardware Compression: Recompress scanned pages into crisp, lightweight documents.
• Optical Character Recognition (OCR): Extract searchable body text from scanned PDFs offline.
• Watermark & Flatten: Stamp confidential text watermarks and flatten interactive form fields.

🎬 HIGH-PERFORMANCE VIDEO STUDIO (22 TOOLS)
• Fast Transcoding: Convert between MP4, WebM, MKV, MOV, AVI, and TS formats.
• Precision Trimming & Cutting: Millisecond-exact lossy or lossless stream clipping.
• Resolution & Aspect Ratio: 16:9, 9:16 Social Media Reframe (TikTok, Reels, Shorts), 1:1 Square, and 4K/1080p/720p scaling.
• Smart Video Concat: Merge multiple videos with automatic aspect ratio and resolution normalization.
• Audio Extraction: Rip background music and dialogue directly to MP3, WAV, or AAC.
• GIF Generation: Create animated high-framerate GIFs from video clips.

🎵 AUDIO STUDIO & VOICE RECORDER (18 TOOLS)
• Multi-Format Audio Transcoder: Convert to MP3, WAV, AAC, M4A, FLAC, OGG, and Opus.
• Offline Voice Recorder: Record high-fidelity audio notes with the built-in microphone recorder.
• Ringtone Maker & Trimmer: Cut audio tracks to exact start and end timestamps.
• Volume Boost & Loudness Normalization: EBU R128 standard loudness compliance.
• Audio Merge: Stitch multiple songs, podcasts, and recordings into a single seamless audio file.

🖼️ IMAGE & PHOTO STUDIO (20 TOOLS)
• Smart Photo Compressor: Reduce file size up to 80% without visible quality loss.
• Format Conversion: PNG, JPG, WebP, AVIF, BMP, TIFF, SVG, and ICO.
• Combine Photos to PDF: Stitch pictures and scans into clean multi-page PDF documents.
• Photo Collage Maker: Multi-photo grid stitcher.
• Privacy & Metadata Scrubber: Wipe hidden EXIF metadata (GPS coordinates, camera serial, shutter time).

📦 ARCHIVE & DATA COMPRESSION STUDIO (15 TOOLS)
• True 7-Zip LZMA2: Create authentic .7z archives and unpack multi-format packages.
• Multi-Format Decompressor: Extract ZIP, 7Z, RAR, TAR, GZ, and BZ2 archives offline.
• Archive Conversion: Convert 7Z, RAR, and TAR packages into standard ZIP files.
• Cryptographic Checksums: Calculate instant SHA-256, MD5, SHA-1, and CRC32 file hashes.

============================================================
🔒 PRIVACY BY DESIGN
============================================================
• 100% Offline: No internet connection is ever required.
• No Tracking: Zero analytics, zero telemetry SDKs, zero background data collection.
• No Ads & No Logins: Free forever, ad-free, with no account registration needed.
• Safe & Secure: All transformations occur within your device's isolated application sandbox.
```

---

## 2. Google Play Console Data Safety Questionnaire Answers

| Question | Answer | Rationale |
| :--- | :--- | :--- |
| **Does your app collect or share any user data?** | **No** | All files and operations execute locally on the device CPU/GPU. No network data transfer exists. |
| **Is all user data collected encrypted in transit?** | **N/A** | No data is collected or transmitted across any network. |
| **Do you provide a way for users to request data deletion?** | **Yes** | Deleting jobs from the Job Queue or uninstalling the app permanently purges all local sandbox caches. |
| **Is your app target audience children under 13?** | **No** (General Public / Everyone) | Safe for all ages, rated PEGI 3. |

---

## 3. Required Store Graphics Checklist

* **App Icon**: `512 x 512 px` 32-bit PNG (with alpha), max 1024 KB. Located at [`frontend/public/icon-512.png`](file:///home/adityapatra/Documents/GitHub/universal-file-studio/frontend/public/icon-512.png).
* **Feature Graphic**: `1024 x 500 px` JPG or 24-bit PNG (no alpha).
* **Phone Screenshots**: Minimum 2 screenshots (recommended 4 to 8), 16:9 or 9:16 aspect ratio, min dimension 1080 px.
* **Tablet Screenshots**: 7-inch and 10-inch screenshots for tablet store optimization.
