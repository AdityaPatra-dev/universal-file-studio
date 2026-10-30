import { StudioTool } from './types';

export const AUDIO_TOOLS: StudioTool[] = [
  // ==================== 🔥 TOP 5 MOST USED (PINNED AT TOP) ====================
  {
    id: 'audio_convert',
    name: 'Universal Audio Converter',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Transcode',
    description: 'Convert between MP3, WAV, AAC, FLAC, OGG, M4A, and Opus audio formats.',
    iconName: 'Music',
    color: 'from-amber-500 to-orange-600',
    badge: 'popular',
    rank: 1,
    isPinnedTop: true,
    operation: 'audio_convert',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma', '.opus'],
    outputFormats: ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'],
    defaultParameters: { format: 'mp3', bitrate: 192 },
    parameters: [
      {
        name: 'format',
        label: 'Target Audio Format',
        type: 'select',
        default: 'mp3',
        options: [
          { label: 'MP3 (.MP3) — Universal standard', value: 'mp3' },
          { label: 'WAV (.WAV) — Uncompressed lossless', value: 'wav' },
          { label: 'AAC (.M4A) — High fidelity Apple', value: 'm4a' },
          { label: 'FLAC (.FLAC) — Studio lossless audio', value: 'flac' },
          { label: 'OGG (.OGG) — Open source Vorbis', value: 'ogg' }
        ]
      },
      {
        name: 'bitrate',
        label: 'Audio Bitrate',
        type: 'select',
        default: 192,
        options: [
          { label: '96 kbps (Voice Memos)', value: 96 },
          { label: '128 kbps (Standard Quality)', value: 128 },
          { label: '192 kbps (High Fidelity)', value: 192 },
          { label: '320 kbps (Maximum MP3 Quality)', value: 320 }
        ]
      }
    ],
    keywords: ['audio convert', 'convert audio', 'mp3 to wav', 'wav to mp3', 'm4a to mp3', 'flac to mp3'],
    examples: ['wav to mp3', 'm4a to mp3', 'convert audio']
  },
  {
    id: 'audio_trim',
    name: 'Cut & Trim Audio Clip (Ringtone Maker)',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Edit & Trim',
    description: 'Snip audio tracks, songs, or voice notes to extract exact ringtones or sound bites.',
    iconName: 'Scissors',
    color: 'from-rose-500 to-pink-600',
    badge: 'popular',
    rank: 2,
    isPinnedTop: true,
    operation: 'audio_trim',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav', '.m4a', '.aac', '.flac'],
    outputFormats: ['.mp3', '.wav', '.m4a'],
    defaultParameters: { start: '00:00:00', end: '00:00:30' },
    parameters: [
      {
        name: 'start',
        label: 'Start Time (HH:MM:SS)',
        type: 'text',
        default: '00:00:00',
        placeholder: '00:00:00'
      },
      {
        name: 'end',
        label: 'End Time (HH:MM:SS)',
        type: 'text',
        default: '00:00:30',
        placeholder: '00:00:30'
      }
    ],
    keywords: ['cut audio', 'trim audio', 'make ringtone', 'shorten audio', 'snip audio clip'],
    examples: ['cut audio', 'make ringtone 30s']
  },
  {
    id: 'audio_compress',
    name: 'Compress Audio File Size',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Transcode',
    description: 'Reduce audio file size by optimizing bitrate for voice recordings and podcast uploads.',
    iconName: 'Minimize2',
    color: 'from-blue-500 to-cyan-600',
    badge: 'essential',
    rank: 3,
    isPinnedTop: true,
    operation: 'audio_compress',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav', '.flac', '.m4a'],
    outputFormats: ['.mp3'],
    defaultParameters: { bitrate: '96' },
    parameters: [
      {
        name: 'bitrate',
        label: 'Target Bitrate',
        type: 'select',
        default: '96',
        options: [
          { label: '64 kbps (Maximum reduction for speech)', value: '64' },
          { label: '96 kbps (Recommended for podcasts)', value: '96' },
          { label: '128 kbps (Balanced music & voice)', value: '128' }
        ]
      }
    ],
    keywords: ['compress audio', 'shrink audio', 'reduce mp3 size', 'small audio file'],
    examples: ['compress audio', 'reduce mp3 size']
  },
  {
    id: 'audio_normalize',
    name: 'Normalize Loudness (EBU R128)',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Enhance',
    description: 'Broadcast-standard volume leveling to eliminate volume spikes and quiet sections.',
    iconName: 'Sliders',
    color: 'from-emerald-500 to-teal-600',
    badge: 'top',
    rank: 4,
    isPinnedTop: true,
    operation: 'audio_normalize',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav', '.m4a', '.flac'],
    outputFormats: ['.mp3'],
    defaultParameters: {},
    parameters: [],
    keywords: ['normalize audio', 'level volume', 'ebu r128', 'balance audio sound', 'audio normalizer'],
    examples: ['normalize audio volume']
  },
  {
    id: 'audio_boost_volume',
    name: 'Amplify & Boost Audio Volume',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Enhance',
    description: 'Boost quiet voice recordings and low-volume audio up to 200% or 300%.',
    iconName: 'Volume2',
    color: 'from-amber-600 to-red-600',
    badge: 'top',
    rank: 5,
    isPinnedTop: true,
    operation: 'audio_convert',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav', '.m4a'],
    outputFormats: ['.mp3'],
    defaultParameters: { volume: '150%' },
    parameters: [
      {
        name: 'volume',
        label: 'Volume Boost Level',
        type: 'select',
        default: '150%',
        options: [
          { label: 'Boost +50% (150% volume)', value: '150%' },
          { label: 'Double Loudness (+100% / 200% volume)', value: '200%' },
          { label: 'Maximum Boost (+200% / 300% volume)', value: '300%' }
        ]
      }
    ],
    keywords: ['boost audio volume', 'amplify audio', 'make audio louder', 'increase mp3 sound'],
    examples: ['boost audio volume', 'make audio louder']
  },

  // ==================== 🎵 EXTENDED AUDIO TOOLS (TOOLS 6 - 15) ====================
  {
    id: 'audio_speed',
    name: 'Change Audio Speed & Tempo',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Enhance',
    description: 'Speed up study lectures (1.25x, 1.5x, 2x) or slow down speech with pitch correction.',
    iconName: 'FastForward',
    color: 'from-purple-500 to-indigo-600',
    rank: 6,
    operation: 'audio_change_speed',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav', '.m4a'],
    outputFormats: ['.mp3'],
    defaultParameters: { speed: 1.5 },
    parameters: [
      {
        name: 'speed',
        label: 'Playback Speed',
        type: 'select',
        default: 1.5,
        options: [
          { label: '0.75x (Slower)', value: 0.75 },
          { label: '1.25x (Fast Listening)', value: 1.25 },
          { label: '1.5x (Lecture Speedup)', value: 1.5 },
          { label: '2.0x (Double Speed)', value: 2.0 }
        ]
      }
    ],
    keywords: ['audio speed', 'speed up audio', 'slow down audio', 'tempo change', 'listen faster'],
    examples: ['speed up audio to 1.5x']
  },
  {
    id: 'audio_merge',
    name: 'Merge & Join Audio Tracks',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Edit & Trim',
    description: 'Combine multiple audio tracks or voice clips into a single continuous track.',
    iconName: 'GitMerge',
    color: 'from-teal-600 to-emerald-700',
    rank: 7,
    operation: 'audio_merge',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav', '.m4a'],
    outputFormats: ['.mp3'],
    acceptsMultipleFiles: true,
    defaultParameters: {},
    parameters: [],
    keywords: ['merge audio', 'combine audio', 'join mp3 files', 'concat audio'],
    examples: ['merge audio files', 'join mp3s']
  },
  {
    id: 'audio_fade',
    name: 'Add Audio Fade In & Fade Out',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Edit & Trim',
    description: 'Apply smooth audio transitions at the beginning and end of a track.',
    iconName: 'TrendingUp',
    color: 'from-cyan-600 to-blue-700',
    rank: 8,
    operation: 'audio_convert',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav', '.m4a'],
    outputFormats: ['.mp3'],
    defaultParameters: { fade_in: 3, fade_out: 3 },
    parameters: [
      {
        name: 'fade_in',
        label: 'Fade In Duration (Seconds)',
        type: 'number',
        default: 3,
        min: 1,
        max: 10
      },
      {
        name: 'fade_out',
        label: 'Fade Out Duration (Seconds)',
        type: 'number',
        default: 3,
        min: 1,
        max: 10
      }
    ],
    keywords: ['fade in audio', 'fade out audio', 'smooth audio transition', 'audio fader'],
    examples: ['add fade in and fade out']
  },
  {
    id: 'audio_reverse',
    name: 'Reverse Audio Track',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Edit & Trim',
    description: 'Play audio backwards from end to start for sound effects and creative design.',
    iconName: 'RotateCcw',
    color: 'from-rose-600 to-pink-700',
    rank: 9,
    operation: 'audio_reverse',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav'],
    outputFormats: ['.mp3'],
    defaultParameters: {},
    parameters: [],
    keywords: ['reverse audio', 'play audio backwards', 'backwards sound effect'],
    examples: ['reverse audio']
  },
  {
    id: 'audio_channel_convert',
    name: 'Stereo to Mono / Mono to Stereo',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Enhance',
    description: 'Downmix stereo into single-channel mono, or expand mono recordings to dual channels.',
    iconName: 'Radio',
    color: 'from-slate-600 to-zinc-700',
    rank: 10,
    operation: 'audio_convert',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav', '.m4a'],
    outputFormats: ['.mp3'],
    defaultParameters: { channels: 1 },
    parameters: [
      {
        name: 'channels',
        label: 'Channel Configuration',
        type: 'select',
        default: 1,
        options: [
          { label: 'Downmix to Mono (1 Channel)', value: 1 },
          { label: 'Convert to Stereo (2 Channels)', value: 2 }
        ]
      }
    ],
    keywords: ['stereo to mono', 'mono to stereo', 'audio channels', 'downmix audio'],
    examples: ['convert stereo to mono']
  },
  {
    id: 'audio_resample',
    name: 'Change Audio Sample Rate',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Enhance',
    description: 'Resample audio between 44.1 kHz (CD Audio), 48 kHz (Video Standard), or 96 kHz.',
    iconName: 'Activity',
    color: 'from-blue-600 to-indigo-700',
    rank: 11,
    operation: 'audio_convert',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav'],
    outputFormats: ['.wav', '.mp3'],
    defaultParameters: { sample_rate: 44100 },
    parameters: [
      {
        name: 'sample_rate',
        label: 'Sample Rate',
        type: 'select',
        default: 44100,
        options: [
          { label: '44.1 kHz (CD Audio Standard)', value: 44100 },
          { label: '48.0 kHz (Cinema / Video Standard)', value: 48000 },
          { label: '96.0 kHz (Hi-Res Audio)', value: 96000 }
        ]
      }
    ],
    keywords: ['audio sample rate', 'resample audio', '44.1khz to 48khz', 'change audio frequency'],
    examples: ['resample audio to 48khz']
  },
  {
    id: 'audio_remove_silence',
    name: 'Remove Dead Air & Silence',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Enhance',
    description: 'Automatically detect and snip prolonged silent pauses from podcasts and voice lectures.',
    iconName: 'VolumeX',
    color: 'from-emerald-600 to-teal-700',
    rank: 12,
    operation: 'audio_convert',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav', '.m4a'],
    outputFormats: ['.mp3'],
    defaultParameters: {},
    parameters: [],
    keywords: ['remove silence from audio', 'strip dead air', 'snip audio pauses', 'podcast silencer'],
    examples: ['remove dead air from audio']
  },
  {
    id: 'audio_invert',
    name: 'Invert Audio Phase',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Enhance',
    description: 'Invert audio waveform phase 180° to eliminate noise or cancel out background vocals.',
    iconName: 'Disc',
    color: 'from-indigo-600 to-violet-700',
    rank: 13,
    operation: 'audio_convert',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav'],
    outputFormats: ['.mp3'],
    defaultParameters: {},
    parameters: [],
    keywords: ['invert audio phase', 'vocal remover phase', 'audio phase cancellation'],
    examples: ['invert audio phase']
  },
  {
    id: 'audio_split_equal',
    name: 'Split Audio into Equal Parts',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Edit & Trim',
    description: 'Slice long audiobooks, concerts, or meetings into equal 5-minute or 10-minute segments.',
    iconName: 'Clock',
    color: 'from-amber-600 to-yellow-700',
    rank: 14,
    operation: 'audio_convert',
    backendEngine: 'ffmpeg',
    mobileEngine: 'server-fallback',
    inputFormats: ['.mp3', '.wav', '.m4a'],
    outputFormats: ['.mp3'],
    defaultParameters: { segment_time: 300 },
    parameters: [
      {
        name: 'segment_time',
        label: 'Segment Duration',
        type: 'select',
        default: 300,
        options: [
          { label: '5 Minutes per chunk', value: 300 },
          { label: '10 Minutes per chunk', value: 600 },
          { label: '15 Minutes per chunk', value: 900 }
        ]
      }
    ],
    keywords: ['split audio in parts', 'divide audio into chunks', 'slice audio by minutes'],
    examples: ['split audio every 5 minutes']
  },
  {
    id: 'audio_record',
    name: 'Local Voice & Microphone Recorder',
    category: 'audio',
    categoryLabel: 'Audio Studio',
    subCategory: 'Edit & Trim',
    description: 'Capture voice notes or microphone input directly into a private local MP3 or WAV file.',
    iconName: 'Mic',
    color: 'from-red-600 to-rose-700',
    rank: 15,
    operation: 'audio_convert',
    backendEngine: 'ffmpeg',
    mobileEngine: 'canvas',
    inputFormats: ['.wav'],
    outputFormats: ['.mp3', '.wav'],
    defaultParameters: {},
    parameters: [],
    keywords: ['record voice', 'microphone recording', 'voice memo recorder', 'audio recorder'],
    examples: ['record voice note']
  }
];

