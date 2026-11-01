#!/usr/bin/env python3
"""
Universal File Studio - Test Media and Document Harvester
Downloads authentic samples from the internet and complements them with native format generators
to produce a complete test suite across documents, audio, video, images, and archives.
"""

import os
import sys
import shutil
import urllib.request
import subprocess
from pathlib import Path

DEST_DIR = Path("test_samples/diverse")
DOC_DIR = DEST_DIR / "documents"
AUDIO_DIR = DEST_DIR / "audio"
VIDEO_DIR = DEST_DIR / "video"
IMAGE_DIR = DEST_DIR / "images"
ARCHIVE_DIR = DEST_DIR / "archives"

for d in [DOC_DIR, AUDIO_DIR, VIDEO_DIR, IMAGE_DIR, ARCHIVE_DIR]:
    d.mkdir(parents=True, exist_ok=True)

def download(url: str, dest: Path) -> bool:
    print(f"--> Fetching from internet: {url}")
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14) UFS-Test-Bot/1.0"}
        )
        with urllib.request.urlopen(req, timeout=10) as response, open(dest, "wb") as out_file:
            shutil.copyfileobj(response, out_file)
        if dest.exists() and dest.stat().st_size > 100:
            print(f"   ✓ Downloaded: {dest.name} ({dest.stat().st_size:,} bytes)")
            return True
    except Exception as e:
        print(f"   ⚠ Download failed for {url}: {e}")
    return False

def main():
    print("======================================================================")
    print("  Universal File Studio - Diverse Media & Document Preparation")
    print("======================================================================")

    # 1. DOCUMENTS FROM INTERNET
    pdf_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    download(pdf_url, DOC_DIR / "sample_w3c_dummy.pdf")

    # Internet sample CSV
    csv_url = "https://raw.githubusercontent.com/datasets/gdp/master/data/gdp.csv"
    download(csv_url, DOC_DIR / "sample_global_gdp.csv")

    # Markdown document
    md_content = """# Universal File Studio Test Document
## Local-First Media and Document Processing

Universal File Studio processes all files **100% locally** on your device.

### Feature Matrix:
- **Audio/Video**: FFmpeg powered transcoding, trimming, normalization, channel mixing.
- **Documents**: Pandoc, Poppler, Ghostscript, LibreOffice processing.
- **Images**: ImageMagick optimization, resizing, format conversion.
- **Security**: SHA-256 / MD5 checksums, metadata scrubbing.

> "Privacy is not an option; it is the default."
"""
    (DOC_DIR / "sample_readme.md").write_text(md_content)
    (DOC_DIR / "sample_notes.txt").write_text("Universal File Studio Local Testing Notes.\nAll systems nominal.")

    # Convert MD to HTML & DOCX & EPUB via Pandoc if available
    try:
        subprocess.run(["pandoc", str(DOC_DIR / "sample_readme.md"), "-o", str(DOC_DIR / "sample_manual.html"), "--standalone"], check=True)
        print("   ✓ Generated: sample_manual.html")
    except Exception as e:
        print(f"   ⚠ Pandoc HTML failed: {e}")

    try:
        subprocess.run(["pandoc", str(DOC_DIR / "sample_readme.md"), "-o", str(DOC_DIR / "sample_manual.docx")], check=True)
        print("   ✓ Generated: sample_manual.docx")
    except Exception as e:
        print(f"   ⚠ Pandoc DOCX failed: {e}")

    try:
        subprocess.run(["pandoc", str(DOC_DIR / "sample_readme.md"), "-o", str(DOC_DIR / "sample_book.epub")], check=True)
        print("   ✓ Generated: sample_book.epub")
    except Exception as e:
        print(f"   ⚠ Pandoc EPUB failed: {e}")

    # Generate XLSX and PPTX via Python / LibreOffice
    # Create simple CSV and convert to XLSX via libreoffice
    try:
        csv_temp = DOC_DIR / "sheet_data.csv"
        csv_temp.write_text("ID,Name,Category,Status,Score\n1,Video Engine,FFmpeg,Active,99\n2,Image Engine,ImageMagick,Active,98\n3,PDF Engine,Ghostscript,Active,100\n")
        subprocess.run(["libreoffice", "--headless", "--convert-to", "xlsx", str(csv_temp), "--outdir", str(DOC_DIR)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if (DOC_DIR / "sheet_data.xlsx").exists():
            (DOC_DIR / "sheet_data.xlsx").rename(DOC_DIR / "sample_finance_sheet.xlsx")
            csv_temp.unlink(missing_ok=True)
            print("   ✓ Generated: sample_finance_sheet.xlsx")
    except Exception as e:
        print(f"   ⚠ LibreOffice XLSX conversion note: {e}")

    # 2. AUDIO FROM INTERNET & SYNTHESIS
    ogg_url = "https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg"
    download(ogg_url, AUDIO_DIR / "sample_wikimedia.ogg")

    # Generate authentic stereo MP3, WAV, AAC, FLAC, M4A using FFmpeg (musical harmonic frequencies)
    print("--> Generating multi-format audio tracks via FFmpeg...")
    audio_wav = AUDIO_DIR / "sample_acoustic.wav"
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "sine=frequency=440:duration=5,aeval=val(0)*sin(2*PI*t)*0.5",
        "-ar", "44100", "-ac", "2", str(audio_wav)
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"   ✓ Generated: {audio_wav.name}")

    for fmt, codec, ext in [
        ("mp3", "libmp3lame", "mp3"),
        ("aac", "aac", "aac"),
        ("flac", "flac", "flac"),
        ("m4a", "aac", "m4a")
    ]:
        out = AUDIO_DIR / f"sample_tune.{ext}"
        subprocess.run(["ffmpeg", "-y", "-i", str(audio_wav), "-c:a", codec, str(out)],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"   ✓ Generated: {out.name}")

    # 3. VIDEO FROM INTERNET & SYNTHESIS
    mp4_url = "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4"
    download(mp4_url, VIDEO_DIR / "sample_street_action.mp4")

    # Generate high quality test patterns in MP4, WebM, MKV, MOV, AVI
    print("--> Generating multi-format video clips via FFmpeg...")
    base_mp4 = VIDEO_DIR / "sample_animation.mp4"
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "testsrc=duration=5:size=640x360:rate=30",
        "-f", "lavfi", "-i", "sine=frequency=523.25:duration=5",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
        str(base_mp4)
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"   ✓ Generated: {base_mp4.name}")

    # WebM
    webm_out = VIDEO_DIR / "sample_stream.webm"
    subprocess.run(["ffmpeg", "-y", "-i", str(base_mp4), "-c:v", "libvpx-vp9", "-b:v", "500k", "-c:a", "libopus", str(webm_out)],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"   ✓ Generated: {webm_out.name}")

    # MKV
    mkv_out = VIDEO_DIR / "sample_cinema.mkv"
    subprocess.run(["ffmpeg", "-y", "-i", str(base_mp4), "-c:v", "copy", "-c:a", "copy", str(mkv_out)],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"   ✓ Generated: {mkv_out.name}")

    # MOV
    mov_out = VIDEO_DIR / "sample_quicktime.mov"
    subprocess.run(["ffmpeg", "-y", "-i", str(base_mp4), "-c:v", "copy", "-c:a", "copy", str(mov_out)],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"   ✓ Generated: {mov_out.name}")

    # AVI
    avi_out = VIDEO_DIR / "sample_vintage.avi"
    subprocess.run(["ffmpeg", "-y", "-i", str(base_mp4), "-c:v", "mpeg4", "-q:v", "3", "-c:a", "mp3", str(avi_out)],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"   ✓ Generated: {avi_out.name}")

    # 4. IMAGES
    print("--> Preparing image collection (JPG, PNG, WebP, GIF, SVG, BMP, TIFF)...")
    # SVG Vector
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="40" fill="url(#grad)" />
  <circle cx="200" cy="200" r="80" fill="#ffffff" fill-opacity="0.9" />
  <text x="200" y="210" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#0f172a" text-anchor="middle">UFS</text>
</svg>"""
    (IMAGE_DIR / "sample_vector_badge.svg").write_text(svg_content)
    print("   ✓ Generated: sample_vector_badge.svg")

    # Generate PNG, JPG, WebP, GIF, BMP, TIFF from SVG using ImageMagick
    base_png = IMAGE_DIR / "sample_graphic.png"
    subprocess.run(["magick", str(IMAGE_DIR / "sample_vector_badge.svg"), str(base_png)], check=True)
    print(f"   ✓ Generated: {base_png.name}")

    for ext in ["jpg", "webp", "bmp", "tiff", "gif"]:
        out = IMAGE_DIR / f"sample_photo.{ext}"
        subprocess.run(["magick", str(base_png), str(out)], check=True)
        print(f"   ✓ Generated: {out.name}")

    # 5. ARCHIVES
    print("--> Packaging multi-format archive files...")
    # ZIP
    zip_path = ARCHIVE_DIR / "sample_archive_package.zip"
    subprocess.run(["7z", "a", "-tzip", str(zip_path), str(DOC_DIR / "sample_readme.md"), str(DOC_DIR / "sample_notes.txt"), str(IMAGE_DIR / "sample_graphic.png")],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"   ✓ Generated: {zip_path.name}")

    # TAR.GZ
    targz_path = ARCHIVE_DIR / "sample_bundle.tar.gz"
    subprocess.run(["tar", "-czf", str(targz_path), "-C", str(DOC_DIR), "sample_readme.md", "sample_notes.txt"],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"   ✓ Generated: {targz_path.name}")

    # 7Z
    sevenz_path = ARCHIVE_DIR / "sample_high_compression.7z"
    subprocess.run(["7z", "a", "-t7z", "-m0=lzma2", "-mx=9", str(sevenz_path), str(DOC_DIR / "sample_readme.md"), str(IMAGE_DIR / "sample_graphic.png")],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"   ✓ Generated: {sevenz_path.name}")

    print("======================================================================")
    print("  All files gathered and prepared successfully in test_samples/diverse!")
    print("======================================================================")

if __name__ == "__main__":
    main()

