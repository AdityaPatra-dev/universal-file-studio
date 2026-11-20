import React, { useState, useRef } from 'react';
import {
  RotateCcw,
  Sparkles,
  Repeat,
  Zap,
  Volume2,
  VolumeX,
  Gauge,
  Sliders,
  Check,
  Flame,
  Clock
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';

interface ReverseBoomerangStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const ReverseBoomerangStudio: React.FC<ReverseBoomerangStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);

  const [mode, setMode] = useState<'boomerang' | 'reverse'>(
    parameters.boomerang === true || parameters.mode === 'boomerang' ? 'boomerang' : 'reverse'
  );
  const [speed, setSpeed] = useState<number>(Number(parameters.speed || 1.0));
  const [reverseAudio, setReverseAudio] = useState<boolean>(parameters.reverse_audio !== false);

  const updateParent = (updates: Partial<{
    mode: 'boomerang' | 'reverse';
    speed: number;
    reverse_audio: boolean;
  }>) => {
    const nextMode = updates.mode !== undefined ? updates.mode : mode;
    const nextSpeed = updates.speed !== undefined ? updates.speed : speed;
    const nextAudio = updates.reverse_audio !== undefined ? updates.reverse_audio : reverseAudio;

    onParametersChange({
      ...parameters,
      mode: nextMode,
      boomerang: nextMode === 'boomerang',
      speed: nextSpeed,
      reverse_audio: nextAudio,
    });
  };

  const handleLoadedMetadata = (dims: { width: number; height: number; duration?: number }) => {
    if (dims.duration && dims.duration > 0) {
      setDuration(dims.duration);
    }
  };

  const speedPresets = [
    { val: 0.5, label: '0.5x', sub: 'Slow Bounce' },
    { val: 1.0, label: '1.0x', sub: 'Standard' },
    { val: 1.5, label: '1.5x', sub: 'Snappy' },
    { val: 2.0, label: '2.0x', sub: 'High Energy' },
  ];

  const estimatedOutputDuration = mode === 'boomerang'
    ? (duration * 2) / speed
    : duration / speed;

  return (
    <div className="space-y-4">
      {/* 1. Video Player Monitor */}
      <VideoPlayerViewport
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* 2. Mode Selector: Boomerang Loop vs Pure Chronological Reverse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setMode('boomerang');
            updateParent({ mode: 'boomerang' });
          }}
          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
            mode === 'boomerang'
              ? 'bg-gradient-to-br from-fuchsia-500/15 to-pink-500/15 border-pink-500/60 shadow-md shadow-pink-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${mode === 'boomerang' ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-800 text-slate-400'}`}>
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Instagram Boomerang</span>
              {mode === 'boomerang' && (
                <span className="text-[10px] font-bold bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30">
                  Active
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Plays forward then bounces in reverse, creating an endless ping-pong loop.
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('reverse');
            updateParent({ mode: 'reverse' });
          }}
          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
            mode === 'reverse'
              ? 'bg-gradient-to-br from-cyan-500/15 to-blue-500/15 border-cyan-500/60 shadow-md shadow-cyan-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${mode === 'reverse' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Complete Reverse</span>
              {mode === 'reverse' && (
                <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Active
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Plays entire video backward from end to start for rewind illusion.
            </div>
          </div>
        </button>
      </div>

      {/* 3. Speed Multiplier Deck */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Gauge className="w-4 h-4" />
            <span>Playback Speed & Rhythm</span>
          </span>
          <span className="font-mono text-cyan-400 font-bold">{speed.toFixed(2)}x Speed</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {speedPresets.map((p) => {
            const isSelected = Math.abs(speed - p.val) < 0.05;
            return (
              <button
                key={p.val}
                type="button"
                onClick={() => {
                  setSpeed(p.val);
                  updateParent({ speed: p.val });
                }}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold">{p.label}</div>
                <div className={`text-[10px] ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                  {p.sub}
                </div>
              </button>
            );
          })}
        </div>

        <input
          type="range"
          min="0.25"
          max="3.0"
          step="0.05"
          value={speed}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setSpeed(val);
            updateParent({ speed: val });
          }}
          className="w-full accent-cyan-500 cursor-pointer pt-1"
        />
      </div>

      {/* 4. Audio Reversal & Duration Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Audio Reversal Toggle */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              {reverseAudio ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span>Reverse Audio Soundtrack</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {reverseAudio ? 'Reverses audio wave backwards' : 'Outputs clean silent video (recommended for social)'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !reverseAudio;
              setReverseAudio(next);
              updateParent({ reverse_audio: next });
            }}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
              reverseAudio ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                reverseAudio ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Runtime Calculation */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Calculated Runtime</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {mode === 'boomerang' ? 'Original duration is doubled' : '1x reverse runtime'}
            </div>
          </div>
          <div className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
            {estimatedOutputDuration > 0 ? `${estimatedOutputDuration.toFixed(1)}s` : '--'}
          </div>
        </div>
      </div>
    </div>
  );
};
