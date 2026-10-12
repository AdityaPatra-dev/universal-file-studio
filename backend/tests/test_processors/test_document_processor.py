import os
import pytest
from pathlib import Path
from app.processors.document import document_processor
from app.processors.registry import processor_registry
from app.engines.wrappers.libreoffice import libreoffice_engine
from app.engines.wrappers.pandoc import pandoc_engine

@pytest.fixture
def temp_workdir(tmp_path):
    out_dir = tmp_path / "outputs"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir

@pytest.mark.anyio
async def test_markdown_to_html_conversion(temp_workdir, tmp_path):
    md_file = tmp_path / "notes.md"
    md_file.write_text("# Universal File Studio\n\n**High Performance** local file processing.\n\n- Zero cloud dependencies\n- Private and fast\n", encoding="utf-8")

    out_file, res = await document_processor.process(
        operation="markdown_convert",
        input_path=str(md_file),
        output_dir=temp_workdir,
        job_id="job_md_001",
        parameters={"format": "html"}
    )

    assert res.success is True
    assert os.path.exists(out_file)
    assert out_file.endswith(".html")
    with open(out_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Universal File Studio" in content
    assert "<strong>High Performance</strong>" in content

@pytest.mark.anyio
async def test_text_conversion(temp_workdir, tmp_path):
    html_file = tmp_path / "sample.html"
    html_file.write_text("<p>Hello <strong>World</strong> from Studio!</p>", encoding="utf-8")

    out_file, res = await document_processor.process(
        operation="text_convert",
        input_path=str(html_file),
        output_dir=temp_workdir,
        job_id="job_txt_001",
        parameters={"format": "txt"}
    )

    assert res.success is True
    assert os.path.exists(out_file)
    with open(out_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Hello World from Studio!" in content

@pytest.mark.anyio
async def test_libreoffice_document_conversion(temp_workdir, tmp_path):
    if not libreoffice_engine.is_installed():
        pytest.skip("LibreOffice is not installed on this test host.")

    doc_file = tmp_path / "sample_doc.txt"
    doc_file.write_text("Universal File Studio LibreOffice Automated Conversion Test Document.\nConfidential.\n", encoding="utf-8")

    out_file, res = await document_processor.process(
        operation="document_convert",
        input_path=str(doc_file),
        output_dir=temp_workdir,
        job_id="job_lo_001",
        parameters={"format": "pdf"}
    )

    assert res.success is True
    assert os.path.exists(out_file)
    assert out_file.endswith(".pdf")
    assert os.path.getsize(out_file) > 100

@pytest.mark.anyio
async def test_processor_registry_document_dispatch(temp_workdir, tmp_path):
    md_file = tmp_path / "readme.md"
    md_file.write_text("## Test Header\nSome body text.", encoding="utf-8")

    out_file, res = await processor_registry.dispatch(
        operation="markdown_convert",
        input_path=str(md_file),
        output_dir=str(temp_workdir),
        job_id="job_reg_doc_001",
        parameters={"format": "html"}
    )

    assert res.success is True
    assert os.path.exists(out_file)
    assert out_file.endswith(".html")
