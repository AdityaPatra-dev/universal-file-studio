import hashlib
import json
import os
import pytest
from pathlib import Path

from app.processors.hash import hash_processor
from app.processors.metadata import metadata_processor
from app.processors.ocr import ocr_processor
from app.processors.registry import processor_registry

@pytest.fixture
def temp_workdir(tmp_path):
    out_dir = tmp_path / "outputs"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir

@pytest.mark.anyio
async def test_hash_processor_computation(temp_workdir, tmp_path):
    test_content = b"Universal File Studio Cryptographic Hash Verification Test Payload"
    test_file = tmp_path / "hash_sample.bin"
    test_file.write_bytes(test_content)

    expected_sha256 = hashlib.sha256(test_content).hexdigest()
    expected_md5 = hashlib.md5(test_content).hexdigest()
    expected_sha1 = hashlib.sha1(test_content).hexdigest()

    hashes = await hash_processor.compute_hashes(str(test_file))
    assert hashes["sha256"] == expected_sha256
    assert hashes["md5"] == expected_md5
    assert hashes["sha1"] == expected_sha1

    # Test processing manifest generation
    out_file, res = await hash_processor.process(
        operation="file_hash",
        input_path=str(test_file),
        output_dir=temp_workdir,
        job_id="job_hash_001",
        parameters={"format": "txt"}
    )
    assert res.success is True
    assert os.path.exists(out_file)
    with open(out_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert expected_sha256 in content

@pytest.mark.anyio
async def test_metadata_stripping_image(temp_workdir, tmp_path):
    img_file = tmp_path / "photo.png"
    # Create simple PNG file
    from app.engines.wrappers.imagemagick import imagemagick_engine
    if not imagemagick_engine.is_installed():
        pytest.skip("ImageMagick is not installed.")

    # Generate an image using ImageMagick
    gen_cmd = [imagemagick_engine._get_bin(), "-size", "64x64", "xc:blue", "-set", "comment", "Confidential Camera Data", str(img_file)]
    await imagemagick_engine.execute(gen_cmd)
    assert os.path.exists(img_file)

    out_file, res = await metadata_processor.process(
        operation="strip_metadata",
        input_path=str(img_file),
        output_dir=temp_workdir,
        job_id="job_meta_001",
        parameters={}
    )
    assert res.success is True
    assert os.path.exists(out_file)
    assert os.path.getsize(out_file) > 0

@pytest.mark.anyio
async def test_ocr_processor_image_report(temp_workdir, tmp_path):
    img_file = tmp_path / "scan.png"
    valid_png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\n\x00\x00\x00\n\x01\x00\x00\x00\x00\xa5I\xf2\x10"
        b"\x00\x00\x00\x0eIDAT\x08\xd7c\xf8\x7f\x80\x017\x02\x00\x07R\x11w\xe6\xc8\xd0\xe3\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    img_file.write_bytes(valid_png)

    out_file, res = await ocr_processor.process(
        operation="ocr_image",
        input_path=str(img_file),
        output_dir=temp_workdir,
        job_id="job_ocr_001",
        parameters={"language": "eng", "format": "txt"}
    )
    assert res.success is True
    assert os.path.exists(out_file)

@pytest.mark.anyio
async def test_advanced_api_hash_and_metadata(client):
    # Upload test file
    sample_content = b"Studio Advanced Security & Checksums Payload"
    files = {"files": ("security_doc.txt", sample_content, "text/plain")}
    upload_res = await client.post("/api/v1/files/upload", files=files)
    assert upload_res.status_code == 200
    file_id = upload_res.json()[0]["id"]

    # 1. Test hash endpoint
    hash_res = await client.get(f"/api/v1/files/{file_id}/hash")
    assert hash_res.status_code == 200
    h_data = hash_res.json()
    assert "sha256" in h_data
    assert "md5" in h_data
    assert h_data["sha256"] == hashlib.sha256(sample_content).hexdigest()

    # 2. Test metadata endpoint
    meta_res = await client.get(f"/api/v1/files/{file_id}/metadata")
    assert meta_res.status_code == 200
    m_data = meta_res.json()
    assert m_data["file_id"] == file_id
    assert "metadata" in m_data
