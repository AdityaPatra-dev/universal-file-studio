import pytest
import os
import subprocess
from pathlib import Path
from app.engines.wrappers import (
    ffmpeg_engine,
    imagemagick_engine,
    sevenzip_engine,
    poppler_engine,
    ghostscript_engine,
    libreoffice_engine,
    pandoc_engine,
    tesseract_engine,
)

@pytest.fixture
def temp_dir(tmp_path):
    return tmp_path

@pytest.mark.anyio
async def test_engine_installation_checks():
    # Detected engines on host
    assert ffmpeg_engine.is_installed() is True
    assert imagemagick_engine.is_installed() is True
    assert sevenzip_engine.is_installed() is True
    assert poppler_engine.is_installed() is True
    assert ghostscript_engine.is_installed() is True
    assert libreoffice_engine.is_installed() is True

    # Engines not installed on host
    assert pandoc_engine.is_installed() is False
    assert tesseract_engine.is_installed() is False

@pytest.mark.anyio
async def test_uninstalled_engine_raises_clean_error():
    # Attempting to execute an uninstalled engine must fail gracefully
    with pytest.raises(RuntimeError) as exc_info:
        await pandoc_engine.execute(["pandoc", "--version"])
    assert "not installed" in str(exc_info.value)

@pytest.mark.anyio
async def test_ffmpeg_wrapper_operations(temp_dir):
    if not ffmpeg_engine.is_installed():
        pytest.skip("FFmpeg is not installed")

    # 1. Create a 1-second synthetic video
    src_video = str(temp_dir / "synthetic_in.mp4")
    cmd = ["ffmpeg", "-y", "-f", "lavfi", "-i", "testsrc=duration=1:size=320x240:rate=10", "-pix_fmt", "yuv420p", src_video]
    proc = await ffmpeg_engine.execute(cmd)
    assert proc.success is True
    assert os.path.exists(src_video)

    # 2. Test convert
    out_video = str(temp_dir / "converted.webm")
    conv_res = await ffmpeg_engine.convert(src_video, out_video, video_codec="libvpx")
    assert conv_res.success is True
    assert os.path.exists(out_video)

    # 3. Test resize
    resized_video = str(temp_dir / "resized.mp4")
    resize_res = await ffmpeg_engine.resize(src_video, resized_video, width=160, height=120)
    assert resize_res.success is True
    assert os.path.exists(resized_video)

@pytest.mark.anyio
async def test_imagemagick_wrapper_operations(temp_dir):
    if not imagemagick_engine.is_installed():
        pytest.skip("ImageMagick is not installed")

    # 1. Create a synthetic test image
    src_img = str(temp_dir / "sample.png")
    bin_cmd = "magick"
    await imagemagick_engine.execute([bin_cmd, "-size", "100x100", "xc:blue", src_img])
    assert os.path.exists(src_img)

    # 2. Test convert
    out_webp = str(temp_dir / "sample.webp")
    conv_res = await imagemagick_engine.convert(src_img, out_webp)
    assert conv_res.success is True
    assert os.path.exists(out_webp)

    # 3. Test resize
    resized_img = str(temp_dir / "resized.png")
    resize_res = await imagemagick_engine.resize(src_img, resized_img, width=50, height=50)
    assert resize_res.success is True
    assert os.path.exists(resized_img)

    # 4. Test metadata inspection
    meta = await imagemagick_engine.metadata(src_img)
    assert meta.get("width") == 100
    assert meta.get("height") == 100

@pytest.mark.anyio
async def test_sevenzip_wrapper_operations(temp_dir):
    if not sevenzip_engine.is_installed():
        pytest.skip("7-Zip is not installed")

    # 1. Create a dummy file
    sample_file = temp_dir / "hello.txt"
    sample_file.write_text("Hello 7-Zip from Universal File Studio!")

    # 2. Test archive creation
    archive_path = str(temp_dir / "archive.7z")
    create_res = await sevenzip_engine.create(archive_path, [str(sample_file)])
    assert create_res.success is True
    assert os.path.exists(archive_path)

    # 3. Test archive listing
    file_list = await sevenzip_engine.list(archive_path)
    assert any("hello.txt" in f for f in file_list)

    # 4. Test archive extraction
    extract_dir = str(temp_dir / "extracted")
    ext_res = await sevenzip_engine.extract(archive_path, extract_dir)
    assert ext_res.success is True
    assert os.path.exists(os.path.join(extract_dir, "hello.txt"))

