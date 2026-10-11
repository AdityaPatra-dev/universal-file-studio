from typing import Dict, Any, Optional, Tuple
from pathlib import Path
from app.processors.base import BaseProcessor
from app.processors.video import video_processor
from app.processors.audio import audio_processor
from app.processors.image import image_processor
from app.processors.pdf import pdf_processor
from app.processors.archive import archive_processor
from app.engines.wrappers.libreoffice import libreoffice_engine
from app.engines.wrappers.base import ProcessResult

class ProcessorRegistry:
    def __init__(self):
        self._processors: Dict[str, BaseProcessor] = {
            # Video
            "video_convert": video_processor,
            "convert_video": video_processor,
            "video_compress": video_processor,
            "compress_video": video_processor,
            "video_resize": video_processor,
            "resize_video": video_processor,
            "video_crop": video_processor,
            "crop_video": video_processor,
            "video_trim": video_processor,
            "trim_video": video_processor,
            "video_rotate": video_processor,
            "rotate_video": video_processor,
            "video_flip": video_processor,
            "flip_video": video_processor,
            "video_change_fps": video_processor,
            "change_fps": video_processor,
            "video_change_speed": video_processor,
            "change_speed": video_processor,
            "video_reverse": video_processor,
            "reverse_video": video_processor,
            "extract_audio": video_processor,
            "video_extract_audio": video_processor,
            "remove_audio": video_processor,
            "video_remove_audio": video_processor,
            "extract_frames": video_processor,
            "video_extract_frames": video_processor,

            # Audio
            "audio_convert": audio_processor,
            "convert_audio": audio_processor,
            "audio_compress": audio_processor,
            "compress_audio": audio_processor,
            "audio_trim": audio_processor,
            "trim_audio": audio_processor,
            "audio_normalize": audio_processor,
            "normalize_audio": audio_processor,
            "audio_change_speed": audio_processor,
            "change_audio_speed": audio_processor,
            "audio_reverse": audio_processor,
            "reverse_audio": audio_processor,

            # Image
            "image_convert": image_processor,
            "convert_image": image_processor,
            "image_resize": image_processor,
            "resize_image": image_processor,
            "image_crop": image_processor,
            "crop_image": image_processor,
            "image_rotate": image_processor,
            "rotate_image": image_processor,
            "image_flip": image_processor,
            "flip_image": image_processor,
            "image_compress": image_processor,
            "compress_image": image_processor,
            "image_grayscale": image_processor,
            "grayscale_image": image_processor,
            "image_strip_metadata": image_processor,
            "strip_metadata": image_processor,

            # PDF
            "pdf_to_images": pdf_processor,
            "pdf_to_image": pdf_processor,
            "pdf_to_text": pdf_processor,
            "pdf_compress": pdf_processor,
            "pdf_optimize": pdf_processor,
            "pdf_rotate_pages": pdf_processor,
            "pdf_extract_pages": pdf_processor,

            # Archive
            "archive_create": archive_processor,
            "create_archive": archive_processor,
            "archive_extract": archive_processor,
            "extract_archive": archive_processor,
            "archive_test": archive_processor,
        }

    async def dispatch(
        self,
        operation: str,
        input_path: str,
        output_dir: str,
        job_id: str,
        parameters: Dict[str, Any],
        file_info: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, ProcessResult]:
        processor = self._processors.get(operation.lower())
        if processor:
            return await processor.process(operation, input_path, output_dir, job_id, parameters, file_info)

        # Document fallback via LibreOffice
        if "document" in operation or "office" in operation:
            target_fmt = str(parameters.get("format", "pdf")).lower()
            res = await libreoffice_engine.convert(input_path, output_dir, format=target_fmt)
            in_p = Path(input_path)
            renamed = Path(output_dir) / f"{in_p.stem}_{job_id[:8]}.{target_fmt}"
            expected = Path(output_dir) / f"{in_p.stem}.{target_fmt}"
            if expected.exists():
                expected.rename(renamed)
            return str(renamed), res

        # Generic copy fallback
        in_p = Path(input_path)
        out_f = str(Path(output_dir) / f"{in_p.stem}_{job_id[:8]}{in_p.suffix}")
        with open(in_p, "rb") as s, open(out_f, "wb") as d:
            d.write(s.read())
        return out_f, ProcessResult(0, "Pass-through copy completed.", "", True, ["ufs_copy", input_path, out_f])

processor_registry = ProcessorRegistry()

