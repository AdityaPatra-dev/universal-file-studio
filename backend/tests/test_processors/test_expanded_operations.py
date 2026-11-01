import pytest
import os
import shutil
from pathlib import Path

from app.processors.video import video_processor
from app.processors.audio import audio_processor
from app.processors.image import image_processor
from app.processors.pdf import pdf_processor
from app.processors.archive import archive_processor
from app.engines.wrappers.ffmpeg import ffmpeg_engine
from app.engines.wrappers.imagemagick import imagemagick_engine
from app.engines.wrappers.sevenzip import sevenzip_engine
from app.engines.wrappers.poppler import poppler_engine
from app.engines.wrappers.ghostscript import ghostscript_engine

@pytest.fixture
def tmp_dir(tmp_path):
    return tmp_path

@pytest.mark.anyio
async def test_expanded_video_operations(tmp_dir):
    if not ffmpeg_engine.is_installed():
        pytest.skip("FFmpeg not installed")

    # Generate test video (1 second, 320x240, 10fps, with 440Hz sine audio)
    src_vid = str(tmp_dir / "base_video.mp4")
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

    # 1. Video compress
    out_comp, res = await video_processor.process(
        operation="video_compress",
        input_path=src_vid,
        output_dir=str(tmp_dir),
        job_id="exp_v01",
        parameters={"crf": 32}
    )
    assert res.success is True
    assert os.path.exists(out_comp)

    # 2. Video trim
    out_trim, res = await video_processor.process(
        operation="video_trim",
        input_path=src_vid,
        output_dir=str(tmp_dir),
        job_id="exp_v02",
        parameters={"start": "00:00:00", "duration": "0.5"}
    )
    assert res.success is True
    assert os.path.exists(out_trim)

    # 3. Video resize
    out_resz, res = await video_processor.process(
        operation="video_resize",
        input_path=src_vid,
        output_dir=str(tmp_dir),
        job_id="exp_v03",
        parameters={"width": 160, "height": 120}
    )
    assert res.success is True
    assert os.path.exists(out_resz)

    # 4. Video crop
    out_crop, res = await video_processor.process(
        operation="video_crop",
        input_path=src_vid,
        output_dir=str(tmp_dir),
        job_id="exp_v04",
        parameters={"width": 100, "height": 100, "x": 10, "y": 10}
    )
    assert res.success is True
    assert os.path.exists(out_crop)

    # 5. Video rotate (90 deg)
    out_rot, res = await video_processor.process(
        operation="video_rotate",
        input_path=src_vid,
        output_dir=str(tmp_dir),
        job_id="exp_v05",
        parameters={"degrees": 90}
    )
    assert res.success is True
    assert os.path.exists(out_rot)

    # 6. Video flip (horizontal)
    out_flip, res = await video_processor.process(
        operation="video_flip",
        input_path=src_vid,
        output_dir=str(tmp_dir),
        job_id="exp_v06",
        parameters={"direction": "horizontal"}
    )
    assert res.success is True
    assert os.path.exists(out_flip)

    # 7. Video change FPS
    out_fps, res = await video_processor.process(
        operation="video_change_fps",
        input_path=src_vid,
        output_dir=str(tmp_dir),
        job_id="exp_v07",
        parameters={"fps": 15}
    )
    assert res.success is True
    assert os.path.exists(out_fps)

    # 8. Video change speed
    out_spd, res = await video_processor.process(
        operation="video_change_speed",
        input_path=src_vid,
        output_dir=str(tmp_dir),
        job_id="exp_v08",
        parameters={"speed": 1.5}
    )
    assert res.success is True
    assert os.path.exists(out_spd)

    # 9. Video reverse
    out_rev, res = await video_processor.process(
        operation="video_reverse",
        input_path=src_vid,
        output_dir=str(tmp_dir),
        job_id="exp_v09",
        parameters={}
    )
    assert res.success is True
    assert os.path.exists(out_rev)

    # 10. Video remove audio (mute)
    out_mute, res = await video_processor.process(
        operation="remove_audio",
        input_path=src_vid,
        output_dir=str(tmp_dir),
        job_id="exp_v10",
        parameters={}
    )
    assert res.success is True
    assert os.path.exists(out_mute)

    # 11. Extract frames
    out_frames, res = await video_processor.process(
        operation="extract_frames",
        input_path=src_vid,
        output_dir=str(tmp_dir),
        job_id="exp_v11",
        parameters={"fps": 2, "format": "jpg"}
    )
    assert res.success is True
    assert os.path.isdir(out_frames)

@pytest.mark.anyio
async def test_expanded_audio_operations(tmp_dir):
    if not ffmpeg_engine.is_installed():
        pytest.skip("FFmpeg not installed")

    # Generate synthetic audio tone
    src_audio = str(tmp_dir / "base_tone.wav")
    cmd = ["ffmpeg", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", src_audio]
    await ffmpeg_engine.execute(cmd)

    # 1. Audio compress
    out_comp, res = await audio_processor.process(
        operation="audio_compress",
        input_path=src_audio,
        output_dir=str(tmp_dir),
        job_id="exp_a01",
        parameters={"bitrate": 96}
    )
    assert res.success is True
    assert os.path.exists(out_comp)

    # 2. Audio trim
    out_trim, res = await audio_processor.process(
        operation="audio_trim",
        input_path=src_audio,
        output_dir=str(tmp_dir),
        job_id="exp_a02",
        parameters={"start": "00:00:00", "duration": "0.5"}
    )
    assert res.success is True
    assert os.path.exists(out_trim)

    # 3. Audio change speed
    out_spd, res = await audio_processor.process(
        operation="audio_change_speed",
        input_path=src_audio,
        output_dir=str(tmp_dir),
        job_id="exp_a03",
        parameters={"speed": 1.5}
    )
    assert res.success is True
    assert os.path.exists(out_spd)

    # 4. Audio reverse
    out_rev, res = await audio_processor.process(
        operation="audio_reverse",
        input_path=src_audio,
        output_dir=str(tmp_dir),
        job_id="exp_a04",
        parameters={}
    )
    assert res.success is True
    assert os.path.exists(out_rev)

    # 5. Audio merge (folder with 2 audio files)
    aud_folder = tmp_dir / "aud_merge_src"
    aud_folder.mkdir()
    shutil.copy(src_audio, str(aud_folder / "track1.wav"))
    shutil.copy(src_audio, str(aud_folder / "track2.wav"))
    out_merge, res = await audio_processor.process(
        operation="audio_merge",
        input_path=str(aud_folder),
        output_dir=str(tmp_dir),
        job_id="exp_a05",
        parameters={"format": "mp3"}
    )
    assert res.success is True
    assert os.path.exists(out_merge)

@pytest.mark.anyio
async def test_expanded_image_operations(tmp_dir):
    if not imagemagick_engine.is_installed():
        pytest.skip("ImageMagick not installed")

    src_img = str(tmp_dir / "base_img.png")
    await imagemagick_engine.execute([imagemagick_engine._get_bin(), "-size", "120x80", "xc:blue", src_img])

    # 1. Image resize
    out_resz, res = await image_processor.process(
        operation="image_resize",
        input_path=src_img,
        output_dir=str(tmp_dir),
        job_id="exp_i01",
        parameters={"width": 60, "height": 40}
    )
    assert res.success is True
    assert os.path.exists(out_resz)

    # 2. Image crop
    out_crop, res = await image_processor.process(
        operation="image_crop",
        input_path=src_img,
        output_dir=str(tmp_dir),
        job_id="exp_i02",
        parameters={"width": 50, "height": 50, "x": 5, "y": 5}
    )
    assert res.success is True
    assert os.path.exists(out_crop)

    # 3. Image rotate
    out_rot, res = await image_processor.process(
        operation="image_rotate",
        input_path=src_img,
        output_dir=str(tmp_dir),
        job_id="exp_i03",
        parameters={"degrees": 180}
    )
    assert res.success is True
    assert os.path.exists(out_rot)

    # 4. Image flip
    out_flip, res = await image_processor.process(
        operation="image_flip",
        input_path=src_img,
        output_dir=str(tmp_dir),
        job_id="exp_i04",
        parameters={"direction": "vertical"}
    )
    assert res.success is True
    assert os.path.exists(out_flip)

    # 5. Image compress
    out_comp, res = await image_processor.process(
        operation="image_compress",
        input_path=src_img,
        output_dir=str(tmp_dir),
        job_id="exp_i05",
        parameters={"quality": 60}
    )
    assert res.success is True
    assert os.path.exists(out_comp)

@pytest.mark.anyio
async def test_expanded_pdf_operations(tmp_dir):
    if not poppler_engine.is_installed() or not ghostscript_engine.is_installed():
        pytest.skip("Poppler or Ghostscript not installed")

    # Generate synthetic 2-page PDF
    src_pdf = str(tmp_dir / "base_doc.pdf")
    img1 = str(tmp_dir / "p1.png")
    img2 = str(tmp_dir / "p2.png")
    magick = imagemagick_engine._get_bin()
    await imagemagick_engine.execute([magick, "-size", "100x100", "xc:red", img1])
    await imagemagick_engine.execute([magick, "-size", "100x100", "xc:green", img2])
    await imagemagick_engine.execute([magick, img1, img2, src_pdf])

    # 1. PDF to text
    out_txt, res = await pdf_processor.process(
        operation="pdf_to_text",
        input_path=src_pdf,
        output_dir=str(tmp_dir),
        job_id="exp_p01",
        parameters={}
    )
    assert res.success is True
    assert os.path.exists(out_txt)

    # 2. PDF to images
    out_imgs, res = await pdf_processor.process(
        operation="pdf_to_images",
        input_path=src_pdf,
        output_dir=str(tmp_dir),
        job_id="exp_p02",
        parameters={"format": "png", "dpi": 100}
    )
    assert res.success is True
    assert os.path.exists(out_imgs)

    # 3. PDF compress
    out_comp, res = await pdf_processor.process(
        operation="pdf_compress",
        input_path=src_pdf,
        output_dir=str(tmp_dir),
        job_id="exp_p03",
        parameters={"quality": "ebook"}
    )
    assert res.success is True
    assert os.path.exists(out_comp)

    # 4. PDF split
    out_split, res = await pdf_processor.process(
        operation="pdf_split",
        input_path=src_pdf,
        output_dir=str(tmp_dir),
        job_id="exp_p04",
        parameters={}
    )
    assert res.success is True
    assert os.path.isdir(out_split)

@pytest.mark.anyio
async def test_expanded_archive_operations(tmp_dir):
    if not sevenzip_engine.is_installed():
        pytest.skip("7-Zip not installed")

    # Create test archive
    src_file = tmp_dir / "doc.txt"
    src_file.write_text("Archive test content")
    out_arc, res = await archive_processor.process(
        operation="archive_create",
        input_path=str(src_file),
        output_dir=str(tmp_dir),
        job_id="exp_arc01",
        parameters={"format": "zip"}
    )
    assert res.success is True
    assert os.path.exists(out_arc)

    # 1. Archive list
    out_list, res = await archive_processor.process(
        operation="archive_list",
        input_path=out_arc,
        output_dir=str(tmp_dir),
        job_id="exp_arc02",
        parameters={}
    )
    assert res.success is True
    assert os.path.exists(out_list)
    manifest = Path(out_list).read_text(encoding="utf-8")
    assert "doc.txt" in manifest

    # 2. Archive test
    _, res = await archive_processor.process(
        operation="archive_test",
        input_path=out_arc,
        output_dir=str(tmp_dir),
        job_id="exp_arc03",
        parameters={}
    )
    assert res.success is True

    # 3. Archive extract
    out_extract, res = await archive_processor.process(
        operation="archive_extract",
        input_path=out_arc,
        output_dir=str(tmp_dir),
        job_id="exp_arc04",
        parameters={}
    )
    assert res.success is True
    assert os.path.isdir(out_extract)
    assert os.path.exists(os.path.join(out_extract, "doc.txt"))
