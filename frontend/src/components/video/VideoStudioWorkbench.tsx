import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Scissors, Crop, Minimize2, Volume2, VolumeX,
  RotateCw, FastForward, Clock, Image as ImageIcon,
  Check, Sliders, Type, FileText, Smartphone, Monitor,
  Square, Film, Music, Sparkles, RefreshCw, Layers,
  Zap, Info, AlertTriangle, ShieldCheck, HardDrive, ArrowRight, Activity, Percent, Cpu,
  Camera, Grid, LayoutGrid, Eye, Download, Shield, Copy, Settings2,
  Repeat, RotateCcw, GitMerge, Plus, Trash2, Captions
} from 'lucide-react';
import { FileRecord } from '../../types/api';
import { universalEngine } from '../../services/universalEngine';
import { formatBytes } from '../../utils/format';
import { CropStudio } from './studios/CropStudio';
import { TrimStudio } from './studios/TrimStudio';
import { WatermarkStudio } from './studios/WatermarkStudio';
import { SpeedVelocityStudio } from './studios/SpeedVelocityStudio';
import { AudioMixerStudio } from './studios/AudioMixerStudio';
import { GifMakerStudio } from './studios/GifMakerStudio';
import { ResizeCanvasStudio } from './studios/ResizeCanvasStudio';
import { RotateFlipStudio } from './studios/RotateFlipStudio';
import { SubtitleBurnStudio } from './studios/SubtitleBurnStudio';
import { StoryboardConcatStudio } from './studios/StoryboardConcatStudio';
import { ReverseBoomerangStudio } from './studios/ReverseBoomerangStudio';
import { SeamlessLooperStudio } from './studios/SeamlessLooperStudio';
import { VolumeBoosterStudio } from './studios/VolumeBoosterStudio';
import { StabilizeStudio } from './studios/StabilizeStudio';
import { CompressStudio } from './studios/CompressStudio';
import { TranscodeStudio } from './studios/TranscodeStudio';
import { FrameGrabberStudio } from './studios/FrameGrabberStudio';
import { FrameRateStudio } from './studios/FrameRateStudio';
import { GifToVideoStudio } from './studios/GifToVideoStudio';
import { AudioExtractorStudio } from './studios/AudioExtractorStudio';

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
      updateParam('time_offset', currentTime.toFixed(2));
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

  // Deep Video Compression Analysis & Engineering
  const fileSizeMB = (file.size_bytes || 0) / (1024 * 1024);
  const sourceBitrateKbps = duration > 0 && file.size_bytes
    ? Math.round((file.size_bytes * 8) / (duration * 1000))
    : 0;
  const sourceBitrateMbps = (sourceBitrateKbps / 1000).toFixed(1);

  const compMode: 'ratio' | 'crf' | 'target_size' = parameters.compression_mode || 'ratio';
  const selectedCodec: string = parameters.codec || 'libx265';
  const selectedResolution: string = parameters.resolution || 'original';
  const selectedPreset: string = parameters.preset || 'medium';
  const selectedAudioMode: string = parameters.audio_mode || 'aac_128';

  const ratioTier: 'archive' | 'balanced' | 'web' | 'saver' = parameters.reduction_tier || 'balanced';
  const ratioFactor = ratioTier === 'archive' ? 0.65 : ratioTier === 'balanced' ? 0.50 : ratioTier === 'web' ? 0.30 : 0.15;

  const selectedCrf: number = parameters.crf ?? (selectedCodec === 'libx265' ? 26 : 24);
  const customTargetMB: number = parameters.target_size_mb || Math.max(1, Math.round(fileSizeMB * 0.5));

  let estOutputMB = 0;
  let estOutputBitrateKbps = 0;

  if (compMode === 'ratio') {
    estOutputMB = Math.max(0.5, fileSizeMB * ratioFactor);
    estOutputBitrateKbps = sourceBitrateKbps > 0
      ? Math.round(sourceBitrateKbps * ratioFactor)
      : Math.round((estOutputMB * 8192) / Math.max(1, duration));
  } else if (compMode === 'crf') {
    const crfBaseline = selectedCodec === 'libx265' ? 26 : 23;
    const crfDelta = crfBaseline - selectedCrf;
    const factor = Math.pow(1.12, crfDelta);
    const efficiency = selectedCodec === 'libx265' ? 0.70 : 1.0;
    estOutputMB = Math.min(fileSizeMB * 0.98, Math.max(fileSizeMB * 0.05, fileSizeMB * 0.5 * factor * efficiency));
    estOutputBitrateKbps = duration > 0 ? Math.round((estOutputMB * 8192) / duration) : Math.round(sourceBitrateKbps * factor * efficiency);
  } else {
    estOutputMB = customTargetMB;
    estOutputBitrateKbps = Math.max(64, Math.round(((customTargetMB * 8192) / Math.max(1, duration))));
  }

  let effW = videoDimensions.width || 1920;
  let effH = videoDimensions.height || 1080;
  if (selectedResolution === '1080p') {
    effW = Math.min(1920, effW);
    effH = Math.min(1080, effH);
  } else if (selectedResolution === '720p') {
    effW = Math.min(1280, effW);
    effH = Math.min(720, effH);
  } else if (selectedResolution === '480p') {
    effW = Math.min(854, effW);
    effH = Math.min(480, effH);
  }

  const pixelRate = effW * effH * 30;
  const rawBpp = pixelRate > 0 ? (estOutputBitrateKbps * 1000) / pixelRate : 0.08;
  const effectiveBpp = selectedCodec === 'libx265' ? rawBpp * 1.5 : rawBpp;

  let healthStatus: { label: string; color: string; desc: string; isWarning: boolean; autoFixResolution?: string } = {
    label: 'Optimal Clarity',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    desc: 'Bitrate is generous; pristine detail retention without noticeable compression degradation.',
    isWarning: false,
  };
  if (effectiveBpp < 0.028) {
    healthStatus = {
      label: 'Severe Blockiness Alert',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      desc: 'Bitrate is too low for this resolution. High motion scenes will show blockiness and macroblocking.',
      isWarning: true,
      autoFixResolution: effW > 1280 ? '720p' : '480p',
    };
  } else if (effectiveBpp < 0.05) {
    healthStatus = {
      label: 'Moderate Softness',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      desc: 'Slight compression softening. Consider downscaling resolution to keep sharper edge fidelity.',
      isWarning: true,
      autoFixResolution: effW > 1920 ? '1080p' : effW > 1280 ? '720p' : undefined,
    };
  } else if (effectiveBpp < 0.09) {
    healthStatus = {
      label: 'Good Balance',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      desc: 'Smooth playback with crisp visuals and high space savings.',
      isWarning: false,
    };
  }

  // FLAGSHIP DEDICATED STUDIOS: Route directly to bespoke, app-grade studio components
  if (toolId === 'video_crop') {
    return (
      <CropStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

  if (toolId === 'video_trim') {
    return (
      <TrimStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

  if (toolId === 'video_watermark') {
    return (
      <WatermarkStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

  if (toolId === 'video_speed' || toolId === 'video_change_speed') {
    return (
      <SpeedVelocityStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

  if (toolId === 'video_add_audio' || toolId === 'add_audio') {
    return (
      <AudioMixerStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
        availableFiles={libraryFiles.map((f) => ({
          id: typeof f.id === 'string' ? parseInt(f.id, 10) : f.id,
          filename: f.filename,
          original_filename: f.original_filename,
        }))}
      />
    );
  }

  if (toolId === 'video_to_gif') {
    return (
      <GifMakerStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

  if (toolId === 'video_resize') {
    return (
      <ResizeCanvasStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

  if (toolId === 'video_rotate' || toolId === 'video_flip' || toolId === 'rotate_video') {
    return (
      <RotateFlipStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

  if (toolId === 'video_burn_subtitles' || toolId === 'burn_subtitles') {
    return (
      <SubtitleBurnStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
        availableFiles={libraryFiles.map((f) => ({
          id: typeof f.id === 'string' ? parseInt(f.id, 10) : f.id,
          filename: f.filename,
          original_filename: f.original_filename,
        }))}
      />
    );
  }

  if (toolId === 'video_concat' || toolId === 'concat_video') {
    return (
      <StoryboardConcatStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
        primaryFileName={file.original_filename || file.filename}
        availableFiles={libraryFiles.map((f) => ({
          id: typeof f.id === 'string' ? parseInt(f.id, 10) : f.id,
          filename: f.filename,
          original_filename: f.original_filename,
        }))}
      />
    );
  }

  if (toolId === 'video_reverse' || toolId === 'boomerang' || toolId === 'reverse_video') {
    return (
      <ReverseBoomerangStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

  if (toolId === 'video_loop' || toolId === 'loop_video') {
    return (
      <SeamlessLooperStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

  if (
    toolId === 'video_adjust_volume' ||
    toolId === 'adjust_volume' ||
    toolId === 'video_remove_audio' ||
    toolId === 'remove_audio'
  ) {
    return (
      <VolumeBoosterStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
        isMuteTool={toolId === 'video_remove_audio' || toolId === 'remove_audio'}
      />
    );
  }

  if (toolId === 'video_stabilize' || toolId === 'stabilize' || toolId === 'deshake') {
    return (
      <StabilizeStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

  if (toolId === 'video_compress' || toolId === 'compress_video') {
    return (
      <CompressStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
        fileSizeBytes={file.size_bytes}
      />
    );
  }

  if (toolId === 'video_convert' || toolId === 'convert_video') {
    return (
      <TranscodeStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
        sourceFormat={file.filename.split('.').pop() || 'mp4'}
      />
    );
  }

  if (
    toolId === 'video_thumbnail' ||
    toolId === 'extract_frame' ||
    toolId === 'thumbnail_video' ||
    toolId === 'storyboard' ||
    toolId === 'extract_frames' ||
    toolId === 'video_extract_frames'
  ) {
    return (
      <FrameGrabberStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

  if (toolId === 'video_change_fps' || toolId === 'change_fps') {
    return (
      <FrameRateStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

  if (toolId === 'gif_to_video' || toolId === 'gif_convert_video') {
    return (
      <GifToVideoStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

  if (toolId === 'extract_audio' || toolId === 'video_extract_audio') {
    return (
      <AudioExtractorStudio
        videoUrl={videoUrl}
        parameters={parameters}
        onParametersChange={onParametersChange}
      />
    );
  }

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
                    ? `rotate(${parameters.degrees || 0}deg) scaleX(${parameters.flip_h ? -1 : 1}) scaleY(${parameters.flip_v ? -1 : 1})`
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

      {/* 0. UNIVERSAL STUDIO VIDEO CONVERTER WORKBENCH */}
      {toolId === 'video_convert' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-indigo-500/30 space-y-4">
          {/* Header & Source Stream Telemetry */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-800">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-white tracking-wide uppercase">Universal Studio Video Converter</span>
                <p className="text-[11px] text-slate-400">High-throughput multi-format transcoder & lossless container re-multiplexer</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] font-bold flex items-center gap-1">
                <Layers className="h-3 w-3" />
                Source: {file.filename.split('.').pop()?.toUpperCase() || 'VIDEO'} • {formatBytes(file.size_bytes)}
              </span>
            </div>
          </div>

          {/* 1. Target Format Selection Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-indigo-400" />
                Target Container Format
              </span>
              <span className="text-[10px] text-slate-400">Select any target container</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {[
                { id: 'mp4', name: 'MP4', sub: 'Universal Master', desc: 'Phones, Web, TV & Mac', badge: 'Standard', color: 'border-indigo-500/40 text-indigo-400' },
                { id: 'webm', name: 'WebM', sub: 'Modern Web', desc: 'VP9 / Opus Royalty-Free', badge: 'High-Eff', color: 'border-emerald-500/40 text-emerald-400' },
                { id: 'mkv', name: 'MKV', sub: 'Studio Matroska', desc: 'Multi-Track & Subtitles', badge: 'Pro Master', color: 'border-purple-500/40 text-purple-400' },
                { id: 'mov', name: 'MOV', sub: 'QuickTime', desc: 'macOS, iOS & Final Cut', badge: 'Apple Native', color: 'border-cyan-500/40 text-cyan-400' },
                { id: 'avi', name: 'AVI', sub: 'Legacy Windows', desc: 'DivX / Xvid Compatibility', badge: 'Classic', color: 'border-amber-500/40 text-amber-400' },
                { id: 'ts', name: 'TS', sub: 'MPEG Transport', desc: 'Broadcast & IPTV Streaming', badge: 'Broadcast', color: 'border-blue-500/40 text-blue-400' },
                { id: 'flv', name: 'FLV', sub: 'Flash Video', desc: 'RTMP Live Streaming', badge: 'RTMP', color: 'border-rose-500/40 text-rose-400' },
                { id: 'wmv', name: 'WMV', sub: 'Windows Media', desc: 'Native Windows Video', badge: 'Windows', color: 'border-teal-500/40 text-teal-400' },
                { id: '3gp', name: '3GP', sub: 'Mobile Compact', desc: 'Ultra-Lightweight Storage', badge: 'Mobile', color: 'border-orange-500/40 text-orange-400' },
                { id: 'ogv', name: 'OGV', sub: 'Ogg Theora', desc: 'Open Source Media Stream', badge: 'Open', color: 'border-slate-500/40 text-slate-400' },
              ].map((fmt) => {
                const active = (parameters.format || 'mp4') === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => updateParam('format', fmt.id)}
                    className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                      active
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{fmt.name}</span>
                        {active ? (
                          <Check className="h-3 w-3 text-indigo-400" />
                        ) : (
                          <span className="text-[9px] font-mono text-slate-400">{fmt.badge}</span>
                        )}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-300">{fmt.sub}</div>
                      <div className="text-[9px] text-slate-400 leading-tight">{fmt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Processing Strategy Switcher */}
          <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Transcoding Strategy
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateParam('remux_lossless', true)}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  parameters.remux_lossless
                    ? 'bg-amber-600/20 border-amber-500 text-white'
                    : 'bg-surface-900 border-surface-800 text-slate-300 hover:border-surface-700'
                }`}
              >
                <Zap className={`h-4 w-4 shrink-0 mt-0.5 ${parameters.remux_lossless ? 'text-amber-400' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>Instant Lossless Remux</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold">
                      0-Second • No Quality Loss
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Stream copies bit-for-bit into the new container instantly without re-compressing pixels. 100% original quality preserved.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateParam('remux_lossless', false)}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  !parameters.remux_lossless
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-surface-900 border-surface-800 text-slate-300 hover:border-surface-700'
                }`}
              >
                <Cpu className={`h-4 w-4 shrink-0 mt-0.5 ${!parameters.remux_lossless ? 'text-indigo-400' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>Studio Re-Encode Engine</span>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-bold">
                      Multi-Threaded
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Custom video/audio codec, resolution downscaling, frame rate timing, and multi-pass precision encoding.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Studio Re-Encode Engine Controls (shown when not remuxing) */}
          {!parameters.remux_lossless && (
            <div className="space-y-3 pt-1">
              {/* Studio Quality Profiles */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                  Studio Quality Presets
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'master_crf18', label: 'Studio Master', sub: 'CRF 18 • 320k Audio', tag: 'Near-Lossless Film' },
                    { id: 'broadcast_crf21', label: 'Broadcast Pro', sub: 'CRF 21 • 256k Audio', tag: 'Industry Delivery' },
                    { id: 'high_crf23', label: 'Universal High', sub: 'CRF 23 • 192k Audio', tag: 'Balanced Master' },
                    { id: 'balanced_crf26', label: 'Balanced Web', sub: 'CRF 26 • 128k Audio', tag: 'Compact & Crisp' },
                  ].map((prof) => {
                    const active = (parameters.quality_profile || 'high_crf23') === prof.id;
                    return (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => {
                          updateParam('quality_profile', prof.id);
                          const crfMap: Record<string, number> = {
                            master_crf18: 18,
                            broadcast_crf21: 21,
                            high_crf23: 23,
                            balanced_crf26: 26,
                          };
                          updateParam('crf', crfMap[prof.id]);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          active
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{prof.label}</div>
                        <div className="text-[10px] text-indigo-300 font-mono">{prof.sub}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{prof.tag}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Codecs & Encoders Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Video Codec */}
                <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-indigo-400" />
                    Video Codec
                  </span>
                  <select
                    value={parameters.video_codec || 'auto'}
                    onChange={(e) => updateParam('video_codec', e.target.value)}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="auto">Auto (Best for {((parameters.format || 'mp4') as string).toUpperCase()})</option>
                    <option value="libx265">H.265 / HEVC (+50% Coding Efficiency)</option>
                    <option value="libx264">H.264 / AVC (Universal Compatibility)</option>
                    <option value="libvpx-vp9">VP9 (Royalty-Free Web)</option>
                    <option value="prores_ks">ProRes (Studio Editing Master)</option>
                    <option value="mpeg4">MPEG-4 (Legacy Xvid)</option>
                    <option value="copy">Lossless Video Copy (-c:v copy)</option>
                  </select>
                </div>

                {/* Audio Codec */}
                <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Music className="h-3 w-3 text-indigo-400" />
                    Audio Codec
                  </span>
                  <select
                    value={parameters.audio_codec || 'auto'}
                    onChange={(e) => updateParam('audio_codec', e.target.value)}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="auto">Auto (Optimized for Container)</option>
                    <option value="aac">AAC (Crystal Clear Stereo)</option>
                    <option value="libopus">Opus (High-Fidelity Audio)</option>
                    <option value="libmp3lame">MP3 (Universal Legacy)</option>
                    <option value="copy">Lossless Audio Copy (-c:a copy)</option>
                  </select>
                </div>

                {/* Resolution Strategy */}
                <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Monitor className="h-3 w-3 text-indigo-400" />
                    Resolution Strategy
                  </span>
                  <select
                    value={parameters.resolution || 'original'}
                    onChange={(e) => updateParam('resolution', e.target.value)}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="original">
                      Keep Original {videoDimensions.width > 0 ? `(${videoDimensions.width}×${videoDimensions.height})` : ''}
                    </option>
                    <option value="4k">4K Ultra HD (3840×2160)</option>
                    <option value="1440p">1440p Quad HD (2560×1440)</option>
                    <option value="1080p">1080p Full HD (1920×1080)</option>
                    <option value="720p">720p HD (1280×720)</option>
                    <option value="480p">480p SD (854×480)</option>
                  </select>
                </div>

                {/* Frame Rate (FPS) */}
                <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-indigo-400" />
                    Target Frame Rate
                  </span>
                  <select
                    value={parameters.fps || 'original'}
                    onChange={(e) => updateParam('fps', e.target.value)}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="original">Keep Source Frame Rate</option>
                    <option value="60">60 FPS (Ultra Smooth)</option>
                    <option value="30">30 FPS (Standard)</option>
                    <option value="24">24 FPS (Cinematic Film)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 4. Telemetry & Hardware Multi-Threading Information Banner */}
          <div className="p-3 rounded-xl bg-surface-950/90 border border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-slate-300 font-semibold">
                Target Output: <span className="font-mono font-bold text-indigo-300">{file.filename.replace(/\.[^.]+$/, '')}.{(parameters.format || 'mp4')}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={parameters.faststart !== false}
                  onChange={(e) => updateParam('faststart', e.target.checked)}
                  className="rounded bg-surface-800 border-surface-700 text-indigo-600 focus:ring-0"
                />
                <span className="text-[11px]">Web Streaming FastStart</span>
              </label>
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                Octa-Threaded
              </span>
            </div>
          </div>
        </div>
      )}

      {/* A. LOSSLESS FRAME-ACCURATE CUTTER & SPLITTER */}
      {toolId === 'video_trim' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-brand-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-brand-400" />
              <span className="text-xs font-bold text-white">Lossless Frame-Accurate Cutter & Splitter</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 font-mono font-bold text-xs border border-brand-500/30">
              Selected Clip: {clipDuration.toFixed(1)}s
            </span>
          </div>

          {/* Trimming Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                id: 'single',
                title: '✂️ Single Range Snipper',
                desc: 'Keep the selected interval between start and end timestamps',
              },
              {
                id: 'split_chunks',
                title: '📱 Story / Status Splitter',
                desc: 'Auto-slice into 15s/30s/60s chunks for WhatsApp & Instagram',
              },
              {
                id: 'cut_out',
                title: '🗑️ Cut Out & Delete Scene',
                desc: 'Remove selected mistake/ad and join the remaining clip',
              },
            ].map((m) => {
              const active = (parameters.trim_mode || 'single') === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateParam('trim_mode', m.id)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    active
                      ? 'bg-brand-600/20 border-brand-500 text-white shadow-sm shadow-brand-500/20'
                      : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                  }`}
                >
                  <div className="text-xs font-bold">{m.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{m.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Social Auto-Chunk Duration when split_chunks */}
          {parameters.trim_mode === 'split_chunks' && (
            <div className="p-3.5 rounded-xl bg-surface-950 border border-brand-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Auto-Chunk Duration</span>
                <span className="text-[10px] text-slate-400">Slices entire video into uniform duration clips</span>
              </div>
              <div className="flex gap-1.5">
                {[
                  { sec: 15, label: '15s (Story)' },
                  { sec: 30, label: '30s (WhatsApp)' },
                  { sec: 60, label: '60s (Reels)' },
                ].map((c) => (
                  <button
                    key={c.sec}
                    type="button"
                    onClick={() => updateParam('chunk_seconds', c.sec)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      (parameters.chunk_seconds || 30) === c.sec
                        ? 'bg-brand-600 text-white border-brand-500'
                        : 'bg-surface-900 border-surface-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Preset Buttons (Single & Cut-Out modes) */}
          {parameters.trim_mode !== 'split_chunks' && (
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
          )}

          {/* Dual Markers Bar (Single & Cut-Out modes) */}
          {parameters.trim_mode !== 'split_chunks' && (
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
          )}

          {/* Engine & Loop Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-brand-400" />
                  <span>Instant 0.1s Lossless Copy</span>
                </div>
                <div className="text-[10px] text-slate-400">Stream copy in 0.1s without re-encoding pixels</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parameters.lossless !== false}
                  onChange={(e) => updateParam('lossless', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-600" />
              </label>
            </div>

            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-brand-400" />
                  <span>Loop Preview Selection</span>
                </div>
                <div className="text-[10px] text-slate-400">Auto-rewinds to start marker during playback</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parameters.loop_selection === true}
                  onChange={(e) => updateParam('loop_selection', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-600" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* B. PRECISION VISUAL CROP & PAN STUDIO */}
      {toolId === 'video_crop' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-indigo-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crop className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">Precision Visual Crop & Pan Studio</span>
            </div>
            <span className="text-[11px] text-indigo-300 font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              Target: {parameters.aspect_ratio || '9:16'}
            </span>
          </div>

          {/* Aspect Ratio Preset Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { id: '9:16', name: '9:16 Vertical', sub: 'TikTok / Reels', icon: Smartphone },
              { id: '1:1', name: '1:1 Square', sub: 'Instagram Feed', icon: Square },
              { id: '4:5', name: '4:5 Portrait', sub: 'Social Portrait', icon: LayoutGrid },
              { id: '16:9', name: '16:9 Widescreen', sub: 'YouTube / TV', icon: Monitor },
              { id: '21:9', name: '21:9 Cinema', sub: 'Ultrawide', icon: Film },
              { id: 'custom', name: 'Custom Crop', sub: 'Custom W×H', icon: Settings2 },
            ].map((ratio) => {
              const active = (parameters.aspect_ratio || '9:16') === ratio.id;
              const IconComp = ratio.icon;
              return (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => updateParam('aspect_ratio', ratio.id)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    active
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <IconComp className={`h-4 w-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                    {active && <Check className="h-3 w-3 text-indigo-400" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{ratio.name}</div>
                    <div className="text-[10px] text-slate-400">{ratio.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Geometry Inputs when custom */}
          {parameters.aspect_ratio === 'custom' && (
            <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 space-y-3">
              <span className="text-xs font-bold text-white block">Custom Crop Dimensions & Coordinates</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Width (px)</label>
                  <input
                    type="number"
                    min={16}
                    max={videoDimensions.width || 3840}
                    step={2}
                    value={parameters.width || 1080}
                    onChange={(e) => updateParam('width', parseInt(e.target.value, 10) || 1080)}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Height (px)</label>
                  <input
                    type="number"
                    min={16}
                    max={videoDimensions.height || 2160}
                    step={2}
                    value={parameters.height || 1080}
                    onChange={(e) => updateParam('height', parseInt(e.target.value, 10) || 1080)}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Offset X (px)</label>
                  <input
                    type="number"
                    min={0}
                    step={2}
                    value={parameters.x || 0}
                    onChange={(e) => updateParam('x', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Offset Y (px)</label>
                  <input
                    type="number"
                    min={0}
                    step={2}
                    value={parameters.y || 0}
                    onChange={(e) => updateParam('y', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Framing Anchor Position & Sinc Sharpening */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Framing Anchor Position</span>
                <span className="text-[10px] text-slate-400">Position where the crop window is centered</span>
              </div>
              <select
                value={parameters.anchor || 'center'}
                onChange={(e) => updateParam('anchor', e.target.value)}
                className="bg-surface-900 border border-surface-700 rounded-lg px-2.5 py-1 text-xs text-white font-semibold"
              >
                <option value="center">🎯 Dead Center</option>
                <option value="top_left">↖️ Top-Left Corner</option>
                <option value="bottom_right">↘️ Bottom-Right Corner</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Lanczos Edge Sharpen</span>
                </div>
                <div className="text-[10px] text-slate-400">Restores fine details on zoomed crops</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parameters.sharpen !== false}
                  onChange={(e) => updateParam('sharpen', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* C. VIDEO COMPRESSOR APP WORKBENCH */}
      {toolId === 'video_compress' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-cyan-500/30 space-y-4">
          {/* Header & Source Stream Telemetry */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-800">
            <div className="flex items-center gap-2">
              <Minimize2 className="h-5 w-5 text-cyan-400" />
              <div>
                <span className="text-xs font-bold text-white tracking-wide uppercase">Intelligent Video Compression Studio</span>
                <p className="text-[11px] text-slate-400">Adaptive stream analysis with live bitrate & fidelity modeling</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                Original: {formatBytes(file.size_bytes)}
              </span>
            </div>
          </div>

          {/* 1. Deep Video Stream Analysis Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-surface-950/80 border border-surface-800">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1">
                <HardDrive className="h-3 w-3 text-cyan-400" />
                <span>Source Size</span>
              </div>
              <div className="text-xs font-mono font-bold text-white">{formatBytes(file.size_bytes)}</div>
              <div className="text-[10px] text-slate-500">{fileSizeMB.toFixed(1)} MB total</div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-950/80 border border-surface-800">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1">
                <Clock className="h-3 w-3 text-cyan-400" />
                <span>Duration</span>
              </div>
              <div className="text-xs font-mono font-bold text-white">
                {duration > 0 ? formatSecondsToTime(duration) : 'Probing...'}
              </div>
              <div className="text-[10px] text-slate-500">{Math.round(duration)} seconds</div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-950/80 border border-surface-800">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1">
                <Film className="h-3 w-3 text-cyan-400" />
                <span>Native Resolution</span>
              </div>
              <div className="text-xs font-mono font-bold text-white">
                {videoDimensions.width > 0 ? `${videoDimensions.width}×${videoDimensions.height}` : 'Probing...'}
              </div>
              <div className="text-[10px] text-cyan-400">
                {videoDimensions.width >= 3840
                  ? '4K UHD'
                  : videoDimensions.width >= 1920
                  ? '1080p FHD'
                  : videoDimensions.width >= 1280
                  ? '720p HD'
                  : 'SD'}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-950/80 border border-surface-800">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1">
                <Activity className="h-3 w-3 text-cyan-400" />
                <span>Source Bitrate</span>
              </div>
              <div className="text-xs font-mono font-bold text-white">
                {sourceBitrateKbps > 0 ? `~${sourceBitrateMbps} Mbps` : 'Probing...'}
              </div>
              <div className="text-[10px] text-slate-500">
                {sourceBitrateKbps > 0 ? `${sourceBitrateKbps} kbps` : 'Calculating'}
              </div>
            </div>
          </div>

          {/* 2. Mode Selector Tabs */}
          <div className="flex rounded-xl bg-surface-950 p-1 border border-surface-800">
            {[
              { id: 'ratio', label: 'Smart Reduction Tiers', icon: Percent },
              { id: 'crf', label: 'Perceptual Quality (CRF)', icon: Sliders },
              { id: 'target_size', label: 'Custom Target File Size', icon: HardDrive },
            ].map((tab) => {
              const active = compMode === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    updateParam('compression_mode', tab.id);
                    if (tab.id === 'ratio') {
                      updateParam('crf', selectedCodec === 'libx265' ? 26 : 24);
                      updateParam('target_bitrate_kbps', estOutputBitrateKbps);
                    } else if (tab.id === 'crf') {
                      updateParam('crf', selectedCrf);
                      updateParam('target_bitrate_kbps', 0);
                    } else {
                      updateParam('target_size_mb', customTargetMB);
                      updateParam('target_bitrate_kbps', estOutputBitrateKbps);
                    }
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    active
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mode A: Smart Reduction Tiers */}
          {compMode === 'ratio' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  {
                    id: 'archive',
                    name: 'Archive Master',
                    percent: '-35%',
                    ratio: 0.65,
                    crf: selectedCodec === 'libx265' ? 22 : 20,
                    desc: 'Pristine visual fidelity, near indistinguishable from source',
                    tag: 'Recommended for Keepsake',
                  },
                  {
                    id: 'balanced',
                    name: 'Balanced Halving',
                    percent: '-50%',
                    ratio: 0.50,
                    crf: selectedCodec === 'libx265' ? 26 : 24,
                    desc: 'Cuts size exactly in half with crisp details',
                    tag: 'Most Popular',
                  },
                  {
                    id: 'web',
                    name: 'Web & Sharing',
                    percent: '-70%',
                    ratio: 0.30,
                    crf: selectedCodec === 'libx265' ? 29 : 27,
                    desc: 'Optimized for fast uploads, Discord, and messaging',
                    tag: 'Cloud & Chat',
                  },
                  {
                    id: 'saver',
                    name: 'Ultra Space Saver',
                    percent: '-85%',
                    ratio: 0.15,
                    crf: selectedCodec === 'libx265' ? 32 : 30,
                    desc: 'Maximum storage recovery for quick mobile transmission',
                    tag: 'Smallest Size',
                  },
                ].map((tier) => {
                  const active = ratioTier === tier.id;
                  const calculatedMB = Math.max(0.5, fileSizeMB * tier.ratio);
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => {
                        updateParam('reduction_tier', tier.id);
                        updateParam('crf', tier.crf);
                        const newEstBitrate = sourceBitrateKbps > 0
                          ? Math.round(sourceBitrateKbps * tier.ratio)
                          : Math.round((calculatedMB * 8192) / Math.max(1, duration));
                        updateParam('target_bitrate_kbps', newEstBitrate);
                      }}
                      className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                        active
                          ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-md'
                          : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{tier.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                            {tier.percent}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 leading-tight mb-2">{tier.desc}</div>
                      </div>
                      <div className="pt-2 border-t border-surface-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-mono text-[10px]">{tier.tag}</span>
                        <span className="font-mono font-bold text-cyan-300">
                          {calculatedMB >= 1024
                            ? `${(calculatedMB / 1024).toFixed(2)} GB`
                            : `${Math.round(calculatedMB)} MB`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode B: Perceptual Quality (CRF) Slider */}
          {compMode === 'crf' && (
            <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">Constant Rate Factor (CRF)</span>
                  <p className="text-[11px] text-slate-400">Direct perceptual quality control without hard bitrate limits</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs">
                    CRF {selectedCrf}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-300">
                    {selectedCrf <= 20
                      ? 'Visually Lossless Master'
                      : selectedCrf <= 24
                      ? 'Studio High Definition'
                      : selectedCrf <= 28
                      ? 'Web Balanced'
                      : 'High Compression'}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="18"
                max="34"
                step="1"
                value={selectedCrf}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  updateParam('crf', val);
                  updateParam('target_bitrate_kbps', 0);
                }}
                className="w-full accent-cyan-500 cursor-pointer h-2 bg-surface-800 rounded-lg"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>18 (Near-Lossless / Larger)</span>
                <span>24 (Studio Default)</span>
                <span>28 (Balanced)</span>
                <span>34 (Ultra Saver)</span>
              </div>
            </div>
          )}

          {/* Mode C: Custom Target File Size */}
          {compMode === 'target_size' && (
            <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">Desired Output File Size</span>
                  <p className="text-[11px] text-slate-400">System calculates exact bitrate needed to hit your target</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={Math.max(10, Math.round(fileSizeMB))}
                    value={customTargetMB}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      updateParam('target_size_mb', val);
                      const reqBitrate = Math.max(64, Math.round(((val * 8192) / Math.max(1, duration))));
                      updateParam('target_bitrate_kbps', reqBitrate);
                    }}
                    className="w-24 px-2 py-1 bg-surface-900 border border-cyan-500/40 rounded-lg text-xs font-mono font-bold text-cyan-300 text-right"
                  />
                  <span className="text-xs text-slate-300 font-bold">MB</span>
                </div>
              </div>

              {/* Slider for Target Size */}
              <input
                type="range"
                min="5"
                max={Math.max(20, Math.round(fileSizeMB))}
                step={fileSizeMB > 500 ? 10 : 1}
                value={customTargetMB}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  updateParam('target_size_mb', val);
                  const reqBitrate = Math.max(64, Math.round(((val * 8192) / Math.max(1, duration))));
                  updateParam('target_bitrate_kbps', reqBitrate);
                }}
                className="w-full accent-cyan-500 cursor-pointer h-2 bg-surface-800 rounded-lg"
              />

              {/* Quick Size Shortcuts */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold">Quick Targets:</span>
                {[
                  { label: '25% of Source', mb: Math.max(5, Math.round(fileSizeMB * 0.25)) },
                  { label: '50% (Half Size)', mb: Math.max(5, Math.round(fileSizeMB * 0.50)) },
                  { label: '75% (Light Touch)', mb: Math.max(5, Math.round(fileSizeMB * 0.75)) },
                  ...(fileSizeMB > 150 ? [{ label: '100 MB', mb: 100 }] : []),
                  ...(fileSizeMB > 600 ? [{ label: '500 MB', mb: 500 }] : []),
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      updateParam('target_size_mb', s.mb);
                      const reqBitrate = Math.max(64, Math.round(((s.mb * 8192) / Math.max(1, duration))));
                      updateParam('target_bitrate_kbps', reqBitrate);
                    }}
                    className="px-2 py-1 rounded bg-surface-900 border border-surface-700 hover:border-cyan-500/50 text-[10px] font-mono text-slate-300 transition"
                  >
                    {s.label} ({s.mb} MB)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Live Health & Fidelity Telemetry Banner */}
          <div className="p-3.5 rounded-xl bg-surface-950/90 border border-surface-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-semibold">Estimated Output:</span>
                <span className="text-xs font-mono font-bold text-white">
                  {formatBytes(file.size_bytes)}
                </span>
                <ArrowRight className="h-3 w-3 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {estOutputMB >= 1024
                    ? `${(estOutputMB / 1024).toFixed(2)} GB`
                    : `${Math.round(estOutputMB)} MB`}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  {fileSizeMB > 0 ? `-${Math.max(0, Math.round(((fileSizeMB - estOutputMB) / fileSizeMB) * 100))}%` : '0%'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Calculated stream bitrate: <span className="text-cyan-300 font-mono font-bold">{estOutputBitrateKbps} kbps</span> (~{(estOutputBitrateKbps / 1000).toFixed(2)} Mbps)
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 ${healthStatus.color}`}>
                {healthStatus.isWarning ? (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{healthStatus.label}</span>
              </div>

              {healthStatus.autoFixResolution && selectedResolution !== healthStatus.autoFixResolution && (
                <button
                  type="button"
                  onClick={() => updateParam('resolution', healthStatus.autoFixResolution)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold transition flex items-center gap-1"
                >
                  <Zap className="h-3 w-3" />
                  Auto-Downscale to {healthStatus.autoFixResolution}
                </button>
              )}
            </div>
          </div>

          {/* 4. Professional Studio Stream & Codec Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Codec */}
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <Cpu className="h-3 w-3 text-cyan-400" />
                  Video Codec
                </span>
                <span className="text-[9px] font-mono text-cyan-400 uppercase">
                  {selectedCodec === 'libx265' ? '+50% Efficiency' : 'Max Compatible'}
                </span>
              </div>
              <select
                value={selectedCodec}
                onChange={(e) => updateParam('codec', e.target.value)}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="libx265">H.265 (HEVC) — 50% Higher Efficiency</option>
                <option value="libx264">H.264 (AVC) — Universal Phone & Web</option>
              </select>
            </div>

            {/* Resolution Downscale */}
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <Monitor className="h-3 w-3 text-cyan-400" />
                Resolution Strategy
              </span>
              <select
                value={selectedResolution}
                onChange={(e) => updateParam('resolution', e.target.value)}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="original">
                  Keep Original {videoDimensions.width > 0 ? `(${videoDimensions.width}×${videoDimensions.height})` : ''}
                </option>
                <option value="1080p">Downscale to 1080p FHD (Save up to 75% for 4K)</option>
                <option value="720p">Downscale to 720p HD (Best for Fast Messaging)</option>
                <option value="480p">Downscale to 480p SD (Ultra Compact)</option>
              </select>
            </div>

            {/* Encoding Preset */}
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <FastForward className="h-3 w-3 text-cyan-400" />
                Encoding Profile
              </span>
              <select
                value={selectedPreset}
                onChange={(e) => updateParam('preset', e.target.value)}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="medium">Medium — Balanced Speed & Size</option>
                <option value="slow">Slow — Multi-pass (Best File Size)</option>
                <option value="veryfast">Very Fast — Rapid Turnaround</option>
              </select>
            </div>

            {/* Audio Stream Strategy */}
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <Music className="h-3 w-3 text-cyan-400" />
                Audio Strategy
              </span>
              <select
                value={selectedAudioMode}
                onChange={(e) => {
                  const mode = e.target.value;
                  updateParam('audio_mode', mode);
                  if (mode === 'copy') {
                    updateParam('copy_audio', true);
                    updateParam('mute_audio', false);
                  } else if (mode === 'mute') {
                    updateParam('mute_audio', true);
                    updateParam('copy_audio', false);
                  } else if (mode === 'aac_96') {
                    updateParam('audio_bitrate', 96);
                    updateParam('copy_audio', false);
                    updateParam('mute_audio', false);
                  } else {
                    updateParam('audio_bitrate', 128);
                    updateParam('copy_audio', false);
                    updateParam('mute_audio', false);
                  }
                }}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="aac_128">AAC 128 kbps (Crystal Clear Stereo)</option>
                <option value="aac_96">AAC 96 kbps (Mobile Speech Optimized)</option>
                <option value="copy">Lossless Audio Copy (Bit-for-Bit Copy)</option>
                <option value="mute">Mute / Discard Audio (Save Extra Size)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* D. VIDEO TO GIF APP WORKBENCH (PRO PALETTEGEN STUDIO) */}
      {toolId === 'video_to_gif' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Pro GIF Maker Studio (2-Pass PaletteGen)</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
              Desktop-Grade Color Fidelity
            </span>
          </div>

          {/* Time range trimming */}
          <div className="p-3 bg-surface-950 rounded-xl border border-surface-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Scissors className="h-3.5 w-3.5 text-emerald-400" />
                Clip Highlight Range (Optional)
              </span>
              <span className="text-[11px] text-slate-400">Leave blank to convert whole video</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Start Time</label>
                  <button
                    type="button"
                    onClick={() => updateParam('start_time', formatSecondsToTime(currentTime))}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-mono"
                  >
                    Set Current ({formatSecondsToTime(currentTime)})
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="00:00:00"
                  value={parameters.start_time || ''}
                  onChange={(e) => updateParam('start_time', e.target.value)}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">End Time</label>
                  <button
                    type="button"
                    onClick={() => updateParam('end_time', formatSecondsToTime(currentTime))}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-mono"
                  >
                    Set Current ({formatSecondsToTime(currentTime)})
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={formatSecondsToTime(duration || 10)}
                  value={parameters.end_time || ''}
                  onChange={(e) => updateParam('end_time', e.target.value)}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Width Resolution presets */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">Output Resolution Width</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '320px', sub: 'Compact Sticker', val: 320 },
                { label: '480px', sub: 'Standard Chat', val: 480 },
                { label: '640px', sub: 'High Res', val: 640 },
                { label: '800px', sub: 'HD Master', val: 800 }
              ].map((res) => {
                const active = (parameters.width || 480) === res.val;
                return (
                  <button
                    key={res.val}
                    type="button"
                    onClick={() => updateParam('width', res.val)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      active
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                        : 'bg-surface-950 border-surface-800 text-slate-400 hover:border-surface-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{res.label}</div>
                    <div className="text-[9px] text-slate-400">{res.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FPS, Dither & Velocity */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">Frame Rate</label>
              <select
                value={parameters.fps || 15}
                onChange={(e) => updateParam('fps', parseInt(e.target.value, 10))}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-xs text-white"
              >
                <option value={10}>10 FPS (Smallest)</option>
                <option value={15}>15 FPS (Standard Smooth)</option>
                <option value={24}>24 FPS (Cinema Cadence)</option>
                <option value={30}>30 FPS (Silky Motion)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">Dither Algorithm</label>
              <select
                value={parameters.dither || 'sierra2_4a'}
                onChange={(e) => updateParam('dither', e.target.value)}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-xs text-white"
              >
                <option value="sierra2_4a">Sierra-2 4A (Smoothest)</option>
                <option value="floyd_steinberg">Floyd-Steinberg</option>
                <option value="bayer">Bayer Matrix (Retro)</option>
                <option value="none">No Dither (Clean Pixel)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">Speed Multiplier</label>
              <select
                value={parameters.speed !== undefined ? parameters.speed : 1.0}
                onChange={(e) => updateParam('speed', parseFloat(e.target.value))}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-xs text-white"
              >
                <option value={0.5}>0.5x (Slow-Mo)</option>
                <option value={1.0}>1.0x (Original)</option>
                <option value={1.25}>1.25x (Crisp Snappy)</option>
                <option value={1.5}>1.5x (Fast Meme)</option>
                <option value={2.0}>2.0x (Double Speed)</option>
              </select>
            </div>
          </div>

          {/* Palette Mode & Infinite Loop */}
          <div className="flex items-center justify-between p-3 bg-surface-950 rounded-xl border border-surface-800">
            <div className="flex items-center gap-2">
              <input
                id="infinite_loop_toggle"
                type="checkbox"
                checked={parameters.infinite_loop !== false}
                onChange={(e) => updateParam('infinite_loop', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-surface-900 border-surface-700"
              />
              <label htmlFor="infinite_loop_toggle" className="text-xs text-slate-300 font-semibold cursor-pointer">
                Endless Continuous Loop
              </label>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">Palette Analysis:</span>
              <select
                value={parameters.stats_mode || 'diff'}
                onChange={(e) => updateParam('stats_mode', e.target.value)}
                className="bg-surface-900 border border-surface-700 rounded-lg px-2 py-1 text-xs text-white"
              >
                <option value="diff">Diff (Action / Motion)</option>
                <option value="full">Full (Static Brilliance)</option>
              </select>
            </div>
          </div>

          {/* Pro info badge */}
          <div className="flex items-start gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-200">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Dual-Pass Color Histogram:</strong> Analyzes all frames to generate a bespoke 256-color palette with Lanczos anti-aliasing, preventing color banding and gradient posterization common in standard mobile GIF makers.
            </span>
          </div>
        </div>
      )}

      {/* D2. GIF TO VIDEO (MP4) WORKBENCH */}
      {(toolId === 'gif_to_video' || toolId === 'gif_convert_video') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-violet-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">GIF to 60fps MP4 & Motion Upscaler</span>
            </div>
            <span className="text-[10px] bg-violet-500/20 text-violet-300 font-semibold px-2 py-0.5 rounded border border-violet-500/30">
              Social Re-Pad & H.264
            </span>
          </div>

          {/* Loop padder */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">
              Duration Loop Padder (Fixes Social Platform Minimum Lengths)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '3x Loops', sub: 'Instagram & TikTok (Recommended)', val: 3 },
                { label: '1x Loop', sub: 'Single Playthrough', val: 1 },
                { label: '2x Loops', sub: 'Double Duration', val: 2 },
                { label: '5x Loops', sub: 'Extended Story Reel', val: 5 }
              ].map((lp) => {
                const active = (parameters.loop_count || 3) === lp.val;
                return (
                  <button
                    key={lp.val}
                    type="button"
                    onClick={() => updateParam('loop_count', lp.val)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      active
                        ? 'bg-violet-500/20 border-violet-500 text-white shadow-sm shadow-violet-500/20'
                        : 'bg-surface-950 border-surface-800 text-slate-400 hover:border-surface-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{lp.label}</div>
                    <div className="text-[9px] text-slate-400 line-clamp-1">{lp.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frame Rate & CRF */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">Target Frame Rate</label>
              <select
                value={parameters.fps || 30}
                onChange={(e) => updateParam('fps', parseInt(e.target.value, 10))}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-xs text-white"
              >
                <option value={30}>30 FPS (Web & Social Standard)</option>
                <option value={60}>60 FPS (Ultra Fluid Motion)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">Quality Profile (CRF)</label>
              <select
                value={parameters.crf || 18}
                onChange={(e) => updateParam('crf', parseInt(e.target.value, 10))}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-xs text-white"
              >
                <option value={18}>CRF 18 (Visually Lossless Studio)</option>
                <option value={23}>CRF 23 (Balanced Standard)</option>
                <option value={28}>CRF 28 (Ultra Compact File)</option>
              </select>
            </div>
          </div>

          {/* Compatibility guarantee note */}
          <div className="flex items-start gap-2 p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-[11px] text-violet-200">
            <ShieldCheck className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
            <span>
              <strong>Universal YUV420p Color Space:</strong> Conforms GIF dimensions to even pixel parity and re-encodes with faststart MP4 container flags to ensure flawless instant playback on Android Gallery, WhatsApp Status, Instagram Reels, and Discord without black screen errors.
            </span>
          </div>
        </div>
      )}

      {/* E. VIDEO SPEED & VELOCITY APP WORKBENCH */}
      {(toolId === 'video_speed' || toolId === 'video_change_speed') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FastForward className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Motion Velocity & Time Warp Studio</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
              {parameters.speed || 1.5}x Speed Multiplier
            </span>
          </div>

          {/* Speed Preset Curve */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
            {[
              { val: 0.25, label: '0.25x', sub: 'Ultra Slo-Mo' },
              { val: 0.5, label: '0.5x', sub: 'Half Speed' },
              { val: 0.75, label: '0.75x', sub: 'Cinematic' },
              { val: 1.0, label: '1.0x', sub: 'Original' },
              { val: 1.25, label: '1.25x', sub: 'Snappy' },
              { val: 1.5, label: '1.5x', sub: 'Podcast/Recap' },
              { val: 2.0, label: '2.0x', sub: 'Double Speed' },
              { val: 4.0, label: '4.0x', sub: 'Timelapse' },
            ].map((s) => {
              const active = Math.abs((parameters.speed || 1.5) - s.val) < 0.01;
              return (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => updateParam('speed', s.val)}
                  className={`py-2 px-1 rounded-xl text-center border transition flex flex-col items-center ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                      : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                  }`}
                >
                  <span className="text-xs font-bold font-mono">{s.label}</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">{s.sub}</span>
                </button>
              );
            })}
          </div>

          {/* Continuous Speed Multiplier Slider */}
          <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Fine Velocity Control</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">{parameters.speed || 1.5}x</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={8.0}
              step={0.05}
              value={parameters.speed || 1.5}
              onChange={(e) => updateParam('speed', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>0.2x Extreme Slo-Mo</span>
              <span>1.0x Realtime</span>
              <span>8.0x Hyperlapse</span>
            </div>
          </div>

          {/* Resulting Video Duration Calculator Card */}
          {duration > 0 && (
            <div className="p-3 rounded-xl bg-surface-950 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-white">Estimated Output Duration</div>
                  <div className="text-[10px] text-slate-400">
                    Original: <span className="font-mono text-slate-300">{formatSecondsToTime(duration)}</span> → Output: <span className="font-mono text-emerald-300 font-bold">{formatSecondsToTime(duration / (parameters.speed || 1.5))}</span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {(parameters.speed || 1.5) > 1.0 ? `-${Math.round((1 - 1 / (parameters.speed || 1.5)) * 100)}% time` : `+${Math.round(((1 / (parameters.speed || 1.5)) - 1) * 100)}% time`}
              </span>
            </div>
          )}

          {/* Smooth Slow-Mo Frame Blending & Audio Handling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Optical Frame Blending</span>
                </div>
                <div className="text-[10px] text-slate-400">Prevents stuttering in slow-motion by blending adjacent frames</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parameters.motion_blur_smooth !== false}
                  onChange={(e) => updateParam('motion_blur_smooth', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Natural Voice Pitch Filter</div>
                <div className="text-[10px] text-slate-400">Preserves original voice tone without chipmunk distortion</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parameters.preserve_pitch !== false}
                  onChange={(e) => updateParam('preserve_pitch', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          </div>

          {/* Mute in Timelapse */}
          <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VolumeX className="h-4 w-4 text-slate-400" />
              <div>
                <div className="text-xs font-bold text-white">Mute Audio Track in Fast Motion</div>
                <div className="text-[10px] text-slate-400">Removes chaotic high-speed sound for clean timelapses</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={parameters.mute_audio === true}
                onChange={(e) => updateParam('mute_audio', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>
        </div>
      )}

      {/* F. RESIZE & SOCIAL PADDING APP WORKBENCH */}
      {toolId === 'video_resize' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-blue-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-white">Social Canvas & Aspect Scaler Studio</span>
            </div>
            <span className="text-[11px] text-blue-300 font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              Lanczos-3 Sinc Scaler
            </span>
          </div>

          {/* Aspect Ratio Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 block">Canvas Aspect Ratio Preset</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { id: '9:16', label: '9:16 Reels', sub: '1080×1920', icon: Smartphone },
                { id: '1:1', label: '1:1 Square', sub: '1080×1080', icon: Square },
                { id: '4:5', label: '4:5 Portrait', sub: '1080×1350', icon: LayoutGrid },
                { id: '16:9', label: '16:9 Landscape', sub: '1920×1080', icon: Monitor },
                { id: '21:9', label: '21:9 Cinema', sub: '2560×1080', icon: Film },
                { id: 'custom', label: 'Custom Canvas', sub: 'Any Res', icon: Settings2 },
              ].map((p) => {
                const active = (parameters.preset || '9:16') === p.id;
                const IconComp = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      updateParam('preset', p.id);
                      if (p.id === '9:16') { updateParam('width', 1080); updateParam('height', 1920); }
                      else if (p.id === '1:1') { updateParam('width', 1080); updateParam('height', 1080); }
                      else if (p.id === '4:5') { updateParam('width', 1080); updateParam('height', 1350); }
                      else if (p.id === '16:9') { updateParam('width', 1920); updateParam('height', 1080); }
                      else if (p.id === '21:9') { updateParam('width', 2560); updateParam('height', 1080); }
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition text-left ${
                      active
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-surface-950 border-surface-800 text-slate-400 hover:border-surface-700'
                    }`}
                  >
                    <IconComp className={`h-4 w-4 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="text-[11px] font-bold text-center leading-tight">{p.label}</span>
                    <span className="text-[9px] text-slate-400">{p.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Width & Height Inputs if custom */}
          {parameters.preset === 'custom' && (
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Canvas Width (px)</label>
                <input
                  type="number"
                  min={120}
                  max={7680}
                  step={2}
                  value={parameters.width || 1080}
                  onChange={(e) => updateParam('width', parseInt(e.target.value, 10) || 1080)}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Canvas Height (px)</label>
                <input
                  type="number"
                  min={120}
                  max={4320}
                  step={2}
                  value={parameters.height || 1920}
                  onChange={(e) => updateParam('height', parseInt(e.target.value, 10) || 1920)}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Framing / Fit Modes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 block">Framing & Social Aesthetic</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'blurred_background',
                  title: '✨ Ambient Blurred Clone (TikTok / Reels)',
                  desc: 'Scales and blurs video as dynamic background, keeping foreground video sharp and uncropped',
                },
                {
                  id: 'letterbox',
                  title: '⬛ Studio Letterbox / Pillarbox',
                  desc: 'Maintains exact aspect ratio with elegant solid borders (customizable background color)',
                },
                {
                  id: 'crop',
                  title: '✂️ Smart Center Zoom & Fill',
                  desc: 'Fills the complete frame with zero black bars by center-zooming the video',
                },
                {
                  id: 'stretch',
                  title: '↔️ Canvas Exact Stretch',
                  desc: 'Forces video to fill exact canvas dimensions without cropping or borders',
                },
              ].map((m) => {
                const active = (parameters.fit_mode || 'blurred_background') === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => updateParam('fit_mode', m.id)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      active
                        ? 'bg-blue-600/15 border-blue-500 text-white'
                        : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{m.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Letterbox Background Color Palette if letterbox */}
          {(parameters.fit_mode === 'letterbox') && (
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Letterbox Canvas Color</div>
                <div className="text-[10px] text-slate-400">Color filling the pillar/letterbox bars</div>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { color: '#000000', name: 'Black' },
                  { color: '#111827', name: 'Dark Gray' },
                  { color: '#ffffff', name: 'White' },
                  { color: '#1e1b4b', name: 'Deep Indigo' },
                  { color: '#064e3b', name: 'Dark Emerald' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    title={c.name}
                    onClick={() => updateParam('pad_color', c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`h-6 w-6 rounded-full border-2 transition ${
                      (parameters.pad_color || '#000000') === c.color ? 'border-blue-400 scale-110 shadow-md' : 'border-surface-700 opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sharpening & Quality Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span>Lanczos Edge Sharpen</span>
                </div>
                <div className="text-[10px] text-slate-400">Unsharp mask compensates for scaling blur</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parameters.sharpen !== false}
                  onChange={(e) => updateParam('sharpen', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Video Encoder</div>
                <div className="text-[10px] text-slate-400">H.265 (High Efficiency) or H.264 (Universal)</div>
              </div>
              <select
                value={parameters.codec || 'h264'}
                onChange={(e) => updateParam('codec', e.target.value)}
                className="bg-surface-900 border border-surface-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
              >
                <option value="h264">H.264 (AVC)</option>
                <option value="h265">H.265 (HEVC)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* F2. PRO MUTE & AUDIO TRACK DIRECTOR */}
      {(toolId === 'video_remove_audio' || toolId === 'remove_audio') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-rose-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VolumeX className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-bold text-white">Pro Mute & Audio Track Director</span>
            </div>
            <span className="text-[11px] text-rose-300 font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
              Lossless Demux Engine
            </span>
          </div>

          {/* Mode Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                id: 'complete',
                title: '⚡ Instant Zero-Loss Mute',
                badge: '< 0.3s runtime',
                desc: 'Lossless stream copy (-c:v copy -an). Strips all sound without re-encoding a single video pixel.',
              },
              {
                id: 'segment',
                title: '⏱️ Segment / Censor Mute',
                badge: 'Time-range censor',
                desc: 'Silences audio only during a specific interval (e.g. bleep/mute sensitive speech or noise).',
              },
              {
                id: 'primary_only',
                title: '🎚️ Discard Secondary Dubs',
                badge: 'Clean multi-track',
                desc: 'Keeps main sound track (Track 1) and strips commentator, secondary dubs, or descriptive tracks.',
              },
            ].map((m) => {
              const active = (parameters.mute_mode || 'complete') === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateParam('mute_mode', m.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    active
                      ? 'bg-rose-600/15 border-rose-500 text-white shadow-sm shadow-rose-500/20'
                      : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold">{m.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">{m.desc}</p>
                  </div>
                  <span className={`text-[9px] font-mono mt-2 self-start px-1.5 py-0.5 rounded ${
                    active ? 'bg-rose-500/20 text-rose-300' : 'bg-surface-900 text-slate-500'
                  }`}>
                    {m.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Segment Time Range Controls when segment */}
          {parameters.mute_mode === 'segment' && (
            <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Censor Silence Interval</span>
                <span className="text-[10px] text-slate-400">Audio will be 0% volume between start and end</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Start Silence</span>
                    <button
                      type="button"
                      onClick={() => updateParam('mute_start', currentTime.toFixed(2))}
                      className="text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Set Current ({formatSecondsToTime(currentTime)})
                    </button>
                  </div>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={duration || 3600}
                    value={parameters.mute_start || 0}
                    onChange={(e) => updateParam('mute_start', parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">End Silence</span>
                    <button
                      type="button"
                      onClick={() => updateParam('mute_end', currentTime.toFixed(2))}
                      className="text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Set Current ({formatSecondsToTime(currentTime)})
                    </button>
                  </div>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={duration || 3600}
                    value={parameters.mute_end || Math.min(duration || 10, 10)}
                    onChange={(e) => updateParam('mute_end', parseFloat(e.target.value) || 0)}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Lossless Indicator badge */}
          {parameters.mute_mode !== 'segment' && (
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-white">Guaranteed Bit-Perfect Video Stream</div>
                  <div className="text-[10px] text-slate-400">Preserves original video bitrate, color matrix, HDR metadata, and timestamps</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                PASSTHROUGH
              </span>
            </div>
          )}
        </div>
      )}

      {/* F3. EXTRACT AUDIO & TRACK RIPPER STUDIO */}
      {(toolId === 'extract_audio' || toolId === 'video_extract_audio') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Audio Studio & Sound Ripper</span>
            </div>
            <span className="text-[11px] text-amber-300 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              Lossless Demux & Mastering
            </span>
          </div>

          {/* Format Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300">Target Audio Format & Codec</label>
              {parameters.lossless_copy && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  STREAM COPY ACTIVE
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'mp3', label: 'MP3', sub: 'Universal 320k', tag: 'Most Compatible' },
                { id: 'flac', label: 'FLAC', sub: '24-bit Lossless', tag: 'Audiophile Master' },
                { id: 'wav', label: 'WAV', sub: 'Uncompressed PCM', tag: 'Studio Raw' },
                { id: 'm4a', label: 'AAC / M4A', sub: 'Apple Spec', tag: 'High Efficiency' },
                { id: 'ogg', label: 'OGG', sub: 'Vorbis Q5', tag: 'Open Standard' },
              ].map((fmt) => {
                const active = (parameters.format || 'mp3') === fmt.id && !parameters.lossless_copy;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      updateParam('format', fmt.id);
                      updateParam('lossless_copy', false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      active
                        ? 'bg-amber-600/20 border-amber-500 text-white shadow-sm shadow-amber-500/20'
                        : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{fmt.label}</div>
                      <div className="text-[10px] text-slate-400">{fmt.sub}</div>
                    </div>
                    <span className="text-[8px] text-amber-400/80 font-mono mt-1.5">{fmt.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Stream Demux Toggle Card */}
          <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Direct Stream Demux (Instant 0.1s Copy)</div>
                <div className="text-[10px] text-slate-400">Rips original embedded audio stream with 0% transcoding loss</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={parameters.lossless_copy === true}
                onChange={(e) => updateParam('lossless_copy', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* Bitrate Selector (when transcoding) */}
          {!parameters.lossless_copy && (parameters.format === 'mp3' || parameters.format === 'm4a' || !parameters.format) && (
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Target Audio Bitrate</span>
                <span className="text-[10px] text-slate-400">Higher bitrates deliver cleaner high-frequencies and wider stereo soundstage</span>
              </div>
              <div className="flex gap-1.5">
                {[128, 192, 256, 320].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => updateParam('bitrate', b)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      (parameters.bitrate || 192) === b
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-surface-900 border-surface-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {b}k
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Audio Mastering & Post-Processing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-amber-400" />
                  <span>EBU R128 Loudness Normalization</span>
                </div>
                <div className="text-[10px] text-slate-400">Auto-levels volume to broadcast standard (-16 LUFS)</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parameters.normalize === true}
                  onChange={(e) => updateParam('normalize', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600" />
              </label>
            </div>

            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Vocal & Dialogue Clarity Filter</span>
                </div>
                <div className="text-[10px] text-slate-400">Isolates speech frequencies and removes low rumble noise</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parameters.voice_enhance === true}
                  onChange={(e) => updateParam('voice_enhance', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600" />
              </label>
            </div>
          </div>

          {/* Segment Trimming Options */}
          <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Time-Segment Sound Extraction</span>
                <span className="text-[10px] text-slate-400">Extract only a specific portion of the soundtrack</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parameters.trim_range === true}
                  onChange={(e) => updateParam('trim_range', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600" />
              </label>
            </div>

            {parameters.trim_range && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-surface-800">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Start Time</span>
                    <button
                      type="button"
                      onClick={() => updateParam('start_time', formatSecondsToTime(currentTime))}
                      className="text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      Set Current ({formatSecondsToTime(currentTime)})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={parameters.start_time || '00:00:00'}
                    onChange={(e) => updateParam('start_time', e.target.value)}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">End Time</span>
                    <button
                      type="button"
                      onClick={() => updateParam('end_time', formatSecondsToTime(currentTime))}
                      className="text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      Set Current ({formatSecondsToTime(currentTime)})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={parameters.end_time || formatSecondsToTime(Math.min(duration || 30, 30))}
                    onChange={(e) => updateParam('end_time', e.target.value)}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* G. DUAL AUDIO TRACK MIXER & DUBBING APP WORKBENCH */}
      {(toolId === 'video_add_audio' || toolId === 'add_audio') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-violet-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-bold text-white">Dual Audio Mixer & Dubbing Studio</span>
            </div>
            <span className="text-[11px] text-violet-300 font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
              Multi-Track Balance Engine
            </span>
          </div>

          {/* Secondary Audio Track Selection */}
          <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 space-y-2">
            <span className="text-[11px] text-slate-300 font-semibold block">Select Background Music / Voiceover Track</span>
            {audioLibraryFiles.length > 0 ? (
              <select
                value={parameters.secondary_file_id || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  updateParam('secondary_file_id', id);
                  const chosen = audioLibraryFiles.find((f) => String(f.id) === String(id));
                  if (chosen) updateParam('audio_filename', chosen.filename);
                }}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2.5 text-xs text-white"
              >
                <option value="">-- Choose an audio file from your library --</option>
                {audioLibraryFiles.map((af) => (
                  <option key={af.id} value={af.id}>
                    🎵 {af.filename} ({formatBytes(af.size_bytes)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-[11px] text-slate-400 p-2.5 rounded-lg bg-surface-900 border border-surface-800">
                Notice: Select or upload your soundtrack (MP3, WAV, AAC, FLAC) in the file slot above to mix with this video.
              </div>
            )}
          </div>

          {/* Dual Volume Sliders & Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-blue-400" />
                  <span>Original Video Audio</span>
                </span>
                <span className="text-blue-400 font-mono font-bold">{parameters.video_volume ?? 100}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={parameters.video_volume ?? 100}
                onChange={(e) => updateParam('video_volume', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex gap-1 pt-1">
                {[
                  { v: 0, label: 'Mute (0%)' },
                  { v: 30, label: 'Low (30%)' },
                  { v: 100, label: 'Normal (100%)' },
                  { v: 150, label: 'Boost (150%)' },
                ].map((b) => (
                  <button
                    key={b.v}
                    type="button"
                    onClick={() => updateParam('video_volume', b.v)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                      (parameters.video_volume ?? 100) === b.v
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-surface-900 border-surface-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Music className="h-3.5 w-3.5 text-violet-400" />
                  <span>Added Music / BGM</span>
                </span>
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
              <div className="flex gap-1 pt-1">
                {[
                  { v: 20, label: 'Subtle (20%)' },
                  { v: 50, label: 'Balanced (50%)' },
                  { v: 100, label: 'Full (100%)' },
                  { v: 150, label: 'Loud (150%)' },
                ].map((b) => (
                  <button
                    key={b.v}
                    type="button"
                    onClick={() => updateParam('audio_volume', b.v)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                      (parameters.audio_volume ?? 50) === b.v
                        ? 'bg-violet-600 text-white border-violet-500'
                        : 'bg-surface-900 border-surface-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pro Mixer Controls: Ducking, Looping, Passthrough */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-violet-400" />
                  <span>Smart Sidechain Ducking</span>
                </div>
                <div className="text-[10px] text-slate-400">Automatically lowers music volume when speech/dialogue is heard</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parameters.ducking === true}
                  onChange={(e) => updateParam('ducking', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-violet-600" />
              </label>
            </div>

            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-violet-400" />
                  <span>Auto-Loop Music Track</span>
                </div>
                <div className="text-[10px] text-slate-400">Repeats soundtrack seamlessly if video is longer than audio</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parameters.loop_audio !== false}
                  onChange={(e) => updateParam('loop_audio', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-violet-600" />
              </label>
            </div>
          </div>

          {/* Lossless Video Stream Copy Badge */}
          <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Lossless Video Passthrough (-c:v copy)</div>
                <div className="text-[10px] text-slate-400">Zero re-encoding on video frames: renders at lightning speed with 100% video quality preserved</div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ZERO PIXEL LOSS
            </span>
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

      {/* I. HERO FRAME & CINEMA STORYBOARD SUITE */}
      {(toolId === 'video_thumbnail' || toolId === 'extract_frame') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-teal-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-bold text-white">Hero Frame & Cinema Storyboard Suite</span>
            </div>
            <span className="text-[11px] text-teal-300 font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
              Full-Sensor 4K Raw Grab
            </span>
          </div>

          {/* Extraction Mode Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                id: 'single',
                title: '📸 Hero Still Frame',
                desc: 'Uncompressed raw full-resolution grab at exact keyframe',
              },
              {
                id: 'storyboard',
                title: '🎞️ Cinema Storyboard Sheet',
                desc: 'Evenly sampled multi-frame contact sheet with timecode badges',
              },
              {
                id: 'burst',
                title: '⚡ Action Burst Sequence',
                desc: 'High-speed sequence of 5-20 frames around the scrub mark',
              },
            ].map((m) => {
              const active = (parameters.extract_mode || 'single') === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateParam('extract_mode', m.id)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    active
                      ? 'bg-teal-600/20 border-teal-500 text-white shadow-sm shadow-teal-500/20'
                      : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                  }`}
                >
                  <div className="text-xs font-bold">{m.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{m.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Mode-specific controls */}
          {parameters.extract_mode === 'storyboard' ? (
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">Storyboard Grid Matrix</span>
                  <p className="text-[10px] text-slate-400">Samples key moments across video duration</p>
                </div>
                <div className="flex gap-1.5">
                  {[
                    { id: '2x2', label: '2×2 (4 frames)' },
                    { id: '3x3', label: '3×3 (9 frames)' },
                    { id: '4x4', label: '4×4 (16 frames)' },
                    { id: '5x3', label: '5×3 (15 frames)' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => updateParam('grid', g.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold border transition ${
                        (parameters.grid || '3x3') === g.id
                          ? 'bg-teal-600 text-white border-teal-500'
                          : 'bg-surface-900 border-surface-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : parameters.extract_mode === 'burst' ? (
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white">Burst Frame Count</span>
                <p className="text-[10px] text-slate-400">Extracted consecutively around {formatSecondsToTime(currentTime)}</p>
              </div>
              <div className="flex gap-1.5">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => updateParam('burst_count', count)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      (parameters.burst_count || 10) === count
                        ? 'bg-teal-600 text-white border-teal-500'
                        : 'bg-surface-900 border-surface-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {count} frames
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-white block">Current Scrub Mark: {formatSecondsToTime(currentTime)}</span>
                <span className="text-[10px] text-slate-400">Scrub above video timeline to target your exact frame</span>
              </div>
              <button
                type="button"
                onClick={captureFrameAtCurrentTime}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/30 btn-press"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Snap Frame at {formatSecondsToTime(currentTime)}</span>
              </button>
            </div>
          )}

          {/* Captured Preview Card */}
          {capturedThumb && (
            <div className="p-3 rounded-xl bg-surface-950 border border-teal-500/40 flex items-center gap-3">
              <img src={capturedThumb} alt="Hero Snapshot" className="h-16 w-28 object-cover rounded-lg border border-surface-700 shadow" />
              <div className="text-xs space-y-0.5 flex-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-teal-400" />
                  <span>Frame Staged for Export</span>
                </div>
                <div className="text-[11px] text-slate-400">Target Time: {formatSecondsToTime(currentTime)} ({currentTime.toFixed(2)}s)</div>
                <div className="text-[11px] text-slate-400">Sensor Resolution: {videoDimensions.width || 1920}×{videoDimensions.height || 1080}</div>
              </div>
            </div>
          )}

          {/* Format & Enhancement Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Export Image Format</span>
                <span className="text-[10px] text-slate-400">PNG Lossless, WebP Compact, or JPEG</span>
              </div>
              <select
                value={parameters.format || 'png'}
                onChange={(e) => updateParam('format', e.target.value)}
                className="bg-surface-900 border border-surface-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
              >
                <option value="png">PNG (Lossless 24-bit)</option>
                <option value="webp">WebP (Smallest File)</option>
                <option value="jpeg">JPEG (High Quality 95%)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                  <span>Unsharp Detail Boost</span>
                </div>
                <div className="text-[10px] text-slate-400">Enhances edges and micro-contrast for thumbnail clickability</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={parameters.enhance !== false}
                  onChange={(e) => updateParam('enhance', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-600" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* J. VIDEO ROTATE & MIRROR WORKBENCH */}
      {toolId === 'video_rotate' && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-sky-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className="h-4 w-4 text-sky-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Orientation & 3D Mirror Studio</span>
            </div>
            <span className="text-[10px] bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 rounded border border-sky-500/30">
              Lossless & Orthogonal Matrix
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { deg: 90, label: '90° CW', sub: 'Turn Right' },
              { deg: 180, label: '180° Invert', sub: 'Upside Down' },
              { deg: 270, label: '270° CCW', sub: 'Turn Left' },
              { deg: 0, label: '0° Normal', sub: 'Reset Angle' }
            ].map((r) => {
              const active = (parameters.degrees || 0) === r.deg;
              return (
                <button
                  key={r.deg}
                  type="button"
                  onClick={() => updateParam('degrees', r.deg)}
                  className={`p-3 rounded-xl border text-center transition ${
                    active
                      ? 'bg-sky-500/20 border-sky-500 text-white shadow-sm shadow-sky-500/20'
                      : 'bg-surface-950 border-surface-800 text-slate-300 hover:border-surface-700'
                  }`}
                >
                  <div className="font-bold text-xs">{r.label}</div>
                  <div className="text-[10px] text-slate-400">{r.sub}</div>
                </button>
              );
            })}
          </div>

          {/* Mirror & Invert Toggles */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateParam('flip_h', !parameters.flip_h)}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                parameters.flip_h
                  ? 'bg-sky-500/20 border-sky-500 text-white'
                  : 'bg-surface-950 border-surface-800 text-slate-400 hover:border-surface-700'
              }`}
            >
              <div>
                <div className="text-xs font-bold">Flip Horizontal</div>
                <div className="text-[10px] text-slate-400">Mirror selfie / front-cam</div>
              </div>
              <div className={`w-3.5 h-3.5 rounded-full border ${parameters.flip_h ? 'bg-sky-400 border-sky-400' : 'border-surface-600'}`} />
            </button>

            <button
              type="button"
              onClick={() => updateParam('flip_v', !parameters.flip_v)}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                parameters.flip_v
                  ? 'bg-sky-500/20 border-sky-500 text-white'
                  : 'bg-surface-950 border-surface-800 text-slate-400 hover:border-surface-700'
              }`}
            >
              <div>
                <div className="text-xs font-bold">Flip Vertical</div>
                <div className="text-[10px] text-slate-400">Invert top to bottom</div>
              </div>
              <div className={`w-3.5 h-3.5 rounded-full border ${parameters.flip_v ? 'bg-sky-400 border-sky-400' : 'border-surface-600'}`} />
            </button>
          </div>

          {/* Lossless Metadata Switch */}
          <div className="flex items-center justify-between p-3 bg-surface-950 rounded-xl border border-surface-800">
            <div className="flex items-center gap-2">
              <input
                id="lossless_metadata_toggle"
                type="checkbox"
                checked={Boolean(parameters.lossless_metadata)}
                onChange={(e) => updateParam('lossless_metadata', e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-surface-900 border-surface-700"
              />
              <label htmlFor="lossless_metadata_toggle" className="text-xs text-slate-300 font-semibold cursor-pointer">
                0-Second Lossless Metadata Tag Fix
              </label>
            </div>
            <span className="text-[10px] text-sky-300">Instant (No Re-encoding)</span>
          </div>
        </div>
      )}

      {/* K. REWIND & BOOMERANG FX WORKBENCH */}
      {(toolId === 'video_reverse' || toolId === 'boomerang') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-teal-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Rewind & Boomerang FX Studio</span>
            </div>
            <span className="text-[10px] bg-teal-500/20 text-teal-300 font-semibold px-2 py-0.5 rounded border border-teal-500/30">
              Bi-Directional Video Loop
            </span>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { mode: true, title: 'Boomerang FX', desc: 'Forward then Backward Loop (Instagram Style)' },
              { mode: false, title: 'Full Reverse Only', desc: 'Rewind video from end to start' }
            ].map((m) => {
              const active = Boolean(parameters.boomerang !== false) === m.mode;
              return (
                <button
                  key={String(m.mode)}
                  type="button"
                  onClick={() => updateParam('boomerang', m.mode)}
                  className={`p-3 rounded-xl border text-left transition ${
                    active
                      ? 'bg-teal-500/20 border-teal-500 text-white shadow-sm shadow-teal-500/20'
                      : 'bg-surface-950 border-surface-800 text-slate-400 hover:border-surface-700'
                  }`}
                >
                  <div className="text-xs font-bold">{m.title}</div>
                  <div className="text-[10px] text-slate-400">{m.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Velocity Speed Multiplier */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">Playback Velocity</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 0.5, label: '0.5x Slo-Mo' },
                { val: 1.0, label: '1.0x Normal' },
                { val: 1.5, label: '1.5x Snappy' },
                { val: 2.0, label: '2.0x Hyper' }
              ].map((sp) => {
                const active = (parameters.speed || 1.0) === sp.val;
                return (
                  <button
                    key={sp.val}
                    type="button"
                    onClick={() => updateParam('speed', sp.val)}
                    className={`p-2 rounded-xl border text-center transition ${
                      active
                        ? 'bg-teal-500/20 border-teal-500 text-white'
                        : 'bg-surface-950 border-surface-800 text-slate-400 hover:border-surface-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{sp.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audio Reverse Option */}
          <div className="flex items-center justify-between p-3 bg-surface-950 rounded-xl border border-surface-800">
            <div className="flex items-center gap-2">
              <input
                id="reverse_audio_toggle"
                type="checkbox"
                checked={parameters.reverse_audio !== false}
                onChange={(e) => updateParam('reverse_audio', e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 focus:ring-0 bg-surface-900 border-surface-700"
              />
              <label htmlFor="reverse_audio_toggle" className="text-xs text-slate-300 font-semibold cursor-pointer">
                Synchronized Audio Reversal
              </label>
            </div>
            <span className="text-[10px] text-slate-400">Uncheck to produce clean silent video</span>
          </div>
        </div>
      )}

      {/* L. INFINITE SEAMLESS LOOPER WORKBENCH */}
      {(toolId === 'video_loop' || toolId === 'loop_video') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Infinite Seamless Looper Studio</span>
            </div>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-semibold px-2 py-0.5 rounded border border-cyan-500/30">
              Instant Stream Copy Multiplex
            </span>
          </div>

          {/* Loop Multiplier Selector */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">Loop Repeat Count</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { count: 2, label: '2x Loops', sub: 'Double Play' },
                { count: 3, label: '3x Loops', sub: 'Social Reels' },
                { count: 5, label: '5x Loops', sub: 'Extended Story' },
                { count: 10, label: '10x Loops', sub: 'Long Loop' }
              ].map((lp) => {
                const active = (parameters.count || 3) === lp.count;
                return (
                  <button
                    key={lp.count}
                    type="button"
                    onClick={() => updateParam('count', lp.count)}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      active
                        ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-sm shadow-cyan-500/20'
                        : 'bg-surface-950 border-surface-800 text-slate-400 hover:border-surface-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{lp.label}</div>
                    <div className="text-[9px] text-slate-400">{lp.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculated Output Duration Badge */}
          {duration > 0 && (
            <div className="flex items-center justify-between p-2.5 bg-surface-950 rounded-xl border border-surface-800 text-xs">
              <span className="text-slate-400">Calculated Final Duration:</span>
              <span className="font-mono font-bold text-cyan-300">
                {formatSecondsToTime(duration * (parameters.count || 3))} ({parameters.count || 3}x of {formatSecondsToTime(duration)})
              </span>
            </div>
          )}

          {/* Stream copy toggle */}
          <div className="flex items-center justify-between p-3 bg-surface-950 rounded-xl border border-surface-800">
            <div className="flex items-center gap-2">
              <input
                id="stream_copy_loop"
                type="checkbox"
                checked={parameters.stream_copy !== false}
                onChange={(e) => updateParam('stream_copy', e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-surface-900 border-surface-700"
              />
              <label htmlFor="stream_copy_loop" className="text-xs text-slate-300 font-semibold cursor-pointer">
                Zero-Loss 0.1-Sec Stream Copy
              </label>
            </div>
            <span className="text-[10px] text-cyan-300">Instant multiplexing</span>
          </div>
        </div>
      )}

      {/* M. MULTI-CLIP STITCHER & CONCAT WORKBENCH */}
      {(toolId === 'video_concat' || toolId === 'concat_video') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-indigo-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Multi-Clip Stitcher & Timeline Joiner</span>
            </div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded border border-indigo-500/30">
              Conforming Timeline Engine
            </span>
          </div>

          {/* Sequence list */}
          <div className="space-y-2">
            <label className="block text-[11px] text-slate-400 font-semibold">Timeline Sequence</label>
            <div className="space-y-1.5 p-2 bg-surface-950 rounded-xl border border-surface-800">
              {/* Primary clip */}
              <div className="flex items-center justify-between p-2 bg-surface-900 rounded-lg text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="text-white font-medium truncate">{file.original_filename}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">Primary Clip</span>
              </div>

              {/* Additional clips */}
              {(parameters.additional_file_ids || []).map((fid: any, idx: number) => {
                const matchedFile = libraryFiles.find((f) => f.id === fid);
                return (
                  <div key={fid} className="flex items-center justify-between p-2 bg-surface-900 rounded-lg text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-surface-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 2}
                      </span>
                      <span className="text-slate-200 font-medium truncate">
                        {matchedFile ? matchedFile.original_filename : `Clip #${fid}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextIds = (parameters.additional_file_ids || []).filter((id: any) => id !== fid);
                        updateParam('additional_file_ids', nextIds);
                      }}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* Add clip picker from library */}
              {libraryFiles.filter((f) => f.id !== file.id && f.mime_type?.startsWith('video/')).length > 0 && (
                <div className="pt-1.5">
                  <select
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const selectedId = isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value);
                      const current = parameters.additional_file_ids || [];
                      if (!current.includes(selectedId)) {
                        updateParam('additional_file_ids', [...current, selectedId]);
                      }
                    }}
                    className="w-full bg-surface-900 border border-surface-700 rounded-lg p-2 text-xs text-indigo-300"
                  >
                    <option value="">+ Append Next Clip From Library...</option>
                    {libraryFiles
                      .filter((f) => f.id !== file.id && f.mime_type?.startsWith('video/'))
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.original_filename} ({formatBytes(f.size_bytes)})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Conforming resolution */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">Target Conforming Resolution</label>
              <select
                value={parameters.resolution || '1080p'}
                onChange={(e) => updateParam('resolution', e.target.value)}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-xs text-white"
              >
                <option value="1080p">1080p Full HD (Standard)</option>
                <option value="720p">720p HD (Fast Render)</option>
                <option value="4k">4K Ultra HD (Cinema Master)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">Stitching Strategy</label>
              <div className="flex items-center h-9 px-3 bg-surface-950 rounded-lg border border-surface-800">
                <input
                  id="concat_stream_copy"
                  type="checkbox"
                  checked={parameters.stream_copy !== false}
                  onChange={(e) => updateParam('stream_copy', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-500 focus:ring-0 bg-surface-900 border-surface-700"
                />
                <label htmlFor="concat_stream_copy" className="ml-2 text-xs text-slate-300 font-medium cursor-pointer">
                  Zero-Loss Stream Copy
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* N. STUDIO VOLUME & GAIN EQUALIZER WORKBENCH */}
      {(toolId === 'video_adjust_volume' || toolId === 'adjust_volume') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Studio Volume & Gain Equalizer</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/30">
              Lossless Video Stream Copy
            </span>
          </div>

          {/* Volume Multiplier Presets */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">Volume Multiplier</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { val: '50%', label: '50%', sub: 'Half' },
                { val: '75%', label: '75%', sub: '-25%' },
                { val: '150%', label: '150%', sub: '+50%' },
                { val: '200%', label: '200%', sub: 'Double' },
                { val: '300%', label: '300%', sub: 'Triple' }
              ].map((vol) => {
                const active = (parameters.volume || '150%') === vol.val;
                return (
                  <button
                    key={vol.val}
                    type="button"
                    onClick={() => updateParam('volume', vol.val)}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      active
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-sm shadow-amber-500/20'
                        : 'bg-surface-950 border-surface-800 text-slate-400 hover:border-surface-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{vol.label}</div>
                    <div className="text-[9px] text-slate-400">{vol.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anti-Clip & Dialogue Boost Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-surface-950 rounded-xl border border-surface-800">
              <div className="flex items-center gap-2">
                <input
                  id="anti_clip_toggle"
                  type="checkbox"
                  checked={parameters.anti_clip !== false}
                  onChange={(e) => updateParam('anti_clip', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-surface-900 border-surface-700"
                />
                <label htmlFor="anti_clip_toggle" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Anti-Clip Soft Limiter
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-950 rounded-xl border border-surface-800">
              <div className="flex items-center gap-2">
                <input
                  id="dialogue_boost_toggle"
                  type="checkbox"
                  checked={Boolean(parameters.dialogue_boost)}
                  onChange={(e) => updateParam('dialogue_boost', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-surface-900 border-surface-700"
                />
                <label htmlFor="dialogue_boost_toggle" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Dialogue Speech Lift
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200">
            <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Zero Transcoding Delay on Video:</strong> Passes through original H.264/HEVC video frames bit-for-bit without touching video quality, ensuring 100% preservation while amplifying sound channels with soft limiting.
            </span>
          </div>
        </div>
      )}

      {/* O. CINEMA FRAME RATE & CADENCE WORKBENCH */}
      {(toolId === 'video_change_fps' || toolId === 'change_fps') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-slate-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-300" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Cinema Frame Rate & Cadence Studio</span>
            </div>
            <span className="text-[10px] bg-slate-500/20 text-slate-300 font-semibold px-2 py-0.5 rounded border border-slate-500/30">
              Cadence Motion Conformance
            </span>
          </div>

          {/* Cadence Selection */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">Target Cadence (FPS)</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { val: 24, label: '24 FPS', sub: 'Film Cadence' },
                { val: 25, label: '25 FPS', sub: 'PAL Europe' },
                { val: 30, label: '30 FPS', sub: 'Web Standard' },
                { val: 60, label: '60 FPS', sub: 'Smooth Action' },
                { val: 120, label: '120 FPS', sub: 'High Frame Rate' }
              ].map((cad) => {
                const active = (parameters.fps || 30) === cad.val;
                return (
                  <button
                    key={cad.val}
                    type="button"
                    onClick={() => updateParam('fps', cad.val)}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      active
                        ? 'bg-slate-400/20 border-slate-300 text-white shadow-sm shadow-white/10'
                        : 'bg-surface-950 border-surface-800 text-slate-400 hover:border-surface-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{cad.label}</div>
                    <div className="text-[9px] text-slate-400">{cad.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-slate-500/10 border border-slate-500/20 rounded-xl text-[11px] text-slate-300">
            <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Motion Cadence Resampling:</strong> Re-indexes timestamps to the exact target cadence while preserving bit-perfect audio sync without pitch drifting or jitter.
            </span>
          </div>
        </div>
      )}

      {/* P. GIMBAL SHAKY CAM STABILIZER WORKBENCH */}
      {(toolId === 'video_stabilize' || toolId === 'stabilize') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Gimbal Shaky Cam Stabilizer</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
              Motion Vector Compensation
            </span>
          </div>

          <div className="p-3 bg-surface-950 rounded-xl border border-surface-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Motion Stabilization Profile</span>
              <span className="text-emerald-400 font-mono text-[11px]">Hardware Accelerated</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Detects camera rotational wobble, walking stride bounces, and hand tremors, synthesizing smooth fluid camera movements.
            </p>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-200">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Full Sensor Pass:</strong> Calculates horizontal, vertical, and rotational motion vectors across consecutive frames to smooth jerky camera movements without edge distortion.
            </span>
          </div>
        </div>
      )}

      {/* Q. CINEMA CAPTION & SUBTITLE HARDCODER WORKBENCH */}
      {(toolId === 'video_burn_subtitles' || toolId === 'burn_subtitles') && (
        <div className="p-4 rounded-2xl bg-surface-900 border border-blue-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Captions className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Cinema Caption & Subtitle Hardcoder</span>
            </div>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-500/30">
              SRT / VTT / ASS Permanent Burn
            </span>
          </div>

          {/* Subtitle File Picker from Library */}
          <div className="space-y-1.5">
            <label className="block text-[11px] text-slate-400 font-semibold">
              Subtitle File (Select from Library)
            </label>
            <select
              value={parameters.secondary_file_id || ''}
              onChange={(e) => updateParam('secondary_file_id', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-xs text-white"
            >
              <option value="">
                {libraryFiles.filter((f) => f.mime_type?.includes('subrip') || f.original_filename?.endsWith('.srt') || f.original_filename?.endsWith('.vtt') || f.original_filename?.endsWith('.ass')).length > 0
                  ? 'Select subtitle track...'
                  : 'No subtitle files found in library (drag & drop an .srt or .vtt file)'}
              </option>
              {libraryFiles
                .filter((f) => f.id !== file.id && (f.mime_type?.includes('subrip') || f.original_filename?.endsWith('.srt') || f.original_filename?.endsWith('.vtt') || f.original_filename?.endsWith('.ass')))
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.original_filename} ({formatBytes(f.size_bytes)})
                  </option>
                ))}
            </select>
          </div>

          {/* Font Size & Primary Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">Typography Size</label>
              <select
                value={parameters.font_size || 22}
                onChange={(e) => updateParam('font_size', parseInt(e.target.value, 10))}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-xs text-white"
              >
                <option value={18}>18px (Compact Mobile)</option>
                <option value={22}>22px (Standard Cinema)</option>
                <option value={28}>28px (Large Prominent)</option>
                <option value={34}>34px (High-Visibility Jumbo)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">Caption Palette</label>
              <select
                value={parameters.primary_color || '&H00FFFFFF'}
                onChange={(e) => updateParam('primary_color', e.target.value)}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-xs text-white"
              >
                <option value="&H00FFFFFF">Crisp Cinema White</option>
                <option value="&H0000FFFF">Classic Documentary Yellow</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
