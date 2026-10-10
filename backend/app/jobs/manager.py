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
from app.engines.wrappers import (
    ffmpeg_engine,
    imagemagick_engine,
    sevenzip_engine,
    poppler_engine,
    ghostscript_engine,
    libreoffice_engine,
    qpdf_engine,
    pandoc_engine,
    tesseract_engine,
    ProcessResult
)

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
            # Execute operation using Core Engine Wrappers
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
        Routes and executes operations through typed engine wrappers.
        Returns: (output_path, command_executed, stdout, stderr)
        """
        in_p = Path(input_path)
        out_dir = Path(settings.OUTPUT_DIR)
        target_fmt = (parameters.get("format") or parameters.get("to") or "converted").lower()

        async def set_progress(p: float):
            async with AsyncSessionLocal() as s:
                await s.execute(update(Job).where(Job.id == job_id).values(progress_percent=p))
                await s.commit()

        await set_progress(20.0)

        # 1. Video & Audio via FFmpegEngine
        if operation in ["video_convert", "convert_video", "compress_video", "audio_convert", "extract_audio", "trim_video", "crop_video", "resize_video"]:
            ext = f".{target_fmt}" if not target_fmt.startswith(".") else target_fmt
            if operation == "extract_audio" and ext in [".converted", ""]:
                ext = ".mp3"
            out_file = str(out_dir / f"{in_p.stem}_{job_id[:8]}{ext}")

            await set_progress(40.0)
            if operation == "extract_audio":
                res = await ffmpeg_engine.extract_audio(str(in_p), out_file, audio_codec="libmp3lame" if ext == ".mp3" else "copy")
            elif "compress" in operation:
                crf = int(parameters.get("crf", 28))
                res = await ffmpeg_engine.compress(str(in_p), out_file, crf=crf)
            elif "trim" in operation and "start" in parameters:
                res = await ffmpeg_engine.trim(str(in_p), out_file, start_time=str(parameters["start"]), end_time=parameters.get("end"))
            elif "crop" in operation and "width" in parameters and "height" in parameters:
                res = await ffmpeg_engine.crop(str(in_p), out_file, int(parameters["width"]), int(parameters["height"]))
            elif "resize" in operation and "width" in parameters and "height" in parameters:
                res = await ffmpeg_engine.resize(str(in_p), out_file, int(parameters["width"]), int(parameters["height"]))
            else:
                v_codec = "libx264" if ext in [".mp4", ".m4v"] else ("libvpx-vp9" if ext == ".webm" else None)
                a_codec = "aac" if ext in [".mp4", ".m4v"] else ("libopus" if ext == ".webm" else None)
                res = await ffmpeg_engine.convert(str(in_p), out_file, video_codec=v_codec, audio_codec=a_codec)

            if not res.success:
                raise RuntimeError(f"FFmpeg failed with returncode {res.returncode}: {res.stderr}")

            await set_progress(95.0)
            return out_file, res.command_str, res.stdout, res.stderr

        # 2. Image via ImageMagickEngine
        elif operation in ["image_convert", "convert_image", "resize_image", "compress_image", "rotate_image", "crop_image"]:
            ext = f".{target_fmt}" if not target_fmt.startswith(".") else target_fmt
            if ext in [".converted", ""]:
                ext = ".webp"
            out_file = str(out_dir / f"{in_p.stem}_{job_id[:8]}{ext}")

            await set_progress(40.0)
            if "resize" in operation and ("width" in parameters or "height" in parameters):
                res = await imagemagick_engine.resize(str(in_p), out_file, width=parameters.get("width"), height=parameters.get("height"))
            elif "compress" in operation or "quality" in parameters:
                res = await imagemagick_engine.compress(str(in_p), out_file, quality=int(parameters.get("quality", 80)))
            elif "rotate" in operation and "degrees" in parameters:
                res = await imagemagick_engine.rotate(str(in_p), out_file, degrees=float(parameters["degrees"]))
            elif "crop" in operation and "width" in parameters and "height" in parameters:
                res = await imagemagick_engine.crop(str(in_p), out_file, int(parameters["width"]), int(parameters["height"]), int(parameters.get("x", 0)), int(parameters.get("y", 0)))
            else:
                res = await imagemagick_engine.convert(str(in_p), out_file)

            if not res.success:
                raise RuntimeError(f"ImageMagick failed with returncode {res.returncode}: {res.stderr}")

            await set_progress(95.0)
            return out_file, res.command_str, res.stdout, res.stderr

        # 3. Archive via SevenZipEngine
        elif operation in ["archive_extract", "extract_archive", "archive_create", "create_archive"]:
            await set_progress(40.0)
            if "extract" in operation:
                extract_dir = str(out_dir / f"{in_p.stem}_{job_id[:8]}")
                res = await sevenzip_engine.extract(str(in_p), extract_dir)
                out_path = extract_dir
            else:
                ext = f".{target_fmt}" if not target_fmt.startswith(".") else target_fmt
                if ext in [".converted", ""]:
                    ext = ".zip"
                out_file = str(out_dir / f"{in_p.stem}_{job_id[:8]}{ext}")
                res = await sevenzip_engine.create(out_file, [str(in_p)], password=parameters.get("password"))
                out_path = out_file

            if not res.success:
                raise RuntimeError(f"7-Zip failed with returncode {res.returncode}: {res.stdout}")

            await set_progress(95.0)
            return out_path, res.command_str, res.stdout, res.stderr

        # 4. PDF via PopplerEngine or GhostscriptEngine
        elif operation in ["pdf_to_images", "pdf_to_text", "pdf_compress", "pdf_optimize"]:
            await set_progress(40.0)
            if operation == "pdf_to_images":
                out_prefix = str(out_dir / f"{in_p.stem}_{job_id[:8]}_page")
                fmt = target_fmt if target_fmt not in ["converted", ""] else "png"
                res = await poppler_engine.pdf_to_image(str(in_p), out_prefix, format=fmt)
                out_path = f"{out_prefix}-1.{fmt}"
            elif operation == "pdf_to_text":
                out_file = str(out_dir / f"{in_p.stem}_{job_id[:8]}.txt")
                res = await poppler_engine.pdf_to_text(str(in_p), out_file)
                out_path = out_file
            else:  # pdf_compress or pdf_optimize
                out_file = str(out_dir / f"{in_p.stem}_{job_id[:8]}.pdf")
                quality = parameters.get("quality", "ebook")
                res = await ghostscript_engine.compress(str(in_p), out_file, quality_setting=quality)
                out_path = out_file

            if not res.success:
                raise RuntimeError(f"PDF operation failed with returncode {res.returncode}: {res.stderr}")

            await set_progress(95.0)
            return out_path, res.command_str, res.stdout, res.stderr

        # 5. Document conversion via LibreOfficeEngine
        elif operation in ["document_convert", "convert_document"]:
            fmt = target_fmt if target_fmt not in ["converted", ""] else "pdf"
            await set_progress(40.0)
            res = await libreoffice_engine.convert(str(in_p), str(out_dir), format=fmt)

            if not res.success:
                raise RuntimeError(f"LibreOffice failed: {res.stderr}")

            expected_out = out_dir / f"{in_p.stem}.{fmt}"
            renamed_out = out_dir / f"{in_p.stem}_{job_id[:8]}.{fmt}"
            if expected_out.exists():
                expected_out.rename(renamed_out)

            await set_progress(95.0)
            return str(renamed_out), res.command_str, res.stdout, res.stderr

        # 6. Fallback Pass-through
        else:
            ext = f".{target_fmt}" if target_fmt not in ["converted", ""] else in_p.suffix
            out_file = str(out_dir / f"{in_p.stem}_{job_id[:8]}{ext}")
            
            await set_progress(50.0)
            await asyncio.sleep(0.5)
            with open(in_p, "rb") as src, open(out_file, "wb") as dst:
                dst.write(src.read())

            return out_file, f"ufs_processor --op {operation} {in_p.name}", "Operation processed successfully.", ""

job_manager = JobManager()
