import asyncio
import os
import sys
import json
from pathlib import Path
import click
import uvicorn

# Ensure backend directory is in path
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.engines.manager import EngineManager
from app.processors.registry import processor_registry
from app.processors.hash import hash_processor
from app.processors.metadata import metadata_processor
from app.processors.ocr import ocr_processor
from app.processors.pipeline_runner import pipeline_runner


@click.group()
@click.version_option(version=settings.VERSION, prog_name="Universal File Studio CLI (ufs)")
def cli():
    """Universal File Studio (ufs) - Local-First File Processing CLI."""
    pass


@cli.command()
def status():
    """Display system diagnostics, storage usage, and configuration."""
    click.echo(f"\n=======================================================")
    click.echo(f"  Universal File Studio (UFS) - System Status")
    click.echo(f"=======================================================")
    click.echo(f"Version:      {settings.VERSION}")
    click.echo(f"Environment:  Localhost ({settings.HOST}:{settings.PORT})")
    click.echo(f"Uploads:      {settings.UPLOAD_DIR}")
    click.echo(f"Outputs:      {settings.OUTPUT_DIR}")
    click.echo(f"Max Workers:  {settings.MAX_CONCURRENT_JOBS}")
    click.echo(f"Max Upload:   {settings.MAX_UPLOAD_SIZE_MB} MB")
    
    # Engine summary
    engines = EngineManager.list_all()
    installed = [e.name for e in engines if e.installed]
    click.echo(f"\nEngines Detected: {len(installed)} / {len(engines)} available")
    click.echo(f"Installed:        {', '.join(installed) if installed else 'None'}")
    click.echo(f"=======================================================\n")


@cli.command()
def engines():
    """List all supported processing engines, versions, and paths."""
    engines_list = EngineManager.list_all()
    click.echo("\n{:<15} {:<12} {:<12} {:<30}".format("ENGINE", "STATUS", "VERSION", "BINARY PATH"))
    click.echo("-" * 70)
    for eng in engines_list:
        status_str = "Installed" if eng.installed else "Missing"
        ver_str = eng.version or "N/A"
        path_str = eng.path or "Not found"
        click.echo("{:<15} {:<12} {:<12} {:<30}".format(eng.name, status_str, ver_str, path_str))
    click.echo("")


@cli.command()
@click.argument("input_path", type=click.Path(exists=True, dir_okay=False))
@click.option("--target", "-t", required=True, help="Target format extension (e.g., mp4, webp, pdf, html)")
@click.option("--output-dir", "-o", default=None, help="Destination directory (defaults to configured OUTPUT_DIR)")
@click.option("--operation", "-p", default=None, help="Explicit operation identifier override")
def convert(input_path, target, output_dir, operation):
    """Convert an audio, video, image, or document file."""
    out_dir = output_dir or settings.OUTPUT_DIR
    os.makedirs(out_dir, exist_ok=True)
    
    ext = Path(input_path).suffix.lower()
    if operation:
        op = operation
    elif ext == ".md":
        op = "markdown_convert"
    elif ext == ".txt":
        op = "text_convert"
    elif ext in [".mp4", ".mov", ".mkv", ".avi", ".webm"]:
        op = "video_convert"
    elif ext in [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"]:
        op = "audio_convert"
    elif ext in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff"]:
        op = "image_convert"
    elif ext in [".docx", ".doc", ".xlsx", ".pptx", ".odt", ".rtf"]:
        op = "document_convert"
    else:
        op = "image_convert"

    params = {"target_format": target, "format": target}
    click.echo(f"[UFS] Converting '{Path(input_path).name}' -> format '{target}' using operation '{op}'...")

    async def _run():
        res_path, result = await processor_registry.dispatch(
            operation=op,
            input_path=input_path,
            output_dir=out_dir,
            job_id="cli_convert",
            parameters=params,
            file_info=None
        )
        return res_path, result

    res_path, result = asyncio.run(_run())
    if result.success and res_path:
        click.echo(f"SUCCESS: Output generated at: {res_path}")
        click.echo(f"Command executed: {result.command_str}")
    else:
        click.echo(f"ERROR: Conversion failed: {result.stderr or result.stdout}", err=True)
        sys.exit(1)


@cli.command()
@click.argument("input_path", type=click.Path(exists=True, dir_okay=False))
@click.option("--algorithm", "-a", type=click.Choice(["sha256", "md5", "all"]), default="all", help="Hash algorithm")
def hash(input_path, algorithm):
    """Compute streaming cryptographic digests (MD5, SHA-256) of a file."""
    click.echo(f"[UFS] Hashing '{Path(input_path).name}'...")
    
    async def _run():
        res_path, result = await hash_processor.process(
            operation="generate_hash",
            input_path=input_path,
            output_dir=Path(settings.OUTPUT_DIR),
            job_id="cli_hash",
            parameters={"format": "json"}
        )
        return res_path, result

    res_path, result = asyncio.run(_run())
    if result.success and res_path and os.path.exists(res_path):
        with open(res_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        click.echo("\n--- Cryptographic Checksums ---")
        click.echo(f"File:       {data.get('filename')}")
        if "sha256" in data:
            click.echo(f"SHA-256:    {data['sha256']}")
        if "md5" in data:
            click.echo(f"MD5:        {data['md5']}")
        if "sha1" in data:
            click.echo(f"SHA-1:      {data['sha1']}")
        if "crc32" in data:
            click.echo(f"CRC-32:     {data['crc32']}")
        click.echo("-------------------------------\n")
    else:
        click.echo(f"ERROR: Hashing failed: {result.stderr}", err=True)
        sys.exit(1)


@cli.command(name="strip-metadata")
@click.argument("input_path", type=click.Path(exists=True, dir_okay=False))
@click.option("--output-dir", "-o", default=None, help="Output directory")
def strip_metadata(input_path, output_dir):
    """Sanitize privacy metadata and EXIF tags from media or documents."""
    out_dir = output_dir or settings.OUTPUT_DIR
    click.echo(f"[UFS] Stripping metadata from '{Path(input_path).name}'...")

    async def _run():
        res_path, result = await metadata_processor.process(
            operation="strip_metadata",
            input_path=input_path,
            output_dir=Path(out_dir),
            job_id="cli_strip_meta",
            parameters={}
        )
        return res_path, result

    res_path, result = asyncio.run(_run())
    if result.success and res_path:
        click.echo(f"SUCCESS: Sanitized file created at: {res_path}")
    else:
        click.echo(f"ERROR: Metadata stripping failed: {result.stderr or result.stdout}", err=True)
        sys.exit(1)


@cli.command()
@click.argument("input_path", type=click.Path(exists=True, dir_okay=False))
@click.option("--format", "-f", type=click.Choice(["text", "hocr"]), default="text", help="OCR output format")
@click.option("--lang", "-l", default="eng", help="OCR language code (default: eng)")
@click.option("--output-dir", "-o", default=None, help="Output directory")
def ocr(input_path, format, lang, output_dir):
    """Extract text from an image or scanned document using OCR."""
    out_dir = output_dir or settings.OUTPUT_DIR
    click.echo(f"[UFS] Running OCR on '{Path(input_path).name}' (language: {lang})...")

    async def _run():
        res_path, result = await ocr_processor.process(
            operation="ocr_extract",
            input_path=input_path,
            output_dir=Path(out_dir),
            job_id="cli_ocr",
            parameters={"format": format, "lang": lang}
        )
        return res_path, result

    res_path, result = asyncio.run(_run())
    if result.success and res_path and os.path.exists(res_path):
        click.echo(f"SUCCESS: OCR text output saved to: {res_path}")
        with open(res_path, "r", encoding="utf-8", errors="replace") as f:
            preview = f.read(500)
        click.echo("\n--- Preview Extracted Text ---")
        click.echo(preview + ("..." if len(preview) == 500 else ""))
        click.echo("------------------------------\n")
    else:
        click.echo(f"ERROR: OCR failed: {result.stderr or result.stdout}", err=True)
        sys.exit(1)


@cli.group()
def pipeline():
    """Manage and execute sequential multi-step pipelines."""
    pass


@pipeline.command(name="list")
def pipeline_list():
    """List available pipeline presets."""
    from app.api.routes.pipelines import BUILTIN_PIPELINES
    click.echo("\n{:<5} {:<30} {:<10} {:<35}".format("ID", "NAME", "STEPS", "DESCRIPTION"))
    click.echo("-" * 80)
    for idx, p in enumerate(BUILTIN_PIPELINES, start=1):
        name = p.get("name", "")
        steps = p.get("steps", [])
        desc = p.get("description", "")
        click.echo("{:<5} {:<30} {:<10} {:<35}".format(
            idx, name, f"{len(steps)} steps", desc[:35]
        ))
    click.echo("")


@pipeline.command(name="run")
@click.argument("pipeline_id", type=int)
@click.argument("input_path", type=click.Path(exists=True, dir_okay=False))
@click.option("--output-dir", "-o", default=None, help="Final output directory")
def pipeline_run(pipeline_id, input_path, output_dir):
    """Execute a multi-step pipeline on a file."""
    from app.api.routes.pipelines import BUILTIN_PIPELINES
    if 1 <= pipeline_id <= len(BUILTIN_PIPELINES):
        target_pipeline = BUILTIN_PIPELINES[pipeline_id - 1]
    else:
        click.echo(f"ERROR: Pipeline #{pipeline_id} not found (choose 1-{len(BUILTIN_PIPELINES)}).", err=True)
        sys.exit(1)

    out_dir = output_dir or settings.OUTPUT_DIR
    pipe_name = target_pipeline.get("name", f"Pipeline #{pipeline_id}")
    click.echo(f"[UFS] Executing Pipeline #{pipeline_id} '{pipe_name}' on '{Path(input_path).name}'...")

    steps_dict = target_pipeline.get("steps", [])

    async def _run():
        res_path, result = await pipeline_runner.execute_chain(
            input_path=input_path,
            steps=steps_dict,
            output_dir=out_dir,
            job_id=f"cli_pipe_{pipeline_id}"
        )
        return res_path, result

    res_path, result = asyncio.run(_run())
    if result.success and res_path:
        click.echo(f"SUCCESS: Pipeline completed! Output saved to: {res_path}")
    else:
        click.echo(f"ERROR: Pipeline failed: {result.stderr or result.stdout}", err=True)
        sys.exit(1)


@cli.command()
@click.option("--host", default=settings.HOST, help="Bind socket host")
@click.option("--port", default=settings.PORT, help="Bind socket port")
@click.option("--reload/--no-reload", default=False, help="Enable auto-reload for development")
def serve(host, port, reload):
    """Start the Universal File Studio web application and API server."""
    click.echo(f"[UFS] Starting Universal File Studio at http://{host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)


def cli_main():
    """Main CLI entrypoint."""
    cli()


if __name__ == "__main__":
    cli_main()
