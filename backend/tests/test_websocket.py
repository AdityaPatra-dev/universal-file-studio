import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.websocket.manager import ws_manager

@pytest.fixture
def test_client():
    return TestClient(app)

def test_websocket_connection_and_handshake(test_client):
    """Test connecting to /ws and receiving the initial handshake packet."""
    with test_client.websocket_connect("/ws") as ws:
        data = ws.receive_json()
        assert data["event"] == "connected"
        assert "Universal File Studio" in data["message"]

def test_websocket_ping_pong(test_client):
    """Test ping keepalive and pong response."""
    with test_client.websocket_connect("/ws") as ws:
        _ = ws.receive_json()  # handshake
        ws.send_json({"action": "ping", "timestamp": 12345})
        res = ws.receive_json()
        assert res["event"] == "pong"
        assert res["timestamp"] == 12345

def test_websocket_job_subscription(test_client):
    """Test subscription to a specific job ID."""
    job_id = "test-job-uuid-1234"
    with test_client.websocket_connect(f"/ws/jobs/{job_id}") as ws:
        data = ws.receive_json()
        assert data["event"] == "subscribed"
        assert data["job_id"] == job_id

@pytest.mark.anyio
async def test_ws_manager_event_broadcasting():
    """Test ConnectionManager emission helpers."""
    # Emit events without clients attached should execute cleanly without raising
    await ws_manager.emit_job_progress("job-99", 50.0, "sample.png", speed="2 MB/s", eta_seconds=10)
    await ws_manager.emit_job_completed("job-99", "/path/to/out.png", duration=1.2, input_size=100, output_size=80)
    await ws_manager.emit_job_failed("job-99", "Failed", detail="Traceback...")
    await ws_manager.emit_job_cancelled("job-99")
    await ws_manager.emit_engine_status("ffmpeg", "installed")
