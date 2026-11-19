import { StudioTool } from './types';

export const VIDEO_TOOLS: StudioTool[] = [
  // ==================== 🔥 TOP 7 MOST USED (PINNED AT TOP) ====================
  {
    id: 'video_convert',
    name: 'Universal Video Converter',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Transcode',
    description: 'Convert between any video format (MP4, WebM, MKV, MOV, AVI, TS, FLV, WMV) with studio-grade encoders and zero-loss remuxing.',
    iconName: 'Film',
    color: 'from-indigo-500 to-violet-600',
    badge: 'popular',
    rank: 1,
    isPinnedTop: true,
    operation: 'video_convert',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.flv', '.ts', '.m4v', '.wmv', '.3gp', '.ogv', '.vob', '.mts', '.m2ts', '.f4v'],
    outputFormats: ['.mp4', '.webm', '.mkv', '.mov', '.avi', '.ts', '.flv', '.wmv', '.3gp', '.ogv'],
    defaultParameters: { format: 'mp4', crf: 23, preset: 'medium', faststart: true, remux_lossless: false },
    parameters: [
      {
        name: 'format',
        label: 'Target Container Format',
        type: 'select',
        default: 'mp4',
        options: [
          { label: 'MP4 (.MP4) — Universal Phone & Web Master', value: 'mp4' },
          { label: 'WebM (.WEBM) — Modern Web Standard (VP9 / Opus)', value: 'webm' },
          { label: 'Matroska (.MKV) — Studio Master & Multi-Track', value: 'mkv' },
          { label: 'QuickTime (.MOV) — Apple macOS / iOS / ProRes', value: 'mov' },
          { label: 'AVI (.AVI) — Legacy Windows & Multimedia', value: 'avi' },
          { label: 'Transport Stream (.TS) — Broadcast & IPTV', value: 'ts' },
          { label: 'Flash Video (.FLV) — RTMP & Web Streaming', value: 'flv' },
          { label: 'Windows Media (.WMV) — Windows Media Stream', value: 'wmv' },
          { label: '3GP (.3GP) — Ultra-Light Mobile', value: '3gp' },
          { label: 'Ogg Video (.OGV) — Open Theora Stream', value: 'ogv' }
        ]
      },
      {
        name: 'resolution',
        label: 'Output Resolution',
        type: 'select',
        default: 'original',
        options: [
          { label: 'Keep Original Resolution', value: 'original' },
          { label: '4K Ultra HD (3840x2160)', value: '4k' },
          { label: '1440p Quad HD (2560x1440)', value: '1440p' },
          { label: '1080p Full HD (1920x1080)', value: '1080p' },
          { label: '720p HD (1280x720)', value: '720p' },
          { label: '480p SD (854x480)', value: '480p' }
        ]
      },
      {
        name: 'video_codec',
        label: 'Video Codec Engine',
        type: 'select',
        default: 'auto',
        options: [
          { label: 'Auto (Optimal for Selected Container)', value: 'auto' },
          { label: 'H.265 / HEVC (+50% Efficiency, 4K/HDR Ready)', value: 'libx265' },
          { label: 'H.264 / AVC (Universal Compatibility)', value: 'libx264' },
          { label: 'VP9 (Google Royalty-Free Web Standard)', value: 'libvpx-vp9' },
          { label: 'ProRes (Studio Editing Master)', value: 'prores_ks' },
          { label: 'MPEG-4 (Xvid / DivX Compatible)', value: 'mpeg4' },
          { label: 'Lossless Stream Copy (No Re-encoding)', value: 'copy' }
        ]
      },
      {
        name: 'quality_profile',
        label: 'Studio Quality Profile',
        type: 'select',
        default: 'high_crf23',
        options: [
          { label: 'Studio Master (CRF 18 • 320k Audio • Film Fidelity)', value: 'master_crf18' },
          { label: 'Broadcast Pro (CRF 21 • 256k Audio • Industry Standard)', value: 'broadcast_crf21' },
          { label: 'Universal High (CRF 23 • 192k Audio • Transparent Quality)', value: 'high_crf23' },
          { label: 'Balanced Web (CRF 26 • 128k Audio • Compact Size)', value: 'balanced_crf26' }
        ]
      },
      {
        name: 'preset',
        label: 'Encoding Effort Profile',
        type: 'select',
        default: 'medium',
        options: [
          { label: 'Slow (Multi-Pass Precision • Best Compression)', value: 'slow' },
          { label: 'Medium (Optimal Balance of Speed & Quality)', value: 'medium' },
          { label: 'Very Fast (High Speed Export)', value: 'veryfast' }
        ]
      },
      {
        name: 'remux_lossless',
        label: 'Instant Lossless Remux (Zero Quality Loss)',
        type: 'boolean',
        default: false
      },
      {
        name: 'faststart',
        label: 'Web Streaming Optimization (FastStart)',
        type: 'boolean',
        default: true
      }
    ],
    keywords: ['video convert', 'convert video', 'mp4 to mkv', 'mkv to mp4', 'mov to mp4', 'avi to mp4', 'webm to mp4', 'video transcode', 'hevc convert', 'h265 convert'],
    examples: ['mp4 to mkv', 'mov to mp4', 'convert video', 'webm to mp4', 'mkv to mp4']
  },
  {
    id: 'video_trim',
    name: 'Lossless Frame-Accurate Cutter & Splitter',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Instant 0.1s lossless stream copy trimming (-c copy) or sub-frame accurate smart cutting with WhatsApp/Story auto-chunk splitting.',
    iconName: 'Scissors',
    color: 'from-pink-500 to-rose-600',
    badge: 'popular',
    rank: 2,
    isPinnedTop: true,
    operation: 'video_trim',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.flv', '.wmv'],
    outputFormats: ['.mp4', '.mkv', '.webm', '.mov'],
    defaultParameters: {
      start: '00:00:00',
      end: '00:00:30',
      trim_mode: 'single',
      chunk_seconds: 30,
      lossless: true,
      loop_selection: false
    },
    parameters: [
      {
        name: 'trim_mode',
        label: 'Trimming Strategy',
        type: 'select',
        default: 'single',
        options: [
          { label: '✂️ Single Range Clip (Start to End)', value: 'single' },
          { label: '📱 Story / Status Auto-Chunk Splitter', value: 'split_chunks' },
          { label: '🗑️ Cut Out Unwanted Segment (Invert Trim)', value: 'cut_out' }
        ]
      },
      {
        name: 'start',
        label: 'Start Timestamp (HH:MM:SS.ms)',
        type: 'text',
        default: '00:00:00',
        placeholder: '00:00:00'
      },
      {
        name: 'end',
        label: 'End Timestamp (HH:MM:SS.ms)',
        type: 'text',
        default: '00:00:30',
        placeholder: '00:01:00'
      },
      {
        name: 'chunk_seconds',
        label: 'Chunk Duration for Social Splitter',
        type: 'select',
        default: 30,
        options: [
          { label: '15 seconds (Instagram Stories)', value: 15 },
          { label: '30 seconds (WhatsApp Status)', value: 30 },
          { label: '60 seconds (TikTok / Reels)', value: 60 }
        ]
      },
      {
        name: 'lossless',
        label: 'Instant 0.1s Lossless Stream Copy',
        type: 'boolean',
        default: true,
        description: 'Bypasses re-encoding: trims 1GB in 0.2s with 100% original video bitrate'
      }
    ],
    keywords: ['cut video', 'trim video', 'clip video', 'shorten video', 'snip video', 'video cutter', 'losslesscut', 'whatsapp status splitter'],
    examples: ['cut video', 'trim video', 'split for whatsapp status']
  },
  {
    id: 'video_compress',
    name: 'Compress Video for Web & Chat',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Transcode',
    description: 'Shrink video file size down to under 25MB for Discord, Slack, WhatsApp, and email.',
    iconName: 'Minimize2',
    color: 'from-cyan-500 to-blue-600',
    badge: 'essential',
    rank: 3,
    isPinnedTop: true,
    operation: 'compress_video',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov', '.avi'],
    outputFormats: ['.mp4'],
    defaultParameters: { crf: 28 },
    parameters: [
      {
        name: 'target_preset',
        label: 'Compression Preset',
        type: 'select',
        default: 'discord',
        options: [
          { label: 'Discord / Slack (<25 MB)', value: 'discord' },
          { label: 'Email Attachment (<10 MB)', value: 'email' },
          { label: 'WhatsApp Mobile (<16 MB)', value: 'whatsapp' },
          { label: 'Balanced Default (CRF 28)', value: 'balanced' }
        ]
      }
    ],
    keywords: ['compress video', 'shrink video', 'reduce video size', 'small video', 'video under 25mb'],
    examples: ['compress video', 'reduce video size']
  },
  {
    id: 'extract_audio',
    name: 'Audio Studio & Track Ripper',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Audio & Speed',
    description: 'Losslessly rip or transcode studio-grade audio tracks (MP3, WAV, FLAC, AAC, OGG) with loudness normalization and vocal clarity filters.',
    iconName: 'Music',
    color: 'from-amber-500 to-orange-600',
    badge: 'popular',
    rank: 4,
    isPinnedTop: true,
    operation: 'extract_audio',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.flv', '.wmv', '.m4v'],
    outputFormats: ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg'],
    defaultParameters: {
      format: 'mp3',
      bitrate: 192,
      lossless_copy: false,
      normalize: false,
      voice_enhance: false,
      trim_range: false,
      start_time: '00:00:00',
      end_time: '00:00:30'
    },
    parameters: [
      {
        name: 'format',
        label: 'Output Audio Format',
        type: 'select',
        default: 'mp3',
        options: [
          { label: 'MP3 (.MP3) — Universal Compatibility', value: 'mp3' },
          { label: 'FLAC (.FLAC) — Audiophile Lossless 24-bit', value: 'flac' },
          { label: 'WAV (.WAV) — Uncompressed PCM Studio Master', value: 'wav' },
          { label: 'AAC / M4A (.M4A) — High-Efficiency Apple Spec', value: 'm4a' },
          { label: 'OGG Vorbis (.OGG) — Open Web Media Standard', value: 'ogg' }
        ]
      },
      {
        name: 'bitrate',
        label: 'Audio Bitrate / Quality',
        type: 'select',
        default: 192,
        options: [
          { label: '128 kbps (Standard Voice / Speech)', value: 128 },
          { label: '192 kbps (High Quality Streaming Music)', value: 192 },
          { label: '256 kbps (Premium Audio Grade)', value: 256 },
          { label: '320 kbps (Maximum Broadcast CD Quality)', value: 320 }
        ]
      },
      {
        name: 'lossless_copy',
        label: 'Direct Lossless Demux (0.1s Zero-Loss Copy)',
        type: 'boolean',
        default: false,
        description: 'Extracts the exact native audio stream without re-encoding a single byte'
      },
      {
        name: 'normalize',
        label: 'EBU R128 Loudness Normalization',
        type: 'boolean',
        default: false,
        description: 'Auto-balances audio loudness to standard broadcast levels'
      },
      {
        name: 'voice_enhance',
        label: 'Vocal & Dialogue Clarity Isolation',
        type: 'boolean',
        default: false,
        description: 'Applies frequency filtering to isolate human speech and remove low rumble'
      }
    ],
    keywords: ['extract audio', 'rip audio', 'mp4 to mp3', 'video to audio', 'save sound from video', 'audio ripper', 'wav extractor'],
    examples: ['extract audio', 'mp4 to mp3', 'rip wav from video']
  },
  {
    id: 'video_to_gif',
    name: 'Pro GIF Maker Studio (PaletteGen)',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Transcode',
    description: 'Transform video clips into ultra-sharp animated GIFs with 2-pass custom palette generation, 4 dither algorithms, and sub-second clip slicing.',
    iconName: 'Image',
    color: 'from-emerald-500 to-teal-600',
    badge: 'popular',
    rank: 5,
    isPinnedTop: true,
    operation: 'video_to_gif',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm', '.avi', '.mkv'],
    outputFormats: ['.gif'],
    defaultParameters: { format: 'gif', fps: 15, width: 480, dither: 'sierra2_4a', stats_mode: 'diff', speed: 1.0, infinite_loop: true },
    parameters: [
      {
        name: 'width',
        label: 'Resolution Width',
        type: 'select',
        default: 480,
        options: [
          { label: '320px (Compact Sticker / Fast Load)', value: 320 },
          { label: '480px (Standard Social & Chat)', value: 480 },
          { label: '640px (High-Res Detailed GIF)', value: 640 },
          { label: '800px (HD Desktop Master)', value: 800 }
        ]
      },
      {
        name: 'fps',
        label: 'Frame Rate',
        type: 'select',
        default: 15,
        options: [
          { label: '10 fps (Compact Bandwidth)', value: 10 },
          { label: '15 fps (Smooth Animation)', value: 15 },
          { label: '24 fps (Cinema Motion)', value: 24 },
          { label: '30 fps (Ultra Fluid Motion)', value: 30 }
        ]
      },
      {
        name: 'dither',
        label: 'Dithering Engine (Color Blending)',
        type: 'select',
        default: 'sierra2_4a',
        options: [
          { label: 'Sierra-2 4A (Smoothest gradients & natural skin)', value: 'sierra2_4a' },
          { label: 'Floyd-Steinberg (Classic balanced diffusion)', value: 'floyd_steinberg' },
          { label: 'Bayer Matrix 3x3 (Retro ordered dithering)', value: 'bayer' },
          { label: 'None (Clean flat solids / pixel art)', value: 'none' }
        ]
      },
      {
        name: 'speed',
        label: 'Playback Velocity',
        type: 'select',
        default: 1.0,
        options: [
          { label: '0.5x (Slow Motion FX)', value: 0.5 },
          { label: '1.0x (Original Speed)', value: 1.0 },
          { label: '1.25x (Crisp Snappy Motion)', value: 1.25 },
          { label: '1.5x (Fast Meme Pacing)', value: 1.5 },
          { label: '2.0x (Double Speed Warp)', value: 2.0 }
        ]
      },
      {
        name: 'stats_mode',
        label: 'Palette Analysis Mode',
        type: 'select',
        default: 'diff',
        options: [
          { label: 'Diff (Motion-optimized palette per zone)', value: 'diff' },
          { label: 'Full (Single global high-fidelity palette)', value: 'full' }
        ]
      },
      {
        name: 'infinite_loop',
        label: 'Infinite Continuous Loop',
        type: 'boolean',
        default: true,
        description: 'Enables endless repeating loop (standard for stickers and social reactions)'
      },
      {
        name: 'start_time',
        label: 'Clip Start Timestamp (optional, e.g. 00:00:02)',
        type: 'text',
        default: '',
        description: 'Extract GIF directly from a specific moment without trimming first'
      },
      {
        name: 'end_time',
        label: 'Clip End Timestamp (optional, e.g. 00:00:07)',
        type: 'text',
        default: '',
        description: 'End moment for the animated GIF highlight'
      }
    ],
    keywords: ['video to gif', 'make gif from video', 'mp4 to gif', 'animated gif maker', 'palettegen gif', 'hd gif maker'],
    examples: ['video to gif', 'mp4 to gif', 'high quality gif']
  },
  {
    id: 'video_resize',
    name: 'Social Canvas & Aspect Scaler',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Transform aspect ratio to 9:16 Reels/TikTok, 1:1 Square, 4K/1080p with cinematic blurred background padding, letterboxing, or Lanczos-3 sharpening.',
    iconName: 'Maximize2',
    color: 'from-blue-600 to-indigo-700',
    badge: 'top',
    rank: 6,
    isPinnedTop: true,
    operation: 'video_resize',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.ts'],
    outputFormats: ['.mp4', '.mkv', '.mov'],
    defaultParameters: { preset: '9:16', fit_mode: 'blurred_background', sharpen: true, codec: 'libx264' },
    parameters: [
      {
        name: 'preset',
        label: 'Canvas Aspect & Platform Preset',
        type: 'select',
        default: '9:16',
        options: [
          { label: '9:16 Vertical Story / Reels / TikTok (1080x1920)', value: '9:16' },
          { label: '1:1 Square Instagram Feed (1080x1080)', value: '1:1' },
          { label: '16:9 Full HD Landscape (1920x1080)', value: '1080p' },
          { label: '4:5 Portrait Feed (1080x1350)', value: '4:5' },
          { label: '21:9 UltraWide Cinema (2560x1080)', value: '21:9' },
          { label: '16:9 Standard HD (1280x720)', value: '720p' },
          { label: 'Custom Canvas Dimensions', value: 'custom' }
        ]
      },
      {
        name: 'fit_mode',
        label: 'Canvas Framing & Background Style',
        type: 'select',
        default: 'blurred_background',
        options: [
          { label: '✨ Aesthetic Blurred Video Background (TikTok / Reels Style)', value: 'blurred_background' },
          { label: '⬛ Studio Letterbox / Pillarbox with Pad Color', value: 'letterbox' },
          { label: '✂️ Smart Center Zoom & Fill Canvas (No Bars)', value: 'crop' },
          { label: '↔️ Stretch Video to Exact Canvas', value: 'stretch' }
        ]
      },
      {
        name: 'sharpen',
        label: 'Lanczos-3 Sinc Interpolation & Edge Sharpening',
        type: 'boolean',
        default: true
      }
    ],
    keywords: ['resize video', 'scale video', 'change video resolution', 'video downscale', '9:16 vertical', 'blurred background', 'video canvas'],
    examples: ['resize video', 'scale to 9:16', 'add blurred background']
  },
  {
    id: 'video_remove_audio',
    name: 'Pro Mute & Audio Track Director',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Audio & Speed',
    description: 'Instant lossless 0-second video muting, selective time-range censor muting, or multi-track commentary stripping.',
    iconName: 'VolumeX',
    color: 'from-slate-600 to-zinc-700',
    badge: 'top',
    rank: 7,
    isPinnedTop: true,
    operation: 'remove_audio',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.ts'],
    outputFormats: ['.mp4', '.mkv', '.mov'],
    defaultParameters: { mute_mode: 'complete', start_time: '00:00:00', end_time: '00:00:10', track_index: 0 },
    parameters: [
      {
        name: 'mute_mode',
        label: 'Muting & Audio Stripping Mode',
        type: 'select',
        default: 'complete',
        options: [
          { label: '⚡ Complete Mute (Instant 0-Second Lossless Copy)', value: 'complete' },
          { label: '⏱️ Mute Time Range Segment (Censor / Bleep Range)', value: 'segment' },
          { label: '🎙️ Keep Primary Track Only (Strip Secondary Commentary)', value: 'primary_only' }
        ]
      },
      {
        name: 'start_time',
        label: 'Segment Start (HH:MM:SS)',
        type: 'text',
        default: '00:00:00',
        placeholder: '00:00:00'
      },
      {
        name: 'end_time',
        label: 'Segment End (HH:MM:SS)',
        type: 'text',
        default: '00:00:10',
        placeholder: '00:00:10'
      }
    ],
    keywords: ['mute video', 'remove audio from video', 'silent video', 'strip sound from video', 'censor video audio'],
    examples: ['mute video', 'remove audio', 'mute segment']
  },

  // ==================== 🎬 EXTENDED VIDEO TOOLS (TOOLS 8 - 21) ====================
  {
    id: 'video_crop',
    name: 'Precision Visual Crop & Pan Studio',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Precision aspect ratio framing (9:16, 1:1, 4:5, 16:9, 21:9, Custom) with rule-of-thirds grid guides, position anchors, and edge sinc sharpening.',
    iconName: 'Crop',
    color: 'from-purple-600 to-pink-600',
    rank: 8,
    operation: 'video_crop',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm', '.mkv', '.avi'],
    outputFormats: ['.mp4'],
    defaultParameters: {
      aspect_ratio: '9:16',
      anchor: 'center',
      sharpen: true,
      x: 0,
      y: 0,
      width: 1080,
      height: 1920
    },
    parameters: [
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio Preset',
        type: 'select',
        default: '9:16',
        options: [
          { label: '📱 9:16 Vertical (TikTok, Reels, Shorts)', value: '9:16' },
          { label: '🟦 1:1 Square (Instagram Grid)', value: '1:1' },
          { label: '🖼️ 4:5 Portrait (Instagram Feed)', value: '4:5' },
          { label: '🖥️ 16:9 Landscape (YouTube, TV)', value: '16:9' },
          { label: '🎬 21:9 Ultrawide Cinema', value: '21:9' },
          { label: '⚙️ Custom Geometry (X, Y, W, H)', value: 'custom' }
        ]
      },
      {
        name: 'anchor',
        label: 'Framing Anchor Position',
        type: 'select',
        default: 'center',
        options: [
          { label: '🎯 Dead Center Framing', value: 'center' },
          { label: '↖️ Top-Left Corner Anchor', value: 'top_left' },
          { label: '↘️ Bottom-Right Corner Anchor', value: 'bottom_right' }
        ]
      },
      {
        name: 'sharpen',
        label: 'Lanczos Sinc Edge Sharpening',
        type: 'boolean',
        default: true,
        description: 'Applies unsharp mask to prevent edge softness on cropped footage'
      }
    ],
    keywords: ['crop video', 'crop 9:16', 'tiktok video crop', 'reels video crop', 'video aspect ratio', 'pan and scan', 'custom crop'],
    examples: ['crop video to 9:16', 'square video crop', 'crop 4:5']
  },
  {
    id: 'video_rotate',
    name: 'Orientation, 3D Horizon & Mirror Studio',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Fix upside-down smartphone recordings with 0-sec lossless metadata flags, rotate 90°/180°/270°, or apply horizontal/vertical mirror reflection.',
    iconName: 'RotateCw',
    color: 'from-blue-500 to-cyan-600',
    rank: 9,
    operation: 'video_rotate',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm', '.mkv'],
    outputFormats: ['.mp4'],
    defaultParameters: { degrees: 90, flip_h: false, flip_v: false, lossless_metadata: false },
    parameters: [
      {
        name: 'degrees',
        label: 'Rotation Degrees',
        type: 'select',
        default: 90,
        options: [
          { label: '90° Clockwise (Turn Right)', value: 90 },
          { label: '180° Invert (Upside Down)', value: 180 },
          { label: '270° Counter-Clockwise (Turn Left)', value: 270 }
        ]
      },
      {
        name: 'flip_h',
        label: 'Horizontal Mirror (Selfie Reflection)',
        type: 'boolean',
        default: false,
        description: 'Mirrors video left-to-right (useful for fixing inverted front camera selfies)'
      },
      {
        name: 'flip_v',
        label: 'Vertical Flip',
        type: 'boolean',
        default: false,
        description: 'Flips video upside-down vertically'
      },
      {
        name: 'lossless_metadata',
        label: 'Lossless 0-Sec Metadata Tag Fix',
        type: 'boolean',
        default: false,
        description: 'Updates orientation tag without re-encoding video frames (instant, zero quality loss)'
      }
    ],
    keywords: ['rotate video', 'turn video', 'fix sideways video', 'flip video', 'mirror video', 'lossless rotation'],
    examples: ['rotate video 90 degrees', 'mirror video horizontally']
  },
  {
    id: 'video_speed',
    name: 'Motion Velocity & Time Warp Studio',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Audio & Speed',
    description: 'Cinematic slow-motion (0.25x-0.75x) with frame blending or high-speed timelapses (1.5x-8.0x) with natural voice pitch tone.',
    iconName: 'FastForward',
    color: 'from-amber-500 to-yellow-600',
    rank: 10,
    operation: 'video_change_speed',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm', '.mkv', '.avi'],
    outputFormats: ['.mp4'],
    defaultParameters: {
      speed: 1.5,
      preserve_pitch: true,
      motion_blur_smooth: true,
      mute_audio: false
    },
    parameters: [
      {
        name: 'speed',
        label: 'Motion Speed Multiplier',
        type: 'select',
        default: 1.5,
        options: [
          { label: '0.25x (Ultra Slo-Mo)', value: 0.25 },
          { label: '0.5x (Half-Speed Cinematic)', value: 0.5 },
          { label: '0.75x (Subtle Slow)', value: 0.75 },
          { label: '1.0x (Standard Speed)', value: 1.0 },
          { label: '1.25x (Snappy Pace)', value: 1.25 },
          { label: '1.5x (Fast Speech / Podcast)', value: 1.5 },
          { label: '2.0x (Double Speed Recap)', value: 2.0 },
          { label: '4.0x (Hyper Timelapse)', value: 4.0 },
          { label: '8.0x (Extreme Fast-Forward)', value: 8.0 }
        ]
      },
      {
        name: 'preserve_pitch',
        label: 'Natural Voice Pitch (atempo)',
        type: 'boolean',
        default: true,
        description: 'Maintains normal human vocal pitch without chipmunk or demon distortion'
      },
      {
        name: 'motion_blur_smooth',
        label: 'Optical Flow Frame Blending',
        type: 'boolean',
        default: true,
        description: 'Blends adjacent frames for silky-smooth slow motion playback'
      },
      {
        name: 'mute_audio',
        label: 'Mute Audio in Timelapse',
        type: 'boolean',
        default: false,
        description: 'Removes chaotic high-speed sound for clean fast-forward clips'
      }
    ],
    keywords: ['video speed', 'slow motion video', 'fast video', 'speed up video', 'timelapse', 'hyperlapse', 'velocity warp'],
    examples: ['speed up video', 'slow motion video', 'make timelapse']
  },
  {
    id: 'video_concat',
    name: 'Multi-Clip Stitcher & Timeline Joiner',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Combine and stitch multiple video clips seamlessly with auto-conforming multi-resolution scaling (1080p, 720p, 4K) or zero-loss stream copy remuxing.',
    iconName: 'GitMerge',
    color: 'from-indigo-600 to-purple-700',
    rank: 11,
    operation: 'video_concat',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov', '.ts'],
    outputFormats: ['.mp4'],
    acceptsMultipleFiles: true,
    defaultParameters: { stream_copy: true, resolution: '1080p' },
    parameters: [
      {
        name: 'stream_copy',
        label: 'Zero-Loss Stream Copy (Fast Remux)',
        type: 'boolean',
        default: true,
        description: 'Instant joining without re-encoding (requires identical codecs and resolutions)'
      },
      {
        name: 'resolution',
        label: 'Conforming Target Resolution',
        type: 'select',
        default: '1080p',
        options: [
          { label: 'Full HD 1080p (1920x1080 Standard)', value: '1080p' },
          { label: 'HD 720p (1280x720 Fast)', value: '720p' },
          { label: '4K Ultra HD (3840x2160 Master)', value: '4k' }
        ]
      }
    ],
    keywords: ['merge video', 'combine video', 'concat video', 'join video clips', 'stitch videos', 'video joiner'],
    examples: ['merge videos', 'combine video clips', 'stitch clips together']
  },
  {
    id: 'video_reverse',
    name: 'Rewind & Boomerang FX Studio',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Create viral bi-directional Boomerang clips (forward then backward) or full video rewind with synchronized reverse audio and velocity scaling.',
    iconName: 'RotateCcw',
    color: 'from-teal-600 to-emerald-700',
    rank: 12,
    operation: 'video_reverse',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm', '.mkv'],
    outputFormats: ['.mp4'],
    defaultParameters: { boomerang: true, reverse_audio: true, speed: 1.0 },
    parameters: [
      {
        name: 'boomerang',
        label: 'Bi-Directional Boomerang Mode',
        type: 'boolean',
        default: true,
        description: 'Plays clip forward then immediately plays backward in a seamless loop (Instagram/Snapchat style)'
      },
      {
        name: 'reverse_audio',
        label: 'Reverse Audio Soundtrack',
        type: 'boolean',
        default: true,
        description: 'Plays audio backward in sync with the video frames (uncheck to mute)'
      },
      {
        name: 'speed',
        label: 'Velocity & Speed Multiplier',
        type: 'select',
        default: 1.0,
        options: [
          { label: '0.5x (Dramatic Slow-Mo Rewind)', value: 0.5 },
          { label: '1.0x (Original Speed)', value: 1.0 },
          { label: '1.5x (Snappy Quick Rewind)', value: 1.5 },
          { label: '2.0x (Hyper Reverse Warp)', value: 2.0 }
        ]
      }
    ],
    keywords: ['reverse video', 'play video backwards', 'rewind video effect', 'boomerang maker', 'boomerang video'],
    examples: ['reverse video', 'make boomerang video']
  },
  {
    id: 'video_loop',
    name: 'Infinite Seamless Looper Studio',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Repeat and multiplex video clips seamlessly by target count (2x, 3x, 5x, 10x) with 0.1s stream copy passthrough.',
    iconName: 'Repeat',
    color: 'from-cyan-600 to-blue-700',
    rank: 13,
    operation: 'video_loop',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.webm', '.mov', '.mkv'],
    outputFormats: ['.mp4'],
    defaultParameters: { count: 3, stream_copy: true },
    parameters: [
      {
        name: 'count',
        label: 'Loop Repeat Multiplier',
        type: 'select',
        default: 3,
        options: [
          { label: '2x (Play Twice)', value: 2 },
          { label: '3x (Social Standard - Instagram/Reels)', value: 3 },
          { label: '5x (Extended Story Loop)', value: 5 },
          { label: '10x (Long Showcase Loop)', value: 10 }
        ]
      },
      {
        name: 'stream_copy',
        label: 'Zero-Loss Stream Copy (0.1s Fast Loop)',
        type: 'boolean',
        default: true,
        description: 'Uses stream multiplexing for instant generation without re-encoding quality loss'
      }
    ],
    keywords: ['loop video', 'repeat video', 'boomerang video maker', 'video loop', 'endless video loop'],
    examples: ['loop video 3 times', 'repeat video 5 times']
  },
  {
    id: 'gif_to_video',
    name: 'GIF to 60fps MP4 & Motion Upscaler',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Transcode',
    description: 'Convert animated GIFs into smooth MP4 videos with auto-pad duration looping (bypasses Instagram/TikTok <3s rejection) and 60fps motion.',
    iconName: 'FileVideo',
    color: 'from-violet-600 to-indigo-700',
    rank: 14,
    operation: 'gif_to_video',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.gif'],
    outputFormats: ['.mp4'],
    defaultParameters: { format: 'mp4', fps: 30, loop_count: 3, crf: 18 },
    parameters: [
      {
        name: 'loop_count',
        label: 'Duration Padder & Multi-Loop',
        type: 'select',
        default: 3,
        options: [
          { label: '3x Loops (Recommended for Instagram / TikTok / WhatsApp)', value: 3 },
          { label: '1x Loop (Original Single Playthrough)', value: 1 },
          { label: '2x Loops (Double Duration)', value: 2 },
          { label: '5x Loops (Extended Story Reel)', value: 5 }
        ]
      },
      {
        name: 'fps',
        label: 'Target Motion Frame Rate',
        type: 'select',
        default: 30,
        options: [
          { label: '30 fps (Web & Social Standard)', value: 30 },
          { label: '60 fps (Ultra Fluid Motion)', value: 60 }
        ]
      },
      {
        name: 'crf',
        label: 'Quality Profile (CRF)',
        type: 'select',
        default: 18,
        options: [
          { label: 'CRF 18 (Visually Lossless Studio Master)', value: 18 },
          { label: 'CRF 23 (Balanced Standard)', value: 23 },
          { label: 'CRF 28 (Ultra Compact File Size)', value: 28 }
        ]
      }
    ],
    keywords: ['gif to video', 'gif to mp4', 'convert gif to video', 'turn gif into mp4', 'gif 60fps', 'pad gif duration'],
    examples: ['gif to mp4', 'gif to video', 'loop gif into video']
  },
  {
    id: 'video_adjust_volume',
    name: 'Studio Volume & Gain Equalizer',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Audio & Speed',
    description: 'Boost quiet speech dialogue up to 300% or attenuate loudness with an anti-clip soft limiter and dynamic speech compressor, leaving video stream untouched.',
    iconName: 'Volume2',
    color: 'from-amber-600 to-red-600',
    rank: 15,
    operation: 'video_adjust_volume',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov', '.ts'],
    outputFormats: ['.mp4'],
    defaultParameters: { volume: '150%', anti_clip: true, dialogue_boost: false },
    parameters: [
      {
        name: 'volume',
        label: 'Volume Multiplier',
        type: 'select',
        default: '150%',
        options: [
          { label: 'Boost +50% (150% Volume - Moderate Speech Lift)', value: '150%' },
          { label: 'Double Volume (200% Volume - Quiet Recordings)', value: '200%' },
          { label: 'Triple Volume (300% Volume - Maximum Amplification)', value: '300%' },
          { label: 'Reduce -25% (75% Volume - Lower Background)', value: '75%' },
          { label: 'Half Volume (50% Volume - Background Muffle)', value: '50%' }
        ]
      },
      {
        name: 'anti_clip',
        label: 'Anti-Clip Soft Limiter Guard',
        type: 'boolean',
        default: true,
        description: 'Prevents digital distortion and speaker crackle at boosted peak amplitudes'
      },
      {
        name: 'dialogue_boost',
        label: 'Speech & Dialogue Dynamic Compressor',
        type: 'boolean',
        default: false,
        description: 'Brings quiet whispers forward without blowing out loud sound effects'
      }
    ],
    keywords: ['boost video volume', 'increase video sound', 'make video louder', 'video volume', 'dialogue booster', 'audio limiter'],
    examples: ['boost video sound', 'make video louder', 'increase dialogue clarity']
  },
  {
    id: 'video_change_fps',
    name: 'Cinema Frame Rate & Cadence Studio',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Transcode',
    description: 'Conform video frame rate to cinematic 24p, broadcast PAL 25p, web 30p, or high-frame-rate 60p/120p with frame blending and pitch-stable audio.',
    iconName: 'Clock',
    color: 'from-slate-600 to-zinc-700',
    rank: 16,
    operation: 'video_change_fps',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm', '.mkv', '.ts'],
    outputFormats: ['.mp4'],
    defaultParameters: { fps: 30 },
    parameters: [
      {
        name: 'fps',
        label: 'Target Motion Cadence (FPS)',
        type: 'select',
        default: 30,
        options: [
          { label: '24 FPS (Hollywood Film Cinematic Cadence)', value: 24 },
          { label: '25 FPS (European PAL Standard)', value: 25 },
          { label: '30 FPS (Web & Social Standard)', value: 30 },
          { label: '60 FPS (Ultra Smooth Action & Gaming)', value: 60 },
          { label: '120 FPS (High Frame Rate / Slo-Mo Prep)', value: 120 }
        ]
      }
    ],
    keywords: ['change video fps', 'convert frame rate', 'video to 60fps', 'video to 24fps', 'cinematic 24p', 'frame rate converter'],
    examples: ['convert video to 60fps', 'convert video to 24fps cinema']
  },
  {
    id: 'video_thumbnail',
    name: 'Hero Frame & Cinema Storyboard',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Extract true 4K native sensor frames, burst sequences, or cinema storyboard proof sheets with timecodes.',
    iconName: 'Camera',
    color: 'from-rose-500 to-pink-600',
    rank: 17,
    operation: 'extract_frame',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.ts'],
    outputFormats: ['.png', '.jpg', '.webp'],
    defaultParameters: { mode: 'single', time: '00:00:01', grid_layout: '3x3', format: 'png', sharpen: true },
    parameters: [
      {
        name: 'mode',
        label: 'Extraction Studio Mode',
        type: 'select',
        default: 'single',
        options: [
          { label: '📸 Precision Native Frame Grabber (Full 4K/1080p)', value: 'single' },
          { label: '🎬 Cinema Storyboard Proof Sheet (Visual Grid with Timecodes)', value: 'storyboard' },
          { label: '⚡ Burst Frame Sequence (ZIP of Numbered Frames)', value: 'burst' }
        ]
      },
      {
        name: 'grid_layout',
        label: 'Storyboard Grid Layout',
        type: 'select',
        default: '3x3',
        options: [
          { label: '3 × 3 (9 Frames Across Video)', value: '3x3' },
          { label: '4 × 4 (16 Frames High Density)', value: '4x4' },
          { label: '5 × 3 (15 Frames Cinematic Panoramic)', value: '5x3' },
          { label: '2 × 3 (6 Frames Quick Summary)', value: '2x3' }
        ]
      },
      {
        name: 'format',
        label: 'Image Format',
        type: 'select',
        default: 'png',
        options: [
          { label: 'PNG — Lossless 100% Master Quality', value: 'png' },
          { label: 'JPEG — High Quality (95% Compression)', value: 'jpg' },
          { label: 'WebP — Ultra-Compact Modern Format', value: 'webp' }
        ]
      },
      {
        name: 'time',
        label: 'Hero Frame Timestamp (HH:MM:SS)',
        type: 'text',
        default: '00:00:01',
        placeholder: '00:00:01'
      },
      {
        name: 'sharpen',
        label: 'Unsharp Contrast Enhancer',
        type: 'boolean',
        default: true
      }
    ],
    keywords: ['video thumbnail', 'extract video frame', 'video cover picture', 'snapshot video', 'storyboard', 'contact sheet'],
    examples: ['extract video thumbnail', 'generate video storyboard']
  },
  {
    id: 'video_watermark',
    name: 'Brand Stamp & Dynamic Lower-Third',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Protect and brand your video content with custom typography, 9-point anchor alignment, opacity tuning, and backing pill badges.',
    iconName: 'Stamp',
    color: 'from-orange-600 to-amber-700',
    rank: 18,
    operation: 'video_watermark',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm', '.mkv'],
    outputFormats: ['.mp4'],
    defaultParameters: { text: '@UniversalFileStudio', position: 'bottom-right', opacity: 85, font_size: 36, box_bg: true },
    parameters: [
      {
        name: 'text',
        label: 'Watermark Brand Text',
        type: 'text',
        default: '@UniversalFileStudio',
        placeholder: 'Enter branding text or copyright'
      },
      {
        name: 'position',
        label: 'Grid Placement Anchor',
        type: 'select',
        default: 'bottom-right',
        options: [
          { label: 'Bottom Right Corner (Standard)', value: 'bottom-right' },
          { label: 'Bottom Left Corner', value: 'bottom-left' },
          { label: 'Top Right Corner', value: 'top-right' },
          { label: 'Top Left Corner', value: 'top-left' },
          { label: 'Dead Center (Maximum Piracy Guard)', value: 'center' }
        ]
      },
      {
        name: 'opacity',
        label: 'Watermark Opacity',
        type: 'select',
        default: 85,
        options: [
          { label: '85% Opacity (Standard Clear)', value: 85 },
          { label: '50% Opacity (Subtle Watermark)', value: 50 },
          { label: '25% Opacity (Ghost Protection)', value: 25 },
          { label: '100% Opacity (Solid Branding)', value: 100 }
        ]
      },
      {
        name: 'font_size',
        label: 'Typography Scale',
        type: 'select',
        default: 36,
        options: [
          { label: '24px (Small Subtle)', value: 24 },
          { label: '36px (Standard Balanced)', value: 36 },
          { label: '48px (Large Prominent)', value: 48 },
          { label: '64px (Jumbo Headline)', value: 64 }
        ]
      },
      {
        name: 'box_bg',
        label: 'Contrast Backing Box',
        type: 'boolean',
        default: true,
        description: 'Renders a semi-transparent black pill behind the text for readability on bright scenes'
      }
    ],
    keywords: ['watermark video', 'stamp video', 'logo on video', 'video copyright', 'brand video', 'video text overlay'],
    examples: ['watermark video', 'stamp copyright on video']
  },
  {
    id: 'video_stabilize',
    name: 'Gimbal Shaky Cam Stabilizer',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Eliminate handheld camera wobble, micro-jitters, and walking vibrations using hardware-accelerated motion vector compensation.',
    iconName: 'Shield',
    color: 'from-emerald-600 to-teal-700',
    rank: 19,
    operation: 'video_stabilize',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm', '.mkv'],
    outputFormats: ['.mp4'],
    defaultParameters: {},
    parameters: [],
    keywords: ['stabilize video', 'fix shaky video', 'smooth video', 'remove video jitter', 'gimbal video', 'deshake video'],
    examples: ['stabilize shaky video', 'smooth handheld footage']
  },
  {
    id: 'video_burn_subtitles',
    name: 'Cinema Caption & Subtitle Hardcoder',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Audio & Speed',
    description: 'Burn SRT, VTT, and ASS subtitles permanently into video frames with cinema typography, high-contrast outlines, and lossless audio retention.',
    iconName: 'Captions',
    color: 'from-blue-600 to-indigo-700',
    rank: 20,
    operation: 'video_burn_subtitles',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    acceptsMultipleFiles: true,
    inputFormats: ['.mp4', '.mkv', '.mov', '.webm', '.srt', '.vtt', '.ass'],
    outputFormats: ['.mp4'],
    defaultParameters: { font_size: 22, primary_color: '&H00FFFFFF' },
    parameters: [
      {
        name: 'font_size',
        label: 'Subtitle Typography Size',
        type: 'select',
        default: 22,
        options: [
          { label: '18px (Compact Mobile)', value: 18 },
          { label: '22px (Standard Cinema)', value: 22 },
          { label: '28px (Large Prominent)', value: 28 },
          { label: '34px (High-Visibility Jumbo)', value: 34 }
        ]
      },
      {
        name: 'primary_color',
        label: 'Caption Color Palette',
        type: 'select',
        default: '&H00FFFFFF',
        options: [
          { label: 'Crisp Cinema White (&H00FFFFFF)', value: '&H00FFFFFF' },
          { label: 'Classic Film Yellow (&H0000FFFF)', value: '&H0000FFFF' }
        ]
      }
    ],
    keywords: ['burn subtitles', 'hardcode subtitles', 'embed srt to video', 'add subtitles', 'subtitle hardcoder', 'caption video'],
    examples: ['burn subtitles onto video', 'hardcode srt captions']
  },
  {
    id: 'video_add_audio',
    name: 'Dual Audio Mixer & Dubbing Studio',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Audio & Speed',
    description: 'Mix background music, dubbing, or voiceovers with original video audio featuring smart ducking, volume balance, and auto-looping.',
    iconName: 'Music2',
    color: 'from-pink-600 to-rose-700',
    rank: 21,
    operation: 'video_add_audio',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    acceptsMultipleFiles: true,
    inputFormats: ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg'],
    outputFormats: ['.mp4'],
    defaultParameters: {
      video_volume: 100,
      audio_volume: 50,
      loop_audio: true,
      ducking: false,
      fade_out: true
    },
    parameters: [
      {
        name: 'video_volume',
        label: 'Original Video Audio Volume (%)',
        type: 'number',
        default: 100,
        description: '0% mutes original sound, 100% normal, 150% amplified'
      },
      {
        name: 'audio_volume',
        label: 'Added BGM / Music Track Volume (%)',
        type: 'number',
        default: 50,
        description: 'Relative volume level of the added audio track'
      },
      {
        name: 'ducking',
        label: 'Auto Audio Ducking (Sidechain)',
        type: 'boolean',
        default: false,
        description: 'Automatically lowers background music when video dialogue/speech is detected'
      },
      {
        name: 'loop_audio',
        label: 'Seamless BGM Audio Loop',
        type: 'boolean',
        default: true,
        description: 'Repeats background music seamlessly if video duration exceeds audio track'
      },
      {
        name: 'fade_out',
        label: 'Smooth Outro Fade-Out',
        type: 'boolean',
        default: true,
        description: 'Applies gentle 2-second audio fade-out at the end of the video'
      }
    ],
    keywords: ['add audio to video', 'add music to video', 'dub video', 'background music video', 'audio mixer', 'bgm overlay', 'sidechain ducking'],
    examples: ['add music to video', 'mix bgm with video']
  }
];

