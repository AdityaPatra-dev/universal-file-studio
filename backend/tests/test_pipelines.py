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
