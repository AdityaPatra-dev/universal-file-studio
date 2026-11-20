import React, { useState, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Sparkles,
  Zap,
  Shield,
  Sliders,
  Check,
  Mic,
  Activity
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';
import { WaveformTrack } from '../core/WaveformTrack';

interface VolumeBoosterStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  isMuteTool?: boolean;
}

export const VolumeBoosterStudio: React.FC<VolumeBoosterStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
  isMuteTool = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Parse volume percentage (e.g. 150 or from '150%')
  const initialVolume = isMuteTool ? 0 : (() => {
    const raw = String(parameters.volume || '150%').replace('%', '');
    const num = parseFloat(raw);
    return isNaN(num) ? 150 : num;
  })();

  const [volume, setVolume] = useState<number>(initialVolume);
  const [antiClip, setAntiClip] = useState<boolean>(parameters.anti_clip !== false);
  const [dialogueBoost, setDialogueBoost] = useState<boolean>(parameters.dialogue_boost === true);

  const updateParent = (updates: Partial<{
    volume: number;
    anti_clip: boolean;
    dialogue_boost: boolean;
  }>) => {
    const nextVol = updates.volume !== undefined ? updates.volume : volume;
    const nextClip = updates.anti_clip !== undefined ? updates.anti_clip : antiClip;
    const nextDiag = updates.dialogue_boost !== undefined ? updates.dialogue_boost : dialogueBoost;

    onParametersChange({
      ...parameters,
      volume: `${Math.round(nextVol)}%`,
      anti_clip: nextClip,
      dialogue_boost: nextDiag,
      mute_mode: nextVol === 0 ? 'complete' : 'none',
    });
  };

  const handleLoadedMetadata = (dims: { width: number; height: number; duration?: number }) => {
    if (dims.duration && dims.duration > 0) {
      setDuration(dims.duration);
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const setExactVolume = (val: number) => {
    setVolume(val);
    updateParent({ volume: val });
  };

  const volumePresets = [
    { val: 0, label: '0%', sub: 'Mute Silent', icon: VolumeX },
    { val: 50, label: '50%', sub: 'Half Volume', icon: Volume1 },
    { val: 100, label: '100%', sub: 'Original Level', icon: Volume2 },
    { val: 150, label: '150%', sub: 'Clear Boost', icon: Volume2 },
    { val: 200, label: '200%', sub: '2x Loudness', icon: Volume2 },
    { val: 300, label: '300%', sub: 'Extreme Boost', icon: Volume2 },
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

      {/* 2. Audio Waveform Display */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-inner">
        <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Activity className="w-3.5 h-3.5" />
            <span>Soundtrack Audio Waveform & Energy Peak</span>
          </div>
          <span className="font-mono text-cyan-400 font-bold">{Math.round(volume)}% Gain</span>
        </div>
        <WaveformTrack
          videoUrl={videoUrl}
          duration={duration}
          currentTime={currentTime}
          onSeek={handleSeek}
        />
      </div>

      {/* 3. Gain Slider & Presets */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${volume === 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
              {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">
                {volume === 0 ? 'Audio Soundtrack Stripped' : 'Loudness Gain Booster'}
              </div>
              <div className="text-xs text-slate-400">
                {volume === 0
                  ? 'Video track copied in 0.05 seconds with zero re-encoding'
                  : 'Fast stream-copied video with audio dynamic normalization'}
              </div>
            </div>
          </div>

          <div className={`px-3.5 py-1.5 rounded-xl border font-bold font-mono text-lg ${
            volume === 0
              ? 'bg-rose-950 border-rose-500/40 text-rose-300'
              : volume > 150
              ? 'bg-amber-950 border-amber-500/40 text-amber-300'
              : 'bg-cyan-950 border-cyan-500/40 text-cyan-300'
          }`}>
            {Math.round(volume)}%
          </div>
        </div>

        {/* Preset Gain Cards */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {volumePresets.map((p) => {
            const isSelected = Math.abs(volume - p.val) < 2;
            const Icon = p.icon;
            return (
              <button
                key={p.val}
                type="button"
                onClick={() => setExactVolume(p.val)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? p.val === 0
                      ? 'bg-rose-500 text-slate-950 border-rose-400 font-bold shadow-md shadow-rose-500/20'
                      : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold">{p.label}</div>
                <div className={`text-[10px] ${isSelected ? 'text-slate-950' : 'text-slate-500'}`}>
                  {p.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continuous Slider (0 to 400%) */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>0% (Mute)</span>
            <span className="font-mono text-cyan-400 font-medium">Fine-tune Loudness</span>
            <span>400% (Extreme)</span>
          </div>
          <input
            type="range"
            min="0"
            max="400"
            step="5"
            value={volume}
            onChange={(e) => setExactVolume(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 4. Professional Studio Filters: Anti-Clipping Limiter & Dialogue Boost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Anti-Clipping Limiter */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Anti-Clipping Limiter</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Caps audio peaks at -0.5dB to prevent crackling distortion
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !antiClip;
              setAntiClip(next);
              updateParent({ anti_clip: next });
            }}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
              antiClip ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                antiClip ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Dialogue Clarity Boost */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dialogue Voice Boost</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Compresses dynamic range to make quiet whisper speech audible
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !dialogueBoost;
              setDialogueBoost(next);
              updateParent({ dialogue_boost: next });
            }}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
              dialogueBoost ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                dialogueBoost ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
