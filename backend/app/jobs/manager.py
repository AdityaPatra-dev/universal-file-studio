import os
import sys
import uuid
import time
import asyncio
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.config import settings
from app.database import AsyncSessionLocal
from app.models.job import Job, JobStatus
from app.models.file_record import FileRecord
from app.processors.registry import processor_registry

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class JobManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(JobManager, cls).__new__(cls)
            cls._instance.queue: asyncio.Queue = asyncio.Queue()
            cls._instance.running_tasks: Dict[str, asyncio.Task] = {}
            cls._instance.worker_tasks: list[asyncio.Task] = []
            cls._instance.is_running: bool = False
        return cls._instance

    def start_workers(self, count: int = settings.MAX_CONCURRENT_JOBS):
        if self.is_running:
            return
        self.is_running = True
        for i in range(count):
            task = asyncio.create_task(self._worker(i))
            self.worker_tasks.append(task)

    async def stop_workers(self):
        self.is_running = False
        for task in self.worker_tasks:
            task.cancel()
        self.worker_tasks.clear()

    async def enqueue_job(self, job_id: str):
        async with AsyncSessionLocal() as session:
            stmt = select(Job).where(Job.id == job_id)
            res = await session.execute(stmt)
            job = res.scalar_one_or_none()
            if job:
                job.status = JobStatus.QUEUED
                await session.commit()
                await self.queue.put(job_id)

    async def cancel_job(self, job_id: str) -> bool:
        if job_id in self.running_tasks:
            self.running_tasks[job_id].cancel()
            return True
        async with AsyncSessionLocal() as session:
            stmt = select(Job).where(Job.id == job_id)
            res = await session.execute(stmt)
            job = res.scalar_one_or_none()
            if job and job.status in [JobStatus.PENDING, JobStatus.QUEUED]:
                job.status = JobStatus.CANCELLED
                await session.commit()
                return True
        return False

    async def _worker(self, worker_id: int):
        while self.is_running:
            try:
                job_id = await self.queue.get()
                current_task = asyncio.current_task()
                self.running_tasks[job_id] = current_task
                try:
                    await self._process_job(job_id)
                finally:
                    self.running_tasks.pop(job_id, None)
                    self.queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                pass

    async def _process_job(self, job_id: str):
        start_time = time.time()
        
        async with AsyncSessionLocal() as session:
            stmt = select(Job).where(Job.id == job_id)
            res = await session.execute(stmt)
            job = res.scalar_one_or_none()
            if not job:
                return

            job.status = JobStatus.RUNNING
            job.started_at = utc_now()
            job.progress_percent = 5.0
            await session.commit()

            # Fetch associated file
            f_stmt = select(FileRecord).where(FileRecord.id == job.file_id)
            f_res = await session.execute(f_stmt)
            file_rec = f_res.scalar_one_or_none()

        from app.websocket.manager import ws_manager
        await ws_manager.emit_job_progress(
            job_id=job_id,
            percent=5.0,
            current_file=file_rec.original_filename if file_rec else ""
        )

        try:
            # Execute operation using Processor Registry
            out_path, cmd_str, stdout_str, stderr_str = await self._run_operation(
                job_id=job.id,
                operation=job.operation,
                input_path=job.input_path,
                parameters=job.parameters or {},
                engine_used=job.engine_used,
                file_rec=file_rec
            )

            out_size = os.path.getsize(out_path) if out_path and os.path.exists(out_path) else None
            out_name = Path(out_path).name if out_path else None
            duration = round(time.time() - start_time, 2)

            async with AsyncSessionLocal() as session:
                j_stmt = select(Job).where(Job.id == job_id)
                j_res = await session.execute(j_stmt)
                db_job = j_res.scalar_one()

                db_job.status = JobStatus.COMPLETED
                db_job.progress_percent = 100.0
                db_job.output_path = out_path
                db_job.output_filename = out_name
                db_job.output_size_bytes = out_size
                db_job.command_executed = cmd_str
                db_job.stdout = stdout_str
                db_job.stderr = stderr_str
                db_job.exit_code = 0
                db_job.completed_at = utc_now()
                db_job.duration_seconds = duration
                await session.commit()

            await ws_manager.emit_job_completed(
                job_id=job_id,
                output_path=out_path or "",
                duration=duration,
                input_size=file_rec.size_bytes if file_rec else 0,
                output_size=out_size or 0
            )

        except asyncio.CancelledError:
            async with AsyncSessionLocal() as session:
                j_stmt = select(Job).where(Job.id == job_id)
                j_res = await session.execute(j_stmt)
                db_job = j_res.scalar_one()
                db_job.status = JobStatus.CANCELLED
                db_job.error_message = "Job was cancelled by user."
                db_job.completed_at = utc_now()
                await session.commit()

            await ws_manager.emit_job_cancelled(job_id=job_id)

        except Exception as exc:
            duration = round(time.time() - start_time, 2)
            error_msg = str(exc)
            error_detail = traceback.format_exc()

            async with AsyncSessionLocal() as session:
                j_stmt = select(Job).where(Job.id == job_id)
                j_res = await session.execute(j_stmt)
                db_job = j_res.scalar_one()
                db_job.status = JobStatus.FAILED
                db_job.error_message = error_msg[:999]
                db_job.error_detail = error_detail
                db_job.completed_at = utc_now()
                db_job.duration_seconds = duration
                await session.commit()

            await ws_manager.emit_job_failed(
                job_id=job_id,
                error=error_msg[:999],
                detail=error_detail
            )

    async def _run_operation(
        self,
        job_id: str,
        operation: str,
        input_path: str,
        parameters: Dict[str, Any],
        engine_used: str,
        file_rec: Optional[FileRecord]
    ) -> tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
        """
        Routes and executes operations through processor registry.
        Returns: (output_path, command_executed, stdout, stderr)
        """
        out_dir = settings.OUTPUT_DIR

        # Progress tracking callback
        async def set_progress(p: float):
            async with AsyncSessionLocal() as s:
                await s.execute(update(Job).where(Job.id == job_id).values(progress_percent=p))
                await s.commit()
            from app.websocket.manager import ws_manager
            await ws_manager.emit_job_progress(
                job_id=job_id,
                percent=p,
                current_file=file_rec.original_filename if file_rec else ""
            )

        await set_progress(35.0)

        f_info = {
            "mime_type": file_rec.mime_type if file_rec else None,
            "category": file_rec.category if file_rec else None,
            "width": file_rec.width if file_rec else None,
            "height": file_rec.height if file_rec else None,
            "duration": file_rec.duration_seconds if file_rec else None,
        }

        if operation == "pipeline_execute":
            from app.processors.pipeline_runner import pipeline_runner
            steps = parameters.get("steps", [])
            on_err = parameters.get("on_error", "stop")
            out_path, res = await pipeline_runner.execute_chain(
                input_path=input_path,
                steps=steps,
                output_dir=Path(out_dir),
                job_id=job_id,
                progress_callback=set_progress,
                file_info=f_info,
                on_error=on_err
            )
            if not res.success:
                raise RuntimeError(res.stderr or f"Pipeline execution failed: {res.stdout}")
            await set_progress(100.0)
            return out_path, res.command_str, res.stdout, res.stderr

        # Live progressive ticker for single operations
        current_p = 10.0
        await set_progress(current_p)
        stop_ticker = asyncio.Event()

        async def progress_ticker():
            nonlocal current_p
            # Calculate dynamic estimate based on duration or file size
            est_seconds = 6.0
            if file_rec and file_rec.duration_seconds:
                est_seconds = max(4.0, file_rec.duration_seconds * 0.5)
            elif file_rec and file_rec.size_bytes:
                est_seconds = max(3.0, (file_rec.size_bytes / (1024 * 1024)) * 0.7)

            start_t = time.time()
            while not stop_ticker.is_set():
                await asyncio.sleep(0.7)
                if stop_ticker.is_set():
                    break
                elapsed = time.time() - start_t
                ratio = min(0.92, 1.0 - (0.5 ** (elapsed / max(2.5, est_seconds))))
                new_p = round(10.0 + ratio * 82.0, 1)
                if new_p > current_p and new_p <= 94.0:
                    current_p = new_p
                    await set_progress(current_p)

        ticker_task = asyncio.create_task(progress_ticker())

        try:
            out_path, res = await processor_registry.dispatch(
                operation=operation,
                input_path=input_path,
                output_dir=out_dir,
                job_id=job_id,
                parameters=parameters,
                file_info=f_info
            )
        finally:
            stop_ticker.set()
            ticker_task.cancel()
            try:
                await ticker_task
            except asyncio.CancelledError:
                pass

        if not res.success:
            err_msg = res.stderr or res.stdout or f"Process failed with exit code {res.returncode}"
            raise RuntimeError(err_msg)

        await set_progress(100.0)
        return out_path, res.command_str, res.stdout, res.stderr

job_manager = JobManager()
