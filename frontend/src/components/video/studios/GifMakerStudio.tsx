import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Repeat,
  Sliders,
  Check,
  AlertTriangle,
  Monitor,
  Flame,
  Film
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';
import { FilmstripScrubber } from '../core/FilmstripScrubber';

interface GifMakerStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const GifMakerStudio: React.FC<GifMakerStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [startTime, setStartTime] = useState<number>(Number(parameters.start_time || parameters.start || 0));
  const [endTime, setEndTime] = useState<number>(Number(parameters.end_time || parameters.end || 0));

  const [fps, setFps] = useState<number>(Number(parameters.fps || 15));
  const [width, setWidth] = useState<number>(Number(parameters.width || 480));
  const [dither, setDither] = useState<string>(parameters.dither || 'sierra2_4a');
  const [infiniteLoop, setInfiniteLoop] = useState<boolean>(parameters.infinite_loop !== false);
  const [speed, setSpeed] = useState<number>(Number(parameters.speed || 1.0));

  const formatSeconds = (sec: number): string => {
    if (isNaN(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const updateParent = (updates: Partial<{
    start: string;
    end: string;
    fps: number;
    width: number;
    dither: string;
    infinite_loop: boolean;
    speed: number;
  }>) => {
    const nextStart = updates.start !== undefined ? updates.start : formatSeconds(startTime);
    const nextEnd = updates.end !== undefined ? updates.end : formatSeconds(endTime > 0 ? endTime : Math.min(5, duration));
    const nextFps = updates.fps !== undefined ? updates.fps : fps;
    const nextWidth = updates.width !== undefined ? updates.width : width;
    const nextDither = updates.dither !== undefined ? updates.dither : dither;
    const nextLoop = updates.infinite_loop !== undefined ? updates.infinite_loop : infiniteLoop;
    const nextSpeed = updates.speed !== undefined ? updates.speed : speed;

    onParametersChange({
      ...parameters,
      start: nextStart,
      start_time: nextStart,
      end: nextEnd,
      end_time: nextEnd,
      fps: nextFps,
      width: nextWidth,
      dither: nextDither,
      infinite_loop: nextLoop,
      speed: nextSpeed,
    });
  };

  const handleLoadedMetadata = (dims: { width: number; height: number; duration?: number }) => {
    if (dims.duration && dims.duration > 0) {
      setDuration(dims.duration);
      // Default to 5 second GIF max to avoid accidental massive GIFs
      const defaultEnd = Math.min(dims.duration, 5);
      if (endTime === 0 || endTime > dims.duration) {
        setEndTime(defaultEnd);
        updateParent({
          start: formatSeconds(0),
          end: formatSeconds(defaultEnd),
        });
      }
    }
  };

  const handleRangeChange = (start: number, end: number) => {
    setStartTime(start);
    setEndTime(end);
    updateParent({
      start: formatSeconds(start),
      end: formatSeconds(end),
    });
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const gifSpan = Math.max(0.1, (endTime || Math.min(duration, 5)) - startTime);
  // Rough size estimation model: bytes = (width * (width * 9/16)) * (fps * span) * 0.45 bytes per pixel after 2-pass palette
  const estimatedMB = Math.max(0.2, (width * (width * 0.5625) * (fps * gifSpan) * 0.45) / (1024 * 1024));

  const resolutionPresets = [
    { label: '320px', sub: 'Discord / Telegram', val: 320 },
    { label: '480px', sub: 'Standard Web (Balanced)', val: 480 },
    { label: '640px', sub: 'High Definition GIF', val: 640 },
    { label: '800px', sub: 'Ultra Crisp / Banner', val: 800 },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Video Player Monitor */}
      <VideoPlayerViewport
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={setCurrentTime}
      />

      {/* 2. Visual Clip Range Trimmer for GIF */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-inner space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-amber-400">
            <Film className="w-4 h-4" />
            <span>GIF Time Range Selector</span>
          </span>
          <span className="font-mono text-cyan-400 font-bold">
            Span: {gifSpan.toFixed(1)}s ({formatSeconds(startTime)} - {formatSeconds(endTime)})
          </span>
        </div>

        <FilmstripScrubber
          videoRef={videoRef}
          videoUrl={videoUrl}
          duration={duration}
          currentTime={currentTime}
          startTime={startTime}
          endTime={endTime}
          onRangeChange={handleRangeChange}
          onSeek={handleSeek}
        />
      </div>

      {/* 3. Resolution & Dimension Presets */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Monitor className="w-4 h-4" />
            <span>GIF Width Resolution</span>
          </span>
          <span className="font-mono text-cyan-400 font-bold">{width}px</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {resolutionPresets.map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => {
                setWidth(preset.val);
                updateParent({ width: preset.val });
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                width === preset.val
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-slate-200">{preset.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{preset.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Frame Rate & 2-Pass Palette Engine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Frame Rate Selection */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Zap className="w-4 h-4" />
              <span>Frame Rate (FPS)</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">{fps} FPS</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[10, 15, 20, 24].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFps(f);
                  updateParent({ fps: f });
                }}
                className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                  fps === f
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {f} FPS
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-500">
            15 FPS is optimal balance for smooth playback and lightweight size.
          </div>
        </div>

        {/* 2-Pass Palettegen Dither Engine */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Color Dithering Engine</span>
            </span>
            <span className="text-[11px] text-slate-500 capitalize">{dither}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { key: 'sierra2_4a', label: 'Sierra2 (Best)' },
              { key: 'floyd_steinberg', label: 'Floyd-Steinberg' },
              { key: 'bayer', label: 'Bayer Matrix' },
            ].map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  setDither(d.key);
                  updateParent({ dither: d.key });
                }}
                className={`py-2 px-1 text-center rounded-lg text-xs font-semibold border transition-all ${
                  dither === d.key
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-500">
            2-pass palette analyzes 16.7M colors to create a custom 256-color palette without color banding.
          </div>
        </div>
      </div>

      {/* 5. Output Budget Meter */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${
        estimatedMB > 15
          ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
          : estimatedMB > 8
          ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
          : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
      }`}>
        <div className="flex items-center gap-2.5">
          {estimatedMB > 15 ? (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          ) : (
            <Check className="w-5 h-5 shrink-0 text-emerald-400" />
          )}
          <div>
            <div className="text-xs font-bold">Estimated Output Size: ~{estimatedMB.toFixed(1)} MB</div>
            <div className="text-[11px] opacity-80">
              {estimatedMB > 15
                ? 'Large file! Consider shortening time span or reducing width to 480px.'
                : estimatedMB > 8
                ? 'Warning: Exceeds standard Discord 8MB free limit.'
                : 'Well within standard social and messaging upload budgets.'}
            </div>
          </div>
        </div>

        <div className="font-mono text-sm font-bold">
          {fps} fps • {width}px
        </div>
      </div>
    </div>
  );
};
