import React, { useState, useRef } from 'react';
import {
  Music,
  FileAudio,
  Zap,
  Sparkles,
  Sliders,
  Check,
  ShieldCheck,
  Activity,
  Mic
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';
import { WaveformTrack } from '../core/WaveformTrack';

interface AudioExtractorStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const AudioExtractorStudio: React.FC<AudioExtractorStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [format, setFormat] = useState<string>(parameters.format || 'mp3');
  const [bitrate, setBitrate] = useState<number>(Number(parameters.bitrate || 192));
  const [losslessCopy, setLosslessCopy] = useState<boolean>(parameters.lossless_copy === true);
  const [normalize, setNormalize] = useState<boolean>(parameters.normalize === true);
  const [voiceEnhance, setVoiceEnhance] = useState<boolean>(parameters.voice_enhance === true);

  const updateParent = (updates: Partial<{
    format: string;
    bitrate: number;
    lossless_copy: boolean;
    normalize: boolean;
    voice_enhance: boolean;
  }>) => {
    const nextFmt = updates.format !== undefined ? updates.format : format;
    const nextBit = updates.bitrate !== undefined ? updates.bitrate : bitrate;
    const nextCopy = updates.lossless_copy !== undefined ? updates.lossless_copy : losslessCopy;
    const nextNorm = updates.normalize !== undefined ? updates.normalize : normalize;
    const nextVoice = updates.voice_enhance !== undefined ? updates.voice_enhance : voiceEnhance;

    onParametersChange({
      ...parameters,
      format: nextFmt,
      bitrate: nextBit,
      lossless_copy: nextCopy,
      normalize: nextNorm,
      voice_enhance: nextVoice,
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

  const audioFormats = [
    { ext: 'mp3', label: 'MP3', sub: 'Universal Device Audio' },
    { ext: 'm4a', label: 'M4A / AAC', sub: 'Apple & High Fidelity' },
    { ext: 'wav', label: 'WAV', sub: 'Uncompressed Studio PCM' },
    { ext: 'flac', label: 'FLAC', sub: 'Lossless Compressed' },
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

      {/* 2. Visual Audio Waveform Track */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-inner">
        <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Activity className="w-3.5 h-3.5" />
            <span>Audio Waveform Peak Amplitude</span>
          </div>
          <span className="font-mono text-cyan-400 font-bold uppercase">{format} • {bitrate} kbps</span>
        </div>
        <WaveformTrack
          videoUrl={videoUrl}
          duration={duration}
          currentTime={currentTime}
          onSeek={handleSeek}
        />
      </div>

      {/* 3. Output Format Selector */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <FileAudio className="w-4 h-4" />
            <span>Target Audio Format</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {audioFormats.map((f) => {
            const isSelected = format === f.ext;
            return (
              <button
                key={f.ext}
                type="button"
                onClick={() => {
                  setFormat(f.ext);
                  updateParent({ format: f.ext });
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-sm font-bold uppercase">{f.label}</div>
                <div className={`text-[10px] ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{f.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Bitrate & Stream Copy Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Bitrate Selector */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Sliders className="w-3.5 h-3.5" />
              <span>Audio Bitrate</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">{bitrate} kbps</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[128, 192, 256, 320].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => {
                  setBitrate(b);
                  updateParent({ bitrate: b });
                }}
                className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                  bitrate === b
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {b}k
              </button>
            ))}
          </div>
        </div>

        {/* 0.1s Stream Copy / Extraction Notice */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Zero-Loss Audio Stream Demux</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Direct stream copy extracted in 100 milliseconds
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !losslessCopy;
              setLosslessCopy(next);
              updateParent({ lossless_copy: next });
            }}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
              losslessCopy ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                losslessCopy ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
