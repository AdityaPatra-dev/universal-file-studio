import pytest
import io

@pytest.mark.anyio
async def test_health_check(client):
    response = await client.get("/api/v1/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Universal File Studio" in data["app"]

@pytest.mark.anyio
async def test_list_engines(client):
    response = await client.get("/api/v1/system/engines")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 8
    engine_names = [e["name"] for e in data]
    assert "ffmpeg" in engine_names
    assert "imagemagick" in engine_names
    assert "7z" in engine_names

@pytest.mark.anyio
async def test_diagnostics(client):
    response = await client.get("/api/v1/system/diagnostics")
    assert response.status_code == 200
    data = response.json()
    assert "cpu_count" in data
    assert "ram_total_gb" in data
    assert "disk_total_gb" in data

@pytest.mark.anyio
async def test_file_upload_and_job_lifecycle(client):
    # 1. Upload a dummy test image
    file_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
    files = {"files": ("test_dot.png", io.BytesIO(file_content), "image/png")}
    
    upload_res = await client.post("/api/v1/files/upload", files=files)
    assert upload_res.status_code == 200
    uploaded_files = upload_res.json()
    assert len(uploaded_files) == 1
    file_id = uploaded_files[0]["id"]
    assert uploaded_files[0]["category"] == "image"
    assert uploaded_files[0]["filename"] == "test_dot.png"

    # 2. Get file details
    detail_res = await client.get(f"/api/v1/files/{file_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == file_id

    # 3. Analyze file
    analyze_res = await client.post(f"/api/v1/files/{file_id}/analyze")
    assert analyze_res.status_code == 200
    analyze_data = analyze_res.json()
    assert len(analyze_data["available_operations"]) > 0

    # 4. Create a conversion job (convert image to webp)
    job_payload = {
        "file_id": file_id,
        "operation": "image_convert",
        "engine_used": "imagemagick",
        "parameters": {"format": "webp"}
    }
    job_res = await client.post("/api/v1/jobs", json=job_payload)
    assert job_res.status_code == 200
    job_data = job_res.json()
    job_id = job_data["id"]
    assert job_data["status"] in ["pending", "queued", "running", "completed"]

    # 5. Fetch job
    get_job_res = await client.get(f"/api/v1/jobs/{job_id}")
    assert get_job_res.status_code == 200
    assert get_job_res.json()["id"] == job_id

