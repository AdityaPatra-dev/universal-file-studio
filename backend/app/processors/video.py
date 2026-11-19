import os
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from app.processors.base import BaseProcessor
from app.engines.wrappers.ffmpeg import ffmpeg_engine
from app.engines.wrappers.base import ProcessResult
from app.security.path_validation import sanitize_format

ALLOWED_VIDEO_FORMATS = {"mp4", "webm", "mkv", "avi", "mov", "flv", "ts", "gif", "wmv", "3gp", "ogv", "m4v"}
ALLOWED_AUDIO_FORMATS = {"mp3", "aac", "wav", "flac", "ogg", "m4a", "opus"}
ALLOWED_PRESETS = {"ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow"}

def _safe_int(val: Any, default: int, min_val: Optional[int] = None, max_val: Optional[int] = None) -> int:
    try:
        res = int(val)
        if min_val is not None:
            res = max(min_val, res)
        if max_val is not None:
            res = min(max_val, res)
        return res
    except (ValueError, TypeError):
        return default

def _safe_float(val: Any, default: float, min_val: Optional[float] = None, max_val: Optional[float] = None) -> float:
    try:
        res = float(val)
        if min_val is not None:
            res = max(min_val, res)
        if max_val is not None:
            res = min(max_val, res)
        return res
    except (ValueError, TypeError):
        return default

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
        target_fmt = sanitize_format(parameters.get("format") or parameters.get("to"), ALLOWED_VIDEO_FORMATS, "mp4")

        # 1. Video Convert
        if operation in ["video_convert", "convert_video"]:
            out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.{target_fmt}")
            remux_lossless = bool(parameters.get("remux_lossless", False))

            # Quality profile mapping
            profile = str(parameters.get("quality_profile", "")).lower()
            default_crf = 28
            audio_bitrate_k = 192
            if profile == "master_crf18":
                default_crf = 18
                audio_bitrate_k = 320
            elif profile == "broadcast_crf21":
                default_crf = 21
                audio_bitrate_k = 256
            elif profile == "high_crf23":
                default_crf = 23
                audio_bitrate_k = 192
            elif profile == "balanced_crf26":
                default_crf = 26
                audio_bitrate_k = 128

            crf = _safe_int(parameters.get("crf"), default_crf, min_val=0, max_val=51) if parameters.get("crf") is not None else default_crf
            preset = str(parameters.get("preset", "medium")).lower()
            if preset not in ALLOWED_PRESETS:
                preset = "medium"

            vcodec_param = parameters.get("video_codec") or parameters.get("vcodec")
            video_codec = str(vcodec_param).lower() if vcodec_param and str(vcodec_param).lower() != "auto" else None

            acodec_param = parameters.get("audio_codec") or parameters.get("acodec")
            audio_codec = str(acodec_param).lower() if acodec_param and str(acodec_param).lower() != "auto" else None

            resolution = str(parameters.get("resolution", "original")).lower()
            scale = None
            if resolution in ["4k", "2160p"]:
                scale = "scale='min(3840,iw)':-2"
            elif resolution in ["1440p", "2k"]:
                scale = "scale='min(2560,iw)':-2"
            elif resolution in ["1080p", "fhd"]:
                scale = "scale='min(1920,iw)':-2"
            elif resolution in ["720p", "hd"]:
                scale = "scale='min(1280,iw)':-2"
            elif resolution in ["480p", "sd"]:
                scale = "scale='min(854,iw)':-2"

            raw_fps = parameters.get("fps")
            fps = _safe_int(raw_fps, 0, min_val=1, max_val=240) if raw_fps and str(raw_fps).lower() != "original" else None
            faststart = bool(parameters.get("faststart", True))

            res = await ffmpeg_engine.convert(
                input_path,
                out_file,
                video_codec=video_codec,
                audio_codec=audio_codec,
                crf=crf,
                preset=preset,
                scale=scale,
                fps=fps,
                remux_lossless=remux_lossless,
                faststart=faststart,
                audio_bitrate_k=audio_bitrate_k
            )
            return out_file, res

        # 2. Video Compress
        elif operation in ["video_compress", "compress_video"]:
            out_file = str(out_d / f"{in_p.stem}_compressed_{job_id[:8]}.mp4")
            crf = _safe_int(parameters.get("crf", 28), 28, min_val=0, max_val=51)
            raw_bitrate = parameters.get("target_bitrate_kbps") or parameters.get("bitrate_k")
            bitrate = _safe_int(raw_bitrate, 1000, min_val=64, max_val=100000) if raw_bitrate else None
            codec_param = parameters.get("codec")
            codec = str(codec_param).lower() if codec_param else None
            if codec and codec not in ["libx264", "libx265", "libvpx", "libvpx-vp9"]:
                codec = None
            preset = str(parameters.get("preset", "medium")).lower()
            if preset not in ALLOWED_PRESETS:
                preset = "medium"

            resolution = str(parameters.get("resolution", "original")).lower()
            scale = None
            if resolution == "1080p":
                scale = "scale='min(1920,iw)':-2"
            elif resolution == "720p":
                scale = "scale='min(1280,iw)':-2"
            elif resolution == "480p":
                scale = "scale='min(854,iw)':-2"

            audio_mode = str(parameters.get("audio_mode", "aac")).lower()
            copy_audio = audio_mode == "copy" or bool(parameters.get("copy_audio", False))
            mute_audio = audio_mode == "mute" or bool(parameters.get("mute_audio", False))
            audio_bitrate = _safe_int(parameters.get("audio_bitrate", 128), 128, min_val=32, max_val=384)

            res = await ffmpeg_engine.compress(
                input_path,
                out_file,
                target_bitrate_k=bitrate,
                crf=crf,
                video_codec=codec,
                preset=preset,
                scale=scale,
                copy_audio=copy_audio,
                mute_audio=mute_audio,
                audio_bitrate_k=audio_bitrate
            )
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
            preset = str(parameters.get("preset", "")).lower()
            w = _safe_int(parameters.get("width"), 1280, min_val=16, max_val=7680)
            h = _safe_int(parameters.get("height"), 720, min_val=16, max_val=4320)
            if preset == "9:16":
                w, h = 1080, 1920
            elif preset == "1:1":
                w, h = 1080, 1080
            elif preset in ["1080p", "fhd"]:
                w, h = 1920, 1080
            elif preset == "4:5":
                w, h = 1080, 1350
            elif preset == "21:9":
                w, h = 2560, 1080
            elif preset == "720p":
                w, h = 1280, 720
            elif preset == "480p":
                w, h = 854, 480

            fit_mode = str(parameters.get("fit_mode", "blurred_background" if preset == "9:16" else "letterbox")).lower()
            sharpen = bool(parameters.get("sharpen", True))
            pad_color = str(parameters.get("pad_color", "black"))
            keep_aspect = bool(parameters.get("keep_aspect_ratio", True))
            res = await ffmpeg_engine.resize(
                input_path,
                out_file,
                width=w,
                height=h,
                keep_aspect_ratio=keep_aspect,
                fit_mode=fit_mode,
                sharpen=sharpen,
                pad_color=pad_color
            )
            return out_file, res

        # 5. Video Crop
        elif operation in ["video_crop", "crop_video"]:
            out_file = str(out_d / f"{in_p.stem}_cropped_{job_id[:8]}.mp4")
            w = _safe_int(parameters.get("width", 640), 640, min_val=16, max_val=7680)
            h = _safe_int(parameters.get("height", 480), 480, min_val=16, max_val=4320)
            x = _safe_int(parameters.get("x", 0), 0, min_val=0)
            y = _safe_int(parameters.get("y", 0), 0, min_val=0)
            res = await ffmpeg_engine.crop(input_path, out_file, width=w, height=h, x=x, y=y)
            return out_file, res

        # 6. Video Rotate / Flip
        elif operation in ["video_rotate", "rotate_video"]:
            deg = _safe_int(parameters.get("degrees", 90), 90)
            out_file = str(out_d / f"{in_p.stem}_rotated_{job_id[:8]}.mp4")
            if deg == 90:
                vf = "transpose=1"
            elif deg == 180:
                vf = "hflip,vflip"
            elif deg == 270:
                vf = "transpose=2"
            else:
                vf = "null"  # 0 or unhandled angle is no-op
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
            fps = _safe_float(parameters.get("fps", 30), 30.0, min_val=1.0, max_val=120.0)
            out_file = str(out_d / f"{in_p.stem}_{int(fps)}fps_{job_id[:8]}.mp4")
            v_codec = ffmpeg_engine.get_best_video_encoder(".mp4")
            cmd = ["ffmpeg", "-y", "-i", input_path, "-r", str(fps), "-c:v", v_codec, out_file]
            res = await ffmpeg_engine.execute(cmd)
            return out_file, res

        # 8. Video Change Speed
        elif operation in ["video_change_speed", "change_speed", "video_speed"]:
            speed = _safe_float(parameters.get("speed", 1.5), 1.5, min_val=0.1, max_val=10.0)
            preserve_pitch = bool(parameters.get("preserve_pitch", True))
            motion_blur_smooth = bool(parameters.get("motion_blur_smooth", True))
            mute_audio = bool(parameters.get("mute_audio", False))
            out_file = str(out_d / f"{in_p.stem}_{speed}x_{job_id[:8]}.mp4")
            res = await ffmpeg_engine.change_speed(
                input_path,
                out_file,
                video_multiplier=speed,
                audio_multiplier=speed,
                preserve_pitch=preserve_pitch,
                motion_blur_smooth=motion_blur_smooth,
                mute_audio=mute_audio
            )
            return out_file, res

        # 9. Video Reverse
        elif operation in ["video_reverse", "reverse_video"]:
            out_file = str(out_d / f"{in_p.stem}_reversed_{job_id[:8]}.mp4")
            res = await ffmpeg_engine.reverse(input_path, out_file, reverse_audio=True)
            return out_file, res

        # 10. Extract Audio
        elif operation in ["extract_audio", "video_extract_audio"]:
            audio_fmt = sanitize_format(parameters.get("format"), ALLOWED_AUDIO_FORMATS, "mp3")
            bitrate = _safe_int(parameters.get("bitrate", 192), 192, min_val=64, max_val=320)
            lossless_copy = bool(parameters.get("lossless_copy", False))
            normalize = bool(parameters.get("normalize", False))
            voice_enhance = bool(parameters.get("voice_enhance", False))
            start_time = parameters.get("start_time") or parameters.get("start")
            end_time = parameters.get("end_time") or parameters.get("end")
            out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.{audio_fmt}")
            codec = "libmp3lame" if audio_fmt == "mp3" else ("aac" if audio_fmt in ["m4a", "aac"] else ("pcm_s16le" if audio_fmt == "wav" else ("flac" if audio_fmt == "flac" else "copy")))
            res = await ffmpeg_engine.extract_audio(
                input_path,
                out_file,
                audio_codec=codec,
                bitrate=bitrate,
                lossless_copy=lossless_copy,
                normalize=normalize,
                voice_enhance=voice_enhance,
                start_time=str(start_time) if start_time else None,
                end_time=str(end_time) if end_time else None
            )
            return out_file, res

        # 10b. Add Music / Audio to Video
        elif operation in ["video_add_audio", "add_audio"]:
            out_file = str(out_d / f"{in_p.stem}_dubbed_{job_id[:8]}.mp4")
            audio_path = parameters.get("audio_path")
            if not audio_path or not os.path.exists(str(audio_path)):
                sec_id = parameters.get("secondary_file_id")
                add_ids = parameters.get("additional_file_ids") or []
                check_ids = [sec_id] if sec_id else add_ids
                if check_ids:
                    try:
                        from app.database import AsyncSessionLocal
                        from app.models.file_record import FileRecord
                        from sqlalchemy import select
                        async with AsyncSessionLocal() as session:
                            stmt = select(FileRecord).where(FileRecord.id.in_([int(i) for i in check_ids if i is not None]))
                            r = await session.execute(stmt)
                            recs = r.scalars().all()
                            for rec in recs:
                                if rec.upload_path and os.path.exists(rec.upload_path):
                                    audio_path = rec.upload_path
                                    break
                    except Exception as err:
                        logger.warning(f"Failed to lookup secondary file from db: {err}")

            if not audio_path or not os.path.exists(str(audio_path)):
                return out_file, ProcessResult(
                    returncode=1,
                    stdout="",
                    stderr="No valid audio file provided to mix with video.",
                    success=False,
                    command=["ffmpeg", "add_audio"]
                )

            v_vol = _safe_int(parameters.get("video_volume", 100), 100, min_val=0, max_val=200) / 100.0
            a_vol = _safe_int(parameters.get("audio_volume", 50), 50, min_val=0, max_val=200) / 100.0
            loop_audio = bool(parameters.get("loop_audio", True))
            ducking = bool(parameters.get("ducking", False))

            res = await ffmpeg_engine.add_audio(
                video_path=input_path,
                audio_path=str(audio_path),
                output_path=out_file,
                video_volume=v_vol,
                audio_volume=a_vol,
                loop_audio=loop_audio,
                ducking=ducking
            )
            return out_file, res

        # 11. Remove / Mute Audio
        elif operation in ["remove_audio", "video_remove_audio", "mute_video"]:
            out_file = str(out_d / f"{in_p.stem}_muted_{job_id[:8]}.mp4")
            mute_mode = str(parameters.get("mute_mode", "complete")).lower()
            start_time = parameters.get("start_time") or parameters.get("start")
            end_time = parameters.get("end_time") or parameters.get("end")
            track_index = _safe_int(parameters.get("track_index", 0), 0)
            res = await ffmpeg_engine.mute_audio(
                input_path,
                out_file,
                mute_mode=mute_mode,
                start_time=str(start_time) if start_time else None,
                end_time=str(end_time) if end_time else None,
                track_index=track_index
            )
            return out_file, res

        # 12. Single Hero Frame, Storyboard, or Burst Extract Frames
        elif operation in ["extract_frame", "video_thumbnail", "thumbnail_video", "storyboard"]:
            mode = str(parameters.get("mode", "single")).lower()
            fmt = sanitize_format(parameters.get("format"), {"png", "jpg", "jpeg", "webp"}, "png")
            sharpen = bool(parameters.get("sharpen", True))
            if mode == "storyboard":
                out_file = str(out_d / f"{in_p.stem}_storyboard_{job_id[:8]}.{fmt}")
                grid = str(parameters.get("grid_layout", "3x3")).lower()
                cols, rows = 3, 3
                if "x" in grid:
                    parts = grid.split("x")
                    cols = _safe_int(parts[0], 3, min_val=1, max_val=8)
                    rows = _safe_int(parts[1], 3, min_val=1, max_val=8)
                res = await ffmpeg_engine.generate_storyboard(input_path, out_file, columns=cols, rows=rows)
                return out_file, res
            elif mode == "burst":
                out_sub_d = str(out_d / f"{in_p.stem}_burst_{job_id[:8]}")
                fps = _safe_float(parameters.get("fps", 1.0), 1.0, min_val=0.01, max_val=10.0)
                res = await ffmpeg_engine.extract_frames(input_path, out_sub_d, fps=fps, format=fmt)
                return out_sub_d, res
            else:
                out_file = str(out_d / f"{in_p.stem}_thumb_{job_id[:8]}.{fmt}")
                time_str = str(parameters.get("time") or parameters.get("timestamp") or "00:00:01")
                res = await ffmpeg_engine.extract_single_frame(input_path, out_file, time_str=time_str, sharpen=sharpen)
                return out_file, res

        elif operation in ["extract_frames", "video_extract_frames"]:
            out_sub_d = str(out_d / f"{in_p.stem}_frames_{job_id[:8]}")
            fps = _safe_float(parameters.get("fps", 1.0), 1.0, min_val=0.01, max_val=10.0)
            fmt = sanitize_format(parameters.get("format"), {"jpg", "jpeg", "png", "webp"}, "jpg")
            res = await ffmpeg_engine.extract_frames(input_path, out_sub_d, fps=fps, format=fmt)
            return out_sub_d, res

        # 13. Video Concat (Directory or multi-video merge)
        elif operation in ["video_concat", "concat_video", "merge_videos"]:
            import re
            vid_exts = {".mp4", ".mkv", ".webm", ".avi", ".mov", ".flv", ".ts"}
            if in_p.is_dir():
                vids = sorted([p for p in in_p.rglob("*") if p.suffix.lower() in vid_exts], key=lambda x: [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', x.name)])
            else:
                vids = [in_p]

            fmt = sanitize_format(parameters.get("format"), ALLOWED_VIDEO_FORMATS, "mp4")
            out_file = str(out_d / f"{in_p.stem}_concat_{job_id[:8]}.{fmt}")

            if not vids:
                return out_file, ProcessResult(returncode=1, stdout="", stderr="No video files found to concatenate", success=False, command=["ffmpeg", "concat"])

            if len(vids) == 1:
                import shutil
                shutil.copyfile(str(vids[0]), out_file)
                return out_file, ProcessResult(returncode=0, stdout="Single video copied", stderr="", success=True, command=["copy", str(vids[0]), out_file])

            # Write concat file safely with quote escaping
            concat_txt = out_d / f"concat_{job_id[:8]}.txt"
            try:
                with open(concat_txt, "w", encoding="utf-8") as f:
                    for v in vids:
                        safe_v_path = v.resolve().as_posix().replace("'", "'\\''")
                        f.write(f"file '{safe_v_path}'\n")

                cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_txt), "-c", "copy", out_file]
                res = await ffmpeg_engine.execute(cmd)
                if not res.success or not os.path.exists(out_file) or os.path.getsize(out_file) == 0:
                    # Fallback to re-encoding if streams are mismatched
                    cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_txt), "-c:v", "libx264", "-c:a", "aac", out_file]
                    res = await ffmpeg_engine.execute(cmd)

                return out_file, res
            finally:
                if concat_txt.exists():
                    concat_txt.unlink(missing_ok=True)

        # Default fallback
        out_file = str(out_d / f"{in_p.stem}_{job_id[:8]}.mp4")
        res = await ffmpeg_engine.convert(input_path, out_file)
        return out_file, res

video_processor = VideoProcessor()

