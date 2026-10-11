from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from app.processors.base import BaseProcessor
from app.engines.wrappers.ffmpeg import ffmpeg_engine
from app.engines.wrappers.base import ProcessResult

class AudioProcessor(BaseProcessor):
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
        target_fmt = str(parameters.get("format") or parameters.get("to") or "mp3").lower().lstrip(".")

        # 1. Audio Convert
        if operation in ["audio_convert", "convert_audio"]:
            out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.{target_fmt}")
            cmd = ["ffmpeg", "-y", "-i", input_path]
            if target_fmt == "mp3":
                cmd.extend(["-c:a", "libmp3lame", "-b:a", f"{parameters.get('bitrate', 192)}k"])
            elif target_fmt == "aac":
                cmd.extend(["-c:a", "aac", "-b:a", f"{parameters.get('bitrate', 192)}k"])
            elif target_fmt == "flac":
                cmd.extend(["-c:a", "flac"])
            elif target_fmt == "wav":
                cmd.extend(["-c:a", "pcm_s16le"])
            elif target_fmt == "ogg":
                cmd.extend(["-c:a", "libvorbis"])
            elif target_fmt == "opus":
                cmd.extend(["-c:a", "libopus"])
            cmd.append(out_file)
            res = await ffmpeg_engine.execute(cmd)
            return out_file, res

        # 2. Audio Compress
        elif operation in ["audio_compress", "compress_audio"]:
            out_file = str(out_d / f"{in_p.stem}_compressed_{job_id[:8]}.mp3")
            kbps = str(parameters.get("bitrate", "96"))
            cmd = ["ffmpeg", "-y", "-i", input_path, "-c:a", "libmp3lame", "-b:a", f"{kbps}k", out_file]
            res = await ffmpeg_engine.execute(cmd)
            return out_file, res

        # 3. Audio Trim
        elif operation in ["audio_trim", "trim_audio"]:
            ext = in_p.suffix if in_p.suffix else ".mp3"
            out_file = str(out_d / f"{in_p.stem}_trimmed_{job_id[:8]}{ext}")
            start = str(parameters.get("start", "00:00:00"))
            end = parameters.get("end")
            duration = parameters.get("duration")
            res = await ffmpeg_engine.trim(input_path, out_file, start_time=start, end_time=end, duration=duration)
            return out_file, res

        # 4. Audio Loudness Normalization (EBU R128 standard)
        elif operation in ["audio_normalize", "normalize_audio"]:
            out_file = str(out_d / f"{in_p.stem}_normalized_{job_id[:8]}.mp3")
            cmd = ["ffmpeg", "-y", "-i", input_path, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", out_file]
            res = await ffmpeg_engine.execute(cmd)
            return out_file, res

        # 5. Audio Change Speed
        elif operation in ["audio_change_speed", "change_audio_speed"]:
            speed = float(parameters.get("speed", 1.25))
            out_file = str(out_d / f"{in_p.stem}_{speed}x_{job_id[:8]}.mp3")
            cmd = ["ffmpeg", "-y", "-i", input_path, "-af", f"atempo={speed}", out_file]
            res = await ffmpeg_engine.execute(cmd)
            return out_file, res

        # 6. Audio Reverse
        elif operation in ["audio_reverse", "reverse_audio"]:
            out_file = str(out_d / f"{in_p.stem}_reversed_{job_id[:8]}.mp3")
            cmd = ["ffmpeg", "-y", "-i", input_path, "-af", "areverse", out_file]
            res = await ffmpeg_engine.execute(cmd)
            return out_file, res

        # Default fallback
        out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.mp3")
        cmd = ["ffmpeg", "-y", "-i", input_path, out_file]
        res = await ffmpeg_engine.execute(cmd)
        return out_file, res

audio_processor = AudioProcessor()
