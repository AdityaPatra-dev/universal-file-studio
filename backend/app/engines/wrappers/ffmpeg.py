import os
from typing import List, Optional
from pathlib import Path
from app.engines.wrappers.base import BaseEngine, ProcessResult

class FFmpegEngine(BaseEngine):
    name = "ffmpeg"

    async def convert(
        self,
        input_path: str,
        output_path: str,
        video_codec: Optional[str] = None,
        audio_codec: Optional[str] = None,
        crf: Optional[int] = None,
        preset: Optional[str] = None
    ) -> ProcessResult:
        cmd = ["ffmpeg", "-y", "-i", input_path]
        if video_codec:
            cmd.extend(["-c:v", video_codec])
        if audio_codec:
            cmd.extend(["-c:a", audio_codec])
        if crf is not None:
            cmd.extend(["-crf", str(crf)])
        if preset:
            cmd.extend(["-preset", preset])
        cmd.append(output_path)
        return await self.execute(cmd)

    async def compress(
        self,
        input_path: str,
        output_path: str,
        target_bitrate_k: Optional[int] = None,
        crf: int = 28
    ) -> ProcessResult:
        cmd = ["ffmpeg", "-y", "-i", input_path]
        if target_bitrate_k:
            cmd.extend(["-b:v", f"{target_bitrate_k}k", "-bufsize", f"{target_bitrate_k * 2}k"])
        else:
            cmd.extend(["-c:v", "libx264", "-crf", str(crf), "-preset", "medium"])
        cmd.extend(["-c:a", "aac", "-b:a", "128k", output_path])
        return await self.execute(cmd)

    async def trim(
        self,
        input_path: str,
        output_path: str,
        start_time: str,
        end_time: Optional[str] = None,
        duration: Optional[str] = None
    ) -> ProcessResult:
        cmd = ["ffmpeg", "-y", "-ss", str(start_time), "-i", input_path]
        if end_time:
            cmd.extend(["-to", str(end_time)])
        elif duration:
            cmd.extend(["-t", str(duration)])
        cmd.extend(["-c", "copy", output_path])
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
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-vf", f"crop={width}:{height}:{x}:{y}",
            "-c:a", "copy",
            output_path
        ]
        return await self.execute(cmd)

    async def resize(
        self,
        input_path: str,
        output_path: str,
        width: int,
        height: int,
        keep_aspect_ratio: bool = True
    ) -> ProcessResult:
        scale_filter = f"scale={width}:{height}"
        if keep_aspect_ratio:
            scale_filter = f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2"

        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-vf", scale_filter,
            "-c:a", "copy",
            output_path
        ]
        return await self.execute(cmd)

    async def extract_audio(
        self,
        input_path: str,
        output_path: str,
        audio_codec: str = "copy"
    ) -> ProcessResult:
        cmd = ["ffmpeg", "-y", "-i", input_path, "-vn", "-c:a", audio_codec, output_path]
        return await self.execute(cmd)

    async def extract_frames(
        self,
        input_path: str,
        output_dir: str,
        fps: float = 1.0,
        format: str = "jpg"
    ) -> ProcessResult:
        os.makedirs(output_dir, exist_ok=True)
        out_pattern = os.path.join(output_dir, f"frame_%04d.{format}")
        cmd = ["ffmpeg", "-y", "-i", input_path, "-vf", f"fps={fps}", out_pattern]
        return await self.execute(cmd)

    async def concat(
        self,
        input_paths: List[str],
        output_path: str
    ) -> ProcessResult:
        # Create temporary concat list file
        concat_file = Path(output_path).parent / f"concat_{os.getpid()}.txt"
        with open(concat_file, "w") as f:
            for p in input_paths:
                f.write(f"file '{p}'\n")

        try:
            cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", output_path]
            return await self.execute(cmd)
        finally:
            if concat_file.exists():
                concat_file.unlink()

    async def add_subtitles(
        self,
        input_video: str,
        input_sub: str,
        output_path: str
    ) -> ProcessResult:
        cmd = [
            "ffmpeg", "-y", "-i", input_video, "-i", input_sub,
            "-c", "copy", "-c:s", "mov_text",
            output_path
        ]
        return await self.execute(cmd)

    async def burn_subtitles(
        self,
        input_video: str,
        input_sub: str,
        output_path: str
    ) -> ProcessResult:
        cmd = [
            "ffmpeg", "-y", "-i", input_video,
            "-vf", f"subtitles='{input_sub}'",
            "-c:a", "copy",
            output_path
        ]
        return await self.execute(cmd)

    async def change_speed(
        self,
        input_path: str,
        output_path: str,
        video_multiplier: float = 1.0,
        audio_multiplier: float = 1.0
    ) -> ProcessResult:
        # PTS multiplier is inverted: 2x speed -> setpts=0.5*PTS
        pts_factor = 1.0 / video_multiplier if video_multiplier != 0 else 1.0
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-filter_complex", f"[0:v]setpts={pts_factor}*PTS[v];[0:a]atempo={audio_multiplier}[a]",
            "-map", "[v]", "-map", "[a]",
            output_path
        ]
        return await self.execute(cmd)

    async def reverse(
        self,
        input_path: str,
        output_path: str,
        reverse_audio: bool = True
    ) -> ProcessResult:
        if reverse_audio:
            cmd = [
                "ffmpeg", "-y", "-i", input_path,
                "-vf", "reverse",
                "-af", "areverse",
                output_path
            ]
        else:
            cmd = [
                "ffmpeg", "-y", "-i", input_path,
                "-vf", "reverse",
                "-c:a", "copy",
                output_path
            ]
        return await self.execute(cmd)

ffmpeg_engine = FFmpegEngine()
