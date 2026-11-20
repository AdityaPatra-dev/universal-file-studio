import React, { useState, useRef } from 'react';
import {
  Film,
  Repeat,
  Sparkles,
  Zap,
  Check,
  ShieldCheck,
  Smartphone,
  Share2
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';

interface GifToVideoStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const GifToVideoStudio: React.FC<GifToVideoStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [fps, setFps] = useState<number>(Number(parameters.fps || 30));
  const [loopCount, setLoopCount] = useState<number>(Number(parameters.loop_count || 3));
  const [crf, setCrf] = useState<number>(Number(parameters.crf || 18));

  const updateParent = (updates: Partial<{
    fps: number;
    loop_count: number;
    crf: number;
  }>) => {
    const nextFps = updates.fps !== undefined ? updates.fps : fps;
    const nextLoop = updates.loop_count !== undefined ? updates.loop_count : loopCount;
    const nextCrf = updates.crf !== undefined ? updates.crf : crf;

    onParametersChange({
      ...parameters,
      fps: nextFps,
      loop_count: nextLoop,
      crf: nextCrf,
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. GIF Source Monitor */}
      <VideoPlayerViewport
        ref={videoRef}
        src={videoUrl}
      />

      {/* 2. Social Story Minimum Duration Loop Padder */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Smartphone className="w-4 h-4" />
            <span>Social Story Duration Padder</span>
          </div>
          <span className="font-mono text-emerald-400 font-bold">{loopCount}× Repeated</span>
        </div>

        <p className="text-xs text-slate-400">
          Instagram Stories and WhatsApp Status require videos to be at least 3 seconds long. Looping pads short 1-second GIFs into compliant social video clips.
        </p>

        <div className="grid grid-cols-4 gap-2 pt-1">
          {[
            { count: 1, label: '1x (Original)', sub: 'No Repeat' },
            { count: 2, label: '2x Loops', sub: '~3-5s Story' },
            { count: 3, label: '3x Loops', sub: 'Instagram Ready' },
            { count: 5, label: '5x Loops', sub: 'Extended Reel' },
          ].map((item) => {
            const isSelected = loopCount === item.count;
            return (
              <button
                key={item.count}
                type="button"
                onClick={() => {
                  setLoopCount(item.count);
                  updateParent({ loop_count: item.count });
                }}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">{item.label}</div>
                <div className={`text-[10px] ${isSelected ? 'text-slate-950' : 'text-slate-500'}`}>{item.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Output Quality & Smooth 60fps Interpolation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Frame Rate Output */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span>Output Frame Rate</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: 30, label: '30 FPS', sub: 'Standard Web' },
              { val: 60, label: '60 FPS', sub: 'Silky Smooth' },
            ].map((f) => (
              <button
                key={f.val}
                type="button"
                onClick={() => {
                  setFps(f.val);
                  updateParent({ fps: f.val });
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  fps === f.val
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-bold text-slate-200">{f.label}</div>
                <div className="text-[10px] text-slate-400">{f.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* CRF Visually Lossless Engine */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>CRF 18 Master Quality</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Converts 256-color GIF to rich 16.7M color H.264 MP4
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
            H.264 yuv420p
          </span>
        </div>
      </div>
    </div>
  );
};
