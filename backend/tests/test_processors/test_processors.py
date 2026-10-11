import pytest
import os
from pathlib import Path
from app.processors.video import video_processor
from app.processors.audio import audio_processor
from app.processors.image import image_processor
from app.processors.archive import archive_processor
from app.processors.registry import processor_registry
from app.engines.wrappers.ffmpeg import ffmpeg_engine
from app.engines.wrappers.imagemagick import imagemagick_engine
from app.engines.wrappers.sevenzip import sevenzip_engine

@pytest.fixture
def tmp_dir(tmp_path):
    return tmp_path

@pytest.mark.anyio
async def test_video_processor(tmp_dir):
    if not ffmpeg_engine.is_installed():
        pytest.skip("FFmpeg not installed")

    # Generate synthetic video with audio stream
    src_vid = str(tmp_dir / "test_video.mp4")
    v_enc = ffmpeg_engine.get_best_video_encoder(".mp4")
    a_enc = ffmpeg_engine.get_best_audio_encoder(".mp4")
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "testsrc=duration=1:size=320x240:rate=10",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=1",
        "-c:v", v_enc, "-c:a", a_enc,
        "-shortest",
        src_vid
    ]
    await ffmpeg_engine.execute(cmd)

    # 1. Video convert to webm
    out_file, res = await video_processor.process(
        operation="video_convert",
        input_path=src_vid,
        output_dir=str(tmp_dir),
        job_id="testjob123",
        parameters={"format": "webm"}
    )
    assert res.success is True
    assert os.path.exists(out_file)

    # 2. Extract audio
    out_audio, res_a = await video_processor.process(
        operation="extract_audio",
        input_path=src_vid,
        output_dir=str(tmp_dir),
        job_id="testjob124",
        parameters={"format": "mp3"}
    )
    assert res_a.success is True
    assert os.path.exists(out_audio)

@pytest.mark.anyio
async def test_audio_processor(tmp_dir):
    if not ffmpeg_engine.is_installed():
        pytest.skip("FFmpeg not installed")

    # Generate synthetic audio tone (1 second sine wave)
    src_audio = str(tmp_dir / "test_tone.wav")
    cmd = ["ffmpeg", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", src_audio]
    await ffmpeg_engine.execute(cmd)

    # 1. Audio convert to mp3
    out_mp3, res_c = await audio_processor.process(
        operation="audio_convert",
        input_path=src_audio,
        output_dir=str(tmp_dir),
        job_id="testaudio1",
        parameters={"format": "mp3", "bitrate": 128}
    )
    assert res_c.success is True
    assert os.path.exists(out_mp3)

    # 2. Audio normalize (loudnorm)
    out_norm, res_n = await audio_processor.process(
        operation="audio_normalize",
        input_path=out_mp3,
        output_dir=str(tmp_dir),
        job_id="testaudio2",
        parameters={}
    )
    assert res_n.success is True
    assert os.path.exists(out_norm)

@pytest.mark.anyio
async def test_image_processor(tmp_dir):
    if not imagemagick_engine.is_installed():
        pytest.skip("ImageMagick not installed")

    # Generate synthetic image
    src_img = str(tmp_dir / "test_img.png")
    await imagemagick_engine.execute([imagemagick_engine._get_bin(), "-size", "80x80", "xc:red", src_img])

    # 1. Convert to webp
    out_webp, res = await image_processor.process(
        operation="image_convert",
        input_path=src_img,
        output_dir=str(tmp_dir),
        job_id="testimg1",
        parameters={"format": "webp"}
    )
    assert res.success is True
    assert os.path.exists(out_webp)

    # 2. Image grayscale
    out_gray, res_g = await image_processor.process(
        operation="image_grayscale",
        input_path=src_img,
        output_dir=str(tmp_dir),
        job_id="testimg2",
        parameters={}
    )
    assert res_g.success is True
    assert os.path.exists(out_gray)

@pytest.mark.anyio
async def test_processor_registry_dispatch(tmp_dir):
    sample = tmp_dir / "sample.txt"
    sample.write_text("Hello Processor Registry")

    out_file, res = await processor_registry.dispatch(
        operation="archive_create",
        input_path=str(sample),
        output_dir=str(tmp_dir),
        job_id="testreg1",
        parameters={"format": "zip"}
    )
    assert res.success is True
    assert os.path.exists(out_file)
    assert out_file.endswith(".zip")
