from app.processors.base import BaseProcessor
from app.processors.video import VideoProcessor, video_processor
from app.processors.audio import AudioProcessor, audio_processor
from app.processors.image import ImageProcessor, image_processor
from app.processors.pdf import PdfProcessor, pdf_processor
from app.processors.archive import ArchiveProcessor, archive_processor
from app.processors.document import DocumentProcessor, document_processor
from app.processors.ocr import OcrProcessor, ocr_processor
from app.processors.metadata import MetadataProcessor, metadata_processor
from app.processors.hash import HashProcessor, hash_processor
from app.processors.registry import ProcessorRegistry, processor_registry

__all__ = [
    "BaseProcessor",
    "VideoProcessor", "video_processor",
    "AudioProcessor", "audio_processor",
    "ImageProcessor", "image_processor",
    "PdfProcessor", "pdf_processor",
    "ArchiveProcessor", "archive_processor",
    "DocumentProcessor", "document_processor",
    "OcrProcessor", "ocr_processor",
    "MetadataProcessor", "metadata_processor",
    "HashProcessor", "hash_processor",
    "ProcessorRegistry", "processor_registry",
]
