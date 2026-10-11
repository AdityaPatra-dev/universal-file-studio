import os
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from app.processors.base import BaseProcessor
from app.engines.wrappers.ffmpeg import ffmpeg_engine
from app.engines.wrappers.base import ProcessResult

class VideoProcessor(BaseProcessor):
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
        target_fmt = str(parameters.get("format") or parameters.get("to") or "mp4").lower().lstrip(".")

        # 1. Video Convert
        if operation in ["video_convert", "convert_video"]:
            out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.{target_fmt}")
            crf = parameters.get("crf")
            preset = parameters.get("preset")
            res = await ffmpeg_engine.convert(input_path, out_file, crf=crf, preset=preset)
            return out_file, res

        # 2. Video Compress
        elif operation in ["video_compress", "compress_video"]:
            out_file = str(out_d / f"{in_p.stem}_compressed_{job_id[:8]}.mp4")
            crf = int(parameters.get("crf", 28))
            bitrate = parameters.get("bitrate_k")
            res = await ffmpeg_engine.compress(input_path, out_file, target_bitrate_k=bitrate, crf=crf)
            return out_file, res

        # 3. Video Trim
        elif operation in ["video_trim", "trim_video"]:
            ext = in_p.suffix if in_p.suffix else ".mp4"
            out_file = str(out_d / f"{in_p.stem}_trim_{job_id[:8]}{ext}")
            start = str(parameters.get("start", "00:00:00"))
            end = parameters.get("end")
            duration = parameters.get("duration")
            res = await ffmpeg_engine.trim(input_path, out_file, start_time=start, end_time=end, duration=duration)
            return out_file, res

        # 4. Video Resize
        elif operation in ["video_resize", "resize_video"]:
            out_file = str(out_d / f"{in_p.stem}_resized_{job_id[:8]}.mp4")
            w = int(parameters.get("width", 1280))
            h = int(parameters.get("height", 720))
            keep_aspect = bool(parameters.get("keep_aspect_ratio", True))
            res = await ffmpeg_engine.resize(input_path, out_file, width=w, height=h, keep_aspect_ratio=keep_aspect)
            return out_file, res

        # 5. Video Crop
        elif operation in ["video_crop", "crop_video"]:
            out_file = str(out_d / f"{in_p.stem}_cropped_{job_id[:8]}.mp4")
            w = int(parameters.get("width", 640))
            h = int(parameters.get("height", 480))
            x = int(parameters.get("x", 0))
            y = int(parameters.get("y", 0))
            res = await ffmpeg_engine.crop(input_path, out_file, width=w, height=h, x=x, y=y)
            return out_file, res

        # 6. Video Rotate / Flip
        elif operation in ["video_rotate", "rotate_video"]:
            deg = int(parameters.get("degrees", 90))
            out_file = str(out_d / f"{in_p.stem}_rotated_{job_id[:8]}.mp4")
            vf = "transpose=1" if deg == 90 else ("transpose=2" if deg == 270 else "hflip,vflip")
            v_codec = ffmpeg_engine.get_best_video_encoder(".mp4")
            cmd = ["ffmpeg", "-y", "-i", input_path, "-vf", vf, "-c:v", v_codec, "-c:a", "copy", out_file]
            res = await ffmpeg_engine.execute(cmd)
            return out_file, res

        elif operation in ["video_flip", "flip_video"]:
            direction = str(parameters.get("direction", "horizontal")).lower()
            vf = "hflip" if direction == "horizontal" else "vflip"
            out_file = str(out_d / f"{in_p.stem}_flipped_{job_id[:8]}.mp4")
            v_codec = ffmpeg_engine.get_best_video_encoder(".mp4")
            cmd = ["ffmpeg", "-y", "-i", input_path, "-vf", vf, "-c:v", v_codec, "-c:a", "copy", out_file]
            res = await ffmpeg_engine.execute(cmd)
            return out_file, res

        # 7. Change FPS
        elif operation in ["video_change_fps", "change_fps"]:
            fps = float(parameters.get("fps", 30))
            out_file = str(out_d / f"{in_p.stem}_{int(fps)}fps_{job_id[:8]}.mp4")
            v_codec = ffmpeg_engine.get_best_video_encoder(".mp4")
            cmd = ["ffmpeg", "-y", "-i", input_path, "-r", str(fps), "-c:v", v_codec, out_file]
            res = await ffmpeg_engine.execute(cmd)
            return out_file, res

        # 8. Video Change Speed
        elif operation in ["video_change_speed", "change_speed"]:
            speed = float(parameters.get("speed", 1.5))
            out_file = str(out_d / f"{in_p.stem}_{speed}x_{job_id[:8]}.mp4")
            res = await ffmpeg_engine.change_speed(input_path, out_file, video_multiplier=speed, audio_multiplier=speed)
            return out_file, res

        # 9. Video Reverse
        elif operation in ["video_reverse", "reverse_video"]:
            out_file = str(out_d / f"{in_p.stem}_reversed_{job_id[:8]}.mp4")
            res = await ffmpeg_engine.reverse(input_path, out_file, reverse_audio=True)
            return out_file, res

        # 10. Extract Audio
        elif operation in ["extract_audio", "video_extract_audio"]:
            audio_fmt = str(parameters.get("format", "mp3")).lower().lstrip(".")
            out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.{audio_fmt}")
            codec = "libmp3lame" if audio_fmt == "mp3" else ("aac" if audio_fmt in ["m4a", "aac"] else "copy")
            res = await ffmpeg_engine.extract_audio(input_path, out_file, audio_codec=codec)
            return out_file, res

        # 11. Remove Audio
        elif operation in ["remove_audio", "video_remove_audio"]:
            out_file = str(out_d / f"{in_p.stem}_muted_{job_id[:8]}.mp4")
            cmd = ["ffmpeg", "-y", "-i", input_path, "-an", "-c:v", "copy", out_file]
            res = await ffmpeg_engine.execute(cmd)
            return out_file, res

        # 12. Extract Frames
        elif operation in ["extract_frames", "video_extract_frames"]:
            out_sub_d = str(out_d / f"{in_p.stem}_frames_{job_id[:8]}")
            fps = float(parameters.get("fps", 1.0))
            fmt = str(parameters.get("format", "jpg"))
            res = await ffmpeg_engine.extract_frames(input_path, out_sub_d, fps=fps, format=fmt)
            return out_sub_d, res

        # Default fallback
        out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.mp4")
        res = await ffmpeg_engine.convert(input_path, out_file)
        return out_file, res

video_processor = VideoProcessor()

