from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from app.processors.base import BaseProcessor
from app.engines.wrappers.imagemagick import imagemagick_engine
from app.engines.wrappers.base import ProcessResult

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
        target_fmt = str(parameters.get("format") or parameters.get("to") or "webp").lower().lstrip(".")

        # 1. Image Convert
        if operation in ["image_convert", "convert_image"]:
            out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.{target_fmt}")
            res = await imagemagick_engine.convert(input_path, out_file)
            return out_file, res

        # 2. Image Resize
        elif operation in ["image_resize", "resize_image"]:
            out_file = str(out_d / f"{in_p.stem}_resized_{job_id[:8]}.{target_fmt}")
            w = parameters.get("width")
            h = parameters.get("height")
            res = await imagemagick_engine.resize(input_path, out_file, width=w, height=h)
            return out_file, res

        # 3. Image Crop
        elif operation in ["image_crop", "crop_image"]:
            out_file = str(out_d / f"{in_p.stem}_cropped_{job_id[:8]}.{target_fmt}")
            w = int(parameters.get("width", 300))
            h = int(parameters.get("height", 300))
            x = int(parameters.get("x", 0))
            y = int(parameters.get("y", 0))
            res = await imagemagick_engine.crop(input_path, out_file, width=w, height=h, x=x, y=y)
            return out_file, res

        # 4. Image Rotate
        elif operation in ["image_rotate", "rotate_image"]:
            deg = float(parameters.get("degrees", 90))
            out_file = str(out_d / f"{in_p.stem}_rotated_{job_id[:8]}.{target_fmt}")
            res = await imagemagick_engine.rotate(input_path, out_file, degrees=deg)
            return out_file, res

        # 5. Image Flip
        elif operation in ["image_flip", "flip_image"]:
            direction = str(parameters.get("direction", "horizontal")).lower()
            out_file = str(out_d / f"{in_p.stem}_flipped_{job_id[:8]}.{target_fmt}")
            flip_flag = "-flop" if direction == "horizontal" else "-flip"
            cmd = [imagemagick_engine._get_bin(), input_path, flip_flag, out_file]
            res = await imagemagick_engine.execute(cmd)
            return out_file, res

        # 6. Image Compress / Quality
        elif operation in ["image_compress", "compress_image"]:
            q = int(parameters.get("quality", 75))
            out_file = str(out_d / f"{in_p.stem}_compressed_{job_id[:8]}.{target_fmt}")
            res = await imagemagick_engine.compress(input_path, out_file, quality=q)
            return out_file, res

        # 7. Image Grayscale
        elif operation in ["image_grayscale", "grayscale_image"]:
            out_file = str(out_d / f"{in_p.stem}_gray_{job_id[:8]}.{target_fmt}")
            cmd = [imagemagick_engine._get_bin(), input_path, "-colorspace", "Gray", out_file]
            res = await imagemagick_engine.execute(cmd)
            return out_file, res

        # 8. Strip Metadata (Privacy cleanup)
        elif operation in ["image_strip_metadata", "strip_metadata"]:
            out_file = str(out_d / f"{in_p.stem}_clean_{job_id[:8]}.{target_fmt}")
            cmd = [imagemagick_engine._get_bin(), input_path, "-strip", out_file]
            res = await imagemagick_engine.execute(cmd)
            return out_file, res

        # Default fallback
        out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.webp")
        res = await imagemagick_engine.convert(input_path, out_file)
        return out_file, res

image_processor = ImageProcessor()

