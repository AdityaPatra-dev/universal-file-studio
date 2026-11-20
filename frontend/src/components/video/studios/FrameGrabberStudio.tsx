import React, { useState, useRef } from 'react';
import {
  Camera,
  Grid,
  Image as ImageIcon,
  Sparkles,
  Download,
  Check,
  Film,
  Layers,
  Clock
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';
import { FilmstripScrubber } from '../core/FilmstripScrubber';

interface FrameGrabberStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const FrameGrabberStudio: React.FC<FrameGrabberStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(1);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });

  const [mode, setMode] = useState<'single' | 'storyboard' | 'burst'>(
    (parameters.mode as any) || 'single'
  );
  const [format, setFormat] = useState<string>(parameters.format || 'png');
  const [gridLayout, setGridLayout] = useState<string>(parameters.grid_layout || '3x3');
  const [sharpen, setSharpen] = useState<boolean>(parameters.sharpen !== false);
  const [snappedPreview, setSnappedPreview] = useState<string | null>(null);

  const formatSeconds = (sec: number): string => {
    if (isNaN(sec) || sec < 0) sec = 0;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const updateParent = (updates: Partial<{
    mode: 'single' | 'storyboard' | 'burst';
    format: string;
    grid_layout: string;
    sharpen: boolean;
    time: string;
    timestamp: string;
  }>) => {
    const nextMode = updates.mode !== undefined ? updates.mode : mode;
    const nextFmt = updates.format !== undefined ? updates.format : format;
    const nextGrid = updates.grid_layout !== undefined ? updates.grid_layout : gridLayout;
    const nextSharp = updates.sharpen !== undefined ? updates.sharpen : sharpen;
    const nextTime = updates.time !== undefined ? updates.time : formatSeconds(currentTime);

    onParametersChange({
      ...parameters,
      mode: nextMode,
      format: nextFmt,
      grid_layout: nextGrid,
      sharpen: nextSharp,
      time: nextTime,
      timestamp: nextTime,
    });
  };

  const handleLoadedMetadata = (dims: { width: number; height: number; duration?: number }) => {
    setVideoDims(dims);
    if (dims.duration && dims.duration > 0) {
      setDuration(dims.duration);
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    updateParent({ time: formatSeconds(time), timestamp: formatSeconds(time) });
  };

  // 1-Click Instant Canvas Frame Grabber
  const captureInstantFrame = () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = v.videoWidth || 1920;
      canvas.height = v.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
        setSnappedPreview(dataUrl);

        // Auto trigger download
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `frame_${formatSeconds(currentTime).replace(/[:.]/g, '_')}.${format}`;
        a.click();
      }
    } catch (e) {
      console.warn('Instant canvas capture restricted by CORS/Blob:', e);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Video Player Monitor */}
      <VideoPlayerViewport
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={setCurrentTime}
      />

      {/* 2. Filmstrip Frame Precision Scrubber with Micro-Steppers */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-inner space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Clock className="w-4 h-4" />
            <span>Target Snapshot Playhead</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400 font-bold">{formatSeconds(currentTime)}</span>
            <button
              type="button"
              onClick={captureInstantFrame}
              className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Snap Photo Now</span>
            </button>
          </div>
        </div>

        <FilmstripScrubber
          videoRef={videoRef}
          videoUrl={videoUrl}
          duration={duration}
          currentTime={currentTime}
          onSeek={handleSeek}
        />
      </div>

      {/* 3. Extraction Mode Selector: Single Frame vs Storyboard Grid vs Burst */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setMode('single');
            updateParent({ mode: 'single' });
          }}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
            mode === 'single'
              ? 'bg-cyan-500/15 border-cyan-500/60 shadow-md shadow-cyan-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2 rounded-lg mt-0.5 ${mode === 'single' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100">Hero Snapshot Frame</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Full native resolution still at playhead</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('storyboard');
            updateParent({ mode: 'storyboard' });
          }}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
            mode === 'storyboard'
              ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2 rounded-lg mt-0.5 ${mode === 'storyboard' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100">Storyboard Grid Sheet</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Narrative contact sheet of entire clip</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('burst');
            updateParent({ mode: 'burst' });
          }}
          className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
            mode === 'burst'
              ? 'bg-emerald-500/15 border-emerald-500/60 shadow-md shadow-emerald-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2 rounded-lg mt-0.5 ${mode === 'burst' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100">Burst Frame Sequence</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Extracts individual frames per second</div>
          </div>
        </button>
      </div>

      {/* 4. Format & Sharpening Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Image Format */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Output Image Format</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { ext: 'png', label: 'PNG Lossless', sub: 'Pristine 100%' },
              { ext: 'jpg', label: 'JPEG (95%)', sub: 'Compact' },
              { ext: 'webp', label: 'WebP', sub: 'Next-Gen Web' },
            ].map((f) => (
              <button
                key={f.ext}
                type="button"
                onClick={() => {
                  setFormat(f.ext);
                  updateParent({ format: f.ext });
                }}
                className={`p-2 rounded-lg border text-center transition-all ${
                  format === f.ext
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold uppercase">{f.ext}</div>
                <div className={`text-[10px] ${format === f.ext ? 'text-slate-950' : 'text-slate-500'}`}>{f.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Storyboard Grid Selector (when in storyboard mode) or Sharpening */}
        {mode === 'storyboard' ? (
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-amber-400" />
              <span>Contact Sheet Grid Layout</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: '2x2', label: '2×2 (4 Frames)' },
                { key: '3x3', label: '3×3 (9 Frames)' },
                { key: '4x4', label: '4×4 (16 Frames)' },
              ].map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => {
                    setGridLayout(g.key);
                    updateParent({ grid_layout: g.key });
                  }}
                  className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                    gridLayout === g.key
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Lanczos-3 Sinc Sharpening</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Enhances crisp boundary edges on extracted image still
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !sharpen;
                setSharpen(next);
                updateParent({ sharpen: next });
              }}
              className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
                sharpen ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  sharpen ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
