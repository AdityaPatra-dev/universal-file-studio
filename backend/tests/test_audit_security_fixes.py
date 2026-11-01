import pytest
import os
import io
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, AsyncMock

from app.security.path_validation import sanitize_filename, sanitize_format, validate_safe_path
from app.exceptions import PathTraversalError, ArchiveBombError, FileTooLargeError
from app.processors.registry import processor_registry
from app.engines.wrappers.ghostscript import ghostscript_engine
from app.engines.wrappers.sevenzip import sevenzip_engine
from app.engines.wrappers.libreoffice import libreoffice_engine
from app.processors.video import video_processor
from app.processors.audio import audio_processor
from app.processors.image import image_processor
from app.processors.hash import hash_processor

def test_sanitize_filename_windows_reserved_and_traversal():
    assert sanitize_filename("CON.txt") == "_CON.txt"
    assert sanitize_filename("aux.png") == "_aux.png"
    assert sanitize_filename("NUL") == "_NUL"
    assert sanitize_filename("../../etc/passwd") == "____etc_passwd"
    assert sanitize_filename("normal_file.pdf") == "normal_file.pdf"

def test_sanitize_format_allowlist_and_traversal():
    allowed = {"mp4", "webm", "mkv"}
    assert sanitize_format("mp4", allowed, "mp4") == "mp4"
    assert sanitize_format(".webm", allowed, "mp4") == "webm"
    assert sanitize_format("../../evil", allowed, "mp4") == "mp4"
    assert sanitize_format("exe", allowed, "mp4") == "mp4"
    assert sanitize_format("", allowed, "mp4") == "mp4"

def test_validate_safe_path_boundary_enforcement(tmp_path):
    root = tmp_path / "sandbox"
    root.mkdir()
    inside = root / "valid_file.txt"
    inside.write_text("safe")
    
    # Valid
    assert validate_safe_path(inside, root) == inside.resolve()

    # Traversal escape
    outside = tmp_path / "outside_secret.txt"
    outside.write_text("secret")
    with pytest.raises(PathTraversalError):
        validate_safe_path(outside, root)

def test_ghostscript_contains_dsafer():
    # Verify -dSAFER is present in all Ghostscript argument profiles
    from unittest.mock import patch
    with patch.object(ghostscript_engine, "execute", new_callable=AsyncMock) as mock_exec:
        import asyncio
        asyncio.run(ghostscript_engine.optimize("in.pdf", "out.pdf"))
        cmd = mock_exec.call_args[0][0]
        assert "-dSAFER" in cmd

        asyncio.run(ghostscript_engine.compress("in.pdf", "out.pdf"))
        cmd_comp = mock_exec.call_args[0][0]
        assert "-dSAFER" in cmd_comp

def test_libreoffice_macro_security_flags():
    from unittest.mock import patch
    with patch.object(libreoffice_engine, "execute", new_callable=AsyncMock) as mock_lo:
        import asyncio
        asyncio.run(libreoffice_engine.convert("test.docx", "/tmp"))
        cmd = mock_lo.call_args[0][0]
        assert "-env:OfficeSettings/MacroSecurity/Level=3" in cmd
        assert "--norestore" in cmd

@pytest.mark.anyio
async def test_sevenzip_archive_safety_bomb_and_traversal_detection(tmp_path):
    # Test path traversal in zip entry detection
    fake_zip = tmp_path / "suspicious.zip"
    fake_zip.write_bytes(b"PK\x03\x04")

    from unittest.mock import patch
    from app.engines.wrappers.base import ProcessResult

    # Mock 7z listing with traversal path
    malicious_manifest = (
        "Listing archive: /tmp/test.zip\n--\nPath = /tmp/test.zip\n----------\n"
        "Path = ../../../../etc/shadow\nSize = 100\n"
    )
    with patch.object(sevenzip_engine, "execute", return_value=ProcessResult(0, malicious_manifest, "", True, [])):
        with pytest.raises(ArchiveBombError):
            await sevenzip_engine.check_archive_safety(str(fake_zip))

    # Mock 7z listing with excessive uncompressed size
    huge_manifest = (
        "Listing archive: /tmp/bomb.zip\n--\nPath = /tmp/bomb.zip\n----------\n"
        f"Path = big.bin\nSize = {6 * 1024 * 1024 * 1024}\n"
    )
    with patch.object(sevenzip_engine, "execute", return_value=ProcessResult(0, huge_manifest, "", True, [])):
        with pytest.raises(ArchiveBombError):
            await sevenzip_engine.check_archive_safety(str(fake_zip))

@pytest.mark.anyio
async def test_processor_registry_rejects_unregistered_operation(tmp_path):
    dummy_file = tmp_path / "test.txt"
    dummy_file.write_text("sample")

    with pytest.raises(ValueError, match="is not recognized or supported"):
        await processor_registry.dispatch(
            operation="malicious_unregistered_op",
            input_path=str(dummy_file),
            output_dir=str(tmp_path),
            job_id="job999",
            parameters={}
        )

@pytest.mark.anyio
async def test_video_and_audio_format_and_param_sanitization(tmp_path):
    dummy_vid = tmp_path / "test.mp4"
    dummy_vid.write_bytes(b"\x00\x00\x00 ftyp")

    from unittest.mock import patch
    from app.engines.wrappers.base import ProcessResult

    # Test that malicious format path traversal string is neutralized
    with patch("app.processors.video.ffmpeg_engine.convert", new_callable=AsyncMock) as mock_conv:
        mock_conv.return_value = ProcessResult(0, "ok", "", True, [])
        out_file, res = await video_processor.process(
            operation="video_convert",
            input_path=str(dummy_vid),
            output_dir=str(tmp_path),
            job_id="secjob1",
            parameters={"format": "../../etc/malicious", "crf": "invalid_crf", "preset": "invalid_preset"}
        )
        assert out_file.endswith(".mp4")  # neutralized to default safe format
        assert mock_conv.call_args[1]["preset"] == "medium"
        assert mock_conv.call_args[1]["crf"] == 28

@pytest.mark.anyio
async def test_hash_processor_async_offload(tmp_path):
    sample = tmp_path / "data.bin"
    sample.write_bytes(b"A" * 100000)

    hashes = await hash_processor.compute_hashes(str(sample))
    assert "sha256" in hashes
    assert len(hashes["sha256"]) == 64
