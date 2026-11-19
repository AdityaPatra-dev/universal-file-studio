# Universal Video Studio — Master Transformation Plan: 13 Pro Tool Workbenches

This master execution plan outlines the upgrade of every remaining video utility in Universal File Studio into a dedicated, best-in-class application. Each tool is engineered to rival or surpass specialized Google Play Store and desktop applications (such as LosslessCut, CapCut, InShot, GIF Maker Pro, and VidStab) with zero artificial compromises, full offline mobile support, and hardware-accelerated processing.

---

## 1. Audit & Current Status of All 21 Video Tools

| # | Tool ID | Operation | Studio Title | Play Store Benchmark | Status |
|---|---------|-----------|--------------|----------------------|--------|
| 1 | `video_convert` | `video_convert` | Universal Format Studio | HandBrake Mobile / Video Converter Pro | ✅ **Completed** |
| 2 | `video_compress` | `video_compress` | Hardware & Pro Analyzer Studio | Panda Video Compressor / Video Dieter | ✅ **Completed** |
| 3 | `video_resize` | `video_resize` | Social Canvas & Aspect Scaler | InShot Canvas / Resize Video | ✅ **Completed** |
| 4 | `video_remove_audio` | `video_remove_audio` | Pro Mute & Audio Track Director | Mute Video / Audio Extractor | ✅ **Completed** |
| 5 | `video_thumbnail` | `extract_frame` | Hero Frame & Cinema Storyboard | Frame Capture / Video Thumbnail Maker | ✅ **Completed** |
| 6 | `extract_audio` | `extract_audio` | Audio Studio & Track Ripper | MP3 Video Converter / Audio Extractor | ✅ **Completed** |
| 7 | `video_speed` | `video_change_speed` | Motion Velocity & Time Warp Studio | Slow Motion Video FX / CapCut Speed | ✅ **Completed** |
| 8 | `video_add_audio` | `video_add_audio` | Dual Audio Mixer & Dubbing Studio | Add Audio to Video / InShot Music | ✅ **Completed** |
| 9 | `video_trim` | `video_trim` | Lossless Frame-Accurate Cutter | LosslessCut / Video Splitter | ✅ **Completed** |
| 10 | `video_crop` | `video_crop` | Precision Visual Crop & Pan Studio | Smart Video Crop / Crop & Trim Video | ✅ **Completed** |
| 11 | `video_to_gif` | `video_to_gif` | Pro GIF Maker Studio (PaletteGen) | GIF Maker - Video to GIF Pro | ✅ **Completed** |
| 12 | `gif_to_video` | `gif_to_video` | GIF to 60fps MP4 & Motion Upscaler | GIF to Video Converter | ✅ **Completed** |
| 13 | `video_rotate` | `video_rotate` | Orientation & 3D Mirror Studio | Video Rotate & Flip | ✅ **Completed** |
| 14 | `video_concat` | `video_concat` | Multi-Clip Stitcher & Timeline Joiner | Video Merger / Video Joiner Pro | ✅ **Completed** |
| 15 | `video_reverse` | `video_reverse` | Rewind & Boomerang FX Studio | Reverse Movie FX / Boomerang Maker | ✅ **Completed** |
| 16 | `video_loop` | `video_loop` | Infinite Seamless Looper Studio | Loop Video / Video Repeat Maker | ✅ **Completed** |
| 17 | `video_adjust_volume` | `video_adjust_volume` | Studio Volume & Gain Equalizer | Volume Booster Pro / Sound Amplifier | ✅ **Completed** |
| 18 | `video_change_fps` | `video_change_fps` | Cinema Frame Rate & Cadence Studio | Video Frame Rate Converter | ✅ **Completed** |
| 19 | `video_watermark` | `video_watermark` | Brand Stamp & Dynamic Lower-Third | Watermark Video / Logo Inserter | ✅ **Completed** |
| 20 | `video_stabilize` | `video_stabilize` | Gimbal Shaky Cam Stabilizer | Deshake Video / Shaky Video Stabilizer | ✅ **Completed** |
| 21 | `video_burn_subtitles` | `video_burn_subtitles` | Cinema Caption & Subtitle Hardcoder | Subtitle Inserter / Auto Subtitles | ✅ **Completed** |

---

## 2. Detailed Technical Breakdown for the Remaining 13 Tools

### 1. `video_trim` — Lossless Frame-Accurate Cutter & Multi-Segment Splitter
- **Play Store Benchmark**: *LosslessCut*, *Video Splitter for WhatsApp Status*.
- **Weakness in Typical Mobile Apps**: Re-encodes whole video taking minutes and degrading quality, or makes coarse keyframe cuts that glitch at the start.
- **Universal File Studio Implementation**:
  - **Dual Cutting Engines**:
    - **Ultra-Fast Stream Copy (`-c copy`)**: Trims 1GB in `< 0.5s` with 0% transcoding loss.
    - **Accurate Smart Cut (`-c:v libx264 -crf 18`)**: Sub-frame millisecond precision for frame-critical cuts.
  - **WhatsApp / Story Auto-Chunk Splitter**:
    - Automatic slicing into `15s`, `30s`, `60s` contiguous chunks for WhatsApp Status, Instagram Stories, and TikTok.
  - **Interactive Dual Timeline Scrubber**:
    - Dual thumb scrubber with zoomable keyframe markers and instant playhead sync.

### 2. `video_crop` — Precision Visual Crop & Pan Studio
- **Play Store Benchmark**: *Smart Video Crop*, *Crop & Trim Video*.
- **Weakness in Typical Mobile Apps**: Blind numeric boxes without visual feedback, or limited fixed aspect ratios.
- **Universal File Studio Implementation**:
  - **Interactive Aspect Locks**: `1:1`, `9:16`, `16:9`, `4:5`, `21:9`, `Custom`.
  - **Center & Rule-of-Thirds Grid Overlays**: Visual guidelines for balanced framing.
  - **Coordinate & Dimension Inputs**: Fine-tune X, Y, Width, and Height with even-pixel parity clamping.
  - **High-Fidelity Scaling Filter**: `crop=w:h:x:y` with Lanczos anti-aliasing.

### 3. `video_to_gif` — Pro GIF Maker Studio (PaletteGen & Dithering)
- **Play Store Benchmark**: *GIF Maker – Video to GIF Pro*.
- **Weakness in Typical Mobile Apps**: Severe color banding (256-color limit with naive palette) and massive file sizes.
- **Universal File Studio Implementation**:
  - **Desktop-Grade 2-Pass PaletteGen**: Generates a custom 256-color palette tailored specifically to the video clip.
  - **Advanced Dithering Algorithms**: `sierra2_4a`, `floyd_steinberg`, `bayer` (bayer_scale=3), and `none` for pixel art.
  - **Frame Rate & Resolution Tuning**: `10fps` (lightweight), `15fps` (balanced), `24fps` (cinematic), `30fps` (buttery smooth).
  - **Loop Count Control**: Infinite loop vs play-once mode.

### 4. `gif_to_video` — GIF to 60fps MP4 & Motion Upscaler
- **Play Store Benchmark**: *GIF to Video Converter*.
- **Weakness in Typical Mobile Apps**: 1-second GIFs get rejected by Instagram/WhatsApp because video is too short (< 3 seconds).
- **Universal File Studio Implementation**:
  - **Duration Multiplier Auto-Pad**: Repeats short GIFs to exceed 3-5 seconds so social platforms accept them as valid video reels.
  - **YUV420p Color Space Conformance**: Fixes black-screen errors on Android/iOS video players.
  - **Frame Rate Upscaling**: Smooth 30fps/60fps motion conversion.

### 5. `video_rotate` — Orientation, 3D Horizon & Mirror Studio
- **Play Store Benchmark**: *Video Rotate & Flip*.
- **Weakness in Typical Mobile Apps**: Stretches video or loses metadata orientation tags.
- **Universal File Studio Implementation**:
  - **Lossless Metadata Orientation Fix**: Fixes upside-down or sideways smartphone videos without re-encoding (`-metadata:s:v rotate=0`).
  - **Hard Orthogonal Transposition**: 90° CW, 180°, 270° (90° CCW).
  - **Mirror & Reflection**: Horizontal Flip (`hflip`) and Vertical Invert (`vflip`).

### 6. `video_concat` — Multi-Clip Stitcher & Timeline Joiner
- **Play Store Benchmark**: *Video Joiner Pro*, *CapCut Merge*.
- **Weakness in Typical Mobile Apps**: Fails when merging videos with different resolutions or frame rates.
- **Universal File Studio Implementation**:
  - **Zero-Loss Remuxing**: Instant stream-copy concat for matching clips.
  - **Auto-Conforming Multi-Resolution Engine**: Re-scales and standardizes varying resolutions (e.g. 720p + 1080p) into a uniform master resolution.
  - **Crossfade Audio/Video Transition Option**: Seamless dissolve transitions between clips.

### 7. `video_reverse` — Rewind & Boomerang FX Studio
- **Play Store Benchmark**: *Reverse Movie FX*, *Boomerang Maker*.
- **Weakness in Typical Mobile Apps**: Crashing on 4K files, losing audio or playing audio forwards over reversed video.
- **Universal File Studio Implementation**:
  - **True Bi-Directional Boomerang**: Plays clip forward then backward seamlessly in a loop.
  - **Synchronized Audio Reversal**: Reverses audio alongside video (`reverse,areverse`) with pitch stabilization.
  - **Speed-Coupled Reverse**: Reverses at `0.5x slo-mo` or `2.0x hyper` for comedic or dramatic effect.

### 8. `video_loop` — Infinite Seamless Looper Studio
- **Play Store Benchmark**: *Loop Video*, *Video Repeater*.
- **Weakness in Typical Mobile Apps**: Noticeable visual jump or audio stutter at loop points.
- **Universal File Studio Implementation**:
  - **Target Multiplier or Target Duration**: Loop by count (e.g. 2x, 5x, 10x) or loop until reaching a specific duration (e.g. 10m, 1 hour).
  - **Crossfade Dissolve Overlap**: 0.5s-1.5s seamless dissolve at loop boundary to hide abrupt cuts.
  - **Stream Copy Passthrough**: Multiplexes looped containers in seconds.

### 9. `video_adjust_volume` — Studio Volume & Gain Equalizer
- **Play Store Benchmark**: *Volume Booster Pro*, *Sound Amplifier*.
- **Weakness in Typical Mobile Apps**: Causes nasty audio clipping/distortion when boosted.
- **Universal File Studio Implementation**:
  - **Gain Multiplier (0% to 400%) & Decibel Tuning (-20dB to +20dB)**.
  - **Soft Limiter / Anti-Clip Guard**: `alimiter` filter prevents square-wave digital distortion.
  - **Speech Dialog Boost (Night Mode Compressor)**: Lifts whisper volumes without blowing out explosions or music.
  - **Lossless Video Passthrough**: Leaves video stream untouched (`-c:v copy`).

### 10. `video_change_fps` — Cinema Frame Rate & Cadence Studio
- **Play Store Benchmark**: *Video Frame Rate Converter*.
- **Weakness in Typical Mobile Apps**: Drops frames unevenly creating judder.
- **Universal File Studio Implementation**:
  - **Cadence Presets**: `24fps` (Hollywood Film Standard), `25fps` (PAL/Europe), `30fps` (Web Standard), `60fps` (Smooth Gaming/Action), `120fps` (High Frame Rate).
  - **Motion Interpolation**: Framerate blending to avoid motion strobing.

### 11. `video_watermark` — Brand Stamp & Dynamic Lower-Third
- **Play Store Benchmark**: *Watermark Video*, *Add Logo to Video*.
- **Weakness in Typical Mobile Apps**: Forced low resolution or cumbersome positioning.
- **Universal File Studio Implementation**:
  - **Text & Graphic Watermarks**: Custom typography, size, color, background pill, and PNG logo overlay.
  - **9-Point Snap Matrix**: Top-Left, Top-Center, Top-Right, Center-Left, Dead-Center, Center-Right, Bottom-Left, Bottom-Center, Bottom-Right.
  - **Precise Margin Padding & Opacity**: 10% to 100% opacity slider with custom pixel offsets.

### 12. `video_stabilize` — Gimbal Shaky Cam Stabilizer
- **Play Store Benchmark**: *Video Stabilizer Deshake*, *Google Photos Stabilize*.
- **Weakness in Typical Mobile Apps**: Aggressive cropping, jelly distortion, or cloud-only requirement.
- **Universal File Studio Implementation**:
  - **2-Pass VidStab Motion Analysis**: Pass 1 generates transform vectors (`vidstabdetect`), Pass 2 applies camera shake compensation (`vidstabtransform`).
  - **Tunable Smoothing Radius**: Subtle handheld smoothing vs locked-off tripod simulation.
  - **Smart Adaptive Zoom & Edge Border Interpolation**: Eliminates black border wobble.

### 13. `video_burn_subtitles` — Cinema Caption & Subtitle Hardcoder
- **Play Store Benchmark**: *Auto Subtitles*, *Subtitle Hardcoder*.
- **Weakness in Typical Mobile Apps**: Generic boring fonts, misaligned text, or poor contrast on bright backgrounds.
- **Universal File Studio Implementation**:
  - **Caption Support**: SubRip (`.srt`), WebVTT (`.vtt`), Advanced SubStation Alpha (`.ass`).
  - **Customizable Cinema Styling**: Font selection, size, yellow/white text color, black outline, semi-transparent backing box.
  - **Direct Stream Audio Copy**: Retains original pristine audio while burning captions into video frames.

---

## 3. Step-by-Step Execution Sequence

We will execute these 13 tools **one by one** across the entire stack:
1. **Batch 1 (Core Editorial Suite)**:
   - `video_trim` (Lossless Frame-Accurate Cutter & WhatsApp Splitter)
   - `video_crop` (Precision Visual Crop & Pan Studio)
2. **Batch 2 (Animated Media & Motion)**:
   - `video_to_gif` (Pro GIF Maker Studio with 2-pass PaletteGen)
   - `gif_to_video` (GIF to 60fps MP4 with duration auto-pad)
3. **Batch 3 (Orientation, Timeline & FX)**:
   - `video_rotate` (Orientation, Horizon & Mirror Studio)
   - `video_concat` (Multi-Clip Stitcher & Conforming Joiner)
   - `video_reverse` (Rewind & Boomerang FX Studio)
   - `video_loop` (Infinite Seamless Looper)
4. **Batch 4 (Audio, Cadence & Finishing)**:
   - `video_adjust_volume` (Studio Volume & Gain Equalizer with Anti-Clip Limiter)
   - `video_change_fps` (Cinema Frame Rate & Cadence Studio)
   - `video_watermark` (Brand Stamp & Dynamic Lower-Third)
5. **Batch 5 (Advanced Cinema Filters)**:
   - `video_stabilize` (Gimbal Shaky Cam 2-Pass Stabilizer)
   - `video_burn_subtitles` (Cinema Caption & Subtitle Hardcoder)

Each tool will receive:
- Updated catalog specification with complete parameter sets in `videoCatalog.ts`.
- Dedicated studio workbench UI in `VideoStudioWorkbench.tsx`.
- Backend FFmpeg engine and processor support in `ffmpeg.py` and `video.py`.
- Native Android offline processing in `UniversalNativeEnginePlugin.java`.
- Comprehensive testing (`pytest`, `oxlint`, `vite build`, `./build-apk.sh`).
