from app.processors.base import BaseProcessor
from app.processors.video import VideoProcessor, video_processor
from app.processors.audio import AudioProcessor, audio_processor
from app.processors.image import ImageProcessor, image_processor
from app.processors.pdf import PdfProcessor, pdf_processor
from app.processors.archive import ArchiveProcessor, archive_processor
from app.processors.registry import ProcessorRegistry, processor_registry

__all__ = [
    "BaseProcessor",
    "VideoProcessor", "video_processor",
    "AudioProcessor", "audio_processor",
    "ImageProcessor", "image_processor",
    "PdfProcessor", "pdf_processor",
    "ArchiveProcessor", "archive_processor",
    "ProcessorRegistry", "processor_registry",
]

