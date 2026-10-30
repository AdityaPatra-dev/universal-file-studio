#!/usr/bin/env python3
import os
import subprocess
import zipfile
from pathlib import Path

def generate_samples():
    sample_dir = Path("test_samples")
    sample_dir.mkdir(exist_ok=True)
    print(f"Creating test samples in {sample_dir.resolve()}...")

    # 1. Video: 5-second 1280x720 MP4 with test pattern + 440Hz sine wave audio
    vid_path = sample_dir / "sample_video.mp4"
    if not vid_path.exists():
        print("Generating sample_video.mp4...")
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", "testsrc=duration=5:size=1280x720:rate=30",
            "-f", "lavfi", "-i", "sine=frequency=440:duration=5",
            "-shortest",
            str(vid_path)
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 2. Audio: 5-second 440Hz sine WAV & MP3
    wav_path = sample_dir / "sample_audio.wav"
    if not wav_path.exists():
        print("Generating sample_audio.wav...")
        cmd = ["ffmpeg", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=5", str(wav_path)]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    mp3_path = sample_dir / "sample_audio.mp3"
    if not mp3_path.exists():
        print("Generating sample_audio.mp3...")
        cmd = ["ffmpeg", "-y", "-i", str(wav_path), "-c:a", "libmp3lame", "-b:a", "192k", str(mp3_path)]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 3. Image: PNG with ImageMagick or Python PIL
    png_path = sample_dir / "sample_image.png"
    if not png_path.exists():
        print("Generating sample_image.png...")
        cmd = [
            "magick", "-size", "800x600", "xc:#1e1b4b",
            "-gravity", "center",
            "-fill", "white",
            "-pointsize", "36",
            "-annotate", "+0-50", "UNIVERSAL FILE STUDIO",
            "-fill", "#818cf8",
            "-pointsize", "22",
            "-annotate", "+0+30", "Test Image for Offline CLI Testing",
            str(png_path)
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    jpg_path = sample_dir / "sample_image.jpg"
    if not jpg_path.exists():
        print("Generating sample_image.jpg...")
        cmd = ["magick", str(png_path), "-quality", "90", str(jpg_path)]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 4. Document: Markdown & Text
    md_path = sample_dir / "sample_document.md"
    if not md_path.exists():
        print("Generating sample_document.md...")
        md_content = """# Universal File Studio Test Document

This is an automated test document for verifying offline local document processors.

## Features Under Test
- Markdown to PDF / HTML / DOCX
- Metadata extraction
- Hashing and checksums
- Local Pandoc and LibreOffice integration

| Engine | Version | Capability |
| :--- | :--- | :--- |
| Pandoc | 3.12+ | Document Conversion |
| LibreOffice | 26+ | Office Transcoding |
| QPDF | 12+ | PDF Manipulation |
"""
        md_path.write_text(md_content, encoding="utf-8")

    txt_path = sample_dir / "sample_document.txt"
    if not txt_path.exists():
        print("Generating sample_document.txt...")
        txt_path.write_text("Hello Universal File Studio!\nPlain text file for CLI testing.\nLine 3 of sample text.", encoding="utf-8")

    # 5. Document: PDF 1 & PDF 2
    pdf1_path = sample_dir / "sample_document.pdf"
    if not pdf1_path.exists():
        print("Generating sample_document.pdf...")
        # Use pandoc or ghostscript/imagemagick to create a clean PDF
        cmd = ["pandoc", str(md_path), "-o", str(pdf1_path), "--pdf-engine=weasyprint"]
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            # Fallback to ImageMagick if weasyprint not installed
            cmd = ["magick", "-size", "600x800", "xc:white", "-fill", "black", "-pointsize", "24", "-annotate", "+50+100", "Sample PDF Document 1\nPage 1 of Universal File Studio Test", str(pdf1_path)]
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    pdf2_path = sample_dir / "sample_document2.pdf"
    if not pdf2_path.exists():
        print("Generating sample_document2.pdf...")
        cmd = ["magick", "-size", "600x800", "xc:white", "-fill", "black", "-pointsize", "24", "-annotate", "+50+100", "Sample PDF Document 2\nTo be merged with Document 1", str(pdf2_path)]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 6. Archive: ZIP
    zip_path = sample_dir / "sample_archive.zip"
    if not zip_path.exists():
        print("Generating sample_archive.zip...")
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.write(txt_path, arcname="sample_document.txt")
            zf.write(md_path, arcname="sample_document.md")
            zf.write(jpg_path, arcname="sample_image.jpg")

    print("\n✓ All sample test files generated successfully in 'test_samples/':")
    for f in sorted(sample_dir.iterdir()):
        size_kb = f.stat().st_size / 1024
        print(f"  - {f.name:<25} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    generate_samples()
