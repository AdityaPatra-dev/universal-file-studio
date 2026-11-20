import React, { useState, useRef } from 'react';
import {
  Gauge,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Clock,
  Music,
  Sliders,
  Check,
  TrendingUp,
  Activity
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';

interface SpeedVelocityStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const SpeedVelocityStudio: React.FC<SpeedVelocityStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);

  const [speed, setSpeed] = useState<number>(Number(parameters.speed || 1.5));
  const [preservePitch, setPreservePitch] = useState<boolean>(parameters.preserve_pitch !== false);
  const [motionBlurSmooth, setMotionBlurSmooth] = useState<boolean>(
    parameters.motion_blur_smooth !== false
  );
  const [muteAudio, setMuteAudio] = useState<boolean>(parameters.mute_audio === true);

  const updateParent = (updates: Partial<{
    speed: number;
    preserve_pitch: boolean;
    motion_blur_smooth: boolean;
    mute_audio: boolean;
  }>) => {
    const nextSpeed = updates.speed !== undefined ? updates.speed : speed;
    const nextPitch = updates.preserve_pitch !== undefined ? updates.preserve_pitch : preservePitch;
    const nextMotion = updates.motion_blur_smooth !== undefined ? updates.motion_blur_smooth : motionBlurSmooth;
    const nextMute = updates.mute_audio !== undefined ? updates.mute_audio : muteAudio;

    onParametersChange({
      ...parameters,
      speed: nextSpeed,
      preserve_pitch: nextPitch,
      motion_blur_smooth: nextMotion,
      mute_audio: nextMute,
    });
  };

  const handleLoadedMetadata = (dims: { width: number; height: number; duration?: number }) => {
    if (dims.duration && dims.duration > 0) {
      setDuration(dims.duration);
    }
    // Set video element playback rate for real-time in-browser preview!
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleSpeedSelect = (val: number) => {
    setSpeed(val);
    if (videoRef.current) {
      videoRef.current.playbackRate = Math.min(val, 16);
    }
    updateParent({ speed: val });
  };

  const formatSeconds = (sec: number): string => {
    if (isNaN(sec) || sec < 0) sec = 0;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const speedPresets = [
    { val: 0.25, label: '0.25x', sub: 'Slow-Mo' },
    { val: 0.5, label: '0.5x', sub: 'Cinematic' },
    { val: 0.75, label: '0.75x', sub: 'Smooth' },
    { val: 1.0, label: '1.0x', sub: 'Normal' },
    { val: 1.25, label: '1.25x', sub: 'Snappy' },
    { val: 1.5, label: '1.5x', sub: 'Quick' },
    { val: 2.0, label: '2.0x', sub: 'Timelapse' },
    { val: 4.0, label: '4.0x', sub: 'Hyper' },
  ];

  const estimatedOutputDuration = duration > 0 && speed > 0 ? duration / speed : 0;

  return (
    <div className="space-y-4">
      {/* 1. Video Player Monitor */}
      <VideoPlayerViewport
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* 2. Interactive Speed Dial & Preset Chips */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">Speed Multiplier</div>
              <div className="text-xs text-slate-400">Preview dynamically playing at {speed}x</div>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Estimated Duration</div>
              <div className="text-xs font-semibold text-cyan-400">
                {formatSeconds(duration)} → {formatSeconds(estimatedOutputDuration)}
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-lg">
              {speed.toFixed(2)}x
            </div>
          </div>
        </div>

        {/* Preset Cards */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {speedPresets.map((preset) => {
            const isSelected = Math.abs(speed - preset.val) < 0.01;
            return (
              <button
                key={preset.val}
                type="button"
                onClick={() => handleSpeedSelect(preset.val)}
                className={`p-2 rounded-lg border text-center transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-sm">{preset.label}</div>
                <div className={`text-[10px] ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                  {preset.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* Fine Stepper Slider */}
        <div className="space-y-1 pt-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>0.1x (Extreme Slow)</span>
            <span className="font-mono text-cyan-400 font-medium">Drag to fine-tune</span>
            <span>10.0x (Extreme Fast)</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="10.0"
            step="0.05"
            value={speed}
            onChange={(e) => handleSpeedSelect(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 3. Audio & Smoothing Engine Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Pitch Correction Toggle */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span>Preserve Natural Pitch</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {preservePitch ? 'No chipmunk effect (atempo filter)' : 'Original audio frequency alters'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !preservePitch;
              setPreservePitch(next);
              updateParent({ preserve_pitch: next });
            }}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
              preservePitch ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                preservePitch ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Motion Blur / Frame Smoothing */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Motion Smoothing</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Interpolates frames to prevent stuttering
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !motionBlurSmooth;
              setMotionBlurSmooth(next);
              updateParent({ motion_blur_smooth: next });
            }}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
              motionBlurSmooth ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                motionBlurSmooth ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Mute Audio Option */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              {muteAudio ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-400" />}
              <span>Mute Soundtrack</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {muteAudio ? 'Silent video output' : 'Audio track preserved'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !muteAudio;
              setMuteAudio(next);
              updateParent({ mute_audio: next });
            }}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
              muteAudio ? 'bg-rose-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                muteAudio ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
