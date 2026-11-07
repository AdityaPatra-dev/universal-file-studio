import { StudioTool } from './types';

export const VIDEO_TOOLS: StudioTool[] = [
  // ==================== 🔥 TOP 7 MOST USED (PINNED AT TOP) ====================
  {
    id: 'video_convert',
    name: 'Universal Video Converter',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Transcode',
    description: 'Convert video format between MP4, WebM, MKV, MOV, AVI, and FLV with hardware speed.',
    iconName: 'Film',
    color: 'from-indigo-500 to-violet-600',
    badge: 'popular',
    rank: 1,
    isPinnedTop: true,
    operation: 'video_convert',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.flv', '.ts', '.m4v'],
    outputFormats: ['.mp4', '.webm', '.mkv', '.mov', '.avi'],
    defaultParameters: { format: 'mp4', crf: 23 },
    parameters: [
      {
        name: 'format',
        label: 'Target Container Format',
        type: 'select',
        default: 'mp4',
        options: [
          { label: 'MP4 (.MP4) — Universal Playback', value: 'mp4' },
          { label: 'WebM (.WEBM) — Web Optimized (VP9)', value: 'webm' },
          { label: 'Matroska (.MKV) — High Quality Stream', value: 'mkv' },
          { label: 'QuickTime (.MOV) — Apple Compatible', value: 'mov' },
          { label: 'AVI (.AVI) — Legacy Standard', value: 'avi' }
        ]
      },
      {
        name: 'resolution',
        label: 'Output Resolution',
        type: 'select',
        default: 'original',
        options: [
          { label: 'Keep Original Resolution', value: 'original' },
          { label: '1080p Full HD (1920x1080)', value: '1080p' },
          { label: '720p HD (1280x720)', value: '720p' },
          { label: '480p SD (854x480)', value: '480p' }
        ]
      }
    ],
    keywords: ['video convert', 'convert video', 'mp4 to mkv', 'mkv to mp4', 'mov to mp4', 'avi to mp4', 'webm to mp4'],
    examples: ['mp4 to mkv', 'mov to mp4', 'convert video']
  },
  {
    id: 'video_trim',
    name: 'Cut & Trim Video Clip',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Snip video between start and end timestamps without re-encoding quality loss.',
    iconName: 'Scissors',
    color: 'from-pink-500 to-rose-600',
    badge: 'popular',
    rank: 2,
    isPinnedTop: true,
    operation: 'video_trim',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov', '.avi'],
    outputFormats: ['.mp4', '.mkv', '.webm', '.mov'],
    defaultParameters: { start: '00:00:00', end: '00:00:30' },
    parameters: [
      {
        name: 'start',
        label: 'Start Timestamp (HH:MM:SS)',
        type: 'text',
        default: '00:00:00',
        placeholder: '00:00:00'
      },
      {
        name: 'end',
        label: 'End Timestamp (HH:MM:SS)',
        type: 'text',
        default: '00:00:30',
        placeholder: '00:01:00'
      }
    ],
    keywords: ['cut video', 'trim video', 'clip video', 'shorten video', 'snip video', 'video cutter'],
    examples: ['cut video', 'trim video']
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
    name: 'Extract Audio from Video',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Audio & Speed',
    description: 'Rip background music, speech, or soundtracks from video into an audio file.',
    iconName: 'Music',
    color: 'from-amber-500 to-orange-600',
    badge: 'popular',
    rank: 4,
    isPinnedTop: true,
    operation: 'extract_audio',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.flv'],
    outputFormats: ['.mp3', '.wav', '.m4a', '.aac', '.flac'],
    defaultParameters: { format: 'mp3', bitrate: 192 },
    parameters: [
      {
        name: 'format',
        label: 'Output Audio Format',
        type: 'select',
        default: 'mp3',
        options: [
          { label: 'MP3 (.MP3) — Universal Compatibility', value: 'mp3' },
          { label: 'WAV (.WAV) — Uncompressed Lossless', value: 'wav' },
          { label: 'AAC (.M4A) — High Quality Apple', value: 'm4a' },
          { label: 'FLAC (.FLAC) — Studio Lossless', value: 'flac' }
        ]
      },
      {
        name: 'bitrate',
        label: 'Audio Bitrate',
        type: 'select',
        default: 192,
        options: [
          { label: '128 kbps (Standard Voice)', value: 128 },
          { label: '192 kbps (High Quality Music)', value: 192 },
          { label: '320 kbps (Maximum Bitrate)', value: 320 }
        ]
      }
    ],
    keywords: ['extract audio', 'rip audio', 'mp4 to mp3', 'video to audio', 'save sound from video'],
    examples: ['extract audio', 'mp4 to mp3']
  },
  {
    id: 'video_to_gif',
    name: 'Video to Animated GIF',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Transcode',
    description: 'Convert any video clip into an animated GIF for memes, documentation, and chat.',
    iconName: 'Image',
    color: 'from-emerald-500 to-teal-600',
    badge: 'popular',
    rank: 5,
    isPinnedTop: true,
    operation: 'video_to_gif',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm', '.avi'],
    outputFormats: ['.gif'],
    defaultParameters: { format: 'gif', fps: 15, width: 480 },
    parameters: [
      {
        name: 'fps',
        label: 'Frame Rate',
        type: 'select',
        default: 15,
        options: [
          { label: '10 fps (Smallest file)', value: 10 },
          { label: '15 fps (Smooth animation)', value: 15 },
          { label: '24 fps (Cinema quality)', value: 24 }
        ]
      },
      {
        name: 'width',
        label: 'GIF Resolution Width',
        type: 'select',
        default: 480,
        options: [
          { label: '320px (Compact sticker)', value: 320 },
          { label: '480px (Standard GIF)', value: 480 },
          { label: '640px (High Res)', value: 640 }
        ]
      }
    ],
    keywords: ['video to gif', 'make gif from video', 'mp4 to gif', 'animated gif maker'],
    examples: ['video to gif', 'mp4 to gif']
  },
  {
    id: 'video_resize',
    name: 'Resize Video Resolution',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Scale video down to 1080p, 720p, or 480p with aspect ratio locking.',
    iconName: 'Maximize2',
    color: 'from-blue-600 to-indigo-700',
    badge: 'top',
    rank: 6,
    isPinnedTop: true,
    operation: 'video_resize',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov'],
    outputFormats: ['.mp4'],
    defaultParameters: { width: 1280, height: 720 },
    parameters: [
      {
        name: 'preset',
        label: 'Standard Resolution Preset',
        type: 'select',
        default: '720p',
        options: [
          { label: '1080p Full HD (1920x1080)', value: '1080p' },
          { label: '720p HD (1280x720)', value: '720p' },
          { label: '480p SD (854x480)', value: '480p' }
        ]
      }
    ],
    keywords: ['resize video', 'scale video', 'change video resolution', 'video downscale'],
    examples: ['resize video', 'scale to 720p']
  },
  {
    id: 'video_remove_audio',
    name: 'Mute / Remove Video Audio',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Audio & Speed',
    description: 'Remove all audio tracks and voice channels, leaving a silent video file.',
    iconName: 'VolumeX',
    color: 'from-slate-600 to-zinc-700',
    badge: 'top',
    rank: 7,
    isPinnedTop: true,
    operation: 'remove_audio',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov', '.avi'],
    outputFormats: ['.mp4'],
    defaultParameters: {},
    parameters: [],
    keywords: ['mute video', 'remove audio from video', 'silent video', 'strip sound from video'],
    examples: ['mute video', 'remove audio']
  },

  // ==================== 🎬 EXTENDED VIDEO TOOLS (TOOLS 8 - 21) ====================
  {
    id: 'video_crop',
    name: 'Crop Video for Social Media',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Crop video to vertical 9:16 (TikTok/Reels), 1:1 Square, or 16:9 Widescreen.',
    iconName: 'Crop',
    color: 'from-purple-600 to-pink-600',
    rank: 8,
    operation: 'video_crop',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm'],
    outputFormats: ['.mp4'],
    defaultParameters: { aspect_ratio: '9:16' },
    parameters: [
      {
        name: 'aspect_ratio',
        label: 'Social Aspect Ratio',
        type: 'select',
        default: '9:16',
        options: [
          { label: '📱 9:16 Vertical (TikTok, Reels, Shorts)', value: '9:16' },
          { label: '🟦 1:1 Square (Instagram Grid)', value: '1:1' },
          { label: '🖥️ 16:9 Widescreen (YouTube, TV)', value: '16:9' },
          { label: '🖼️ 4:5 Portrait (Instagram Feed)', value: '4:5' }
        ]
      }
    ],
    keywords: ['crop video', 'crop 9:16', 'tiktok video crop', 'reels video crop', 'video aspect ratio'],
    examples: ['crop video to 9:16', 'square video crop']
  },
  {
    id: 'video_rotate',
    name: 'Rotate & Flip Video',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Fix sideways or upside-down mobile phone video recordings (90°, 180°, 270°).',
    iconName: 'RotateCw',
    color: 'from-blue-500 to-cyan-600',
    rank: 9,
    operation: 'video_rotate',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm'],
    outputFormats: ['.mp4'],
    defaultParameters: { degrees: 90 },
    parameters: [
      {
        name: 'degrees',
        label: 'Rotation Degrees',
        type: 'select',
        default: 90,
        options: [
          { label: '90° Clockwise (Turn Right)', value: 90 },
          { label: '180° Flip (Upside Down)', value: 180 },
          { label: '270° Counter-Clockwise (Turn Left)', value: 270 }
        ]
      }
    ],
    keywords: ['rotate video', 'turn video', 'fix sideways video', 'flip video'],
    examples: ['rotate video 90 degrees']
  },
  {
    id: 'video_speed',
    name: 'Change Video Playback Speed',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Audio & Speed',
    description: 'Create dramatic slow-motion (0.5x) or fast timelapse (1.5x, 2x, 4x) videos.',
    iconName: 'FastForward',
    color: 'from-amber-500 to-yellow-600',
    rank: 10,
    operation: 'video_change_speed',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm'],
    outputFormats: ['.mp4'],
    defaultParameters: { speed: 1.5 },
    parameters: [
      {
        name: 'speed',
        label: 'Playback Speed Multiplier',
        type: 'select',
        default: 1.5,
        options: [
          { label: '0.5x (Slow Motion)', value: 0.5 },
          { label: '0.75x (Subtle Slow)', value: 0.75 },
          { label: '1.25x (Slight Speedup)', value: 1.25 },
          { label: '1.5x (Fast Motion)', value: 1.5 },
          { label: '2.0x (Double Speed Timelapse)', value: 2.0 }
        ]
      }
    ],
    keywords: ['video speed', 'slow motion video', 'fast video', 'speed up video', 'timelapse'],
    examples: ['speed up video', 'slow motion video']
  },
  {
    id: 'video_concat',
    name: 'Merge & Concat Videos',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Stitch multiple video clips together into a single continuous video file.',
    iconName: 'GitMerge',
    color: 'from-indigo-600 to-purple-700',
    rank: 11,
    operation: 'video_concat',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm'],
    outputFormats: ['.mp4'],
    acceptsMultipleFiles: true,
    defaultParameters: {},
    parameters: [],
    keywords: ['merge video', 'combine video', 'concat video', 'join video clips'],
    examples: ['merge videos', 'combine video clips']
  },
  {
    id: 'video_reverse',
    name: 'Reverse Video Playback',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Rewind video so it plays backwards from finish to start.',
    iconName: 'RotateCcw',
    color: 'from-teal-600 to-emerald-700',
    rank: 12,
    operation: 'video_reverse',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm'],
    outputFormats: ['.mp4'],
    defaultParameters: {},
    parameters: [],
    keywords: ['reverse video', 'play video backwards', 'rewind video effect'],
    examples: ['reverse video']
  },
  {
    id: 'video_loop',
    name: 'Video Loop Maker',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Repeat a video clip seamlessly 2x, 3x, or 5x times.',
    iconName: 'Repeat',
    color: 'from-cyan-600 to-blue-700',
    rank: 13,
    operation: 'video_loop',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.webm'],
    outputFormats: ['.mp4'],
    defaultParameters: { count: 3 },
    parameters: [
      {
        name: 'count',
        label: 'Loop Count',
        type: 'select',
        default: 3,
        options: [
          { label: 'Loop 2 times', value: 2 },
          { label: 'Loop 3 times', value: 3 },
          { label: 'Loop 5 times', value: 5 }
        ]
      }
    ],
    keywords: ['loop video', 'repeat video', 'boomerang video maker', 'video loop'],
    examples: ['loop video 3 times']
  },
  {
    id: 'gif_to_video',
    name: 'Animated GIF to Video (MP4)',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Transcode',
    description: 'Convert heavy animated GIFs into lightweight, fast-loading MP4 video files.',
    iconName: 'FileVideo',
    color: 'from-violet-600 to-indigo-700',
    rank: 14,
    operation: 'gif_to_video',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.gif'],
    outputFormats: ['.mp4'],
    defaultParameters: { format: 'mp4' },
    parameters: [],
    keywords: ['gif to video', 'gif to mp4', 'convert gif to video', 'turn gif into mp4'],
    examples: ['gif to mp4', 'gif to video']
  },
  {
    id: 'video_adjust_volume',
    name: 'Adjust / Boost Video Audio Volume',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Audio & Speed',
    description: 'Amplify quiet video dialogue up to 200% or lower loud background volume.',
    iconName: 'Volume2',
    color: 'from-amber-600 to-red-600',
    rank: 15,
    operation: 'video_adjust_volume',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mkv', '.webm', '.mov'],
    outputFormats: ['.mp4'],
    defaultParameters: { volume: '150%' },
    parameters: [
      {
        name: 'volume',
        label: 'Volume Multiplier',
        type: 'select',
        default: '150%',
        options: [
          { label: 'Boost +50% (150% volume)', value: '150%' },
          { label: 'Double Volume (200% volume)', value: '200%' },
          { label: 'Reduce -50% (50% volume)', value: '50%' }
        ]
      }
    ],
    keywords: ['boost video volume', 'increase video sound', 'make video louder', 'video volume'],
    examples: ['boost video sound', 'make video louder']
  },
  {
    id: 'video_change_fps',
    name: 'Change Video Frame Rate (FPS)',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Transcode',
    description: 'Convert video frame rate to cinematic 24fps, standard 30fps, or smooth 60fps.',
    iconName: 'Clock',
    color: 'from-slate-600 to-zinc-700',
    rank: 16,
    operation: 'video_change_fps',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov', '.webm'],
    outputFormats: ['.mp4'],
    defaultParameters: { fps: 30 },
    parameters: [
      {
        name: 'fps',
        label: 'Target Frame Rate',
        type: 'select',
        default: 30,
        options: [
          { label: '24 FPS (Cinematic standard)', value: 24 },
          { label: '30 FPS (Web & social standard)', value: 30 },
          { label: '60 FPS (Ultra smooth playback)', value: 60 }
        ]
      }
    ],
    keywords: ['change video fps', 'convert frame rate', 'video to 60fps', 'video to 24fps'],
    examples: ['convert video to 30fps']
  },
  {
    id: 'video_thumbnail',
    name: 'Extract Video Cover Thumbnail',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Capture a high-definition image frame at any timestamp to use as a cover picture.',
    iconName: 'Camera',
    color: 'from-rose-500 to-pink-600',
    rank: 17,
    operation: 'extract_frame',
    backendEngine: 'ffmpeg',
    mobileEngine: 'canvas',
    inputFormats: ['.mp4', '.mov', '.webm', '.mkv'],
    outputFormats: ['.jpg', '.png'],
    defaultParameters: { time: '00:00:01' },
    parameters: [
      {
        name: 'time',
        label: 'Timestamp to Capture',
        type: 'text',
        default: '00:00:01',
        placeholder: '00:00:01'
      }
    ],
    keywords: ['video thumbnail', 'extract video frame', 'video cover picture', 'snapshot video'],
    examples: ['extract video thumbnail']
  },
  {
    id: 'video_watermark',
    name: 'Watermark Video (Logo / Text)',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Stamp a copyright text mark or corner logo onto video.',
    iconName: 'Stamp',
    color: 'from-orange-600 to-amber-700',
    rank: 18,
    operation: 'video_watermark',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov'],
    outputFormats: ['.mp4'],
    defaultParameters: { text: 'CONFIDENTIAL' },
    parameters: [
      {
        name: 'text',
        label: 'Watermark Text',
        type: 'text',
        default: 'CONFIDENTIAL',
        placeholder: 'Enter watermark text'
      }
    ],
    keywords: ['watermark video', 'stamp video', 'logo on video', 'video copyright'],
    examples: ['watermark video']
  },
  {
    id: 'video_stabilize',
    name: 'Stabilize Shaky Video',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Edit & Trim',
    description: 'Smooth out hand-held camera jitter and shaky mobile footage.',
    iconName: 'Shield',
    color: 'from-emerald-600 to-teal-700',
    rank: 19,
    operation: 'video_stabilize',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    inputFormats: ['.mp4', '.mov'],
    outputFormats: ['.mp4'],
    defaultParameters: {},
    parameters: [],
    keywords: ['stabilize video', 'fix shaky video', 'smooth video', 'remove video jitter'],
    examples: ['stabilize shaky video']
  },
  {
    id: 'video_burn_subtitles',
    name: 'Burn / Hardcode Subtitles',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Audio & Speed',
    description: 'Hardcode SRT or VTT subtitle tracks directly into video pixels.',
    iconName: 'Captions',
    color: 'from-blue-600 to-indigo-700',
    rank: 20,
    operation: 'video_burn_subtitles',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    acceptsMultipleFiles: true,
    inputFormats: ['.mp4', '.mkv', '.mov', '.webm', '.srt', '.vtt', '.ass'],
    outputFormats: ['.mp4'],
    defaultParameters: {},
    parameters: [],
    keywords: ['burn subtitles', 'hardcode subtitles', 'embed srt to video', 'add subtitles'],
    examples: ['burn subtitles onto video']
  },
  {
    id: 'video_add_audio',
    name: 'Add Music / Audio to Video',
    category: 'video',
    categoryLabel: 'Video Studio',
    subCategory: 'Audio & Speed',
    description: 'Overlay background music or dub voiceover onto a silent or muted video.',
    iconName: 'Music2',
    color: 'from-pink-600 to-rose-700',
    rank: 21,
    operation: 'video_add_audio',
    backendEngine: 'ffmpeg',
    mobileEngine: 'ffmpeg',
    acceptsMultipleFiles: true,
    inputFormats: ['.mp4', '.mov', '.mkv', '.webm', '.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg'],
    outputFormats: ['.mp4'],
    defaultParameters: {},
    parameters: [],
    keywords: ['add audio to video', 'add music to video', 'dub video', 'background music video'],
    examples: ['add music to video']
  }
];

