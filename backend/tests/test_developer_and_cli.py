import os
import tempfile
import pytest
from click.testing import CliRunner
from httpx import AsyncClient
from app.cli.main import cli

@pytest.mark.anyio
async def test_developer_info_api(client: AsyncClient):
    """Test GET /api/v1/developer/info."""
    res = await client.get("/api/v1/developer/info")
    assert res.status_code == 200
    data = res.json()
    assert "project" in data
    assert "version" in data
    assert "websocket" in data
    assert "engines" in data
    assert "cli" in data
    assert "commands" in data["cli"]

@pytest.mark.anyio
async def test_developer_openapi_schema(client: AsyncClient):
    """Test GET /api/v1/developer/openapi.json."""
    res = await client.get("/api/v1/developer/openapi.json")
    assert res.status_code == 200
    data = res.json()
    assert data["openapi"].startswith("3.")
    assert "paths" in data

@pytest.mark.anyio
async def test_developer_events_spec(client: AsyncClient):
    """Test GET /api/v1/developer/events."""
    res = await client.get("/api/v1/developer/events")
    assert res.status_code == 200
    data = res.json()
    assert "job:progress" in data
    assert "job:completed" in data
    assert "job:failed" in data

@pytest.mark.anyio
async def test_developer_test_event_trigger(client: AsyncClient):
    """Test POST /api/v1/developer/test-event."""
    res = await client.post("/api/v1/developer/test-event", params={"event_type": "ping", "message": "hello"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "broadcasted"
    assert data["event"] == "test:ping"

def test_cli_status_command():
    """Test CLI ufs status command."""
    runner = CliRunner()
    result = runner.invoke(cli, ["status"])
    assert result.exit_code == 0
    assert "Universal File Studio (UFS) - System Status" in result.output
    assert "Engines Detected:" in result.output

def test_cli_engines_command():
    """Test CLI ufs engines command."""
    runner = CliRunner()
    result = runner.invoke(cli, ["engines"])
    assert result.exit_code == 0
    assert "ENGINE" in result.output
    assert "ffmpeg" in result.output

def test_cli_pipeline_list_command():
    """Test CLI ufs pipeline list command."""
    runner = CliRunner()
    result = runner.invoke(cli, ["pipeline", "list"])
    assert result.exit_code == 0
    assert "STEPS" in result.output
    assert "Video Privacy Clean & WebM" in result.output

def test_cli_hash_command():
    """Test CLI ufs hash command."""
    runner = CliRunner()
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
        f.write(b"Hello Developer CLI Testing 12345")
        temp_path = f.name
    try:
        result = runner.invoke(cli, ["hash", temp_path])
        assert result.exit_code == 0
        assert "SHA-256:" in result.output
        assert "MD5:" in result.output
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def test_cli_convert_markdown_command():
    """Test CLI ufs convert markdown command."""
    runner = CliRunner()
    with tempfile.NamedTemporaryFile(suffix=".md", delete=False) as f:
        f.write(b"# Developer Test Document\n\nThis is a CLI test.")
        temp_path = f.name
    try:
        result = runner.invoke(cli, ["convert", temp_path, "-t", "html"])
        assert result.exit_code == 0
        assert "SUCCESS: Output generated at:" in result.output
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
