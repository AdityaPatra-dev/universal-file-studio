import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional, Callable, Awaitable, Union

from app.engines.wrappers.base import ProcessResult
from app.processors.registry import processor_registry
from app.processors.specs import OPERATION_SPECS

# File extensions by category for smart batch categorization
CATEGORY_EXTENSIONS: Dict[str, set] = {
    "image": {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp", ".avif", ".svg", ".heic", ".heif", ".psd", ".ico"},
    "video": {".mp4", ".mkv", ".avi", ".webm", ".mov", ".flv", ".wmv", ".m4v", ".3gp", ".ts", ".m2ts"},
    "audio": {".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a", ".opus", ".aiff"},
    "document": {".pdf", ".docx", ".doc", ".odt", ".rtf", ".txt", ".html", ".htm", ".epub", ".md", ".tex"},
    "spreadsheet": {".xlsx", ".xls", ".ods", ".csv", ".tsv"},
    "presentation": {".pptx", ".ppt", ".odp"},
    "archive": {".zip", ".7z", ".rar", ".tar", ".gz", ".bz2", ".xz", ".cbz", ".cbr"},
    "pdf": {".pdf"},
    "text": {".txt", ".md", ".markdown", ".csv", ".json", ".xml", ".html", ".log"},
}

def natsort_key(p: Path):
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', p.name)]

def categorize_file(path: Path) -> str:
    ext = path.suffix.lower()
    for cat, exts in CATEGORY_EXTENSIONS.items():
        if ext in exts:
            return cat
    return "unknown"

def filter_files_for_operation(directory: Path, operation: str) -> List[Path]:
    """Given a directory and an operation, return all files that the operation can process."""
    spec = OPERATION_SPECS.get(operation, {})
    accepted_formats = set(spec.get("accepts", {}).get("formats", []))
    accepted_categories = set(spec.get("accepts", {}).get("categories", []))

    matching = []
    for f in sorted(directory.rglob("*"), key=natsort_key):
        if not f.is_file():
            continue
        ext = f.suffix.lower()
        cat = categorize_file(f)
        if (not accepted_formats and not accepted_categories) or ext in accepted_formats or cat in accepted_categories:
            matching.append(f)
    return matching


class PipelineRunner:
    """
    Universal Pipeline Runner.
    Chains transformation operations with dynamic batch detection across all media/document categories.
    """

    async def execute_chain(
        self,
        input_path: str,
        steps: List[Dict[str, Any]],
        output_dir: Union[str, Path],
        job_id: str,
        progress_callback: Optional[Callable[[float], Awaitable[None]]] = None,
        file_info: Optional[Dict[str, Any]] = None,
        on_error: str = "stop"  # "stop" | "skip" | "collect"
    ) -> Tuple[str, ProcessResult]:
        if not steps:
            raise ValueError("Pipeline must have at least one step.")

        output_dir_p = Path(output_dir)
        temp_workspace = Path(tempfile.mkdtemp(prefix=f"ufs_pipe_{job_id[:8]}_"))
        current_input = input_path
        commands_executed: List[str] = []
        stdout_log: List[str] = []
        errors_collected: List[Dict[str, str]] = []

        total_steps = len(steps)

        try:
            for idx, step in enumerate(steps):
                step_num = idx + 1
                op = step.get("operation", "")
                params = step.get("parameters", {})
                spec = OPERATION_SPECS.get(op, {})

                is_final = (step_num == total_steps)
                step_out_dir = output_dir_p if is_final else (temp_workspace / f"step_{step_num}_out")
                step_out_dir.mkdir(parents=True, exist_ok=True)

                if progress_callback:
                    pct = ((idx) / total_steps) * 90.0
                    await progress_callback(pct)

                curr_p = Path(current_input)
                is_dir_input = curr_p.is_dir()
                batch_capable = spec.get("batch_capable", False)
                consumes_directory = "directory" in spec.get("accepts", {}).get("categories", []) or op in [
                    "images_to_pdf", "archive_to_pdf", "cbz_to_pdf", "merge_to_pdf",
                    "archive_create", "create_archive",
                    "pdf_merge", "merge_pdf", "merge_pdfs",
                    "video_concat", "concat_video", "merge_videos",
                    "audio_merge", "merge_audio", "concat_audio"
                ]

                # CASE 1: Directory input and operation is batch-capable (process each file in batch)
                if is_dir_input and batch_capable and not consumes_directory:
                    matching_files = filter_files_for_operation(curr_p, op)
                    if not matching_files:
                        # Fallback: try all files in folder if no specific match
                        matching_files = [p for p in sorted(curr_p.rglob("*"), key=natsort_key) if p.is_file()]

                    if not matching_files:
                        return str(step_out_dir), ProcessResult(
                            returncode=1,
                            stdout="",
                            stderr=f"No compatible files found in directory {current_input} for operation {op}",
                            success=False,
                            command=[op]
                        )

                    processed_count = 0
                    for sub_idx, sub_file in enumerate(matching_files):
                        sub_job_id = f"{job_id}_s{step_num}_{sub_idx:04d}"
                        try:
                            _, sub_res = await processor_registry.dispatch(
                                operation=op,
                                input_path=str(sub_file),
                                output_dir=str(step_out_dir),
                                job_id=sub_job_id,
                                parameters=params,
                                file_info=file_info
                            )
                            if sub_res.success:
                                processed_count += 1
                            else:
                                if on_error == "stop":
                                    return str(step_out_dir), sub_res
                                else:
                                    errors_collected.append({"file": sub_file.name, "error": sub_res.stderr})
                        except Exception as ex:
                            if on_error == "stop":
                                raise
                            errors_collected.append({"file": sub_file.name, "error": str(ex)})

                    step_out_path = str(step_out_dir)
                    res = ProcessResult(
                        returncode=0,
                        stdout=f"Batch processed {processed_count}/{len(matching_files)} files.",
                        stderr=f"Errors: {len(errors_collected)}" if errors_collected else "",
                        success=True,
                        command=[op, f"count={processed_count}"]
                    )

                # CASE 2: Single file or Directory consumed as a whole (e.g. archive_extract, images_to_pdf, etc.)
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

                current_input = step_out_path

            if progress_callback:
                await progress_callback(100.0)

            combined_result = ProcessResult(
                returncode=0,
                stdout="\n\n".join(stdout_log),
                stderr=f"Skipped {len(errors_collected)} error items" if errors_collected else "",
                success=True,
                command=["ufs_pipeline_chain", f"steps={total_steps}"]
            )
            return current_input, combined_result

        finally:
            if temp_workspace.exists():
                shutil.rmtree(temp_workspace, ignore_errors=True)

pipeline_runner = PipelineRunner()
