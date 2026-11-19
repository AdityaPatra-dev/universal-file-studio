import os
import shutil
from typing import List, Optional
from pathlib import Path
from app.engines.wrappers.base import BaseEngine, ProcessResult

class FFmpegEngine(BaseEngine):
    name = "ffmpeg"

    def get_bin(self) -> str:
        which = shutil.which("ffmpeg")
        if which:
            return which
        try:
            import imageio_ffmpeg
            return imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:
            return "ffmpeg"

    def get_best_video_encoder(self, format_ext: str) -> str:
        info = self.get_info()
        encoders = info.capabilities.encoders if info and info.capabilities else []
        fmt = format_ext.lower().lstrip(".")
        if fmt == "gif":
            return "gif"
        if fmt == "webm":
            if "libvpx-vp9" in encoders:
                return "libvpx-vp9"
            if "libvpx" in encoders:
                return "libvpx"
            return "vp9"
        if "libx264" in encoders:
            return "libx264"
        if "libopenh264" in encoders:
            return "libopenh264"
        return "mpeg4"

    def get_best_audio_encoder(self, format_ext: str) -> str:
        info = self.get_info()
        encoders = info.capabilities.encoders if info and info.capabilities else []
        fmt = format_ext.lower().lstrip(".")
        if fmt == "webm":
            if "libopus" in encoders or not encoders:
                return "libopus"
            return "libvorbis" if "libvorbis" in encoders else "opus"
        if fmt == "mp3":
            return "libmp3lame"
        return "aac"

    async def convert(
        self,
        input_path: str,
        output_path: str,
        video_codec: Optional[str] = None,
        audio_codec: Optional[str] = None,
        crf: Optional[int] = None,
        preset: Optional[str] = None,
        scale: Optional[str] = None,
        fps: Optional[int] = None,
        remux_lossless: bool = False,
        faststart: bool = True,
        audio_bitrate_k: Optional[int] = 192
    ) -> ProcessResult:
        ext = Path(output_path).suffix.lower()

        if ext == ".gif":
            cmd = ["ffmpeg", "-y", "-i", input_path]
            if scale:
                cmd.extend(["-vf", scale])
            if fps:
                cmd.extend(["-r", str(fps)])
            cmd.extend(["-c:v", "gif", "-an", output_path])
            return await self.execute(cmd)

        if remux_lossless:
            cmd = ["ffmpeg", "-y", "-i", input_path, "-c", "copy", "-map", "0"]
            if faststart and ext in [".mp4", ".mov", ".m4v"]:
                cmd.extend(["-movflags", "+faststart"])
            cmd.append(output_path)
            return await self.execute(cmd)

        info = self.get_info()
        available_encoders = info.capabilities.encoders if info and info.capabilities else []

        if video_codec and video_codec in available_encoders:
            v_codec = video_codec
        else:
            v_codec = self.get_best_video_encoder(ext)

        cmd = ["ffmpeg", "-y", "-i", input_path]
        if scale:
            cmd.extend(["-vf", scale])
        if fps:
            cmd.extend(["-r", str(fps)])

        cmd.extend(["-c:v", v_codec])

        # crf and preset only apply to x264/x265/vpx
        if crf is not None and v_codec in ["libx264", "libx265", "libvpx", "libvpx-vp9"]:
            cmd.extend(["-crf", str(crf)])
        if preset and v_codec in ["libx264", "libx265"]:
            cmd.extend(["-preset", preset])

        if v_codec == "libx265":
            cmd.extend(["-tag:v", "hvc1"])

        if v_codec in ["libx264", "libx265"]:
            cmd.extend(["-pix_fmt", "yuv420p"])

        if audio_codec == "copy":
            cmd.extend(["-c:a", "copy"])
        else:
            a_codec = audio_codec or self.get_best_audio_encoder(ext)
            cmd.extend(["-c:a", a_codec])
            if a_codec == "opus":
                cmd.extend(["-strict", "-2"])
            if a_codec in ["aac", "libmp3lame", "libopus", "opus"]:
                cmd.extend(["-b:a", f"{audio_bitrate_k or 192}k"])

        if faststart and ext in [".mp4", ".mov", ".m4v"]:
            cmd.extend(["-movflags", "+faststart"])

        cmd.extend(["-threads", "0"])
        cmd.append(output_path)
        return await self.execute(cmd)

    async def compress(
        self,
        input_path: str,
        output_path: str,
        target_bitrate_k: Optional[int] = None,
        crf: int = 28,
        video_codec: Optional[str] = None,
        preset: Optional[str] = None,
        scale: Optional[str] = None,
        copy_audio: bool = False,
        mute_audio: bool = False,
        audio_bitrate_k: Optional[int] = 128
    ) -> ProcessResult:
        ext = Path(output_path).suffix
        info = self.get_info()
        available_encoders = info.capabilities.encoders if info and info.capabilities else []

        if video_codec and video_codec in available_encoders:
            v_codec = video_codec
        else:
            v_codec = self.get_best_video_encoder(ext)

        cmd = ["ffmpeg", "-y", "-i", input_path]
        if scale:
            cmd.extend(["-vf", scale])

        cmd.extend(["-c:v", v_codec])
        if target_bitrate_k and target_bitrate_k > 0:
            cmd.extend([
                "-b:v", f"{target_bitrate_k}k",
                "-maxrate", f"{int(target_bitrate_k * 1.5)}k",
                "-bufsize", f"{int(target_bitrate_k * 2)}k"
            ])
        elif v_codec in ["libx264", "libx265", "libvpx", "libvpx-vp9"]:
            cmd.extend(["-crf", str(crf)])
        else:
            cmd.extend(["-b:v", "1200k"])

        if preset and v_codec in ["libx264", "libx265"]:
            cmd.extend(["-preset", preset])

        if v_codec == "libx265":
            cmd.extend(["-tag:v", "hvc1"])

        cmd.extend(["-pix_fmt", "yuv420p"])

        if mute_audio:
            cmd.append("-an")
        elif copy_audio:
            cmd.extend(["-c:a", "copy"])
        else:
            a_codec = self.get_best_audio_encoder(ext)
            cmd.extend(["-c:a", a_codec, "-b:a", f"{audio_bitrate_k or 128}k"])

        cmd.append(output_path)
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
        ext = Path(output_path).suffix
        v_codec = self.get_best_video_encoder(ext)
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-vf", f"crop={width}:{height}:{x}:{y}",
            "-c:v", v_codec,
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
        keep_aspect_ratio: bool = True,
        fit_mode: str = "letterbox",
        sharpen: bool = False,
        pad_color: str = "black"
    ) -> ProcessResult:
        ext = Path(output_path).suffix
        v_codec = self.get_best_video_encoder(ext)

        if fit_mode == "blurred_background":
            blur_filter = (
                f"[0:v]scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},"
                f"boxblur=25:5[bg];"
                f"[0:v]scale={width}:{height}:force_original_aspect_ratio=decrease[fg];"
                f"[bg][fg]overlay=(W-w)/2:(H-h)/2"
            )
            if sharpen:
                blur_filter += ",unsharp=5:5:0.8:3:3:0.4"
            blur_filter += "[v]"
            cmd = [
                "ffmpeg", "-y", "-i", input_path,
                "-filter_complex", blur_filter,
                "-map", "[v]", "-map", "0:a?",
                "-c:v", v_codec,
                "-c:a", "copy",
                output_path
            ]
            return await self.execute(cmd)

        scale_filter = f"scale={width}:{height}:flags=lanczos"
        if fit_mode == "crop":
            scale_filter = f"scale={width}:{height}:force_original_aspect_ratio=increase:flags=lanczos,crop={width}:{height}"
        elif fit_mode == "stretch":
            scale_filter = f"scale={width}:{height}:flags=lanczos"
        elif keep_aspect_ratio or fit_mode == "letterbox":
            scale_filter = f"scale={width}:{height}:force_original_aspect_ratio=decrease:flags=lanczos,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:color={pad_color}"

        if sharpen:
            scale_filter += ",unsharp=5:5:0.8:3:3:0.4"

        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-vf", scale_filter,
            "-c:v", v_codec,
            "-c:a", "copy",
            output_path
        ]
        return await self.execute(cmd)

    async def extract_single_frame(
        self,
        input_path: str,
        output_path: str,
        time_str: str = "00:00:01",
        sharpen: bool = False
    ) -> ProcessResult:
        cmd = ["ffmpeg", "-y", "-ss", time_str, "-i", input_path]
        if sharpen:
            cmd.extend(["-vf", "unsharp=5:5:0.8:3:3:0.4"])
        cmd.extend(["-vframes", "1", "-q:v", "2", output_path])
        return await self.execute(cmd)

    async def generate_storyboard(
        self,
        input_path: str,
        output_path: str,
        columns: int = 3,
        rows: int = 3,
        thumb_width: int = 480
    ) -> ProcessResult:
        tile_filter = f"select='not(mod(n\\,60))',scale={thumb_width}:-2:flags=lanczos,tile={columns}x{rows}:padding=6:margin=12:color=black"
        cmd = ["ffmpeg", "-y", "-i", input_path, "-vf", tile_filter, "-vframes", "1", "-q:v", "2", output_path]
        return await self.execute(cmd)

    async def mute_audio(
        self,
        input_path: str,
        output_path: str,
        mute_mode: str = "complete",
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        track_index: int = 0
    ) -> ProcessResult:
        if mute_mode == "segment" and start_time and end_time:
            cmd = [
                "ffmpeg", "-y", "-i", input_path,
                "-af", f"volume=enable='between(t,{start_time},{end_time})':volume=0",
                "-c:v", "copy",
                "-c:a", "aac", "-b:a", "192k",
                output_path
            ]
        elif mute_mode == "primary_only":
            cmd = [
                "ffmpeg", "-y", "-i", input_path,
                "-map", "0:v:0", "-map", f"0:a:{track_index}",
                "-c", "copy",
                output_path
            ]
        else:
            cmd = [
                "ffmpeg", "-y", "-i", input_path,
                "-an", "-c:v", "copy",
                output_path
            ]
        return await self.execute(cmd)

    async def extract_audio(
        self,
        input_path: str,
        output_path: str,
        audio_codec: str = "copy",
        bitrate: int = 192,
        lossless_copy: bool = False,
        normalize: bool = False,
        voice_enhance: bool = False,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None
    ) -> ProcessResult:
        cmd = ["ffmpeg", "-y"]
        if start_time:
            cmd.extend(["-ss", str(start_time)])
        if end_time:
            cmd.extend(["-to", str(end_time)])
        cmd.extend(["-i", input_path, "-vn"])

        af_filters = []
        if normalize:
            af_filters.append("loudnorm=I=-16:TP=-1.5:LRA=11")
        if voice_enhance:
            af_filters.append("highpass=f=120,lowpass=f=7500")

        if lossless_copy and not af_filters and not start_time:
            cmd.extend(["-c:a", "copy"])
        else:
            if af_filters:
                cmd.extend(["-af", ",".join(af_filters)])
            if audio_codec == "copy":
                ext = Path(output_path).suffix.lower()
                audio_codec = "libmp3lame" if ext == ".mp3" else ("pcm_s16le" if ext == ".wav" else ("flac" if ext == ".flac" else "aac"))
            cmd.extend(["-c:a", audio_codec])
            if audio_codec in ["libmp3lame", "aac", "libvorbis"] and bitrate > 0:
                cmd.extend(["-b:a", f"{bitrate}k"])

        cmd.append(output_path)
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
        audio_multiplier: float = 1.0,
        preserve_pitch: bool = True,
        motion_blur_smooth: bool = False,
        mute_audio: bool = False
    ) -> ProcessResult:
        pts_factor = 1.0 / video_multiplier if video_multiplier != 0 else 1.0
        ext = Path(output_path).suffix
        v_codec = self.get_best_video_encoder(ext)
        a_codec = self.get_best_audio_encoder(ext)

        v_filter = f"setpts={pts_factor}*PTS"
        if motion_blur_smooth and video_multiplier < 1.0:
            v_filter += ",tblend=all_mode=average"

        if mute_audio:
            cmd = [
                "ffmpeg", "-y", "-i", input_path,
                "-vf", v_filter,
                "-an",
                "-c:v", v_codec,
                output_path
            ]
            return await self.execute(cmd)

        if preserve_pitch:
            atempos = []
            cur_speed = audio_multiplier
            while cur_speed > 2.0:
                atempos.append("atempo=2.0")
                cur_speed /= 2.0
            while cur_speed < 0.5:
                atempos.append("atempo=0.5")
                cur_speed /= 0.5
            atempos.append(f"atempo={max(0.5, min(2.0, cur_speed)):.4f}")
            a_filter = ",".join(atempos)
        else:
            a_filter = f"asetrate=44100*{audio_multiplier:.4f},aresample=44100"

        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-filter_complex", f"[0:v]{v_filter}[v];[0:a]{a_filter}[a]",
            "-map", "[v]", "-map", "[a]",
            "-c:v", v_codec, "-c:a", a_codec,
            output_path
        ]
        return await self.execute(cmd)

    async def add_audio(
        self,
        video_path: str,
        audio_path: str,
        output_path: str,
        video_volume: float = 1.0,
        audio_volume: float = 0.5,
        loop_audio: bool = True,
        ducking: bool = False
    ) -> ProcessResult:
        cmd = ["ffmpeg", "-y", "-i", video_path]
        if loop_audio:
            cmd.extend(["-stream_loop", "-1"])
        cmd.extend(["-i", audio_path])

        if video_volume <= 0:
            filter_complex = f"[1:a]volume={audio_volume:.2f}[aout]"
        elif ducking:
            filter_complex = (
                f"[0:a]volume={video_volume:.2f}[va];"
                f"[1:a]volume={audio_volume:.2f}[ma];"
                f"[ma][va]sidechaincompress=threshold=0.12:ratio=4:attack=15:release=250[ducked_m];"
                f"[va][ducked_m]amix=inputs=2:duration=first:dropout_transition=2[aout]"
            )
        else:
            filter_complex = (
                f"[0:a]volume={video_volume:.2f}[va];"
                f"[1:a]volume={audio_volume:.2f}[ma];"
                f"[va][ma]amix=inputs=2:duration=first:dropout_transition=2[aout]"
            )

        cmd.extend([
            "-filter_complex", filter_complex,
            "-map", "0:v:0", "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest",
            output_path
        ])
        return await self.execute(cmd)

    async def reverse(
        self,
        input_path: str,
        output_path: str,
        reverse_audio: bool = True
    ) -> ProcessResult:
        ext = Path(output_path).suffix
        v_codec = self.get_best_video_encoder(ext)
        a_codec = self.get_best_audio_encoder(ext)
        if reverse_audio:
            cmd = [
                "ffmpeg", "-y", "-i", input_path,
                "-vf", "reverse",
                "-af", "areverse",
                "-c:v", v_codec, "-c:a", a_codec,
                output_path
            ]
        else:
            cmd = [
                "ffmpeg", "-y", "-i", input_path,
                "-vf", "reverse",
                "-c:v", v_codec,
                "-c:a", "copy",
                output_path
            ]
        return await self.execute(cmd)

    async def strip_metadata(self, input_path: str, output_path: str) -> ProcessResult:
        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-map_metadata", "-1",
            "-c", "copy",
            output_path
        ]
        return await self.execute(cmd)

ffmpeg_engine = FFmpegEngine()
