import React, { useState, useRef } from 'react';
import {
  RefreshCw,
  Zap,
  Sparkles,
  Sliders,
  Check,
  Cpu,
  Layers,
  FileCode,
  Music,
  ShieldCheck
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';

interface TranscodeStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  sourceFormat?: string;
}

export const TranscodeStudio: React.FC<TranscodeStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
  sourceFormat = 'mp4',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });

  const [targetFormat, setTargetFormat] = useState<string>(
    parameters.format || parameters.target_format || 'mp4'
  );
  const [remuxLossless, setRemuxLossless] = useState<boolean>(
    parameters.remux_lossless === true
  );
  const [qualityProfile, setQualityProfile] = useState<string>(
    parameters.quality_profile || 'high_crf23'
  );
  const [videoCodec, setVideoCodec] = useState<string>(
    parameters.video_codec || parameters.vcodec || 'auto'
  );
  const [audioCodec, setAudioCodec] = useState<string>(
    parameters.audio_codec || parameters.acodec || 'auto'
  );

  const updateParent = (updates: Partial<{
    format: string;
    target_format: string;
    remux_lossless: boolean;
    quality_profile: string;
    video_codec: string;
    audio_codec: string;
  }>) => {
    const nextFmt = updates.format || updates.target_format || targetFormat;
    const nextRemux = updates.remux_lossless !== undefined ? updates.remux_lossless : remuxLossless;
    const nextProf = updates.quality_profile !== undefined ? updates.quality_profile : qualityProfile;
    const nextVCodec = updates.video_codec !== undefined ? updates.video_codec : videoCodec;
    const nextACodec = updates.audio_codec !== undefined ? updates.audio_codec : audioCodec;

    onParametersChange({
      ...parameters,
      format: nextFmt,
      target_format: nextFmt,
      remux_lossless: nextRemux,
      quality_profile: nextProf,
      video_codec: nextVCodec,
      vcodec: nextVCodec,
      audio_codec: nextACodec,
      acodec: nextACodec,
    });
  };

  const handleLoadedMetadata = (dims: { width: number; height: number }) => {
    setVideoDims(dims);
  };

  const containers = [
    { ext: 'mp4', name: 'MP4 (MPEG-4)', sub: 'Universal Compatibility' },
    { ext: 'mkv', name: 'MKV (Matroska)', sub: 'Multi-Track & Subtitles' },
    { ext: 'webm', name: 'WebM (Google)', sub: 'Optimized HTML5 Web' },
    { ext: 'mov', name: 'MOV (QuickTime)', sub: 'Apple ProRes & Final Cut' },
    { ext: 'avi', name: 'AVI (Legacy)', sub: 'Vintage Players' },
  ];

  const qualityProfiles = [
    { key: 'master_crf18', label: 'Master CRF 18', desc: 'Visually lossless archival (320k audio)' },
    { key: 'broadcast_crf21', label: 'Broadcast CRF 21', desc: 'Studio grade television master (256k audio)' },
    { key: 'high_crf23', label: 'High CRF 23', desc: 'Pristine detail retention (192k audio)' },
    { key: 'balanced_crf26', label: 'Balanced CRF 26', desc: 'Fast streaming web export (128k audio)' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Video Player Monitor */}
      <VideoPlayerViewport
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* 2. Target Container Format Picker */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <FileCode className="w-4 h-4" />
            <span>Target Container Format</span>
          </span>
          <span className="font-mono text-slate-500 uppercase">Input: {sourceFormat}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {containers.map((c) => {
            const isSelected = targetFormat === c.ext;
            return (
              <button
                key={c.ext}
                type="button"
                onClick={() => {
                  setTargetFormat(c.ext);
                  updateParent({ target_format: c.ext, format: c.ext });
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-sm font-bold uppercase">{c.ext}</div>
                <div className={`text-[10px] truncate ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                  {c.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Zero-Loss Stream Remux vs Re-encode Profile */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>0.1s Zero-Loss Stream Remuxing (`-c copy`)</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Changes container envelope without decoding video or losing 1 single bit of quality.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !remuxLossless;
              setRemuxLossless(next);
              updateParent({ remux_lossless: next });
            }}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
              remuxLossless ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                remuxLossless ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Quality Profiles (disabled when remuxing) */}
        {!remuxLossless && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            {qualityProfiles.map((p) => {
              const isSelected = qualityProfile === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setQualityProfile(p.key);
                    updateParent({ quality_profile: p.key });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/60 shadow-sm'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{p.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Codec Specifics */}
      {!remuxLossless && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Video Codec */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <label htmlFor="video-codec-select" className="text-xs text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Video Encoder Codec:</span>
            </label>
            <select
              id="video-codec-select"
              value={videoCodec}
              onChange={(e) => {
                setVideoCodec(e.target.value);
                updateParent({ video_codec: e.target.value });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
            >
              <option value="auto">Auto (Container Default)</option>
              <option value="libx264">H.264 / AVC (Most Compatible)</option>
              <option value="libx265">H.265 / HEVC (High Efficiency)</option>
              <option value="libvpx-vp9">VP9 (Open Video)</option>
              <option value="prores">Apple ProRes (Production Master)</option>
            </select>
          </div>

          {/* Audio Codec */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <label htmlFor="audio-codec-select" className="text-xs text-slate-400 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audio Encoder Codec:</span>
            </label>
            <select
              id="audio-codec-select"
              value={audioCodec}
              onChange={(e) => {
                setAudioCodec(e.target.value);
                updateParent({ audio_codec: e.target.value });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
            >
              <option value="auto">Auto (Container Default)</option>
              <option value="aac">AAC (Crisp Stereo)</option>
              <option value="libmp3lame">MP3 (MPEG Audio)</option>
              <option value="libopus">Opus (Ultra Low Latency)</option>
              <option value="flac">FLAC (Lossless Studio Master)</option>
              <option value="copy">Passthrough (Copy Untouched)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
