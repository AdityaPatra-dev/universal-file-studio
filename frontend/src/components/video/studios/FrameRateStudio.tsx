import React, { useState, useRef } from 'react';
import {
  Film,
  Zap,
  Sparkles,
  Sliders,
  Check,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';

interface FrameRateStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const FrameRateStudio: React.FC<FrameRateStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fps, setFps] = useState<number>(Number(parameters.fps || 30));

  const updateParent = (val: number) => {
    setFps(val);
    onParametersChange({
      ...parameters,
      fps: val,
    });
  };

  const fpsPresets = [
    { val: 24, label: '24 FPS', title: 'Cinematic Cadence', desc: 'Hollywood motion feel, natural motion blur' },
    { val: 30, label: '30 FPS', title: 'Standard Broadcast', desc: 'Optimal standard for social, web, and television' },
    { val: 60, label: '60 FPS', title: 'High-Motion Smooth', desc: 'Silky smooth motion for gameplay, sports & reels' },
    { val: 120, label: '120 FPS', title: 'Pro High-Speed', desc: 'Extreme smoothness on 120Hz mobile & gaming displays' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Video Player Monitor */}
      <VideoPlayerViewport
        ref={videoRef}
        src={videoUrl}
      />

      {/* 2. Target Frame Rate Deck */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">Target Motion Cadence</div>
              <div className="text-xs text-slate-400">Resamples video frame rate with temporal frame timing</div>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold font-mono text-lg">
            {fps} FPS
          </div>
        </div>

        {/* Preset Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fpsPresets.map((p) => {
            const isSelected = fps === p.val;
            return (
              <button
                key={p.val}
                type="button"
                onClick={() => updateParent(p.val)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <span className="font-mono text-cyan-400">{p.label}</span>
                    <span>• {p.title}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{p.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Continuous Slider (12 to 120 FPS) */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>12 FPS (Stop Motion)</span>
            <span className="font-mono text-cyan-400 font-medium">Drag to fine-tune frame rate</span>
            <span>120 FPS (Extreme)</span>
          </div>
          <input
            type="range"
            min="12"
            max="120"
            step="1"
            value={fps}
            onChange={(e) => updateParent(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 3. Audio Passthrough Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Drift Audio Sync & Passthrough</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Maintains 100% synchronized audio alignment with zero pitch or speed alteration
          </div>
        </div>
        <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/30">
          -c:a copy
        </span>
      </div>
    </div>
  );
};
