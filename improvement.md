# 🔧 Universal File Studio — Pipeline Studio Improvement Plan

> **Goal**: Make the Pipeline Studio truly universal — any file type → any output format, batch-capable, modular, and non-restrictive.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Current Architecture Audit](#current-architecture-audit)
- [Critical Limitations (Why It's Restrictive)](#critical-limitations)
- [Improvement 1: Universal Format Compatibility Matrix](#improvement-1-universal-format-compatibility-matrix)
- [Improvement 2: Generic Batch Pipeline Runner](#improvement-2-generic-batch-pipeline-runner)
- [Improvement 3: Dynamic Operation Parameter System](#improvement-3-dynamic-operation-parameter-system)
- [Improvement 4: Smart Step Chaining & Validation](#improvement-4-smart-step-chaining--validation)
- [Improvement 5: Multi-File Batch Pipeline Execution](#improvement-5-multi-file-batch-pipeline-execution)
- [Improvement 6: Missing Operations & Format Gaps](#improvement-6-missing-operations--format-gaps)
- [Improvement 7: Frontend Pipeline Editor Overhaul](#improvement-7-frontend-pipeline-editor-overhaul)
- [Improvement 8: Job System Enhancements](#improvement-8-job-system-enhancements)
- [Improvement 9: Pipeline Import/Export & Sharing](#improvement-9-pipeline-importexport--sharing)
- [Improvement 10: Modular Plugin Architecture](#improvement-10-modular-plugin-architecture)
- [Implementation Roadmap](#implementation-roadmap)
- [File-by-File Change Map](#file-by-file-change-map)

---

## Executive Summary

The current Pipeline Studio can chain sequential operations (e.g., `archive_extract → image_convert → images_to_pdf`) but has **fundamental restrictions** that prevent users from building arbitrary file-to-file conversion workflows:

| Problem | Impact |
|---------|--------|
| Batch processing only works for 4 image operations | Video/audio/document archives can't be batch-processed |
| Format options are hardcoded in the frontend | New backend operations get zero UI controls |
| No format compatibility validation | Users can create invalid chains that fail at runtime |
| Single-file input only | Can't run the same pipeline on 50 files at once |
| No conditional/branching logic | Can't route different file types through different paths |
| Parameter UI ignores the operations API schema | Adding a new engine parameter requires frontend code changes |
| No retry, no skip-on-error, no partial results | One failed file in a batch kills the entire pipeline |

This document specifies **10 concrete improvements** with code-level change maps, data models, API schemas, and UI wireframes to resolve every restriction.

---

## Current Architecture Audit

### Backend File Map

```
backend/app/
├── processors/
│   ├── pipeline_runner.py    ← Sequential chain executor (BOTTLENECK)
│   ├── registry.py           ← Hardcoded operation→processor map
│   ├── base.py               ← Abstract BaseProcessor
│   ├── video.py              ← 13 video operations (FFmpeg)
│   ├── audio.py              ← 6 audio operations (FFmpeg)
│   ├── image.py              ← 7 image operations (ImageMagick)
│   ├── pdf.py                ← 10 PDF operations (Poppler/Ghostscript/ImageMagick)
│   ├── archive.py            ← 3 archive operations (7-Zip)
│   ├── document.py           ← 6 document operations (LibreOffice/Pandoc)
│   ├── ocr.py                ← 3 OCR operations (Tesseract)
│   ├── metadata.py           ← 7 metadata operations
│   └── hash.py               ← 4 hash operations
├── api/routes/
│   ├── pipelines.py          ← CRUD + execute (no batch execute)
│   ├── operations.py         ← Lists ops with hardcoded param schemas
│   └── batch.py              ← Single-op batch only (no pipeline batch)
├── jobs/
│   └── manager.py            ← Queue workers (no per-step progress)
├── engines/wrappers/
│   ├── ffmpeg.py, imagemagick.py, sevenzip.py, poppler.py,
│   ├── ghostscript.py, libreoffice.py, pandoc.py, tesseract.py
│   └── base.py               ← ProcessResult dataclass
└── models/
    ├── pipeline.py            ← Pipeline(id, name, description, steps, created_at)
    └── job.py                 ← Job(id, file_id, operation, status, ...)
```

### Frontend File Map

```
frontend/src/
├── components/pipeline/
│   └── PipelineEditor.tsx     ← Pipeline Studio (CRITICAL — hardcoded params)
├── components/files/
│   ├── FileDropZone.tsx       ← Upload (no multi-select for pipelines)
│   ├── FileList.tsx           ← Grid/list view (no checkboxes)
│   └── FileProcessModal.tsx   ← Single-file process modal
├── services/
│   ├── api.ts                 ← REST client (no batch pipeline execute)
│   └── socket.ts              ← WebSocket (not integrated into jobs UI)
└── types/
    └── api.ts                 ← Operation, OperationParam, Pipeline types
```

---

## Critical Limitations

### 1. Pipeline Runner Is Only Batch-Aware for 4 Image Operations

**File**: `backend/app/processors/pipeline_runner.py`

The `execute_chain()` method has this hardcoded check:

```python
BATCH_IMAGE_OPS = {"image_convert", "image_resize", "image_compress", "image_strip_metadata"}

if Path(current_output).is_dir() and step["operation"] in BATCH_IMAGE_OPS:
    # Process each image file individually
    for img in sorted(images, key=natsort_key):
        ...
```

**Problem**: If a ZIP archive contains videos, documents, or mixed file types, downstream operations like `video_convert`, `document_convert`, `audio_convert`, or `ocr_image` will **receive a directory path and fail** because they expect a single file.

### 2. Operations API Returns Parameter Schemas That the Frontend Ignores

**File**: `backend/app/api/routes/operations.py`

The API returns rich parameter metadata:
```json
{
  "id": "image_convert",
  "parameters": [
    {"name": "format", "type": "select", "options": ["webp","png","jpg","avif"], "default": "webp"},
    {"name": "quality", "type": "number", "default": 80, "min": 10, "max": 100}
  ]
}
```

**File**: `frontend/src/components/pipeline/PipelineEditor.tsx`

But the frontend **ignores this entirely** and hardcodes format options via string matching:
```tsx
{step.operation.includes('image') && (
  <>
    <option value="webp">WebP</option>
    <option value="png">PNG</option>
    ...
  </>
)}
```

**Problem**: Any new operation added to the backend gets **zero** parameter controls in the pipeline UI. The user is locked into whatever the developer manually hardcoded.

### 3. No Format Compatibility Declaration

No operation declares what input file types it accepts or what output formats it produces. The frontend cannot validate whether step B can follow step A.

**Example of an invalid chain the UI currently allows**:
```
archive_extract → audio_convert → images_to_pdf
```
This will fail at runtime because `audio_convert` doesn't know how to handle a directory, and `images_to_pdf` can't process audio output.

### 4. Single-File Pipeline Execution Only

**File**: `backend/app/api/routes/pipelines.py`

```python
class PipelineExecuteRequest(BaseModel):
    file_id: int  # ← Single file only
```

Users cannot select 10 ZIP files and run the same manga-to-PDF pipeline on all of them.

### 5. No Per-Step Progress in Pipeline Jobs

**File**: `backend/app/jobs/manager.py`

Pipeline execution creates a single job with `operation="pipeline_execute"`. There's no way to know which step is currently running, which steps completed, or which step failed.

### 6. No Error Recovery in Batch Pipeline

If image 47 out of 131 fails to convert, the entire pipeline stops with no output. There's no "skip failed files" or "continue on error" option.

---

## Improvement 1: Universal Format Compatibility Matrix

### Problem
Operations don't declare their input/output types. The frontend can't validate chains or auto-suggest next steps.

### Solution
Add an `OperationSpec` schema that every operation must declare:

```python
# backend/app/processors/specs.py (NEW FILE)

OPERATION_SPECS = {
    "image_convert": {
        "id": "image_convert",
        "name": "Convert Image",
        "category": "image",
        "engine": "imagemagick",
        "description": "Convert image format",
        "accepts": {
            "categories": ["image"],
            "formats": [".jpg",".jpeg",".png",".gif",".bmp",".tiff",".webp",".avif",".svg",".heic",".psd"],
            "directory": True,  # Can process extracted directories (batch)
        },
        "produces": {
            "category": "image",
            "format_from_param": "format",  # Output format comes from `parameters.format`
            "directory": True,  # When input is directory, output is also directory
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["webp","png","jpg","avif","gif","bmp","tiff"], "default": "webp"},
            {"name": "quality", "type": "number", "default": 85, "min": 10, "max": 100,
             "description": "Compression quality (higher = better quality, larger file)"},
        ],
        "batch_capable": True,
        "estimated_time_per_mb": 0.5,  # seconds
    },
    "video_convert": {
        "id": "video_convert",
        "accepts": {
            "categories": ["video"],
            "formats": [".mp4",".mkv",".avi",".webm",".mov",".flv",".wmv",".m4v",".3gp"],
            "directory": True,
        },
        "produces": {
            "category": "video",
            "format_from_param": "format",
            "directory": True,
        },
        "parameters": [
            {"name": "format", "type": "select", "options": ["mp4","webm","mkv","avi","mov"], "default": "mp4"},
            {"name": "crf", "type": "number", "default": 28, "min": 0, "max": 51,
             "description": "Constant Rate Factor (lower = better quality, larger file)"},
            {"name": "preset", "type": "select", "options": ["ultrafast","fast","medium","slow","veryslow"], "default": "medium",
             "description": "Encoding speed vs compression trade-off"},
        ],
        "batch_capable": True,
    },
    "archive_extract": {
        "id": "archive_extract",
        "accepts": {
            "categories": ["archive"],
            "formats": [".zip",".7z",".rar",".tar",".gz",".bz2",".xz",".cbz",".cbr",".tar.gz",".tgz"],
            "directory": False,
        },
        "produces": {
            "category": "directory",  # Special: outputs a directory of mixed files
            "format": "directory",
            "directory": False,  # The output itself IS a directory
        },
        "parameters": [
            {"name": "password", "type": "text", "default": "", "description": "Archive password (if encrypted)"},
        ],
        "batch_capable": False,
    },
    "images_to_pdf": {
        "id": "images_to_pdf",
        "accepts": {
            "categories": ["directory", "image"],  # Takes a directory of images
            "formats": [".jpg",".jpeg",".png",".webp",".bmp",".tiff",".gif",".avif"],
            "directory": True,  # Prefers directory input
        },
        "produces": {
            "category": "pdf",
            "format": ".pdf",
            "directory": False,
        },
        "parameters": [
            {"name": "quality", "type": "number", "default": 85, "min": 20, "max": 100},
            {"name": "compress", "type": "select", "options": ["jpeg","deflate"], "default": "jpeg"},
        ],
        "batch_capable": False,
    },
    # ... etc for ALL operations
}
```

### New API Endpoint

```python
# GET /api/v1/operations/specs
@router.get("/specs")
async def get_operation_specs():
    return OPERATION_SPECS

# GET /api/v1/operations/{op_id}/compatible-next
@router.get("/{op_id}/compatible-next")
async def get_compatible_next_operations(op_id: str):
    """Given an operation, return which operations can follow it."""
    spec = OPERATION_SPECS.get(op_id)
    if not spec:
        raise HTTPException(404, "Operation not found")

    output_category = spec["produces"]["category"]
    compatible = []
    for next_op in OPERATION_SPECS.values():
        accepted_cats = next_op["accepts"]["categories"]
        if output_category in accepted_cats or "directory" in accepted_cats:
            compatible.append(next_op)
    return compatible
```

### Frontend Integration

```typescript
// When user selects operation for step N, auto-filter step N+1 options:
const getCompatibleOps = (currentOp: string) => {
  const spec = operationSpecs[currentOp];
  return allOperations.filter(op => {
    const nextSpec = operationSpecs[op.id];
    return nextSpec.accepts.categories.includes(spec.produces.category);
  });
};
```

---

## Improvement 2: Generic Batch Pipeline Runner

### Problem
`pipeline_runner.py` only batch-processes images. Videos, audio, documents inside extracted archives are ignored.

### Solution
Make the pipeline runner **operation-agnostic** for batch processing.

### Proposed Code

```python
# backend/app/processors/pipeline_runner.py — REWRITE

import re
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from app.processors.registry import processor_registry
from app.processors.specs import OPERATION_SPECS
from app.engines.wrappers.base import ProcessResult

# File extensions by category
CATEGORY_EXTENSIONS = {
    "image": {".jpg",".jpeg",".png",".gif",".bmp",".tiff",".webp",".avif",".svg",".heic",".psd"},
    "video": {".mp4",".mkv",".avi",".webm",".mov",".flv",".wmv",".m4v",".3gp",".ts",".m2ts"},
    "audio": {".mp3",".wav",".flac",".aac",".ogg",".wma",".m4a",".opus",".aiff"},
    "document": {".pdf",".docx",".doc",".odt",".rtf",".txt",".html",".htm",".epub",".md",".tex"},
    "spreadsheet": {".xlsx",".xls",".ods",".csv",".tsv"},
    "presentation": {".pptx",".ppt",".odp"},
    "archive": {".zip",".7z",".rar",".tar",".gz",".bz2",".cbz",".cbr"},
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
    """Given a directory and an operation, return files that the operation can process."""
    spec = OPERATION_SPECS.get(operation, {})
    accepted_formats = set(spec.get("accepts", {}).get("formats", []))
    accepted_categories = set(spec.get("accepts", {}).get("categories", []))

    matching = []
    for f in sorted(directory.rglob("*"), key=natsort_key):
        if not f.is_file():
            continue
        ext = f.suffix.lower()
        cat = categorize_file(f)
        if ext in accepted_formats or cat in accepted_categories:
            matching.append(f)
    return matching


class PipelineRunner:
    async def execute_chain(
        self,
        input_path: str,
        steps: List[Dict[str, Any]],
        output_dir,
        job_id: str,
        on_error: str = "stop",  # "stop" | "skip" | "collect"
        on_progress: callable = None,  # callback(step_index, file_index, total_files)
    ) -> Tuple[str, ProcessResult]:
        current_output = input_path
        last_result = None

        for step_idx, step in enumerate(steps):
            operation = step["operation"]
            parameters = step.get("parameters", {})
            spec = OPERATION_SPECS.get(operation, {})

            # Report progress
            if on_progress:
                on_progress(step_idx, 0, 1)

            # CASE 1: Current output is a directory and operation supports batch
            if Path(current_output).is_dir() and spec.get("batch_capable", False):
                files = filter_files_for_operation(Path(current_output), operation)

                if not files:
                    # No compatible files found — pass directory as-is to next step
                    continue

                # Create batch output directory
                batch_out = Path(output_dir) / f"_batch_{step_idx}_{job_id[:8]}"
                batch_out.mkdir(parents=True, exist_ok=True)

                errors = []
                for file_idx, file_path in enumerate(files):
                    if on_progress:
                        on_progress(step_idx, file_idx, len(files))
                    try:
                        out_file, result = await processor_registry.dispatch(
                            operation=operation,
                            input_path=str(file_path),
                            output_dir=str(batch_out),
                            job_id=f"{job_id}_{step_idx}_{file_idx}",
                            parameters=parameters,
                        )
                        last_result = result
                    except Exception as e:
                        if on_error == "stop":
                            raise
                        elif on_error == "skip":
                            errors.append({"file": str(file_path), "error": str(e)})
                            continue
                        elif on_error == "collect":
                            errors.append({"file": str(file_path), "error": str(e)})
                            continue

                current_output = str(batch_out)

            # CASE 2: Current output is a directory but operation doesn't support batch
            # (e.g., images_to_pdf, archive_create — these CONSUME the entire directory)
            elif Path(current_output).is_dir() and "directory" in spec.get("accepts", {}).get("categories", []):
                is_last = step_idx == len(steps) - 1
                step_out = str(output_dir) if is_last else str(Path(output_dir) / f"_step_{step_idx}")
                Path(step_out).mkdir(parents=True, exist_ok=True)

                out_file, result = await processor_registry.dispatch(
                    operation=operation,
                    input_path=current_output,
                    output_dir=step_out,
                    job_id=f"{job_id}_{step_idx}",
                    parameters=parameters,
                )
                current_output = out_file
                last_result = result

            # CASE 3: Single file → single file operation
            else:
                is_last = step_idx == len(steps) - 1
                step_out = str(output_dir) if is_last else str(Path(output_dir) / f"_step_{step_idx}")
                Path(step_out).mkdir(parents=True, exist_ok=True)

                out_file, result = await processor_registry.dispatch(
                    operation=operation,
                    input_path=current_output,
                    output_dir=step_out,
                    job_id=f"{job_id}_{step_idx}",
                    parameters=parameters,
                )
                current_output = out_file
                last_result = result

        return current_output, last_result
```

### Key Differences from Current Implementation

| Feature | Current | Proposed |
|---------|---------|----------|
| Batch operations | 4 image ops hardcoded | Any operation with `batch_capable: true` in spec |
| File filtering | Image extensions only | Spec-driven: checks `accepts.formats` and `accepts.categories` |
| Error handling | Entire chain stops | Configurable: `stop`, `skip`, or `collect` errors |
| Progress reporting | None | Callback with `(step_index, file_index, total_files)` |
| Directory consumers | `images_to_pdf` hardcoded | Any op with `"directory" in accepts.categories` |
| Mixed-type archives | Unsupported | `filter_files_for_operation()` picks matching files per step |

---

## Improvement 3: Dynamic Operation Parameter System

### Problem
The frontend hardcodes format dropdowns based on `step.operation.includes('image')` string matching. This breaks for operations like `extract_audio`, `archive_to_pdf`, etc.

### Solution
The frontend must **dynamically render parameter controls** from the operation's parameter schema returned by the API.

### Proposed Frontend Component

```tsx
// frontend/src/components/pipeline/StepParameterForm.tsx (NEW FILE)

interface StepParameterFormProps {
  operation: Operation;
  parameters: Record<string, any>;
  onChange: (paramName: string, value: any) => void;
}

const StepParameterForm: React.FC<StepParameterFormProps> = ({
  operation, parameters, onChange
}) => {
  if (!operation.parameters || operation.parameters.length === 0) {
    return (
      <div className="text-[10px] text-slate-500 italic">
        No configurable parameters for this operation.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {operation.parameters.map((param) => (
        <div key={param.name}>
          <label className="block text-[10px] text-slate-400 mb-1 capitalize">
            {param.name.replace(/_/g, ' ')}
            {param.description && (
              <span className="text-slate-600 ml-1" title={param.description}>ⓘ</span>
            )}
          </label>

          {/* SELECT */}
          {param.type === 'select' && (
            <select
              value={parameters[param.name] ?? param.default ?? ''}
              onChange={(e) => onChange(param.name, e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-900 border border-surface-750
                         text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              {param.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          {/* NUMBER (with range slider for bounded, input for unbounded) */}
          {param.type === 'number' && param.min !== undefined && param.max !== undefined ? (
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>{param.min}</span>
                <span className="font-mono text-brand-400 font-bold">
                  {parameters[param.name] ?? param.default}
                </span>
                <span>{param.max}</span>
              </div>
              <input
                type="range"
                min={param.min}
                max={param.max}
                value={parameters[param.name] ?? param.default ?? param.min}
                onChange={(e) => onChange(param.name, parseInt(e.target.value, 10))}
                className="w-full accent-brand-500 h-1.5 bg-surface-800 rounded-lg cursor-pointer"
              />
            </div>
          ) : param.type === 'number' ? (
            <input
              type="number"
              value={parameters[param.name] ?? param.default ?? ''}
              onChange={(e) => onChange(param.name, parseInt(e.target.value, 10) || 0)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-900 border border-surface-750
                         text-xs text-slate-200 focus:outline-none"
            />
          ) : null}

          {/* TEXT */}
          {param.type === 'text' && (
            <input
              type="text"
              value={parameters[param.name] ?? param.default ?? ''}
              onChange={(e) => onChange(param.name, e.target.value)}
              placeholder={param.description || ''}
              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-900 border border-surface-750
                         text-xs text-slate-200 focus:outline-none"
            />
          )}

          {/* BOOLEAN */}
          {param.type === 'boolean' && (
            <button
              type="button"
              onClick={() => onChange(param.name, !parameters[param.name])}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                parameters[param.name]
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'bg-surface-900 text-slate-400 border border-surface-750'
              }`}
            >
              {parameters[param.name] ? 'Enabled' : 'Disabled'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

### Benefit
- **Zero frontend changes needed** when a new operation or parameter is added to the backend.
- The operations API is the single source of truth.
- Works for ANY operation, including custom user-defined ones.

---

## Improvement 4: Smart Step Chaining & Validation

### Problem
Users can build invalid chains that fail at runtime with cryptic errors.

### Solution

#### Backend: Chain Validation Endpoint

```python
# POST /api/v1/pipelines/validate
@router.post("/validate")
async def validate_pipeline_chain(payload: PipelineCreate):
    """Validate that a pipeline's steps form a compatible chain."""
    issues = []

    for i in range(len(payload.steps) - 1):
        current_op = payload.steps[i].operation
        next_op = payload.steps[i + 1].operation

        current_spec = OPERATION_SPECS.get(current_op)
        next_spec = OPERATION_SPECS.get(next_op)

        if not current_spec:
            issues.append({"step": i, "severity": "error", "message": f"Unknown operation: {current_op}"})
            continue
        if not next_spec:
            issues.append({"step": i+1, "severity": "error", "message": f"Unknown operation: {next_op}"})
            continue

        output_cat = current_spec["produces"]["category"]
        accepted_cats = next_spec["accepts"]["categories"]

        if output_cat not in accepted_cats and "directory" not in accepted_cats:
            issues.append({
                "step": i + 1,
                "severity": "error",
                "message": f"Step {i+2} ({next_op}) cannot accept output from step {i+1} ({current_op}). "
                           f"Expected input categories: {accepted_cats}, but receives: {output_cat}"
            })

        # Check: if current produces directory but next is not batch-capable and doesn't accept directory
        if output_cat == "directory" and not next_spec.get("batch_capable") and "directory" not in accepted_cats:
            issues.append({
                "step": i + 1,
                "severity": "warning",
                "message": f"Step {i+2} ({next_op}) is not batch-capable. Only matching files will be processed."
            })

    return {
        "valid": len([i for i in issues if i["severity"] == "error"]) == 0,
        "issues": issues
    }
```

#### Frontend: Real-Time Validation

```tsx
// In PipelineEditor, after any step change:
useEffect(() => {
  const validate = async () => {
    if (newSteps.length < 2) return;
    const result = await api.validatePipeline({ name: "draft", description: "", steps: newSteps });
    setValidationIssues(result.issues);
  };
  validate();
}, [newSteps]);

// Render validation badges on each step:
{validationIssues
  .filter(i => i.step === idx)
  .map((issue, j) => (
    <div key={j} className={`text-[10px] p-2 rounded-lg mt-2 ${
      issue.severity === 'error'
        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
    }`}>
      {issue.severity === 'error' ? '❌' : '⚠️'} {issue.message}
    </div>
  ))
}
```

---

## Improvement 5: Multi-File Batch Pipeline Execution

### Problem
Users can only select one input file per pipeline run.

### Solution

#### Backend: Batch Pipeline Execute Endpoint

```python
# POST /api/v1/pipelines/{id}/batch-execute
class PipelineBatchExecuteRequest(BaseModel):
    file_ids: List[int]
    on_error: str = "skip"  # "stop" | "skip" | "collect"

@router.post("/{pipeline_id}/batch-execute")
async def batch_execute_pipeline(
    pipeline_id: int,
    payload: PipelineBatchExecuteRequest,
    db: AsyncSession = Depends(get_db)
):
    pipeline = await db.get(Pipeline, pipeline_id)
    if not pipeline:
        raise HTTPException(404, "Pipeline not found")

    jobs = []
    for file_id in payload.file_ids:
        file_record = await db.get(FileRecord, file_id)
        if not file_record:
            continue

        job = Job(
            file_id=file_id,
            operation="pipeline_execute",
            parameters={
                "pipeline_steps": pipeline.steps,
                "on_error": payload.on_error,
                "batch_group_id": f"batch_{pipeline_id}_{uuid4().hex[:8]}",
            },
            input_path=file_record.upload_path,
        )
        db.add(job)
        jobs.append(job)

    await db.commit()
    for job in jobs:
        await job_manager.enqueue(job)

    return {"batch_id": jobs[0].parameters.get("batch_group_id"), "job_count": len(jobs)}
```

#### Frontend: Multi-Select File Picker

```tsx
// In PipelineEditor execution panel, replace single <select> with multi-select:
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <label className="text-xs font-semibold text-slate-200">Select Input Files</label>
    <span className="text-[10px] text-slate-500">{selectedFileIds.length} selected</span>
  </div>

  <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-xl bg-surface-950 border border-surface-800">
    {files.map(f => (
      <label key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                                    hover:bg-surface-900 cursor-pointer">
        <input
          type="checkbox"
          checked={selectedFileIds.includes(f.id)}
          onChange={() => toggleFileSelection(f.id)}
          className="accent-brand-500"
        />
        <span className="text-xs text-slate-300">{f.filename}</span>
        <span className="text-[10px] text-slate-500 ml-auto">{f.category}</span>
      </label>
    ))}
  </div>

  <button onClick={handleBatchExecute} disabled={selectedFileIds.length === 0}>
    Run Pipeline on {selectedFileIds.length} Files
  </button>
</div>
```

---

## Improvement 6: Missing Operations & Format Gaps

### Currently Missing Operations

| Operation | Description | Engine | Priority |
|-----------|-------------|--------|----------|
| `pdf_merge` | Merge multiple PDFs into one | Ghostscript/qpdf | 🔴 High |
| `pdf_split` | Split PDF by page ranges | Poppler/qpdf | 🔴 High |
| `pdf_encrypt` | Password-protect PDF | qpdf | 🟡 Medium |
| `pdf_decrypt` | Remove PDF password | qpdf | 🟡 Medium |
| `pdf_watermark` | Add text/image watermark | ImageMagick+Ghostscript | 🟡 Medium |
| `video_concat` | Concatenate multiple videos | FFmpeg concat | 🔴 High |
| `video_watermark` | Burn-in image/text overlay | FFmpeg drawtext/overlay | 🟡 Medium |
| `video_subtitle_burn` | Burn subtitles into video | FFmpeg subtitles filter | 🟡 Medium |
| `audio_merge` | Concatenate audio files | FFmpeg concat | 🟡 Medium |
| `audio_volume` | Adjust audio volume/normalize | FFmpeg loudnorm | 🟢 Low |
| `image_montage` | Create image collage/grid | ImageMagick montage | 🟡 Medium |
| `image_watermark` | Overlay text/image watermark | ImageMagick composite | 🟡 Medium |
| `image_thumbnail` | Generate thumbnail at size | ImageMagick | 🟢 Low |
| `html_to_pdf` | Convert HTML page to PDF | wkhtmltopdf/Chromium | 🔴 High |
| `archive_list` | List archive contents | 7-Zip | 🟢 Low |
| `file_rename` | Rename file using pattern | Python | 🟡 Medium |
| `file_split` | Split large file into chunks | Python | 🟢 Low |

### Missing Format Support in Current Processors

| Processor | Missing Formats |
|-----------|----------------|
| Image | `.heic`, `.heif`, `.raw`, `.cr2`, `.nef`, `.arw`, `.dng`, `.ico`, `.jxl` (JPEG XL) |
| Video | `.vob`, `.mts`, `.m2ts`, `.divx`, `.ogv`, `.f4v` |
| Audio | `.wma`, `.ape`, `.dsd`, `.alac`, `.ac3`, `.dts` |
| Document | `.rtf` reading, `.epub` → PDF (reliable), `.latex` → PDF |
| Archive | `.tar.gz`, `.tar.bz2`, `.tar.xz`, `.iso`, `.dmg` |

### Implementation Example: `pdf_merge`

```python
# backend/app/processors/pdf.py — add method

async def _merge_pdfs(self, input_path, output_dir, job_id, parameters):
    """Merge multiple PDFs. Input can be a directory of PDFs or a single PDF."""
    in_p = Path(input_path)
    out_d = Path(output_dir)

    if in_p.is_dir():
        pdfs = sorted([p for p in in_p.glob("*.pdf")], key=lambda p: p.name)
    else:
        pdfs = [in_p]

    if len(pdfs) < 2:
        return str(pdfs[0]), ProcessResult(success=True, output_path=str(pdfs[0]))

    out_file = str(out_d / f"merged_{job_id[:8]}.pdf")

    # Use Ghostscript for merge
    cmd = [
        "gs", "-dBATCH", "-dNOPAUSE", "-q",
        "-sDEVICE=pdfwrite",
        f"-sOutputFile={out_file}",
        *[str(p) for p in pdfs]
    ]
    proc = await asyncio.create_subprocess_exec(*cmd, stdout=PIPE, stderr=PIPE)
    stdout, stderr = await proc.communicate()

    return out_file, ProcessResult(
        success=proc.returncode == 0,
        output_path=out_file,
        engine="ghostscript",
        command=" ".join(cmd),
    )
```

---

## Improvement 7: Frontend Pipeline Editor Overhaul

### 7a. Replace Hardcoded Parameters with Dynamic Rendering

**Current Problem** (line-by-line in `PipelineEditor.tsx`):
```tsx
// HARDCODED — only shows format if operation name contains "convert" or "archive_create"
{(step.operation.includes('convert') || step.operation === 'archive_create') && (
  <select> /* hardcoded options per keyword match */ </select>
)}

// HARDCODED — only shows quality slider if operation contains "image" or "pdf"
{(step.operation.includes('image') || step.operation.includes('pdf')) && (
  <input type="range" />
)}
```

**Solution**: Replace with `<StepParameterForm operation={currentOp} />` that reads from the API spec.

### 7b. Add Step Compatibility Filtering

When adding a new step after step N, only show operations that can accept step N's output:

```tsx
const getAvailableOpsForStep = (stepIndex: number): Operation[] => {
  if (stepIndex === 0) return allOperations; // First step can be anything

  const prevOp = newSteps[stepIndex - 1].operation;
  const prevSpec = operationSpecs[prevOp];
  if (!prevSpec) return allOperations;

  const outputCategory = prevSpec.produces.category;
  return allOperations.filter(op => {
    const spec = operationSpecs[op.id];
    return spec?.accepts.categories.includes(outputCategory);
  });
};
```

### 7c. Visual Flow Diagram Enhancement

Replace the flat step list with a proper flow visualization:

```
┌─────────────┐    ┌─────────────────┐    ┌──────────────┐
│ 📂 Extract  │ →  │ 🖼️ Convert      │ →  │ 📄 Compile   │
│ ZIP Archive │    │ → WebP (85%)    │    │ → PDF (JPEG) │
│             │    │ Batch: 131 imgs │    │              │
│ ✅ Stage 1  │    │ ✅ Stage 2       │    │ ✅ Stage 3    │
└─────────────┘    └─────────────────┘    └──────────────┘
```

### 7d. Pipeline Execution History Panel

Add a "History" tab next to the pipeline detail view:

```tsx
interface PipelineRun {
  id: string;
  pipeline_id: number;
  input_file: string;
  status: 'completed' | 'failed' | 'running';
  started_at: string;
  completed_at: string;
  output_path: string;
  steps_completed: number;
  total_steps: number;
  error?: string;
}
```

### 7e. Drag-and-Drop Step Reordering

Consider adding `@dnd-kit/core` or `react-beautiful-dnd` for intuitive step reordering:

```tsx
<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={newSteps.map((_, i) => `step-${i}`)}>
    {newSteps.map((step, idx) => (
      <SortableStepCard key={`step-${idx}`} step={step} index={idx} />
    ))}
  </SortableContext>
</DndContext>
```

---

## Improvement 8: Job System Enhancements

### 8a. Per-Step Progress Tracking

```python
# backend/app/models/job.py — Add fields
class Job(Base):
    # ... existing fields ...
    current_step: int = Column(Integer, default=0)
    total_steps: int = Column(Integer, default=1)
    step_details: dict = Column(JSON, default=list)
    # step_details = [
    #   {"operation": "archive_extract", "status": "completed", "duration": 1.2},
    #   {"operation": "image_convert", "status": "running", "progress": "47/131", "duration": null},
    #   {"operation": "images_to_pdf", "status": "pending", "duration": null}
    # ]
    batch_group_id: str = Column(String, nullable=True)
```

### 8b. Job Priority Queue

```python
# backend/app/jobs/manager.py — Replace asyncio.Queue with PriorityQueue
import heapq

class PriorityJobQueue:
    def __init__(self):
        self._queue = []
        self._counter = 0

    async def put(self, job, priority=5):
        heapq.heappush(self._queue, (priority, self._counter, job))
        self._counter += 1

    async def get(self):
        return heapq.heappop(self._queue)[2]

# Priority levels:
# 1 = Critical (user-initiated single conversion)
# 3 = Normal (pipeline step)
# 5 = Low (batch background processing)
```

### 8c. Resource-Aware Scheduling

```python
# Don't run 4 FFmpeg transcodes simultaneously on a 4-core machine
RESOURCE_WEIGHTS = {
    "ffmpeg": 2.0,     # Heavy CPU + I/O
    "imagemagick": 0.5, # Light per-image
    "libreoffice": 3.0, # Very heavy, singleton
    "ghostscript": 1.0,
    "tesseract": 1.5,
    "7z": 0.5,
    "pandoc": 0.3,
}

# Worker checks: current_load + job_weight <= max_concurrent_weight
```

### 8d. Job Retry

```python
# backend/app/api/routes/jobs.py
@router.post("/{job_id}/retry")
async def retry_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job or job.status != "failed":
        raise HTTPException(400, "Only failed jobs can be retried")

    job.status = "pending"
    job.error_message = None
    job.retry_count = (job.retry_count or 0) + 1
    await db.commit()
    await job_manager.enqueue(job)
    return job
```

---

## Improvement 9: Pipeline Import/Export & Sharing

### Export Pipeline as JSON

```python
# GET /api/v1/pipelines/{id}/export
@router.get("/{pipeline_id}/export")
async def export_pipeline(pipeline_id: int, db: AsyncSession = Depends(get_db)):
    pipeline = await db.get(Pipeline, pipeline_id)
    return {
        "ufs_pipeline_version": "1.0",
        "name": pipeline.name,
        "description": pipeline.description,
        "steps": pipeline.steps,
        "exported_at": datetime.utcnow().isoformat(),
        "requires_engines": list(set(
            OPERATION_SPECS[s["operation"]]["engine"]
            for s in pipeline.steps
            if s["operation"] in OPERATION_SPECS
        ))
    }
```

### Import Pipeline from JSON

```python
# POST /api/v1/pipelines/import
@router.post("/import")
async def import_pipeline(file: UploadFile, db: AsyncSession = Depends(get_db)):
    data = json.loads(await file.read())
    pipeline = Pipeline(
        name=data["name"],
        description=data.get("description", ""),
        steps=data["steps"]
    )
    db.add(pipeline)
    await db.commit()
    return pipeline
```

### Frontend: Import/Export Buttons

```tsx
<div className="flex gap-2">
  <button onClick={() => exportPipeline(selectedPipeline.id)}>
    📥 Export JSON
  </button>
  <label className="cursor-pointer">
    📤 Import Pipeline
    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
  </label>
</div>
```

---

## Improvement 10: Modular Plugin Architecture

### Goal
Allow third-party or user-defined operations without modifying core code.

### Plugin Registration System

```python
# backend/app/processors/plugins.py (NEW FILE)

import importlib
from pathlib import Path

PLUGINS_DIR = Path("plugins")

class PluginManager:
    def __init__(self):
        self.plugins = {}

    def discover(self):
        """Scan plugins/ directory for operation modules."""
        if not PLUGINS_DIR.exists():
            return

        for plugin_dir in PLUGINS_DIR.iterdir():
            if not plugin_dir.is_dir():
                continue
            manifest = plugin_dir / "manifest.json"
            if manifest.exists():
                self._load_plugin(plugin_dir, manifest)

    def _load_plugin(self, path, manifest_path):
        import json
        manifest = json.loads(manifest_path.read_text())
        # manifest.json:
        # {
        #   "name": "image-upscale",
        #   "version": "1.0.0",
        #   "operations": [
        #     {
        #       "id": "image_upscale",
        #       "name": "AI Upscale Image",
        #       "engine": "realesrgan",
        #       "spec": { ... },
        #       "processor_module": "processor.py",
        #       "processor_class": "UpscaleProcessor"
        #     }
        #   ]
        # }
        for op in manifest.get("operations", []):
            module = importlib.import_module(f"plugins.{path.name}.{op['processor_module'].replace('.py','')}")
            processor_cls = getattr(module, op["processor_class"])
            self.plugins[op["id"]] = {
                "spec": op["spec"],
                "processor": processor_cls(),
            }

plugin_manager = PluginManager()
```

### Example Plugin Directory Structure

```
plugins/
└── image-upscale/
    ├── manifest.json
    ├── processor.py
    └── requirements.txt
```

---

## Implementation Roadmap

### Phase 1: Foundation (Estimated: 2-3 days)
- [ ] Create `backend/app/processors/specs.py` with `OPERATION_SPECS` for all existing operations
- [ ] Add `/api/v1/operations/specs` endpoint
- [ ] Add `/api/v1/pipelines/validate` endpoint
- [ ] Fix pipeline runner to use spec-driven batch detection

### Phase 2: Dynamic Frontend (Estimated: 2-3 days)
- [ ] Create `StepParameterForm.tsx` component (reads from API specs)
- [ ] Replace all hardcoded parameter UI in PipelineEditor
- [ ] Add step compatibility filtering in operation dropdown
- [ ] Add real-time chain validation display

### Phase 3: Batch Pipeline (Estimated: 1-2 days)
- [ ] Add `PipelineBatchExecuteRequest` schema
- [ ] Add `/api/v1/pipelines/{id}/batch-execute` endpoint
- [ ] Add multi-select file picker in frontend
- [ ] Add batch progress tracking

### Phase 4: Missing Operations (Estimated: 3-4 days)
- [ ] Implement `pdf_merge`, `pdf_split`
- [ ] Implement `video_concat`, `audio_merge`
- [ ] Implement `html_to_pdf`
- [ ] Implement `image_montage`, `image_watermark`
- [ ] Add missing format support (HEIC, JXL, RAW)

### Phase 5: Job System (Estimated: 2 days)
- [ ] Add per-step progress tracking to Job model
- [ ] Add `batch_group_id` for grouped jobs
- [ ] Add job retry endpoint
- [ ] Integrate WebSocket push (replace polling)

### Phase 6: Polish (Estimated: 2 days)
- [ ] Pipeline import/export
- [ ] Pipeline execution history panel
- [ ] Drag-and-drop step reordering
- [ ] Plugin architecture scaffold

---

## File-by-File Change Map

| File | Change Type | Description |
|------|-------------|-------------|
| `backend/app/processors/specs.py` | **NEW** | Operation specification registry with format compatibility matrix |
| `backend/app/processors/pipeline_runner.py` | **REWRITE** | Generic batch-aware chain executor using specs |
| `backend/app/processors/registry.py` | **MODIFY** | Add dynamic plugin registration, spec lookup |
| `backend/app/processors/pdf.py` | **MODIFY** | Add `pdf_merge`, `pdf_split`, `pdf_encrypt` |
| `backend/app/processors/video.py` | **MODIFY** | Add `video_concat`, `video_watermark` |
| `backend/app/processors/audio.py` | **MODIFY** | Add `audio_merge`, `audio_volume` |
| `backend/app/processors/image.py` | **MODIFY** | Add `image_montage`, `image_watermark`, `image_thumbnail` |
| `backend/app/api/routes/operations.py` | **MODIFY** | Add `/specs` and `/compatible-next` endpoints |
| `backend/app/api/routes/pipelines.py` | **MODIFY** | Add `/validate`, `/batch-execute`, `/export`, `/import` |
| `backend/app/api/routes/batch.py` | **MODIFY** | Add batch pipeline execution |
| `backend/app/models/job.py` | **MODIFY** | Add `current_step`, `total_steps`, `step_details`, `batch_group_id`, `retry_count` |
| `backend/app/schemas/pipeline_schema.py` | **MODIFY** | Add `PipelineBatchExecuteRequest`, `PipelineValidationResponse` |
| `backend/app/jobs/manager.py` | **MODIFY** | Add priority queue, resource-aware scheduling, per-step progress |
| `backend/app/processors/plugins.py` | **NEW** | Plugin discovery and registration system |
| `frontend/src/components/pipeline/StepParameterForm.tsx` | **NEW** | Dynamic parameter renderer from API specs |
| `frontend/src/components/pipeline/PipelineEditor.tsx` | **REWRITE** | Use StepParameterForm, add compatibility filtering, multi-select, validation |
| `frontend/src/components/pipeline/PipelineHistory.tsx` | **NEW** | Execution history panel |
| `frontend/src/components/files/FileList.tsx` | **MODIFY** | Add multi-select checkboxes |
| `frontend/src/services/api.ts` | **MODIFY** | Add `getOperationSpecs()`, `validatePipeline()`, `batchExecutePipeline()`, `exportPipeline()`, `importPipeline()` |
| `frontend/src/types/api.ts` | **MODIFY** | Add `OperationSpec`, `ValidationResult`, `BatchExecuteResponse` types |

---

> [!IMPORTANT]
> The single most impactful change is **Improvement 1 (Format Compatibility Matrix)** + **Improvement 3 (Dynamic Parameters)**. Together, they eliminate the root cause of the restrictiveness: hardcoded operation knowledge in the frontend. Every other improvement builds on this foundation.

> [!TIP]
> Start with `specs.py` → `/api/v1/operations/specs` → `StepParameterForm.tsx`. This alone will make the pipeline editor work with **any** current and future operation without frontend code changes.
