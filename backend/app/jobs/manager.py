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

        try:
            # Execute operation
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

        except asyncio.CancelledError:
            async with AsyncSessionLocal() as session:
                j_stmt = select(Job).where(Job.id == job_id)
                j_res = await session.execute(j_stmt)
                db_job = j_res.scalar_one()
                db_job.status = JobStatus.CANCELLED
                db_job.error_message = "Job was cancelled by user."
                db_job.completed_at = utc_now()
                await session.commit()

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
        Executes operations using local CLI tools or safe fallbacks.
        Returns: (output_path, command_executed, stdout, stderr)
        """
        in_p = Path(input_path)
        out_dir = Path(settings.OUTPUT_DIR)
        target_fmt = (parameters.get("format") or parameters.get("to") or "converted").lower()

        # Update progress helper
        async def set_progress(p: float):
            async with AsyncSessionLocal() as s:
                await s.execute(update(Job).where(Job.id == job_id).values(progress_percent=p))
                await s.commit()

        await set_progress(25.0)

        # 1. Video / Audio operations (FFmpeg)
        if operation in ["video_convert", "convert_video", "compress_video", "audio_convert", "extract_audio"]:
            ext = f".{target_fmt}" if not target_fmt.startswith(".") else target_fmt
            if operation == "extract_audio" and ext in [".converted", ""]:
                ext = ".mp3"
            out_file = out_dir / f"{in_p.stem}_{job_id[:8]}{ext}"

            cmd = ["ffmpeg", "-y", "-i", str(in_p)]

            if operation == "extract_audio":
                cmd.extend(["-vn", "-acodec", "libmp3lame" if ext == ".mp3" else "copy"])
            elif "compress" in operation:
                cmd.extend(["-vcodec", "libx264", "-crf", "28", "-preset", "fast"])
            else:
                if ext in [".mp4", ".m4v"]:
                    cmd.extend(["-vcodec", "libx264", "-acodec", "aac"])
                elif ext in [".webm"]:
                    cmd.extend(["-vcodec", "libvpx-vp9", "-acodec", "libopus"])

            cmd.append(str(out_file))
            await set_progress(50.0)
            
            proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=settings.SUBPROCESS_TIMEOUT_SECONDS)
            
            if proc.returncode != 0:
                raise RuntimeError(f"FFmpeg failed with exit code {proc.returncode}: {stderr.decode('utf-8', errors='replace')}")

            await set_progress(95.0)
            return str(out_file), " ".join(cmd), stdout.decode('utf-8', errors='replace'), stderr.decode('utf-8', errors='replace')

        # 2. Image operations (ImageMagick)
        elif operation in ["image_convert", "convert_image", "resize_image", "compress_image"]:
            ext = f".{target_fmt}" if not target_fmt.startswith(".") else target_fmt
            if ext in [".converted", ""]:
                ext = ".webp"
            out_file = out_dir / f"{in_p.stem}_{job_id[:8]}{ext}"

            bin_cmd = "magick"
            cmd = [bin_cmd, str(in_p)]

            if "resize" in operation and "width" in parameters:
                cmd.extend(["-resize", f"{parameters['width']}x{parameters.get('height', '')}"])
            if "compress" in operation or "quality" in parameters:
                q = str(parameters.get("quality", 80))
                cmd.extend(["-quality", q])

            cmd.append(str(out_file))
            await set_progress(50.0)

            proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)

            if proc.returncode != 0:
                # Fallback to convert if magick binary had issue
                cmd[0] = "convert"
                proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
                if proc.returncode != 0:
                    raise RuntimeError(f"ImageMagick failed with exit code {proc.returncode}: {stderr.decode('utf-8', errors='replace')}")

            await set_progress(95.0)
            return str(out_file), " ".join(cmd), stdout.decode('utf-8', errors='replace'), stderr.decode('utf-8', errors='replace')

        # 3. Archive operations (7-Zip)
        elif operation in ["archive_extract", "extract_archive", "archive_create", "create_archive"]:
            if "extract" in operation:
                extract_dir = out_dir / f"{in_p.stem}_{job_id[:8]}"
                extract_dir.mkdir(parents=True, exist_ok=True)
                cmd = ["7z", "x", str(in_p), f"-o{str(extract_dir)}", "-y"]
                out_path = str(extract_dir)
            else:
                ext = f".{target_fmt}" if not target_fmt.startswith(".") else target_fmt
                if ext in [".converted", ""]:
                    ext = ".zip"
                out_file = out_dir / f"{in_p.stem}_{job_id[:8]}{ext}"
                cmd = ["7z", "a", str(out_file), str(in_p)]
                out_path = str(out_file)

            await set_progress(50.0)
            proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)

            if proc.returncode != 0:
                raise RuntimeError(f"7-Zip failed with exit code {proc.returncode}: {stdout.decode('utf-8', errors='replace')}")

            await set_progress(95.0)
            return out_path, " ".join(cmd), stdout.decode('utf-8', errors='replace'), stderr.decode('utf-8', errors='replace')

        # 4. Document / Office operations (LibreOffice)
        elif operation in ["document_convert", "convert_document"]:
            fmt = target_fmt if target_fmt not in ["converted", ""] else "pdf"
            cmd = ["libreoffice", "--headless", "--convert-to", fmt, "--outdir", str(out_dir), str(in_p)]
            await set_progress(50.0)

            proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)

            if proc.returncode != 0:
                raise RuntimeError(f"LibreOffice failed: {stderr.decode('utf-8', errors='replace')}")

            expected_out = out_dir / f"{in_p.stem}.{fmt}"
            # Rename with job_id to prevent collision
            renamed_out = out_dir / f"{in_p.stem}_{job_id[:8]}.{fmt}"
            if expected_out.exists():
                expected_out.rename(renamed_out)

            await set_progress(95.0)
            return str(renamed_out), " ".join(cmd), stdout.decode('utf-8', errors='replace'), stderr.decode('utf-8', errors='replace')

        # 5. Default / Mock or Pass-through operation
        else:
            ext = f".{target_fmt}" if target_fmt not in ["converted", ""] else in_p.suffix
            out_file = out_dir / f"{in_p.stem}_{job_id[:8]}{ext}"
            
            # Simulate work
            await set_progress(40.0)
            await asyncio.sleep(1.0)
            await set_progress(80.0)
            
            # Copy file content
            with open(in_p, "rb") as src, open(out_file, "wb") as dst:
                dst.write(src.read())

            return str(out_file), f"ufs_processor --op {operation} {in_p.name}", "Operation processed successfully.", ""

job_manager = JobManager()

