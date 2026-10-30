import sys
import platform
import psutil
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.config import settings
from app.models.engine_info import EngineInfo as EngineInfoModel
from app.models.setting import Setting
from app.schemas.system_schema import EngineStatusResponse, SystemDiagnosticsResponse, SettingResponse, SettingUpdate
from app.engines.manager import EngineManager
from app.engines.base import CapabilityRegistry

router = APIRouter(prefix="/system", tags=["system"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "local-first"
    }

@router.get("/engines", response_model=List[EngineStatusResponse])
async def list_engines(db: AsyncSession = Depends(get_db)):
    stmt = select(EngineInfoModel).order_by(EngineInfoModel.name)
    res = await db.execute(stmt)
    records = res.scalars().all()
    
    if not records:
        # Initial scan if table empty
        await EngineManager.scan_and_register_all()
        stmt = select(EngineInfoModel).order_by(EngineInfoModel.name)
        res = await db.execute(stmt)
        records = res.scalars().all()

    return records

@router.post("/engines/scan", response_model=List[EngineStatusResponse])
async def rescan_engines(db: AsyncSession = Depends(get_db)):
    await EngineManager.scan_and_register_all()
    stmt = select(EngineInfoModel).order_by(EngineInfoModel.name)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/diagnostics", response_model=SystemDiagnosticsResponse)
async def get_diagnostics(db: AsyncSession = Depends(get_db)):
    # Memory
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage(settings.UPLOAD_DIR)

    # Engines
    stmt = select(EngineInfoModel).order_by(EngineInfoModel.name)
    res = await db.execute(stmt)
    engines = res.scalars().all()

    return SystemDiagnosticsResponse(
        os=f"{platform.system()} {platform.release()}",
        platform=platform.platform(),
        python_version=sys.version.split()[0],
        cpu_count=psutil.cpu_count(logical=True) or 1,
        cpu_percent=psutil.cpu_percent(interval=None),
        ram_total_gb=round(mem.total / (1024**3), 2),
        ram_available_gb=round(mem.available / (1024**3), 2),
        ram_percent=mem.percent,
        disk_total_gb=round(disk.total / (1024**3), 2),
        disk_free_gb=round(disk.free / (1024**3), 2),
        disk_percent=disk.percent,
        storage_paths={
            "uploads": settings.UPLOAD_DIR,
            "outputs": settings.OUTPUT_DIR,
            "temp": settings.TEMP_DIR,
            "thumbnails": settings.THUMBNAIL_DIR
        },
        installed_engines=engines
    )

@router.get("/settings", response_model=List[SettingResponse])
async def list_settings(db: AsyncSession = Depends(get_db)):
    stmt = select(Setting).order_by(Setting.category, Setting.key)
    res = await db.execute(stmt)
    records = res.scalars().all()
    if not records:
        # Populate defaults
        defaults = [
            Setting(key="max_concurrent_jobs", value=str(settings.MAX_CONCURRENT_JOBS), type="integer", category="processing", description="Maximum concurrent processing jobs"),
            Setting(key="max_upload_size_mb", value=str(settings.MAX_UPLOAD_SIZE_MB), type="integer", category="processing", description="Maximum allowed file upload size in MB"),
            Setting(key="theme", value="dark", type="string", category="appearance", description="UI Color Theme (dark / light)"),
            Setting(key="preserve_folder_structure", value="true", type="boolean", category="processing", description="Preserve nested directory structure in outputs"),
        ]
        for d in defaults:
            db.add(d)
        await db.commit()
        stmt = select(Setting).order_by(Setting.category, Setting.key)
        res = await db.execute(stmt)
        records = res.scalars().all()
    return records

@router.put("/settings/{key}", response_model=SettingResponse)
async def update_setting(key: str, payload: SettingUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Setting).where(Setting.key == key)
    res = await db.execute(stmt)
    setting_rec = res.scalar_one_or_none()
    if not setting_rec:
        raise HTTPException(status_code=404, detail="Setting not found")

    setting_rec.value = payload.value
    await db.commit()
    await db.refresh(setting_rec)
    return setting_rec

@router.get("/network")
async def get_network_info():
    import socket
    hostname = socket.gethostname()
    local_ips = ["127.0.0.1"]
    primary_ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(("8.8.8.8", 80))
        detected_ip = s.getsockname()[0]
        s.close()
        if detected_ip and detected_ip not in local_ips:
            primary_ip = detected_ip
            local_ips.append(detected_ip)
    except Exception:
        pass

    try:
        # Also grab any host addresses
        host_info = socket.gethostbyname_ex(hostname)
        for ip in host_info[2]:
            if ip not in local_ips and not ip.startswith("127."):
                local_ips.append(ip)
                if primary_ip == "127.0.0.1":
                    primary_ip = ip
    except Exception:
        pass

    port = settings.PORT
    mobile_url = f"http://{primary_ip}:{port}" if primary_ip != "127.0.0.1" else f"http://localhost:{port}"

    return {
        "hostname": hostname,
        "primary_ip": primary_ip,
        "all_ips": local_ips,
        "port": port,
        "mobile_url": mobile_url,
        "is_lan_available": primary_ip != "127.0.0.1"
    }

