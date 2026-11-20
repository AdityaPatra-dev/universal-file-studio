import React, { useState, useRef } from 'react';
import {
  Repeat,
  Zap,
  Sparkles,
  Clock,
  Layers,
  Sliders,
  Check,
  TrendingUp,
  Film
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';

interface SeamlessLooperStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const SeamlessLooperStudio: React.FC<SeamlessLooperStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);

  const [count, setCount] = useState<number>(Number(parameters.count || 3));
  const [streamCopy, setStreamCopy] = useState<boolean>(parameters.stream_copy !== false);

  const updateParent = (updates: Partial<{
    count: number;
    stream_copy: boolean;
  }>) => {
    const nextCount = updates.count !== undefined ? updates.count : count;
    const nextCopy = updates.stream_copy !== undefined ? updates.stream_copy : streamCopy;

    onParametersChange({
      ...parameters,
      count: nextCount,
      stream_copy: nextCopy,
    });
  };

  const handleLoadedMetadata = (dims: { width: number; height: number; duration?: number }) => {
    if (dims.duration && dims.duration > 0) {
      setDuration(dims.duration);
    }
  };

  const loopPresets = [
    { count: 2, label: '2x Loops', sub: 'Double Play' },
    { count: 3, label: '3x Loops', sub: 'Reels / Shorts' },
    { count: 5, label: '5x Loops', sub: 'Extended Story' },
    { count: 10, label: '10x Loops', sub: 'Kiosk / Display' },
  ];

  const formatSeconds = (sec: number): string => {
    if (isNaN(sec) || sec < 0) sec = 0;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalCalculatedSeconds = duration * count;

  return (
    <div className="space-y-4">
      {/* 1. Video Player Monitor with native looping preview */}
      <VideoPlayerViewport
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* 2. Loop Multiplier Selector */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">Repeat Loop Multiplier</div>
              <div className="text-xs text-slate-400">Creates a single continuous video file repeating {count} times</div>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold font-mono text-lg">
            {count}×
          </div>
        </div>

        {/* Preset Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {loopPresets.map((p) => {
            const isSelected = count === p.count;
            return (
              <button
                key={p.count}
                type="button"
                onClick={() => {
                  setCount(p.count);
                  updateParent({ count: p.count });
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-sm">{p.label}</div>
                <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-950' : 'text-slate-500'}`}>
                  {p.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* Fine Count Slider (2 to 25 repeats) */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>2 repeats (Min)</span>
            <span className="font-mono text-cyan-400 font-medium">Drag to set custom loop count</span>
            <span>25 repeats (Max)</span>
          </div>
          <input
            type="range"
            min="2"
            max="25"
            step="1"
            value={count}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setCount(val);
              updateParent({ count: val });
            }}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 3. Duration Telemetry & 0.1s Stream Copy Multiplexer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Total Runtime Calculator */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Resulting Timeline Duration</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {formatSeconds(duration)} × {count} repeats
            </div>
          </div>
          <div className="font-mono text-sm font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/30">
            {formatSeconds(totalCalculatedSeconds)}
          </div>
        </div>

        {/* 0.1s Stream Copy Engine */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Stream Copy Multiplex</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Loops packets in 0.1 seconds without re-encoding
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !streamCopy;
              setStreamCopy(next);
              updateParent({ stream_copy: next });
            }}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
              streamCopy ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                streamCopy ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
