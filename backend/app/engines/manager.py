import asyncio
import dataclasses
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.engines.base import CapabilityRegistry, EngineInfo
from app.engines.detectors import ALL_DETECTORS
from app.models.engine_info import EngineInfo as EngineInfoModel
from app.database import AsyncSessionLocal

class EngineManager:
    """Coordinates engine discovery and synchronizes capabilities with the database."""
    
    @classmethod
    async def scan_and_register_all(cls) -> Dict[str, EngineInfo]:
        registry = CapabilityRegistry()
        
        async with AsyncSessionLocal() as session:
            for detector in ALL_DETECTORS:
                info = await detector.detect()
                registry.register(info)
                
                # Persist or update in database
                stmt = select(EngineInfoModel).where(EngineInfoModel.name == info.name)
                res = await session.execute(stmt)
                db_record = res.scalar_one_or_none()
                
                caps_dict = dataclasses.asdict(info.capabilities)
                
                if db_record:
                    db_record.installed = info.installed
                    db_record.version = info.version
                    db_record.path = info.path
                    db_record.capabilities = caps_dict
                    db_record.detected_at = info.detected_at
                else:
                    new_rec = EngineInfoModel(
                        name=info.name,
                        installed=info.installed,
                        version=info.version,
                        path=info.path,
                        capabilities=caps_dict,
                        detected_at=info.detected_at
                    )
                    session.add(new_rec)
                    
            await session.commit()
            
        return registry.get_all()

    @classmethod
    def get_registry(cls) -> CapabilityRegistry:
        return CapabilityRegistry()

    @classmethod
    async def get_all_detected(cls) -> List[EngineInfo]:
        results = []
        for detector in ALL_DETECTORS:
            info = await detector.detect()
            results.append(info)
        return results

    @classmethod
    def list_all(cls) -> List[EngineInfo]:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
        if loop and loop.is_running():
            # In running loop, run in thread or executor
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                return executor.submit(asyncio.run, cls.get_all_detected()).result()
        return asyncio.run(cls.get_all_detected())


