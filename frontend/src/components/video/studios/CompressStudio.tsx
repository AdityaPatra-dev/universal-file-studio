import React, { useState, useRef } from 'react';
import {
  Minimize2,
  HardDrive,
  Sparkles,
  Sliders,
  Check,
  AlertTriangle,
  Zap,
  Layers,
  Cpu,
  Share2,
  FileCheck
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';

interface CompressStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  fileSizeBytes?: number;
}

export const CompressStudio: React.FC<CompressStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
  fileSizeBytes = 50 * 1024 * 1024, // default 50MB fallback
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });

  const [mode, setMode] = useState<'preset' | 'crf' | 'custom_mb'>('preset');
  const [targetPreset, setTargetPreset] = useState<string>('discord_8mb');
  const [crf, setCrf] = useState<number>(Number(parameters.crf || 28));
  const [codec, setCodec] = useState<string>(parameters.codec || 'libx264');
  const [resolution, setResolution] = useState<string>(parameters.resolution || 'original');
  const [customMB, setCustomMB] = useState<number>(15);
  const [audioMode, setAudioMode] = useState<string>(parameters.audio_mode || 'aac');

  const sourceMB = fileSizeBytes / (1024 * 1024);

  const calculateTargetBitrateKbps = (mb: number, dur: number): number => {
    if (dur <= 0) return 1000;
    // Total bits = mb * 8192 kbits. Reserve 128kbps for audio.
    const totalKbits = mb * 8192;
    const videoKbits = Math.max(64, Math.round(totalKbits / dur) - 128);
    return Math.max(64, videoKbits);
  };

  const updateParent = (updates: Partial<{
    crf: number;
    codec: string;
    resolution: string;
    audio_mode: string;
    target_bitrate_kbps?: number;
    bitrate_k?: number;
  }>) => {
    const nextCrf = updates.crf !== undefined ? updates.crf : crf;
    const nextCodec = updates.codec !== undefined ? updates.codec : codec;
    const nextRes = updates.resolution !== undefined ? updates.resolution : resolution;
    const nextAudio = updates.audio_mode !== undefined ? updates.audio_mode : audioMode;

    const baseParams: Record<string, any> = {
      ...parameters,
      crf: nextCrf,
      codec: nextCodec,
      resolution: nextRes,
      audio_mode: nextAudio,
    };

    if (updates.target_bitrate_kbps !== undefined) {
      baseParams.target_bitrate_kbps = updates.target_bitrate_kbps;
      baseParams.bitrate_k = updates.target_bitrate_kbps;
    }

    onParametersChange(baseParams);
  };

  const handleLoadedMetadata = (dims: { width: number; height: number; duration?: number }) => {
    setVideoDims(dims);
    if (dims.duration && dims.duration > 0) {
      setDuration(dims.duration);
      // Auto-set initial bitrate for 8MB
      const kbps = calculateTargetBitrateKbps(8, dims.duration);
      updateParent({ target_bitrate_kbps: kbps });
    }
  };

  const applyPlatformPreset = (presetKey: string, mb: number) => {
    setMode('preset');
    setTargetPreset(presetKey);
    const kbps = calculateTargetBitrateKbps(mb, duration);
    updateParent({ target_bitrate_kbps: kbps });
  };

  const platformPresets = [
    { key: 'discord_8mb', label: 'Discord Free', mb: 8, sub: '8 MB Max' },
    { key: 'whatsapp_16mb', label: 'WhatsApp', mb: 16, sub: '16 MB Video' },
    { key: 'email_25mb', label: 'Email / Nitro', mb: 25, sub: '25 MB Attachment' },
    { key: 'telegram_50mb', label: 'Telegram HD', mb: 50, sub: '50 MB High Quality' },
  ];

  // Estimated size calculation
  let estimatedMB = 8;
  if (mode === 'preset') {
    const found = platformPresets.find((p) => p.key === targetPreset);
    estimatedMB = found ? found.mb : 8;
  } else if (mode === 'custom_mb') {
    estimatedMB = customMB;
  } else {
    // CRF heuristic: 23 is ~50% source, 28 is ~25% source, 32 is ~15% source
    const crfFactor = Math.pow(0.5, (crf - 23) / 6);
    const codecEfficiency = codec === 'libx265' ? 0.65 : 1.0;
    estimatedMB = Math.max(1, Math.min(sourceMB * 0.95, sourceMB * crfFactor * codecEfficiency));
  }

  const spaceSavingsPct = Math.max(0, Math.min(95, Math.round((1 - estimatedMB / sourceMB) * 100)));

  return (
    <div className="space-y-4">
      {/* 1. Video Player Monitor */}
      <VideoPlayerViewport
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* 2. Space Savings Telemetry Hero Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Minimize2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Estimated Space Savings: ~{spaceSavingsPct}%</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Reduced
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono">
              Original: <span className="text-slate-200">{sourceMB.toFixed(1)} MB</span> → Compressed: <span className="text-cyan-400 font-bold">~{estimatedMB.toFixed(1)} MB</span>
            </div>
          </div>
        </div>

        {/* Compression Engine Mode Switch */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setMode('preset')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'preset' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Target Budget
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('crf');
              onParametersChange({ ...parameters, target_bitrate_kbps: undefined, bitrate_k: undefined, crf });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'crf' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CRF Quality
          </button>
        </div>
      </div>

      {/* 3. Compression Controls: Platform Presets or CRF Slider */}
      {mode === 'preset' ? (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Share2 className="w-4 h-4" />
              <span>Target File Size & Platform Budgets</span>
            </span>
            <span className="text-[11px] text-slate-500">Auto-computes bitrate for exact size</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {platformPresets.map((p) => {
              const isSelected = targetPreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPlatformPreset(p.key, p.mb)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{p.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{p.sub}</div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Constant Rate Factor (CRF Quality)</span>
            </span>
            <span className="font-mono text-amber-400 font-bold">CRF {crf}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 23, label: 'CRF 23', sub: 'Visually Lossless' },
              { val: 28, label: 'CRF 28', sub: 'Balanced Web (Default)' },
              { val: 32, label: 'CRF 32', sub: 'Maximum Space Saving' },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => {
                  setCrf(preset.val);
                  updateParent({ crf: preset.val });
                }}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  crf === preset.val
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">{preset.label}</div>
                <div className={`text-[10px] ${crf === preset.val ? 'text-slate-900' : 'text-slate-500'}`}>
                  {preset.sub}
                </div>
              </button>
            ))}
          </div>

          <input
            type="range"
            min="18"
            max="38"
            value={crf}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setCrf(val);
              updateParent({ crf: val });
            }}
            className="w-full accent-amber-500 cursor-pointer pt-1"
          />
        </div>
      )}

      {/* 4. Codec Efficiency & Downscaling Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Codec Selection: H.264 vs H.265 */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Encoder Codec Architecture</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setCodec('libx264');
                updateParent({ codec: 'libx264' });
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                codec === 'libx264'
                  ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-bold text-slate-200">H.264 / AVC</div>
              <div className="text-[10px] text-slate-400">100% universal device playback</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setCodec('libx265');
                updateParent({ codec: 'libx265' });
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                codec === 'libx265'
                  ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-bold text-slate-200">H.265 / HEVC</div>
              <div className="text-[10px] text-emerald-400 font-semibold">+50% higher compression</div>
            </button>
          </div>
        </div>

        {/* Resolution Downscale Option */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Resolution Scaler</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {['original', '1080p', '720p', '480p'].map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => {
                  setResolution(res);
                  updateParent({ resolution: res });
                }}
                className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all uppercase ${
                  resolution === res
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {res === 'original' ? 'Source' : res}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
