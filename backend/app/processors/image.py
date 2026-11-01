from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from app.processors.base import BaseProcessor
from app.engines.wrappers.imagemagick import imagemagick_engine
from app.engines.wrappers.base import ProcessResult
from app.security.path_validation import sanitize_format

ALLOWED_IMAGE_FORMATS = {"webp", "png", "jpg", "jpeg", "avif", "tiff", "bmp", "gif", "ico"}

def _safe_int(val: Any, default: int, min_val: Optional[int] = None, max_val: Optional[int] = None) -> int:
    try:
        res = int(val)
        if min_val is not None:
            res = max(min_val, res)
        if max_val is not None:
            res = min(max_val, res)
        return res
    except (ValueError, TypeError):
        return default

def _safe_float(val: Any, default: float, min_val: Optional[float] = None, max_val: Optional[float] = None) -> float:
    try:
        res = float(val)
        if min_val is not None:
            res = max(min_val, res)
        if max_val is not None:
            res = min(max_val, res)
        return res
    except (ValueError, TypeError):
        return default

class ImageProcessor(BaseProcessor):
    async def process(
        self,
        operation: str,
        input_path: str,
        output_dir: str,
        job_id: str,
        parameters: Dict[str, Any],
        file_info: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, ProcessResult]:
        in_p = Path(input_path)
        out_d = Path(output_dir)
        target_fmt = sanitize_format(parameters.get("format") or parameters.get("to"), ALLOWED_IMAGE_FORMATS, "webp")

        # 1. Image Convert
        if operation in ["image_convert", "convert_image"]:
            out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.{target_fmt}")
            res = await imagemagick_engine.convert(input_path, out_file)
            return out_file, res

        # 2. Image Resize
        elif operation in ["image_resize", "resize_image"]:
            out_file = str(out_d / f"{in_p.stem}_resized_{job_id[:8]}.{target_fmt}")
            w = _safe_int(parameters.get("width"), 1280, min_val=1, max_val=16384) if parameters.get("width") else None
            h = _safe_int(parameters.get("height"), 720, min_val=1, max_val=16384) if parameters.get("height") else None
            res = await imagemagick_engine.resize(input_path, out_file, width=w, height=h)
            return out_file, res

        # 3. Image Crop
        elif operation in ["image_crop", "crop_image"]:
            out_file = str(out_d / f"{in_p.stem}_cropped_{job_id[:8]}.{target_fmt}")
            w = _safe_int(parameters.get("width"), 300, min_val=1, max_val=16384)
            h = _safe_int(parameters.get("height"), 300, min_val=1, max_val=16384)
            x = _safe_int(parameters.get("x"), 0, min_val=0)
            y = _safe_int(parameters.get("y"), 0, min_val=0)
            res = await imagemagick_engine.crop(input_path, out_file, width=w, height=h, x=x, y=y)
            return out_file, res

        # 4. Image Rotate
        elif operation in ["image_rotate", "rotate_image"]:
            deg = _safe_float(parameters.get("degrees"), 90.0)
            out_file = str(out_d / f"{in_p.stem}_rotated_{job_id[:8]}.{target_fmt}")
            res = await imagemagick_engine.rotate(input_path, out_file, degrees=deg)
            return out_file, res

        # 5. Image Flip
        elif operation in ["image_flip", "flip_image"]:
            direction = str(parameters.get("direction", "horizontal")).lower()
            out_file = str(out_d / f"{in_p.stem}_flipped_{job_id[:8]}.{target_fmt}")
            flip_flag = "-flop" if direction == "horizontal" else "-flip"
            cmd = [*imagemagick_engine._base_cmd(), input_path, flip_flag, out_file]
            res = await imagemagick_engine.execute(cmd)
            return out_file, res

        # 6. Image Compress / Quality
        elif operation in ["image_compress", "compress_image"]:
            q = _safe_int(parameters.get("quality"), 75, min_val=1, max_val=100)
            out_file = str(out_d / f"{in_p.stem}_compressed_{job_id[:8]}.{target_fmt}")
            res = await imagemagick_engine.compress(input_path, out_file, quality=q)
            return out_file, res

        # 7. Image Grayscale
        elif operation in ["image_grayscale", "grayscale_image"]:
            out_file = str(out_d / f"{in_p.stem}_gray_{job_id[:8]}.{target_fmt}")
            cmd = [*imagemagick_engine._base_cmd(), input_path, "-colorspace", "Gray", out_file]
            res = await imagemagick_engine.execute(cmd)
            return out_file, res

        # 8. Strip Metadata (Privacy cleanup)
        elif operation in ["image_strip_metadata", "strip_metadata"]:
            out_file = str(out_d / f"{in_p.stem}_clean_{job_id[:8]}.{target_fmt}")
            cmd = [*imagemagick_engine._base_cmd(), input_path, "-strip", out_file]
            res = await imagemagick_engine.execute(cmd)
            return out_file, res

        # Default fallback
        out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.webp")
        res = await imagemagick_engine.convert(input_path, out_file)
        return out_file, res

image_processor = ImageProcessor()

