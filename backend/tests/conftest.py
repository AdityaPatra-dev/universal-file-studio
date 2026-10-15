import pytest
import os
import sys
from pathlib import Path

# Add backend to sys.path
backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db
from app.engines.manager import EngineManager

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(autouse=True, scope="session")
def setup_test_env():
    import asyncio
    asyncio.run(init_db())
    asyncio.run(EngineManager.scan_and_register_all())

@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

