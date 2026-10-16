# Universal File Studio - Comprehensive Test Matrix Audit

## Executive Summary
This document records the end-to-end matrix test across **all media formats, documents, archives, processors, engines, and sequential pipelines** supported by Universal File Studio.

- **Total Test Cases Executed**: 83
- **Passed**: 83 (100.0%)
- **Failed**: 0 (0.0%)
- **Engines Verified**: FFmpeg, ImageMagick, Poppler, Ghostscript, QPDF, 7-Zip, LibreOffice, Pandoc, Tesseract

---

## Errors Encountered During Initial Audit & Resolutions

During the initial matrix audit execution across 83 conversion and operation types, **3 errors** were discovered. All 3 errors were systematically investigated, patched, and verified to achieve a 100% pass rate.

### Issue 1: MP4 to GIF Conversion Error (`video_convert` with `format='gif'`)
- **Symptoms**: FFmpeg conversion failed with:
  ```text
  [gif @ 0x...] gif muxer supports only codec gif for type video
  [out#0/gif @ 0x...] Could not write header (incorrect codec parameters ?): Invalid argument
  ```
- **Root Cause**: In `backend/app/engines/wrappers/ffmpeg.py`, `get_best_video_encoder` defaulted to `libopenh264` / `mpeg4` when converting `.mp4` to `.gif`. Additionally, an audio stream encoder was included (`-c:a aac`), which is invalid for GIF muxers that only accept video with the `gif` codec and no audio tracks.
- **Fix Applied**: 
  - Updated `get_best_video_encoder` to explicitly return `"gif"` when `format_ext == "gif"`.
  - In `FFmpegEngine.convert`, added check: when the target output is `.gif`, pass `["-c:v", "gif", "-an"]` to ensure clean animation generation without audio streams.
- **Verification**: Retested against `sample.mp4`. Generated valid animated GIF (`123,004 bytes`, returncode 0).

---

### Issue 2: PDF to JPG Page Extraction Flag Failure (`pdf_to_images` with `format='jpg'`)
- **Symptoms**: `pdftoppm` exited with returncode 99 and usage help:
  ```text
  Usage: pdftoppm [options] [PDF-file [PPM-file-prefix]]
  -png: generate a PNG file
  -jpeg: generate a JPEG file
  ```
- **Root Cause**: In `backend/app/engines/wrappers/poppler.py`, `pdf_to_image` passed `f"-{format}"` directly to `pdftoppm`. For `format="jpg"`, this resulted in `-jpg`, which is not a valid flag in Poppler (the Poppler CLI requires `-jpeg`).
- **Fix Applied**:
  - Normalized format flag in `PopplerEngine.pdf_to_image`: mapped both `"jpg"` and `"jpeg"` to `-jpeg`.
  - In `backend/app/processors/pdf.py`, added defense for `first_page` checking both `.jpg` and `.jpeg` extensions on output verification.
- **Verification**: Retested on 2-page `sample.pdf`. Successfully generated `sample_test_047_page-1.jpg` (`19,577 bytes`) and `sample_test_047_page-2.jpg`.

---

### Issue 3: EPUB to TXT Pandoc Unknown Format Error (`ebook_convert` with `format='txt'`)
- **Symptoms**: Pandoc exited with error:
  ```text
  Unknown output format 'txt'
  ```
- **Root Cause**: Pandoc's CLI option `-t` uses `plain` as the format name for plain text output, rather than `txt`. Passing `-t txt` causes Pandoc to abort with an unknown format error.
- **Fix Applied**:
  - In `backend/app/engines/wrappers/pandoc.py`, added format normalization for both `format_from` and `format_to`: mapped `"txt"` and `"text"` to `"plain"`, and `"md"` to `"markdown"`.
  - In `backend/app/processors/document.py`, updated `_convert_ebook` to map `target_fmt` of `"txt"` to `format_to="plain"`.
- **Verification**: Retested on `sample.epub` (`Ode of the Brave`). Successfully extracted the complete novel to clean plain text (`1,435,110 bytes`, returncode 0).

---

## Complete Verification Matrix (83 Test Cases)

| ID | Category | Test Name | Operation | Input Format | Output Size | Result |
|:---|:---|:---|:---|:---|:---|:---:|
| 1 | `image` | PNG to WebP | `image_convert` | `.png` | 828 B | **PASSED** |
| 2 | `image` | PNG to JPG | `image_convert` | `.png` | 3,370 B | **PASSED** |
| 3 | `image` | PNG to AVIF | `image_convert` | `.png` | 3,324 B | **PASSED** |
| 4 | `image` | PNG to TIFF | `image_convert` | `.png` | 240,264 B | **PASSED** |
| 5 | `image` | PNG to BMP | `image_convert` | `.png` | 120,138 B | **PASSED** |
| 6 | `image` | PNG to GIF | `image_convert` | `.png` | 1,698 B | **PASSED** |
| 7 | `image` | JPG to PNG | `image_convert` | `.jpg` | 5,878 B | **PASSED** |
| 8 | `image` | WebP to PNG | `image_convert` | `.webp` | 5,981 B | **PASSED** |
| 9 | `image` | Image Resize (100x100) | `image_resize` | `.png` | 408 B | **PASSED** |
| 10 | `image` | Image Crop (80x80) | `image_crop` | `.png` | 88 B | **PASSED** |
| 11 | `image` | Image Rotate 90 | `image_rotate` | `.png` | 842 B | **PASSED** |
| 12 | `image` | Image Flip Horizontal | `image_flip` | `.png` | 824 B | **PASSED** |
| 13 | `image` | Image Flip Vertical | `image_flip` | `.png` | 848 B | **PASSED** |
| 14 | `image` | Image Compress Quality | `image_compress` | `.jpg` | 740 B | **PASSED** |
| 15 | `image` | Image Grayscale | `image_grayscale` | `.png` | 586 B | **PASSED** |
| 16 | `image` | Image Strip Metadata | `image_strip_metadata` | `.jpg` | 3,372 B | **PASSED** |
| 17 | `video` | MP4 to MKV | `video_convert` | `.mp4` | 50,032 B | **PASSED** |
| 18 | `video` | MP4 to WebM | `video_convert` | `.mp4` | 25,905 B | **PASSED** |
| 19 | `video` | MP4 to AVI | `video_convert` | `.mp4` | 60,922 B | **PASSED** |
| 20 | `video` | MP4 to MOV | `video_convert` | `.mp4` | 50,702 B | **PASSED** |
| 21 | `video` | MP4 to GIF animation | `video_convert` | `.mp4` | 123,004 B | **PASSED (Fixed)** |
| 22 | `video` | Video Compress CRF | `video_compress` | `.mp4` | 57,721 B | **PASSED** |
| 23 | `video` | Video Resize (160x120) | `video_resize` | `.mp4` | 41,614 B | **PASSED** |
| 24 | `video` | Video Crop (160x120) | `video_crop` | `.mp4` | 16,955 B | **PASSED** |
| 25 | `video` | Video Trim (00:00:00-00:00:01) | `video_trim` | `.mp4` | 35,092 B | **PASSED** |
| 26 | `video` | Video Rotate 90 | `video_rotate` | `.mp4` | 52,477 B | **PASSED** |
| 27 | `video` | Video Flip Horizontal | `video_flip` | `.mp4` | 51,493 B | **PASSED** |
| 28 | `video` | Video Change FPS (15 fps) | `video_change_fps` | `.mp4` | 43,221 B | **PASSED** |
| 29 | `video` | Video Change Speed (2.0x) | `video_change_speed` | `.mp4` | 33,847 B | **PASSED** |
| 30 | `video` | Video Reverse | `video_reverse` | `.mp4` | 54,695 B | **PASSED** |
| 31 | `video` | Video Extract Audio MP3 | `extract_audio` | `.mp4` | 12,659 B | **PASSED** |
| 32 | `video` | Video Extract Audio WAV | `extract_audio` | `.mp4` | 13,400 B | **PASSED** |
| 33 | `video` | Video Extract Audio AAC | `extract_audio` | `.mp4` | 13,828 B | **PASSED** |
| 34 | `video` | Video Remove Audio (Mute) | `remove_audio` | `.mp4` | 35,164 B | **PASSED** |
| 35 | `video` | Video Extract Frames | `extract_frames` | `.mp4` | 23,993 B | **PASSED** |
| 36 | `audio` | MP3 to WAV | `audio_convert` | `.mp3` | 132,378 B | **PASSED** |
| 37 | `audio` | MP3 to OGG | `audio_convert` | `.mp3` | 6,131 B | **PASSED** |
| 38 | `audio` | MP3 to FLAC | `audio_convert` | `.mp3` | 83,824 B | **PASSED** |
| 39 | `audio` | MP3 to AAC | `audio_convert` | `.mp3` | 27,170 B | **PASSED** |
| 40 | `audio` | WAV to MP3 | `audio_convert` | `.wav` | 37,660 B | **PASSED** |
| 41 | `audio` | Audio Compress (64k) | `audio_compress` | `.mp3` | 12,582 B | **PASSED** |
| 42 | `audio` | Audio Trim (00:00:00-00:00:01) | `audio_trim` | `.mp3` | 8,612 B | **PASSED** |
| 43 | `audio` | Audio Loudness Normalize | `audio_normalize` | `.mp3` | 12,525 B | **PASSED** |
| 44 | `audio` | Audio Change Speed (1.5x) | `audio_change_speed` | `.mp3` | 8,586 B | **PASSED** |
| 45 | `audio` | Audio Reverse | `audio_reverse` | `.mp3` | 12,556 B | **PASSED** |
| 46 | `pdf` | PDF to PNG Pages | `pdf_to_images` | `.pdf` | 13,962 B | **PASSED** |
| 47 | `pdf` | PDF to JPG Pages | `pdf_to_images` | `.pdf` | 19,577 B | **PASSED (Fixed)** |
| 48 | `pdf` | PDF Extract Text | `pdf_to_text` | `.pdf` | 2 B | **PASSED** |
| 49 | `pdf` | PDF Compress Ghostscript | `pdf_compress` | `.pdf` | 9,120 B | **PASSED** |
| 50 | `pdf` | PDF Rotate Pages (90 deg) | `pdf_rotate_pages` | `.pdf` | 4,967 B | **PASSED** |
| 51 | `pdf` | PDF Extract Page 1 | `pdf_extract_pages` | `.pdf` | 2,808 B | **PASSED** |
| 52 | `pdf` | CBZ to PDF (Manga compile) | `archive_to_pdf` | `.cbz` | 8,420 B | **PASSED** |
| 53 | `pdf` | Image to PDF | `images_to_pdf` | `.png` | 4,124 B | **PASSED** |
| 54 | `document` | Markdown to HTML | `markdown_convert` | `.md` | 228 B | **PASSED** |
| 55 | `document` | Markdown to DOCX | `markdown_convert` | `.md` | 6,177 B | **PASSED** |
| 56 | `document` | Markdown to PDF | `markdown_convert` | `.md` | 40,943 B | **PASSED** |
| 57 | `document` | Markdown to Plain TXT | `markdown_convert` | `.md` | 121 B | **PASSED** |
| 58 | `document` | TXT to HTML | `text_convert` | `.txt` | 86 B | **PASSED** |
| 59 | `document` | TXT to DOCX | `text_convert` | `.txt` | 5,121 B | **PASSED** |
| 60 | `document` | TXT to PDF | `text_convert` | `.txt` | 15,265 B | **PASSED** |
| 61 | `document` | EPUB to DOCX | `ebook_convert` | `.epub` | 595,201 B | **PASSED** |
| 62 | `document` | EPUB to HTML | `ebook_convert` | `.epub` | 1,531,484 B | **PASSED** |
| 63 | `document` | EPUB to TXT | `ebook_convert` | `.epub` | 1,435,110 B | **PASSED (Fixed)** |
| 64 | `document` | EPUB to PDF (Pandoc + LibreOffice) | `ebook_convert` | `.epub` | 5,033,381 B | **PASSED** |
| 65 | `document` | DOCX to PDF (LibreOffice) | `document_convert` | `.docx` | 27,353 B | **PASSED** |
| 66 | `document` | CSV to XLSX | `spreadsheet_convert` | `.csv` | 5,704 B | **PASSED** |
| 67 | `archive` | Archive Create ZIP | `archive_create` | `.png` | 2,749 B | **PASSED** |
| 68 | `archive` | Archive Create TAR | `archive_create` | `.png` | 5,120 B | **PASSED** |
| 69 | `archive` | Archive Create 7Z | `archive_create` | `.png` | 2,681 B | **PASSED** |
| 70 | `archive` | Archive Extract ZIP | `archive_extract` | `.zip` | 3,403 B | **PASSED** |
| 71 | `archive` | Archive List Manifest | `archive_list` | `.zip` | 129 B | **PASSED** |
| 72 | `archive` | Archive Test Integrity | `archive_test` | `.zip` | 3,619 B | **PASSED** |
| 73 | `advanced` | OCR Image (Tesseract) | `ocr_image` | `.png` | 9 B | **PASSED** |
| 74 | `advanced` | OCR PDF / Text Extract | `ocr_pdf` | `.pdf` | 2 B | **PASSED** |
| 75 | `advanced` | Inspect Video Metadata | `metadata_inspect` | `.mp4` | 3,739 B | **PASSED** |
| 76 | `advanced` | Inspect Image Metadata | `metadata_inspect` | `.png` | 210 B | **PASSED** |
| 77 | `advanced` | Video Strip Metadata | `video_strip_metadata` | `.mp4` | 49,763 B | **PASSED** |
| 78 | `advanced` | Audio Strip Metadata | `audio_strip_metadata` | `.mp3` | 12,582 B | **PASSED** |
| 79 | `advanced` | Hash Checksums (SHA-256, MD5, CRC32) | `file_hash` | `.png` | 376 B | **PASSED** |
| 80 | `pipeline` | Pipeline: ZIP -> Extract -> WebP Images -> PDF | `pipeline_chain_1` | `.zip` | 4,059 B | **PASSED** |
| 81 | `pipeline` | Pipeline: Video -> Extract Audio WAV -> Normalize -> Convert MP3 | `pipeline_chain_2` | `.mp4` | 3,501 B | **PASSED** |
| 82 | `pipeline` | Pipeline: Markdown -> HTML -> File Hash | `pipeline_chain_3` | `.md` | 372 B | **PASSED** |
| 83 | `pipeline` | Pipeline: EPUB -> DOCX | `pipeline_chain_4` | `.epub` | 595,200 B | **PASSED** |
