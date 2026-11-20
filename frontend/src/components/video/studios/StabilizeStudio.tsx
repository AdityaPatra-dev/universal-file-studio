import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Activity,
  Sliders,
  Check,
  ShieldCheck,
  Compass,
  AlertCircle
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';

interface StabilizeStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const StabilizeStudio: React.FC<StabilizeStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });

  const [strength, setStrength] = useState<'standard' | 'high' | 'subtle'>('standard');
  const [edgeCompensation, setEdgeCompensation] = useState<boolean>(true);

  const handleLoadedMetadata = (dims: { width: number; height: number }) => {
    setVideoDims(dims);
  };

  return (
    <div className="space-y-4">
      {/* 1. Video Player Monitor */}
      <VideoPlayerViewport
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* 2. Motion Vector Stabilization Engine Card */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Activity className="w-4 h-4" />
            <span>Deshake Motion Trajectory Engine</span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
            Affine 2D Low-Pass Smoother
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Scans high-frequency handheld camera vibrations across adjacent video frames, computing an optimal synthetic camera path to eliminate jitter, tremors, and walking bounces.
        </p>

        {/* Stabilization Profiles */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {[
            {
              key: 'subtle',
              label: 'Subtle',
              desc: 'Micro-jitter fix',
              sub: 'Zero crop edge loss',
            },
            {
              key: 'standard',
              label: 'Standard',
              desc: 'Handheld & Walking',
              sub: 'Balanced smoothness',
            },
            {
              key: 'high',
              label: 'Action Cam',
              desc: 'Running & Cycling',
              sub: 'Steadicam emulation',
            },
          ].map((profile) => {
            const isSelected = strength === profile.key;
            return (
              <button
                key={profile.key}
                type="button"
                onClick={() => setStrength(profile.key as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{profile.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{profile.desc}</div>
                <div className="text-[10px] text-slate-500 font-medium">{profile.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Edge Compensation & Audio Passthrough Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Edge Zoom Compensation */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart Edge Inpainting</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Mirrors boundary pixels to prevent black border fringes
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEdgeCompensation(!edgeCompensation)}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
              edgeCompensation ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                edgeCompensation ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Audio Passthrough Notice */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bit-for-Bit Audio Copy</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Preserves 100% original audio stream with zero re-encoding
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
            0.0s Copy
          </span>
        </div>
      </div>
    </div>
  );
};
