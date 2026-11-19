import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Scissors, Crop, Minimize2, Volume2, VolumeX,
  RotateCw, FastForward, Clock, Image as ImageIcon,
  Check, Sliders, Type, FileText, Smartphone, Monitor,
  Square, Film, Music, Sparkles, RefreshCw, Layers
} from 'lucide-react';
import { FileRecord } from '../../types/api';
import { universalEngine } from '../../services/universalEngine';
import { formatBytes } from '../../utils/format';

interface VideoStudioWorkbenchProps {
  toolId: string;
  file: FileRecord;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  libraryFiles?: FileRecord[];
}

export const VideoStudioWorkbench: React.FC<VideoStudioWorkbenchProps> = ({
  toolId,
  file,
  parameters,
  onParametersChange,
  libraryFiles = [],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [capturedThumb, setCapturedThumb] = useState<string | null>(null);

  // Load preview URL for video
  useEffect(() => {
    let active = true;
    let createdUrl = '';

    const loadUrl = async () => {
      try {
        const url = await universalEngine.getFilePreviewUrl(file.id);
        if (active) {
          createdUrl = url;
          setVideoUrl(url);
        }
      } catch (err) {
        console.warn('Failed to load video preview URL:', err);
      }
    };

    loadUrl();

    return () => {
      active = false;
      if (createdUrl && createdUrl.startsWith('blob:')) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [file.id]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      const w = videoRef.current.videoWidth || 0;
      const h = videoRef.current.videoHeight || 0;
      setDuration(dur);
      setVideoDimensions({ width: w, height: h });

      // If trim tool and no end specified or end is 00:00:30, adjust default
      if (toolId === 'video_trim') {
        const currentEnd = parameters.end;
        if (!currentEnd || currentEnd === '00:00:30') {
          const defaultEndSec = Math.min(dur || 30, 30);
          updateParam('start', '00:00:00');
          updateParam('end', formatSecondsToTime(defaultEndSec));
          updateParam('lossless', true);
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);

      // Loop selection in trim mode if enabled
      if (toolId === 'video_trim' && parameters.loop_selection) {
        const startSec = parseTimeToSeconds(parameters.start || '00:00:00');
        const endSec = parseTimeToSeconds(parameters.end || formatSecondsToTime(duration || 30));
        if (videoRef.current.currentTime >= endSec || videoRef.current.currentTime < startSec) {
          videoRef.current.currentTime = startSec;
          videoRef.current.play().catch(() => {});
        }
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const seekTo = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, sec));
    }
  };

  const updateParam = (key: string, value: any) => {
    onParametersChange({
      ...parameters,
      [key]: value,
    });
  };

  const formatSecondsToTime = (totalSeconds: number): string => {
    const s = Math.max(0, totalSeconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    if (typeof timeStr === 'number') return timeStr;
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(timeStr) || 0;
  };

  const captureFrameAtCurrentTime = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedThumb(dataUrl);
      updateParam('timestamp', currentTime.toFixed(2));
      updateParam('time', currentTime.toFixed(2));
    }
  };

  // Trim times
  const startSec = parseTimeToSeconds(parameters.start || '00:00:00');
  const endSec = parseTimeToSeconds(parameters.end || formatSecondsToTime(duration || 30));
  const clipDuration = Math.max(0, endSec - startSec);

  // Audio files in library for video_add_audio
  const audioLibraryFiles = libraryFiles.filter(
    (f) => f.category === 'audio' || f.filename.match(/\.(mp3|wav|m4a|aac|flac|ogg)$/i)
  );

  return (
    <div className="space-y-4">
      {/* 1. PROFESSIONAL VIDEO MONITOR & PLAYER */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-surface-800 shadow-2xl">
        {/* Top Monitor Bar */}
        <div className="px-3.5 py-2 bg-surface-900/90 backdrop-blur-md border-b border-surface-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-200 truncate max-w-[200px]">{file.filename}</span>
            {videoDimensions.width > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-surface-800 text-[10px] text-brand-300 font-mono">
                {videoDimensions.width}×{videoDimensions.height}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-mono">
            <span>{formatSecondsToTime(currentTime)}</span>
            <span>/</span>
            <span>{formatSecondsToTime(duration)}</span>
          </div>
        </div>

        {/* Video Canvas Container with Interactive Overlays */}
        <div className="relative aspect-video max-h-[280px] sm:max-h-[320px] w-full flex items-center justify-center bg-black overflow-hidden group">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              muted={isMuted}
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
              style={{
                transform:
                  toolId === 'video_rotate'
                    ? `rotate(${parameters.degrees || 0}deg) scaleX(${parameters.flip_h ? -1 : 1})`
                    : 'none',
                transition: 'transform 0.25s ease',
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
              <Film className="h-8 w-8 animate-pulse text-slate-600" />
              <span>Loading video monitor...</span>
            </div>
          )}

          {/* Interactive Overlay: CROP GUIDES */}
          {toolId === 'video_crop' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="border-2 border-dashed border-brand-400 bg-brand-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] transition-all duration-200 relative flex items-center justify-center"
                style={{
                  aspectRatio:
                    parameters.aspect_ratio === '9:16' ? '9/16' :
                    parameters.aspect_ratio === '1:1' ? '1/1' :
                    parameters.aspect_ratio === '4:5' ? '4/5' :
                    parameters.aspect_ratio === '16:9' ? '16/9' : '9/16',
                  height: parameters.aspect_ratio === '16:9' ? '56%' : '88%',
                }}
              >
                {/* 3x3 Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-40">
                  <div className="border-r border-b border-brand-300" />
                  <div className="border-r border-b border-brand-300" />
                  <div className="border-b border-brand-300" />
                  <div className="border-r border-b border-brand-300" />
                  <div className="border-r border-b border-brand-300" />
                  <div className="border-b border-brand-300" />
                  <div className="border-r border-brand-300" />
                  <div className="border-r border-brand-300" />
                  <div />
                </div>
                <span className="px-2 py-0.5 rounded bg-brand-600 text-white font-bold text-[10px] shadow">
                  {parameters.aspect_ratio || '9:16'} Crop
                </span>
              </div>
            </div>
          )}

          {/* Interactive Overlay: WATERMARK PREVIEW */}
          {toolId === 'video_watermark' && (
            <div className="absolute inset-0 pointer-events-none p-4 flex">
              <div
                className={`transition-all duration-200 ${
                  parameters.position === 'top-left' ? 'self-start justify-self-start mr-auto mb-auto' :
                  parameters.position === 'top-right' ? 'self-start ml-auto mb-auto' :
                  parameters.position === 'bottom-left' ? 'self-end mr-auto mt-auto' :
                  parameters.position === 'center' ? 'm-auto' : 'self-end ml-auto mt-auto'
                }`}
                style={{ opacity: (parameters.opacity || 85) / 100 }}
              >
                <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-lg">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>{parameters.text || '@UniversalFileStudio'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Overlay: SUBTITLE PREVIEW */}
          {toolId === 'video_burn_subtitles' && (
            <div className="absolute inset-x-0 bottom-4 pointer-events-none flex justify-center px-4">
              <div className="px-3.5 py-1.5 rounded-lg bg-black/75 backdrop-blur-sm border border-white/10 text-white font-semibold text-xs text-center shadow-lg max-w-[85%]">
                {parameters.custom_text || 'Sample Caption: Crisp Hardcoded Subtitle Preview'}
              </div>
            </div>
          )}

          {/* Player Central Play / Pause Button Overlay */}
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 btn-press"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
        </div>

        {/* Video Scrubber Timeline */}
        <div className="p-3 bg-surface-900 border-t border-surface-800 space-y-2">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.05}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-200 transition"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 transition"
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <span className="text-[11px] text-slate-400 font-mono">
                {formatSecondsToTime(currentTime)}
              </span>
            </div>

            {/* Quick Seek Steppers */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => seekTo(currentTime - 1)}
                className="px-2 py-1 rounded bg-surface-800 hover:bg-surface-700 text-slate-300 font-mono"
              >
                -1s
              </button>
              <button
                type="button"
                onClick={() => seekTo(currentTime + 1)}
                className="px-2 py-1 rounded bg-surface-800 hover:bg-surface-700 text-slate-300 font-mono"
              >
                +1s
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BESPOKE APP WORKBENCHES TAILORED FOR EACH TOOL */}

      {/* A. VIDEO TRIMMER APP WORKBENCH */}
      {toolId === 'video_trim' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-brand-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-brand-400" />
              <span className="text-xs font-bold text-white">Precision Range Trimmer</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 font-mono font-bold text-xs">
              Selected Clip: {clipDuration.toFixed(1)}s
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'First 15s (Story)', start: 0, end: 15 },
              { label: 'First 30s (WhatsApp)', start: 0, end: 30 },
              { label: 'First 60s (Reels)', start: 0, end: 60 },
              { label: 'Last 30s', start: Math.max(0, duration - 30), end: duration },
              { label: 'Full Video', start: 0, end: duration },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  updateParam('start', formatSecondsToTime(preset.start));
                  updateParam('end', formatSecondsToTime(preset.end));
                  seekTo(preset.start);
                }}
                className="px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-[11px] font-semibold text-slate-300 transition"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Dual Markers Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold">Start Point</span>
                <button
                  type="button"
                  onClick={() => updateParam('start', formatSecondsToTime(currentTime))}
                  className="px-2 py-0.5 rounded bg-brand-600 hover:bg-brand-500 text-white font-bold text-[10px]"
                >
                  Set to Current ({formatSecondsToTime(currentTime)})
                </button>
              </div>
              <input
                type="text"
                value={parameters.start || '00:00:00'}
                onChange={(e) => updateParam('start', e.target.value)}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold">End Point</span>
                <button
                  type="button"
                  onClick={() => updateParam('end', formatSecondsToTime(currentTime))}
                  className="px-2 py-0.5 rounded bg-brand-600 hover:bg-brand-500 text-white font-bold text-[10px]"
                >
                  Set to Current ({formatSecondsToTime(currentTime)})
                </button>
              </div>
              <input
                type="text"
                value={parameters.end || formatSecondsToTime(duration || 30)}
                onChange={(e) => updateParam('end', e.target.value)}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Lossless Fast Cut vs Re-encode Toggle */}
          <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>⚡ Instant Lossless Cut (Zero Quality Loss)</span>
              </div>
              <div className="text-[11px] text-slate-400">Stream copy cut in 0.1s without re-encoding pixels</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={parameters.lossless !== false}
                onChange={(e) => updateParam('lossless', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600" />
            </label>
          </div>
        </div>
      )}

      {/* B. VIDEO CROPER APP WORKBENCH */}
      {toolId === 'video_crop' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crop className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">Social Aspect Ratio Cropper</span>
            </div>
            <span className="text-[11px] text-indigo-300 font-mono font-semibold">
              Target: {parameters.aspect_ratio || '9:16'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: '9:16', name: '9:16 Vertical', sub: 'Reels / TikTok / Shorts', icon: Smartphone },
              { id: '1:1', name: '1:1 Square', sub: 'Instagram Feed Post', icon: Square },
              { id: '4:5', name: '4:5 Portrait', sub: 'Social Portrait Post', icon: Smartphone },
              { id: '16:9', name: '16:9 Landscape', sub: 'YouTube / Cinema', icon: Monitor },
            ].map((ratio) => {
              const active = (parameters.aspect_ratio || '9:16') === ratio.id;
              const IconComp = ratio.icon;
              return (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => updateParam('aspect_ratio', ratio.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                    active
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <IconComp className={`h-4 w-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                    {active && <Check className="h-3 w-3 text-indigo-400" />}
                  </div>
                  <div className="text-xs font-bold">{ratio.name}</div>
                  <div className="text-[10px] text-slate-400">{ratio.sub}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* C. VIDEO COMPRESSOR APP WORKBENCH */}
      {toolId === 'video_compress' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Minimize2 className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">Target Compression Profiler</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs">
              Original: {formatBytes(file.size_bytes)}
            </span>
          </div>

          {/* Quick Target Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'discord', label: 'Discord / Slack', target: '< 25 MB', crf: 28 },
              { id: 'whatsapp', label: 'WhatsApp / Chat', target: '< 16 MB', crf: 30 },
              { id: 'email', label: 'Email Attachment', target: '< 10 MB', crf: 32 },
              { id: 'balanced', label: 'Balanced HD', target: '70% Smaller', crf: 26 },
            ].map((p) => {
              const active = (parameters.target_preset || 'balanced') === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    updateParam('target_preset', p.id);
                    updateParam('crf', p.crf);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    active
                      ? 'bg-cyan-600/20 border-cyan-500 text-white'
                      : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                  }`}
                >
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-[11px] text-cyan-400 font-mono font-semibold">{p.target}</div>
                </button>
              );
            })}
          </div>

          {/* Codec Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold">Video Codec</span>
              <select
                value={parameters.codec || 'libx264'}
                onChange={(e) => updateParam('codec', e.target.value)}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="libx264">H.264 (AVC) — Universal Phone & Web Compatibility</option>
                <option value="libx265">H.265 (HEVC) — 50% Higher Efficiency</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold">Resolution Downscaling</span>
              <select
                value={parameters.resolution || 'original'}
                onChange={(e) => updateParam('resolution', e.target.value)}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="original">Keep Original Resolution</option>
                <option value="1080p">Downscale to 1080p Full HD</option>
                <option value="720p">Downscale to 720p HD (Recommended for Chat)</option>
                <option value="480p">Downscale to 480p SD (Compact)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* D. VIDEO TO GIF APP WORKBENCH */}
      {toolId === 'video_to_gif' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Studio GIF Generator (2-Pass Palettegen)</span>
            </div>
            <span className="text-[11px] text-amber-300 font-semibold">Crisp 256-Color Palette</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">Frame Rate (FPS)</label>
              <select
                value={parameters.fps || 15}
                onChange={(e) => updateParam('fps', parseInt(e.target.value, 10))}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-xs text-white"
              >
                <option value={10}>10 FPS (Small size)</option>
                <option value={15}>15 FPS (Standard smooth)</option>
                <option value={24}>24 FPS (Cinematic)</option>
                <option value={30}>30 FPS (Silky smooth)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">Width (Scale)</label>
              <select
                value={parameters.width || 480}
                onChange={(e) => updateParam('width', parseInt(e.target.value, 10))}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-xs text-white"
              >
                <option value={320}>320px (Compact sticker)</option>
                <option value={480}>480px (Standard web)</option>
                <option value={640}>640px (High definition)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">Color Dither</label>
              <select
                value={parameters.dither || 'bayer'}
                onChange={(e) => updateParam('dither', e.target.value)}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-xs text-white"
              >
                <option value="bayer">Bayer Matrix (Clean)</option>
                <option value="floyd_steinberg">Floyd-Steinberg</option>
                <option value="none">No Dither</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* E. VIDEO SPEED / MOTION APP WORKBENCH */}
      {toolId === 'video_speed' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FastForward className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Motion Speed Curve</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs">
              {parameters.speed || 1.5}x Speed
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {[
              { val: 0.25, label: '0.25x Slo-Mo' },
              { val: 0.5, label: '0.5x Slow' },
              { val: 1.0, label: '1.0x Normal' },
              { val: 1.5, label: '1.5x Snappy' },
              { val: 2.0, label: '2.0x Double' },
              { val: 4.0, label: '4.0x Hyper' },
            ].map((s) => {
              const active = (parameters.speed || 1.5) === s.val;
              return (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => updateParam('speed', s.val)}
                  className={`py-2 px-1 rounded-xl text-center font-bold text-xs border transition ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-white">Natural Voice Pitch Filter (atempo)</div>
              <div className="text-[11px] text-slate-400">Preserves original voice tone without chipmunk distortion</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={parameters.preserve_pitch !== false}
                onChange={(e) => updateParam('preserve_pitch', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>
        </div>
      )}

      {/* F. RESIZE & SOCIAL PADDING APP WORKBENCH */}
      {toolId === 'video_resize' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-blue-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-white">Social Dimension & Padding Studio</span>
            </div>
            <span className="text-[11px] text-blue-300 font-semibold">TikTok / Reels / YouTube</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold">Aspect Ratio Adaptation</span>
              <select
                value={parameters.fit_mode || 'blurred_background'}
                onChange={(e) => updateParam('fit_mode', e.target.value)}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="blurred_background">✨ Blurred Background Padding (TikTok Aesthetic)</option>
                <option value="letterbox">⬛ Classic Black Letterbox Bars</option>
                <option value="crop">✂️ Center Crop to Fill (No Bars)</option>
                <option value="stretch">↔️ Stretch Video to Canvas</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold">Target Canvas Preset</span>
              <select
                value={parameters.preset || '1080p'}
                onChange={(e) => updateParam('preset', e.target.value)}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="9:16">9:16 TikTok / Instagram Reels (1080x1920)</option>
                <option value="1080p">16:9 Full HD Landscape (1920x1080)</option>
                <option value="1:1">1:1 Square (1080x1080)</option>
                <option value="720p">16:9 HD Standard (1280x720)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* G. ADD AUDIO & MUSIC MIXER APP WORKBENCH */}
      {toolId === 'video_add_audio' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-violet-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-bold text-white">Dual Audio Track Mixer</span>
            </div>
            <span className="text-[11px] text-violet-300 font-semibold">Video + Background Music</span>
          </div>

          {/* Secondary Audio Track Selection */}
          <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-2">
            <span className="text-[11px] text-slate-400 font-semibold block">Select Music / Audio Track</span>
            {audioLibraryFiles.length > 0 ? (
              <select
                value={parameters.secondary_file_id || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  updateParam('secondary_file_id', id);
                  const chosen = audioLibraryFiles.find((f) => String(f.id) === String(id));
                  if (chosen) updateParam('audio_filename', chosen.filename);
                }}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="">-- Choose an audio file from your library --</option>
                {audioLibraryFiles.map((af) => (
                  <option key={af.id} value={af.id}>
                    🎵 {af.filename} ({formatBytes(af.size_bytes)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-[11px] text-slate-400 p-2 rounded-lg bg-surface-900 border border-surface-800">
                Notice: Upload an audio track (MP3/WAV) to your library or select it to mix with this video.
              </div>
            )}
          </div>

          {/* Dual Volume Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Original Video Audio</span>
                <span className="text-brand-400 font-mono font-bold">{parameters.video_volume ?? 100}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={parameters.video_volume ?? 100}
                onChange={(e) => updateParam('video_volume', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Added Music Track</span>
                <span className="text-violet-400 font-mono font-bold">{parameters.audio_volume ?? 50}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={parameters.audio_volume ?? 50}
                onChange={(e) => updateParam('audio_volume', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* H. WATERMARK APP WORKBENCH */}
      {toolId === 'video_watermark' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-rose-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-bold text-white">Brand Watermark Overlay Studio</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] text-slate-400 font-semibold">Watermark Text</label>
            <input
              type="text"
              value={parameters.text ?? '@UniversalFileStudio'}
              onChange={(e) => updateParam('text', e.target.value)}
              placeholder="e.g. @YourBrandName or Confidential"
              className="w-full bg-surface-950 border border-surface-800 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">Position Grid</label>
              <select
                value={parameters.position || 'bottom-right'}
                onChange={(e) => updateParam('position', e.target.value)}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-xs text-white"
              >
                <option value="bottom-right">Bottom Right (Standard)</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
                <option value="center">Center</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400 font-semibold">Opacity</span>
                <span className="text-rose-400 font-mono font-bold">{parameters.opacity ?? 85}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={parameters.opacity ?? 85}
                onChange={(e) => updateParam('opacity', parseInt(e.target.value, 10))}
                className="w-full h-1.5 mt-2 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* I. COVER THUMBNAIL / FRAME GRABBER APP WORKBENCH */}
      {(toolId === 'video_thumbnail' || toolId === 'extract_frame') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-teal-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-bold text-white">Hero Frame & Cover Grabber</span>
            </div>
            <button
              type="button"
              onClick={captureFrameAtCurrentTime}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/30 btn-press"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Capture Frame at {formatSecondsToTime(currentTime)}</span>
            </button>
          </div>

          {capturedThumb && (
            <div className="p-3 rounded-xl bg-surface-950 border border-teal-500/40 flex items-center gap-3">
              <img src={capturedThumb} alt="Hero Snapshot" className="h-16 w-28 object-cover rounded-lg border border-surface-700" />
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-teal-400" />
                  <span>Frame Ready for Export</span>
                </div>
                <div className="text-[11px] text-slate-400">Timestamp: {formatSecondsToTime(currentTime)}</div>
                <div className="text-[11px] text-slate-400">Resolution: {videoDimensions.width}×{videoDimensions.height}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* J. VIDEO ROTATE & MIRROR WORKBENCH */}
      {toolId === 'video_rotate' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-sky-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className="h-4 w-4 text-sky-400" />
              <span className="text-xs font-bold text-white">Orientation & Mirror Studio</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { deg: 90, label: 'Rotate 90° CW' },
              { deg: 180, label: 'Rotate 180°' },
              { deg: 270, label: 'Rotate 270° (90° CCW)' },
              { deg: 0, flip: true, label: 'Flip Horizontal (Mirror)' },
            ].map((r, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (r.flip) {
                    updateParam('flip_h', !parameters.flip_h);
                  } else {
                    updateParam('degrees', r.deg);
                  }
                }}
                className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                  parameters.degrees === r.deg || (r.flip && parameters.flip_h)
                    ? 'bg-sky-600/20 border-sky-500 text-white'
                    : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
