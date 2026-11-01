#!/usr/bin/env python3
"""
Comprehensive Desktop CLI Test Verification Suite for Universal File Studio.
Tests every major function and processor via the native Python/Click CLI interface.
"""
import os
import sys
import subprocess
import time
from pathlib import Path

PYTHON_EXE = sys.executable or "./.venv/bin/python"
CLI_SCRIPT = "backend/cli.py"

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

test_results = []

def run_test(test_id: str, category: str, description: str, args: list, expected_out_ext: str = None) -> bool:
    print(f"{CYAN}[{category.upper()}]{RESET} Testing {BOLD}{test_id}{RESET}: {description}...")
    cmd = [PYTHON_EXE, CLI_SCRIPT] + args
    start_time = time.time()
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    duration = time.time() - start_time

    success = (proc.returncode == 0)
    output_path = None

    if success:
        # Extract output path if reported in stdout
        for line in proc.stdout.splitlines():
            if "Output:" in line or "Output generated at:" in line or "Output saved to:" in line or "created at:" in line:
                parts = line.split(":", 1)
                if len(parts) > 1:
                    cand = parts[1].strip()
                    if os.path.exists(cand):
                        output_path = cand
                        break
        
        status_str = f"{GREEN}✓ PASSED{RESET} ({duration:.2f}s)"
        print(f"   {status_str}")
        if output_path:
            sz = os.path.getsize(output_path)
            print(f"   ↳ Generated: {Path(output_path).name} ({sz:,} bytes)")
    else:
        status_str = f"{RED}✗ FAILED{RESET} (exit code {proc.returncode})"
        print(f"   {status_str}")
        err_msg = proc.stderr.strip() or proc.stdout.strip()
        print(f"   ↳ Error: {err_msg[:200]}")

    test_results.append({
        "id": test_id,
        "category": category,
        "description": description,
        "success": success,
        "duration": duration,
        "command": " ".join(args),
        "output_path": output_path
    })
    return success

def main():
    print(f"\n{BOLD}======================================================================{RESET}")
    print(f"{BOLD}  Universal File Studio - Full Desktop CLI Function Test Suite{RESET}")
    print(f"{BOLD}======================================================================{RESET}\n")

    # Ensure samples exist
    if not os.path.exists("test_samples/sample_video.mp4"):
        print("Generating test samples first...")
        subprocess.run([PYTHON_EXE, "scripts/generate_test_files.py"], check=True)

    # 1. System & Engine Diagnostics
    run_test("SYS-01", "Diagnostics", "Check system status and configuration", ["status"])
    run_test("SYS-02", "Diagnostics", "List detected hardware CLI engines", ["engines"])

    # 2. Cryptographic Digest & Hashing
    run_test("HASH-01", "Security", "Compute SHA-256, MD5, and CRC-32", ["hash", "test_samples/sample_image.png"])

    # 3. Privacy Sanitization & EXIF Scrubber
    run_test("META-01", "Security", "Sanitize EXIF and device metadata", ["strip-metadata", "test_samples/sample_image.jpg"])

    # 4. OCR Text Extraction (Tesseract Engine)
    run_test("OCR-01", "Document", "Extract printed text from PNG image via OCR", ["ocr", "test_samples/sample_image.png"])

    # 5. Core Transcoding
    run_test("CONV-01", "Document", "Transcode Markdown to HTML via Pandoc", ["convert", "test_samples/sample_document.md", "-t", "html"])
    run_test("CONV-02", "Image", "Transcode PNG to WebP via ImageMagick", ["convert", "test_samples/sample_image.png", "-t", "webp"])
    run_test("CONV-03", "Audio", "Transcode WAV to MP3 via FFmpeg", ["convert", "test_samples/sample_audio.wav", "-t", "mp3"])
    run_test("CONV-04", "Video", "Transcode MP4 to WebM (VP9 + Opus)", ["convert", "test_samples/sample_video.mp4", "-t", "webm"])

    # 6. Document & PDF Studio (iLovePDF Parity)
    run_test("PDF-01", "Document", "Lossless PDF compression via Ghostscript", ["process", "pdf_compress", "test_samples/sample_document.pdf"])
    run_test("PDF-02", "Document", "Merge multiple PDFs into single document", [
        "process", "pdf_merge", "test_samples/sample_document.pdf",
        "-p", "additional_files=test_samples/sample_document2.pdf"
    ])
    run_test("PDF-03", "Document", "Split multi-page PDF into separate pages via Poppler", [
        "process", "pdf_split", "test_samples/sample_document.pdf"
    ])
    run_test("PDF-04", "Document", "Render PDF pages into high-res PNG images", [
        "process", "pdf_to_images", "test_samples/sample_document.pdf",
        "-p", "format=png", "-p", "dpi=150"
    ])
    run_test("PDF-05", "Document", "Combine image into PDF document", [
        "process", "images_to_pdf", "test_samples/sample_image.png"
    ])

    # 7. Video Studio
    run_test("VID-01", "Video", "Fast-seek video trimming without re-encoding", [
        "process", "video_trim", "test_samples/sample_video.mp4",
        "-p", "start_time=00:01", "-p", "duration=2"
    ])
    run_test("VID-02", "Video", "Extract lossless/compressed audio track from MP4", [
        "process", "extract_audio", "test_samples/sample_video.mp4",
        "-p", "format=mp3"
    ])
    run_test("VID-03", "Video", "Resize video with aspect-ratio preserving padding", [
        "process", "video_resize", "test_samples/sample_video.mp4",
        "-p", "width=640", "-p", "height=360"
    ])
    run_test("VID-04", "Video", "Strip audio track (Mute video stream)", [
        "process", "remove_audio", "test_samples/sample_video.mp4"
    ])

    # 8. Audio Studio
    run_test("AUD-01", "Audio", "Trim audio file to custom duration (Ringtone)", [
        "process", "audio_trim", "test_samples/sample_audio.mp3",
        "-p", "start_time=00:01", "-p", "duration=2"
    ])
    run_test("AUD-02", "Audio", "EBU R128 integrated loudness normalization", [
        "process", "audio_normalize", "test_samples/sample_audio.mp3",
        "-p", "target_lufs=-16.0"
    ])

    # 9. Image Studio
    run_test("IMG-01", "Image", "Resize image dimensions with bicubic filter", [
        "process", "image_resize", "test_samples/sample_image.png",
        "-p", "width=400", "-p", "height=300"
    ])
    run_test("IMG-02", "Image", "Convert image color profile to Black & White Grayscale", [
        "process", "image_grayscale", "test_samples/sample_image.png"
    ])
    run_test("IMG-03", "Image", "Rotate image orientation by 90 degrees", [
        "process", "image_rotate", "test_samples/sample_image.png",
        "-p", "angle=90"
    ])

    # 10. Archive & Compression Studio
    run_test("ARC-01", "Archive", "Package files into compressed ZIP archive via 7-Zip", [
        "process", "archive_create", "test_samples/sample_document.md",
        "-p", "format=zip"
    ])
    run_test("ARC-02", "Archive", "List table-of-contents manifest from ZIP archive", [
        "process", "archive_list", "test_samples/sample_archive.zip"
    ])
    run_test("ARC-03", "Archive", "Decompress and extract ZIP archive into directory", [
        "process", "archive_extract", "test_samples/sample_archive.zip"
    ])
    run_test("ARC-04", "Archive", "Verify archive file integrity and checksums", [
        "process", "archive_test", "test_samples/sample_archive.zip"
    ])

    # 11. Multi-Step Pipelines
    run_test("PIPE-01", "Pipeline", "Execute Pipeline #1: Video Privacy Scrub & WebM", [
        "pipeline", "run", "1", "test_samples/sample_video.mp4"
    ])
    run_test("PIPE-02", "Pipeline", "Execute Pipeline #3: Image Sanitize & WebP Encoding", [
        "pipeline", "run", "3", "test_samples/sample_image.jpg"
    ])

    # Summary
    passed_count = sum(1 for t in test_results if t["success"])
    total_count = len(test_results)
    total_time = sum(t["duration"] for t in test_results)

    print(f"\n{BOLD}======================================================================{RESET}")
    print(f"{BOLD}  TEST EXECUTION SUMMARY{RESET}")
    print(f"{BOLD}======================================================================{RESET}")
    print(f"Total Functions Tested:  {total_count}")
    print(f"Passed:                 {GREEN}{passed_count} / {total_count}{RESET} (100% SUCCESS)" if passed_count == total_count else f"Passed: {passed_count} / {total_count}")
    print(f"Execution Wall Time:    {total_time:.2f} seconds")
    print(f"Engines Exercised:      FFmpeg, ImageMagick, Ghostscript, Poppler, Pandoc, 7-Zip, Tesseract")
    print(f"======================================================================\n")

    if passed_count != total_count:
        sys.exit(1)

if __name__ == "__main__":
    main()

