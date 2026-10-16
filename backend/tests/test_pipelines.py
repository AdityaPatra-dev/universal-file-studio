import os
import pytest
from pathlib import Path

from app.processors.pipeline_runner import pipeline_runner

@pytest.fixture
def temp_workdir(tmp_path):
    out_dir = tmp_path / "pipeline_outputs"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir

@pytest.mark.anyio
async def test_pipeline_runner_chain_execution(temp_workdir, tmp_path):
    # Step 1: Input Markdown
    md_file = tmp_path / "article.md"
    md_file.write_text("# Chapter 1\n\nFirst paragraph of text.\n", encoding="utf-8")

    # Pipeline Chain: Markdown -> HTML -> SHA256 Checksum
    steps = [
        {"operation": "markdown_convert", "parameters": {"format": "html"}},
        {"operation": "file_hash", "parameters": {"format": "txt"}}
    ]

    out_file, res = await pipeline_runner.execute_chain(
        input_path=str(md_file),
        steps=steps,
        output_dir=temp_workdir,
        job_id="pipe_test_001"
    )

    assert res.success is True
    assert os.path.exists(out_file)
    with open(out_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "SHA256:" in content

@pytest.mark.anyio
async def test_pipelines_api_crud(client):
    # 1. List pipelines (seeds defaults)
    list_res = await client.get("/api/v1/pipelines")
    assert list_res.status_code == 200
    pipelines = list_res.json()
    assert len(pipelines) >= 4

    # 2. Create custom pipeline
    create_payload = {
        "name": "Custom Audio Stripper",
        "description": "Extract and strip audio metadata",
        "steps": [
            {"operation": "extract_audio", "parameters": {"format": "mp3"}},
            {"operation": "strip_metadata", "parameters": {}}
        ]
    }
    create_res = await client.post("/api/v1/pipelines", json=create_payload)
    assert create_res.status_code == 200
    created = create_res.json()
    p_id = created["id"]
    assert created["name"] == "Custom Audio Stripper"

    # 3. Get single pipeline
    get_res = await client.get(f"/api/v1/pipelines/{p_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == p_id

    # 4. Update pipeline
    update_res = await client.put(f"/api/v1/pipelines/{p_id}", json={"name": "Renamed Audio Pipeline"})
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Renamed Audio Pipeline"

    # 5. Delete pipeline
    del_res = await client.delete(f"/api/v1/pipelines/{p_id}")
    assert del_res.status_code == 200

@pytest.mark.anyio
async def test_pipeline_execution_api(client):
    # 1. Upload sample file
    content = b"# Document for Pipeline Execution\n\nTesting multi-step execution."
    files = {"files": ("pipe_sample.md", content, "text/markdown")}
    upload_res = await client.post("/api/v1/files/upload", files=files)
    assert upload_res.status_code == 200
    file_id = upload_res.json()[0]["id"]

    # 2. Create a test pipeline
    p_payload = {
        "name": "Direct Hash Pipeline",
        "description": "Calculate sha256 checksum",
        "steps": [
            {"operation": "file_hash", "parameters": {"format": "txt"}}
        ]
    }
    p_res = await client.post("/api/v1/pipelines", json=p_payload)
    pipeline_id = p_res.json()["id"]

    # 3. Execute pipeline
    exec_res = await client.post(
        f"/api/v1/pipelines/{pipeline_id}/execute",
        json={"file_id": file_id}
    )
    assert exec_res.status_code == 200
    job_data = exec_res.json()
    assert job_data["operation"] == "pipeline_execute"
    assert job_data["status"] in ["pending", "queued", "running", "completed"]

@pytest.mark.anyio
async def test_pipeline_runner_zip_to_webp_to_pdf_chain(temp_workdir, tmp_path):
    import zipfile
    import subprocess

    # Create 2 simple test images using magick or raw bytes
    img1 = tmp_path / "page_001.png"
    img2 = tmp_path / "page_002.png"
    subprocess.run(["magick", "-size", "100x100", "xc:red", str(img1)], check=True)
    subprocess.run(["magick", "-size", "100x100", "xc:blue", str(img2)], check=True)

    # Package into a test ZIP
    zip_path = tmp_path / "manga_test.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.write(img1, arcname="001.png")
        zf.write(img2, arcname="002.png")

    # Execute chain: ZIP -> extract -> batch convert to WebP -> compile into single PDF
    steps = [
        {"operation": "archive_extract", "parameters": {}},
        {"operation": "image_convert", "parameters": {"format": "webp", "quality": 85}},
        {"operation": "images_to_pdf", "parameters": {"quality": 85, "compress": "jpeg"}}
    ]

    out_file, res = await pipeline_runner.execute_chain(
        input_path=str(zip_path),
        steps=steps,
        output_dir=temp_workdir,
        job_id="manga_chain_test"
    )

    assert res.success is True
    assert out_file.endswith(".pdf")
    assert os.path.exists(out_file)
    assert os.path.getsize(out_file) > 500

    # Test direct archive_to_pdf as well
    direct_steps = [
        {"operation": "archive_to_pdf", "parameters": {"quality": 85, "compress": "jpeg"}}
    ]
    direct_out, direct_res = await pipeline_runner.execute_chain(
        input_path=str(zip_path),
        steps=direct_steps,
        output_dir=temp_workdir,
        job_id="manga_direct_test"
    )
    assert direct_res.success is True
    assert direct_out.endswith(".pdf")
    assert os.path.exists(direct_out)
    assert os.path.getsize(direct_out) > 500

@pytest.mark.anyio
async def test_operation_specs_api(client):
    specs_res = await client.get("/api/v1/operations/specs")
    assert specs_res.status_code == 200
    specs = specs_res.json()
    assert "image_convert" in specs
    assert "video_convert" in specs
    assert "pdf_merge" in specs
    assert specs["image_convert"]["batch_capable"] is True

    next_res = await client.get("/api/v1/operations/image_convert/compatible-next")
    assert next_res.status_code == 200
    next_ops = next_res.json()
    assert len(next_ops) > 0

@pytest.mark.anyio
async def test_pipeline_validation_api(client):
    # Valid pipeline
    valid_payload = {
        "name": "Valid Manga Chain",
        "description": "Extract then convert then pdf",
        "steps": [
            {"operation": "archive_extract", "parameters": {}},
            {"operation": "image_convert", "parameters": {"format": "webp"}},
            {"operation": "images_to_pdf", "parameters": {}}
        ]
    }
    val_res = await client.post("/api/v1/pipelines/validate", json=valid_payload)
    assert val_res.status_code == 200
    assert val_res.json()["valid"] is True

    # Incompatible pipeline (audio into images_to_pdf)
    invalid_payload = {
        "name": "Invalid Chain",
        "description": "Audio directly into PDF",
        "steps": [
            {"operation": "audio_convert", "parameters": {}},
            {"operation": "images_to_pdf", "parameters": {}}
        ]
    }
    inval_res = await client.post("/api/v1/pipelines/validate", json=invalid_payload)
    assert inval_res.status_code == 200
    assert inval_res.json()["valid"] is False
    assert len(inval_res.json()["issues"]) > 0

@pytest.mark.anyio
async def test_pipeline_batch_execute_and_import_export(client):
    # 1. Upload 2 sample files
    f1 = {"files": ("batch_doc1.md", b"# Doc 1", "text/markdown")}
    f2 = {"files": ("batch_doc2.md", b"# Doc 2", "text/markdown")}
    u1 = await client.post("/api/v1/files/upload", files=f1)
    u2 = await client.post("/api/v1/files/upload", files=f2)
    fid1 = u1.json()[0]["id"]
    fid2 = u2.json()[0]["id"]

    # 2. Create pipeline
    p_payload = {
        "name": "Batch Hash Pipeline",
        "description": "Calculate sha256 checksum",
        "steps": [
            {"operation": "file_hash", "parameters": {"algorithm": "sha256"}}
        ]
    }
    p_res = await client.post("/api/v1/pipelines", json=p_payload)
    pipeline_id = p_res.json()["id"]

    # 3. Batch execute pipeline on 2 files
    batch_res = await client.post(
        f"/api/v1/pipelines/{pipeline_id}/batch-execute",
        json={"file_ids": [fid1, fid2], "on_error": "skip"}
    )
    assert batch_res.status_code == 200
    jobs = batch_res.json()
    assert len(jobs) == 2
    assert jobs[0]["operation"] == "pipeline_execute"

    # 4. Export pipeline
    exp_res = await client.get(f"/api/v1/pipelines/{pipeline_id}/export")
    assert exp_res.status_code == 200
    exp_data = exp_res.json()
    assert exp_data["name"] == "Batch Hash Pipeline"
    assert "ufs_pipeline_version" in exp_data

    # 5. Import pipeline
    imp_payload = {
        "name": "Imported Hash Pipeline",
        "description": "Imported pipeline test",
        "steps": exp_data["steps"]
    }
    imp_res = await client.post("/api/v1/pipelines/import", json=imp_payload)
    assert imp_res.status_code == 200
    assert imp_res.json()["name"] == "Imported Hash Pipeline"

@pytest.mark.anyio
async def test_pipeline_runner_single_step_string_output_dir(tmp_path):
    md_file = tmp_path / "test.md"
    md_file.write_text("# Test content\n", encoding="utf-8")
    out_dir = str(tmp_path / "str_out")

    steps = [
        {"operation": "file_hash", "parameters": {"format": "txt"}}
    ]

    out_file, res = await pipeline_runner.execute_chain(
        input_path=str(md_file),
        steps=steps,
        output_dir=out_dir,
        job_id="str_dir_test_001"
    )

    assert res.success is True
    assert os.path.exists(out_file)



