import pytest
import io

@pytest.mark.anyio
async def test_presets_api(client):
    res = await client.get("/api/v1/presets")
    assert res.status_code == 200
    presets = res.json()
    assert len(presets) >= 5
    names = [p["name"] for p in presets]
    assert "High Quality Video" in names
    assert "WebP Modern Image" in names

@pytest.mark.anyio
async def test_batch_convert_api(client):
    # Upload 2 images
    img1 = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
    img2 = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
    
    files = [
        ("files", ("batch_img1.png", io.BytesIO(img1), "image/png")),
        ("files", ("batch_img2.png", io.BytesIO(img2), "image/png")),
    ]
    up_res = await client.post("/api/v1/files/upload", files=files)
    assert up_res.status_code == 200
    uploaded = up_res.json()
    file_ids = [u["id"] for u in uploaded]

    # Batch convert to webp
    batch_payload = {
        "file_ids": file_ids,
        "target_format": "webp"
    }
    batch_res = await client.post("/api/v1/batch/convert", json=batch_payload)
    assert batch_res.status_code == 200
    b_data = batch_res.json()
    assert b_data["total_requested"] == 2
    assert len(b_data["jobs_created"]) == 2

@pytest.mark.anyio
async def test_batch_archive_api(client):
    f1 = b"Sample text file 1"
    f2 = b"Sample text file 2"
    files = [
        ("files", ("doc1.txt", io.BytesIO(f1), "text/plain")),
        ("files", ("doc2.txt", io.BytesIO(f2), "text/plain")),
    ]
    up_res = await client.post("/api/v1/files/upload", files=files)
    assert up_res.status_code == 200
    file_ids = [u["id"] for u in up_res.json()]

    archive_res = await client.post("/api/v1/batch/archive", json={"file_ids": file_ids, "archive_format": "zip"})
    assert archive_res.status_code == 200
    arc_data = archive_res.json()
    assert arc_data["success"] is True
    assert arc_data["files_count"] == 2

