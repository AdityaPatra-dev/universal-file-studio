from typing import Dict, Any, Optional, Tuple
from pathlib import Path
from app.processors.base import BaseProcessor
from app.processors.video import video_processor
from app.processors.audio import audio_processor
from app.processors.image import image_processor
from app.processors.pdf import pdf_processor
from app.processors.archive import archive_processor
from app.processors.document import document_processor
from app.processors.ocr import ocr_processor
from app.processors.metadata import metadata_processor
from app.processors.hash import hash_processor
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
            "image_strip_metadata": metadata_processor,
            "strip_metadata": metadata_processor,

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

            # Documents & Office
            "document_convert": document_processor,
            "convert_document": document_processor,
            "docx_to_pdf": document_processor,
            "pdf_to_docx": document_processor,
            "spreadsheet_convert": document_processor,
            "convert_spreadsheet": document_processor,
            "excel_to_csv": document_processor,
            "presentation_convert": document_processor,
            "convert_presentation": document_processor,
            "ppt_to_pdf": document_processor,
            "markdown_convert": document_processor,
            "convert_markdown": document_processor,
            "text_convert": document_processor,
            "convert_text": document_processor,
            "ebook_convert": document_processor,
            "convert_ebook": document_processor,

            # Phase 5: Advanced (OCR, Metadata, Hashing)
            "ocr_image": ocr_processor,
            "ocr_pdf": ocr_processor,
            "extract_text_ocr": ocr_processor,

            "video_strip_metadata": metadata_processor,
            "audio_strip_metadata": metadata_processor,
            "pdf_strip_metadata": metadata_processor,
            "inspect_metadata": metadata_processor,
            "metadata_inspect": metadata_processor,
            "extract_metadata": metadata_processor,

            "file_hash": hash_processor,
            "hash_file": hash_processor,
            "calculate_checksum": hash_processor,
            "verify_checksum": hash_processor,
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
        out_dir_path = Path(output_dir)
        processor = self._processors.get(operation.lower())
        if processor:
            return await processor.process(operation, input_path, out_dir_path, job_id, parameters, file_info)

        # Fallback to document processor for any other doc operations
        if any(term in operation for term in ["doc", "sheet", "slide", "presentation", "office"]):
            return await document_processor.process(operation, input_path, out_dir_path, job_id, parameters, file_info)

        # Generic copy fallback
        in_p = Path(input_path)
        out_f = str(out_dir_path / f"{in_p.stem}_{job_id[:8]}{in_p.suffix}")
        with open(in_p, "rb") as s, open(out_f, "wb") as d:
            d.write(s.read())
        return out_f, ProcessResult(0, "Pass-through copy completed.", "", True, ["ufs_copy", input_path, out_f])

processor_registry = ProcessorRegistry()
