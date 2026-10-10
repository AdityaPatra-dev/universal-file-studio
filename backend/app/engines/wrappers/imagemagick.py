import json
from typing import List, Optional, Dict, Any
from pathlib import Path
from app.engines.wrappers.base import BaseEngine, ProcessResult

class ImageMagickEngine(BaseEngine):
    name = "imagemagick"

    def _get_bin(self) -> str:
        info = self.get_info()
        return info.path if info and info.path else "magick"

    async def convert(self, input_path: str, output_path: str) -> ProcessResult:
        cmd = [self._get_bin(), input_path, output_path]
        return await self.execute(cmd)

    async def resize(
        self,
        input_path: str,
        output_path: str,
        width: Optional[int] = None,
        height: Optional[int] = None
    ) -> ProcessResult:
        size_str = ""
        if width and height:
            size_str = f"{width}x{height}"
        elif width:
            size_str = f"{width}x"
        elif height:
            size_str = f"x{height}"
        else:
            size_str = "100%"

        cmd = [self._get_bin(), input_path, "-resize", size_str, output_path]
        return await self.execute(cmd)

    async def crop(
        self,
        input_path: str,
        output_path: str,
        width: int,
        height: int,
        x: int = 0,
        y: int = 0
    ) -> ProcessResult:
        geometry = f"{width}x{height}+{x}+{y}"
        cmd = [self._get_bin(), input_path, "-crop", geometry, "+repage", output_path]
        return await self.execute(cmd)

    async def rotate(self, input_path: str, output_path: str, degrees: float) -> ProcessResult:
        cmd = [self._get_bin(), input_path, "-rotate", str(degrees), output_path]
        return await self.execute(cmd)

    async def compress(self, input_path: str, output_path: str, quality: int = 80) -> ProcessResult:
        cmd = [self._get_bin(), input_path, "-quality", str(quality), output_path]
        return await self.execute(cmd)

    async def change_quality(self, input_path: str, output_path: str, quality: int) -> ProcessResult:
        return await self.compress(input_path, output_path, quality)

    async def metadata(self, input_path: str) -> Dict[str, Any]:
        cmd = [self._get_bin(), "identify", "-format", "%w|%h|%m|%Q|%r", input_path]
        res = await self.execute(cmd)
        if res.success and "|" in res.stdout:
            parts = res.stdout.strip().split("|")
            return {
                "width": int(parts[0]) if parts[0].isdigit() else None,
                "height": int(parts[1]) if parts[1].isdigit() else None,
                "format": parts[2],
                "quality": parts[3],
                "color_space": parts[4] if len(parts) > 4 else None,
            }
        return {}

    async def batch(self, input_dir: str, output_dir: str, target_format: str = "webp") -> ProcessResult:
        in_p = Path(input_dir)
        out_p = Path(output_dir)
        out_p.mkdir(parents=True, exist_ok=True)

        img_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".tiff"}
        files = [p for p in in_p.glob("*") if p.suffix.lower() in img_exts]

        last_res = ProcessResult(0, f"Processed {len(files)} files", "", True, [])
        for f in files:
            target = out_p / f"{f.stem}.{target_format}"
            last_res = await self.convert(str(f), str(target))
            if not last_res.success:
                return last_res

        return last_res

imagemagick_engine = ImageMagickEngine()
