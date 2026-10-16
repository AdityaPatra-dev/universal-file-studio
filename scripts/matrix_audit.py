import os
import sys
import shutil
import asyncio
import traceback
import subprocess
from pathlib import Path
from typing import Dict, Any, List

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.engines.manager import EngineManager
from app.processors.registry import processor_registry
from app.processors.pipeline_runner import pipeline_runner

FIXTURES_DIR = Path("/tmp/ufs_audit_fixtures")
OUTPUT_DIR = Path("/tmp/ufs_audit_outputs")

async def setup_fixtures():
    FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("[SETUP] Generating synthetic test fixtures...")

    # 1. Images
    png_path = FIXTURES_DIR / "sample.png"
    if not png_path.exists():
        subprocess.run(["magick", "-size", "200x200", "canvas:teal", "-fill", "white", "-gravity", "center", "-pointsize", "20", "-annotate", "0", "UFS TEST", str(png_path)], check=True)
    
    jpg_path = FIXTURES_DIR / "sample.jpg"
    if not jpg_path.exists():
        subprocess.run(["magick", str(png_path), str(jpg_path)], check=True)
        
    webp_path = FIXTURES_DIR / "sample.webp"
    if not webp_path.exists():
        subprocess.run(["magick", str(png_path), str(webp_path)], check=True)

    bmp_path = FIXTURES_DIR / "sample.bmp"
    if not bmp_path.exists():
        subprocess.run(["magick", str(png_path), str(bmp_path)], check=True)

    tiff_path = FIXTURES_DIR / "sample.tiff"
    if not tiff_path.exists():
        subprocess.run(["magick", str(png_path), str(tiff_path)], check=True)

    # 2. Audio
    mp3_path = FIXTURES_DIR / "sample.mp3"
    if not mp3_path.exists():
        subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "sine=frequency=1000:duration=1.5", "-c:a", "libmp3lame", str(mp3_path)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    wav_path = FIXTURES_DIR / "sample.wav"
    if not wav_path.exists():
        subprocess.run(["ffmpeg", "-y", "-i", str(mp3_path), "-c:a", "pcm_s16le", str(wav_path)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    ogg_path = FIXTURES_DIR / "sample.ogg"
    if not ogg_path.exists():
        subprocess.run(["ffmpeg", "-y", "-i", str(mp3_path), "-c:a", "libvorbis", str(ogg_path)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    # 3. Video
    mp4_path = FIXTURES_DIR / "sample.mp4"
    if not mp4_path.exists():
        vcodec = "libopenh264"
        subprocess.run([
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", "testsrc=duration=1.5:size=320x240:rate=24",
            "-f", "lavfi", "-i", "sine=frequency=1000:duration=1.5",
            "-c:v", vcodec, "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            str(mp4_path)
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    mkv_path = FIXTURES_DIR / "sample.mkv"
    if not mkv_path.exists():
        subprocess.run(["ffmpeg", "-y", "-i", str(mp4_path), "-c", "copy", str(mkv_path)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    # 4. Documents & eBooks
    md_path = FIXTURES_DIR / "sample.md"
    md_path.write_text("# Universal File Studio Document\n\nTesting end-to-end matrix processing.\n\n- Bullet 1\n- Bullet 2\n\n**Bold text** and *italic text*.\n", encoding="utf-8")

    txt_path = FIXTURES_DIR / "sample.txt"
    txt_path.write_text("Universal File Studio plain text sample file for verification.\nLine 2 content.\n", encoding="utf-8")

    docx_path = FIXTURES_DIR / "sample.docx"
    if not docx_path.exists():
        subprocess.run(["pandoc", str(md_path), "-o", str(docx_path)], check=True)

    epub_path = FIXTURES_DIR / "sample.epub"
    existing_epub = Path("/home/adityapatra/Documents/GitHub/universal-file-studio/storage/uploads/1b2525df_Ode_of_the_Brave_Fast_1-86.epub")
    if existing_epub.exists():
        shutil.copyfile(str(existing_epub), str(epub_path))
    else:
        subprocess.run(["pandoc", str(md_path), "-o", str(epub_path)], check=True)

    csv_path = FIXTURES_DIR / "sample.csv"
    csv_path.write_text("ID,Name,Value\n1,Alpha,100\n2,Beta,200\n3,Gamma,300\n", encoding="utf-8")

    # 5. PDF
    pdf_path = FIXTURES_DIR / "sample.pdf"
    if not pdf_path.exists():
        # Generate 2-page PDF
        page1 = FIXTURES_DIR / "p1.png"
        page2 = FIXTURES_DIR / "p2.png"
        subprocess.run(["magick", "-size", "400x600", "canvas:white", "-fill", "black", "-gravity", "north", "-pointsize", "24", "-annotate", "0", "Page 1 Title", str(page1)], check=True)
        subprocess.run(["magick", "-size", "400x600", "canvas:white", "-fill", "black", "-gravity", "north", "-pointsize", "24", "-annotate", "0", "Page 2 Title", str(page2)], check=True)
        subprocess.run(["magick", str(page1), str(page2), str(pdf_path)], check=True)

    # 6. Archives
    zip_path = FIXTURES_DIR / "sample.zip"
    if not zip_path.exists():
        import zipfile
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.write(png_path, arcname="image.png")
            zf.write(txt_path, arcname="document.txt")

    cbz_path = FIXTURES_DIR / "sample.cbz"
    if not cbz_path.exists():
        import zipfile
        with zipfile.ZipFile(cbz_path, "w") as zf:
            zf.write(png_path, arcname="01.png")
            zf.write(jpg_path, arcname="02.jpg")

    print("[SETUP] Fixtures generated successfully.")

async def run_matrix():
    await setup_fixtures()
    await EngineManager.scan_and_register_all()

    test_cases: List[Dict[str, Any]] = [
        # --- IMAGE CONVERSIONS & OPS ---
        {"cat": "image", "op": "image_convert", "file": "sample.png", "params": {"format": "webp"}, "name": "PNG to WebP"},
        {"cat": "image", "op": "image_convert", "file": "sample.png", "params": {"format": "jpg"}, "name": "PNG to JPG"},
        {"cat": "image", "op": "image_convert", "file": "sample.png", "params": {"format": "avif"}, "name": "PNG to AVIF"},
        {"cat": "image", "op": "image_convert", "file": "sample.png", "params": {"format": "tiff"}, "name": "PNG to TIFF"},
        {"cat": "image", "op": "image_convert", "file": "sample.png", "params": {"format": "bmp"}, "name": "PNG to BMP"},
        {"cat": "image", "op": "image_convert", "file": "sample.png", "params": {"format": "gif"}, "name": "PNG to GIF"},
        {"cat": "image", "op": "image_convert", "file": "sample.jpg", "params": {"format": "png"}, "name": "JPG to PNG"},
        {"cat": "image", "op": "image_convert", "file": "sample.webp", "params": {"format": "png"}, "name": "WebP to PNG"},
        {"cat": "image", "op": "image_resize", "file": "sample.png", "params": {"width": 100, "height": 100}, "name": "Image Resize"},
        {"cat": "image", "op": "image_crop", "file": "sample.png", "params": {"width": 80, "height": 80, "x": 10, "y": 10}, "name": "Image Crop"},
        {"cat": "image", "op": "image_rotate", "file": "sample.png", "params": {"degrees": 90}, "name": "Image Rotate 90"},
        {"cat": "image", "op": "image_flip", "file": "sample.png", "params": {"direction": "horizontal"}, "name": "Image Flip Horizontal"},
        {"cat": "image", "op": "image_flip", "file": "sample.png", "params": {"direction": "vertical"}, "name": "Image Flip Vertical"},
        {"cat": "image", "op": "image_compress", "file": "sample.jpg", "params": {"quality": 60}, "name": "Image Compress Quality"},
        {"cat": "image", "op": "image_grayscale", "file": "sample.png", "params": {}, "name": "Image Grayscale"},
        {"cat": "image", "op": "image_strip_metadata", "file": "sample.jpg", "params": {}, "name": "Image Strip Metadata"},

        # --- VIDEO CONVERSIONS & OPS ---
        {"cat": "video", "op": "video_convert", "file": "sample.mp4", "params": {"format": "mkv"}, "name": "MP4 to MKV"},
        {"cat": "video", "op": "video_convert", "file": "sample.mp4", "params": {"format": "webm"}, "name": "MP4 to WebM"},
        {"cat": "video", "op": "video_convert", "file": "sample.mp4", "params": {"format": "avi"}, "name": "MP4 to AVI"},
        {"cat": "video", "op": "video_convert", "file": "sample.mp4", "params": {"format": "mov"}, "name": "MP4 to MOV"},
        {"cat": "video", "op": "video_convert", "file": "sample.mp4", "params": {"format": "gif"}, "name": "MP4 to GIF animation"},
        {"cat": "video", "op": "video_compress", "file": "sample.mp4", "params": {"crf": 32}, "name": "Video Compress CRF"},
        {"cat": "video", "op": "video_resize", "file": "sample.mp4", "params": {"width": 160, "height": 120}, "name": "Video Resize"},
        {"cat": "video", "op": "video_crop", "file": "sample.mp4", "params": {"width": 160, "height": 120, "x": 0, "y": 0}, "name": "Video Crop"},
        {"cat": "video", "op": "video_trim", "file": "sample.mp4", "params": {"start": "00:00:00", "end": "00:00:01"}, "name": "Video Trim"},
        {"cat": "video", "op": "video_rotate", "file": "sample.mp4", "params": {"degrees": 90}, "name": "Video Rotate 90"},
        {"cat": "video", "op": "video_flip", "file": "sample.mp4", "params": {"direction": "horizontal"}, "name": "Video Flip Horizontal"},
        {"cat": "video", "op": "video_change_fps", "file": "sample.mp4", "params": {"fps": 15}, "name": "Video Change FPS"},
        {"cat": "video", "op": "video_change_speed", "file": "sample.mp4", "params": {"speed": 2.0}, "name": "Video Change Speed 2x"},
        {"cat": "video", "op": "video_reverse", "file": "sample.mp4", "params": {}, "name": "Video Reverse"},
        {"cat": "video", "op": "extract_audio", "file": "sample.mp4", "params": {"format": "mp3"}, "name": "Video Extract Audio MP3"},
        {"cat": "video", "op": "extract_audio", "file": "sample.mp4", "params": {"format": "wav"}, "name": "Video Extract Audio WAV"},
        {"cat": "video", "op": "extract_audio", "file": "sample.mp4", "params": {"format": "aac"}, "name": "Video Extract Audio AAC"},
        {"cat": "video", "op": "remove_audio", "file": "sample.mp4", "params": {}, "name": "Video Remove Audio (Mute)"},
        {"cat": "video", "op": "extract_frames", "file": "sample.mp4", "params": {"fps": 2, "format": "jpg"}, "name": "Video Extract Frames"},

        # --- AUDIO CONVERSIONS & OPS ---
        {"cat": "audio", "op": "audio_convert", "file": "sample.mp3", "params": {"format": "wav"}, "name": "MP3 to WAV"},
        {"cat": "audio", "op": "audio_convert", "file": "sample.mp3", "params": {"format": "ogg"}, "name": "MP3 to OGG"},
        {"cat": "audio", "op": "audio_convert", "file": "sample.mp3", "params": {"format": "flac"}, "name": "MP3 to FLAC"},
        {"cat": "audio", "op": "audio_convert", "file": "sample.mp3", "params": {"format": "aac"}, "name": "MP3 to AAC"},
        {"cat": "audio", "op": "audio_convert", "file": "sample.wav", "params": {"format": "mp3"}, "name": "WAV to MP3"},
        {"cat": "audio", "op": "audio_compress", "file": "sample.mp3", "params": {"bitrate": "64"}, "name": "Audio Compress"},
        {"cat": "audio", "op": "audio_trim", "file": "sample.mp3", "params": {"start": "00:00:00", "end": "00:00:01"}, "name": "Audio Trim"},
        {"cat": "audio", "op": "audio_normalize", "file": "sample.mp3", "params": {}, "name": "Audio Loudness Normalize"},
        {"cat": "audio", "op": "audio_change_speed", "file": "sample.mp3", "params": {"speed": 1.5}, "name": "Audio Change Speed 1.5x"},
        {"cat": "audio", "op": "audio_reverse", "file": "sample.mp3", "params": {}, "name": "Audio Reverse"},

        # --- PDF OPS ---
        {"cat": "pdf", "op": "pdf_to_images", "file": "sample.pdf", "params": {"format": "png", "dpi": 150}, "name": "PDF to PNG Pages"},
        {"cat": "pdf", "op": "pdf_to_images", "file": "sample.pdf", "params": {"format": "jpg", "dpi": 150}, "name": "PDF to JPG Pages"},
        {"cat": "pdf", "op": "pdf_to_text", "file": "sample.pdf", "params": {}, "name": "PDF Extract Text"},
        {"cat": "pdf", "op": "pdf_compress", "file": "sample.pdf", "params": {"quality": "screen"}, "name": "PDF Compress Ghostscript"},
        {"cat": "pdf", "op": "pdf_rotate_pages", "file": "sample.pdf", "params": {"angle": 90, "pages": "1-z"}, "name": "PDF Rotate Pages"},
        {"cat": "pdf", "op": "pdf_extract_pages", "file": "sample.pdf", "params": {"pages": "1"}, "name": "PDF Extract Page 1"},
        {"cat": "pdf", "op": "archive_to_pdf", "file": "sample.cbz", "params": {}, "name": "CBZ to PDF (Manga compile)"},
        {"cat": "pdf", "op": "images_to_pdf", "file": "sample.png", "params": {}, "name": "Image to PDF"},

        # --- DOCUMENTS & EBOOKS ---
        {"cat": "document", "op": "markdown_convert", "file": "sample.md", "params": {"format": "html"}, "name": "Markdown to HTML"},
        {"cat": "document", "op": "markdown_convert", "file": "sample.md", "params": {"format": "docx"}, "name": "Markdown to DOCX"},
        {"cat": "document", "op": "markdown_convert", "file": "sample.md", "params": {"format": "pdf"}, "name": "Markdown to PDF"},
        {"cat": "document", "op": "markdown_convert", "file": "sample.md", "params": {"format": "txt"}, "name": "Markdown to Plain TXT"},
        {"cat": "document", "op": "text_convert", "file": "sample.txt", "params": {"format": "html"}, "name": "TXT to HTML"},
        {"cat": "document", "op": "text_convert", "file": "sample.txt", "params": {"format": "docx"}, "name": "TXT to DOCX"},
        {"cat": "document", "op": "text_convert", "file": "sample.txt", "params": {"format": "pdf"}, "name": "TXT to PDF"},
        {"cat": "document", "op": "ebook_convert", "file": "sample.epub", "params": {"format": "docx"}, "name": "EPUB to DOCX"},
        {"cat": "document", "op": "ebook_convert", "file": "sample.epub", "params": {"format": "html"}, "name": "EPUB to HTML"},
        {"cat": "document", "op": "ebook_convert", "file": "sample.epub", "params": {"format": "txt"}, "name": "EPUB to TXT"},
        {"cat": "document", "op": "ebook_convert", "file": "sample.epub", "params": {"format": "pdf"}, "name": "EPUB to PDF (Pandoc + LibreOffice)"},
        {"cat": "document", "op": "document_convert", "file": "sample.docx", "params": {"format": "pdf"}, "name": "DOCX to PDF (LibreOffice)"},
        {"cat": "document", "op": "spreadsheet_convert", "file": "sample.csv", "params": {"format": "xlsx"}, "name": "CSV to XLSX"},

        # --- ARCHIVES ---
        {"cat": "archive", "op": "archive_create", "file": "sample.png", "params": {"format": "zip"}, "name": "Archive Create ZIP"},
        {"cat": "archive", "op": "archive_create", "file": "sample.png", "params": {"format": "tar"}, "name": "Archive Create TAR"},
        {"cat": "archive", "op": "archive_create", "file": "sample.png", "params": {"format": "7z"}, "name": "Archive Create 7Z"},
        {"cat": "archive", "op": "archive_extract", "file": "sample.zip", "params": {}, "name": "Archive Extract ZIP"},
        {"cat": "archive", "op": "archive_list", "file": "sample.zip", "params": {}, "name": "Archive List Manifest"},
        {"cat": "archive", "op": "archive_test", "file": "sample.zip", "params": {}, "name": "Archive Test Integrity"},

        # --- OCR, METADATA & HASH ---
        {"cat": "advanced", "op": "ocr_image", "file": "sample.png", "params": {"language": "eng"}, "name": "OCR Image (Tesseract)"},
        {"cat": "advanced", "op": "ocr_pdf", "file": "sample.pdf", "params": {}, "name": "OCR PDF / Text Extract"},
        {"cat": "advanced", "op": "metadata_inspect", "file": "sample.mp4", "params": {}, "name": "Inspect Video Metadata"},
        {"cat": "advanced", "op": "metadata_inspect", "file": "sample.png", "params": {}, "name": "Inspect Image Metadata"},
        {"cat": "advanced", "op": "video_strip_metadata", "file": "sample.mp4", "params": {}, "name": "Video Strip Metadata"},
        {"cat": "advanced", "op": "audio_strip_metadata", "file": "sample.mp3", "params": {}, "name": "Audio Strip Metadata"},
        {"cat": "advanced", "op": "file_hash", "file": "sample.png", "params": {"format": "json"}, "name": "Hash Checksums (SHA-256, MD5, CRC32)"},

        # --- PIPELINES (MULTI-STEP CHAINS) ---
        {
            "cat": "pipeline",
            "op": "pipeline_chain_1",
            "file": "sample.zip",
            "pipeline_steps": [
                {"operation": "archive_extract", "parameters": {}},
                {"operation": "image_convert", "parameters": {"format": "webp"}},
                {"operation": "images_to_pdf", "parameters": {}}
            ],
            "name": "Pipeline: ZIP -> Extract -> WebP Images -> PDF"
        },
        {
            "cat": "pipeline",
            "op": "pipeline_chain_2",
            "file": "sample.mp4",
            "pipeline_steps": [
                {"operation": "extract_audio", "parameters": {"format": "wav"}},
                {"operation": "audio_normalize", "parameters": {}},
                {"operation": "audio_convert", "parameters": {"format": "mp3"}}
            ],
            "name": "Pipeline: Video -> Extract Audio WAV -> Normalize -> Convert MP3"
        },
        {
            "cat": "pipeline",
            "op": "pipeline_chain_3",
            "file": "sample.md",
            "pipeline_steps": [
                {"operation": "markdown_convert", "parameters": {"format": "html"}},
                {"operation": "file_hash", "parameters": {"format": "txt"}}
            ],
            "name": "Pipeline: Markdown -> HTML -> File Hash"
        },
        {
            "cat": "pipeline",
            "op": "pipeline_chain_4",
            "file": "sample.epub",
            "pipeline_steps": [
                {"operation": "ebook_convert", "parameters": {"format": "docx"}}
            ],
            "name": "Pipeline: EPUB -> DOCX"
        }
    ]

    results = []
    print(f"\n[EXECUTION] Running {len(test_cases)} tests across all operations...")

    for idx, tc in enumerate(test_cases, 1):
        job_id = f"test_{idx:03d}"
        in_file = FIXTURES_DIR / tc["file"]
        name = tc["name"]
        cat = tc["cat"]
        op = tc["op"]
        print(f"[{idx:02d}/{len(test_cases):02d}] Testing '{name}' ({cat} -> {op})...", end=" ", flush=True)

        try:
            if cat == "pipeline":
                out_path, res = await pipeline_runner.execute_chain(
                    input_path=str(in_file),
                    steps=tc["pipeline_steps"],
                    output_dir=OUTPUT_DIR,
                    job_id=job_id
                )
            else:
                out_path, res = await processor_registry.dispatch(
                    operation=op,
                    input_path=str(in_file),
                    output_dir=str(OUTPUT_DIR),
                    job_id=job_id,
                    parameters=tc.get("params", {})
                )

            # Check verification criteria
            out_p = Path(out_path) if out_path else None
            exists = out_p.exists() if out_p else False
            size = 0
            if exists:
                if out_p.is_file():
                    size = out_p.stat().st_size
                elif out_p.is_dir():
                    size = sum(f.stat().st_size for f in out_p.rglob("*") if f.is_file())

            if res.success and exists and size > 0:
                print(f"PASSED ({size:,} bytes)")
                results.append({
                    "id": idx,
                    "name": name,
                    "cat": cat,
                    "op": op,
                    "file": tc["file"],
                    "params": tc.get("params", tc.get("pipeline_steps")),
                    "status": "PASSED",
                    "output": str(out_path),
                    "size": size,
                    "error": None,
                    "stderr": None
                })
            else:
                err_msg = res.stderr or res.stdout or "Output file missing or 0 bytes"
                print(f"FAILED: {err_msg[:80]}")
                results.append({
                    "id": idx,
                    "name": name,
                    "cat": cat,
                    "op": op,
                    "file": tc["file"],
                    "params": tc.get("params", tc.get("pipeline_steps")),
                    "status": "FAILED",
                    "output": str(out_path) if out_path else None,
                    "size": size,
                    "error": err_msg,
                    "stderr": res.stderr
                })
        except Exception as exc:
            err_msg = f"{type(exc).__name__}: {str(exc)}"
            tb = traceback.format_exc()
            print(f"FAILED (EXCEPTION): {err_msg[:80]}")
            results.append({
                "id": idx,
                "name": name,
                "cat": cat,
                "op": op,
                "file": tc["file"],
                "params": tc.get("params", tc.get("pipeline_steps")),
                "status": "FAILED",
                "output": None,
                "size": 0,
                "error": err_msg,
                "stderr": tb
            })

    # Summary
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASSED")
    failed = sum(1 for r in results if r["status"] == "FAILED")

    print("\n" + "="*60)
    print(f"AUDIT COMPLETED: {total} tests | {passed} PASSED | {failed} FAILED")
    print("="*60)

    # Write Markdown file
    md_content = generate_markdown_report(total, passed, failed, results)
    report_file = Path("/home/adityapatra/Documents/GitHub/universal-file-studio/TEST_MATRIX_AUDIT.md")
    report_file.write_text(md_content, encoding="utf-8")
    print(f"[REPORT] Saved full audit to: {report_file}")

def generate_markdown_report(total: int, passed: int, failed: int, results: List[Dict[str, Any]]) -> str:
    lines = []
    lines.append("# Universal File Studio - Comprehensive Test Matrix Audit")
    lines.append("")
    lines.append(f"**Execution Summary**:")
    lines.append(f"- **Total Test Cases**: {total}")
    lines.append(f"- **Passed**: {passed} ({passed/total*100:.1f}%)")
    lines.append(f"- **Failed**: {failed} ({failed/total*100:.1f}%)")
    lines.append("")

    if failed > 0:
        lines.append("## Discovered Failures & Issues To Solve")
        lines.append("")
        lines.append("| ID | Category | Operation | Test Name | Input File | Error Summary |")
        lines.append("|---|---|---|---|---|---|")
        for r in results:
            if r["status"] == "FAILED":
                clean_err = (r["error"] or "Unknown").replace("\n", " ").replace("|", "\\|")[:90]
                lines.append(f"| #{r['id']} | `{r['cat']}` | `{r['op']}` | {r['name']} | `{r['file']}` | {clean_err} |")
        lines.append("")

        lines.append("### Detailed Failure Diagnostics")
        lines.append("")
        for r in results:
            if r["status"] == "FAILED":
                lines.append(f"#### Test #{r['id']}: {r['name']} (`{r['op']}`)")
                lines.append(f"- **Category**: {r['cat']}")
                lines.append(f"- **Input File**: `{r['file']}`")
                lines.append(f"- **Parameters**: `{r['params']}`")
                lines.append(f"- **Output Path Reported**: `{r['output']}`")
                lines.append(f"- **Error Message**:\n```\n{r['error']}\n```")
                if r['stderr'] and r['stderr'] != r['error']:
                    lines.append(f"- **Traceback / Stderr**:\n```\n{r['stderr']}\n```")
                lines.append("")
    else:
        lines.append("## Status: 100% Tests Passed - Zero Failures Detected")
        lines.append("")

    lines.append("## All Executed Test Cases")
    lines.append("")
    lines.append("| ID | Category | Test Name | Operation | Input | Status | Output Size |")
    lines.append("|---|---|---|---|---|---|---|")
    for r in results:
        status_badge = "PASSED" if r["status"] == "PASSED" else "**FAILED**"
        size_str = f"{r['size']:,} B" if r["size"] > 0 else "0 B"
        lines.append(f"| {r['id']} | `{r['cat']}` | {r['name']} | `{r['op']}` | `{r['file']}` | {status_badge} | {size_str} |")
    lines.append("")

    return "\n".join(lines)

if __name__ == "__main__":
    asyncio.run(run_matrix())
