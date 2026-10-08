import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional, Callable, Awaitable

from app.engines.wrappers.base import ProcessResult
from app.processors.registry import processor_registry

class PipelineRunner:
    """
    Executes a chain of transformation operations where the output of step N
    becomes the input for step N+1. Manages intermediate buffers, logs, and progress.
    Supports multi-file batch transformations (e.g. archive_extract -> image_convert -> images_to_pdf).
    """

    async def execute_chain(
        self,
        input_path: str,
        steps: List[Dict[str, Any]],
        output_dir: Path,
        job_id: str,
        progress_callback: Optional[Callable[[float], Awaitable[None]]] = None,
        file_info: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, ProcessResult]:
        if not steps:
            raise ValueError("Pipeline must have at least one step.")

        temp_workspace = Path(tempfile.mkdtemp(prefix=f"ufs_pipe_{job_id[:8]}_"))
        current_input = input_path
        commands_executed: List[str] = []
        stdout_log: List[str] = []
        intermediate_files_to_clean: List[str] = []

        total_steps = len(steps)

        def natural_sort_key(s):
            return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', str(s))]

        try:
            for idx, step in enumerate(steps):
                step_num = idx + 1
                op = step.get("operation", "")
                params = step.get("parameters", {})

                # Intermediate steps output to dedicated temp subfolder; final step outputs to destination output_dir
                is_final = (step_num == total_steps)
                step_out_dir = output_dir if is_final else (temp_workspace / f"step_{step_num}_out")
                step_out_dir.mkdir(parents=True, exist_ok=True)

                if progress_callback:
                    pct = ((idx) / total_steps) * 90.0
                    await progress_callback(pct)

                curr_p = Path(current_input)

                # Multi-file batch transformation: if previous step was an archive extraction and produced a directory
                if curr_p.is_dir() and op in [
                    "image_convert", "convert_image", 
                    "image_resize", "resize_image", 
                    "image_compress", "compress_image", 
                    "image_strip_metadata", "strip_metadata"
                ]:
                    img_exts = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".bmp", ".tiff", ".gif"}
                    input_images = [p for p in curr_p.rglob("*") if p.suffix.lower() in img_exts]
                    input_images.sort(key=natural_sort_key)

                    if not input_images:
                        return str(step_out_dir), ProcessResult(
                            returncode=1,
                            stdout="",
                            stderr=f"No image files found in intermediate directory {current_input}",
                            success=False,
                            command=[op]
                        )

                    for sub_idx, img_file in enumerate(input_images):
                        sub_job_id = f"{job_id}_s{step_num}_{sub_idx:04d}"
                        await processor_registry.dispatch(
                            operation=op,
                            input_path=str(img_file),
                            output_dir=str(step_out_dir),
                            job_id=sub_job_id,
                            parameters=params,
                            file_info=file_info
                        )

                    step_out_path = str(step_out_dir)
                    res = ProcessResult(
                        returncode=0,
                        stdout=f"Batch processed {len(input_images)} images into {params.get('format', 'target format')}.",
                        stderr="",
                        success=True,
                        command=[op, f"count={len(input_images)}"]
                    )
                else:
                    step_out_path, res = await processor_registry.dispatch(
                        operation=op,
                        input_path=current_input,
                        output_dir=str(step_out_dir),
                        job_id=f"{job_id}_s{step_num}",
                        parameters=params,
                        file_info=file_info
                    )

                commands_executed.append(res.command_str)
                stdout_log.append(f"[Step {step_num}: {op}]\n{res.stdout or 'Completed successfully.'}")

                if not res.success:
                    err_msg = res.stderr or res.stdout or f"Pipeline failed at step {step_num} ({op})"
                    return step_out_path, ProcessResult(
                        returncode=res.returncode,
                        stdout="\n".join(stdout_log),
                        stderr=f"Error in step {step_num} ({op}): {err_msg}",
                        success=False,
                        command=res.command
                    )

                if not is_final:
                    intermediate_files_to_clean.append(step_out_path)

                current_input = step_out_path

            if progress_callback:
                await progress_callback(100.0)

            combined_result = ProcessResult(
                returncode=0,
                stdout="\n\n".join(stdout_log),
                stderr="",
                success=True,
                command=["ufs_pipeline_chain", f"steps={total_steps}"]
            )
            return current_input, combined_result

        finally:
            if temp_workspace.exists():
                shutil.rmtree(temp_workspace, ignore_errors=True)

pipeline_runner = PipelineRunner()
