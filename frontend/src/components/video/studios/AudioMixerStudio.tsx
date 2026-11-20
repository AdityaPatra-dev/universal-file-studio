import React, { useState, useRef } from 'react';
import {
  Music,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Repeat,
  Mic,
  PlusCircle,
  FileAudio,
  Check
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';
import { WaveformTrack } from '../core/WaveformTrack';

interface AudioMixerStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  availableFiles?: Array<{ id: number; filename: string; original_filename?: string }>;
}

export const AudioMixerStudio: React.FC<AudioMixerStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
  availableFiles = [],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [videoVolume, setVideoVolume] = useState<number>(Number(parameters.video_volume ?? 100));
  const [audioVolume, setAudioVolume] = useState<number>(Number(parameters.audio_volume ?? 100));
  const [ducking, setDucking] = useState<boolean>(parameters.audio_ducking !== false);
  const [loopAudio, setLoopAudio] = useState<boolean>(parameters.loop_audio !== false);
  const [selectedFileId, setSelectedFileId] = useState<number | string>(
    parameters.secondary_file_id || (availableFiles[0]?.id ?? '')
  );

  const updateParent = (updates: Partial<{
    video_volume: number;
    audio_volume: number;
    audio_ducking: boolean;
    loop_audio: boolean;
    secondary_file_id: any;
  }>) => {
    const nextVVol = updates.video_volume !== undefined ? updates.video_volume : videoVolume;
    const nextAVol = updates.audio_volume !== undefined ? updates.audio_volume : audioVolume;
    const nextDuck = updates.audio_ducking !== undefined ? updates.audio_ducking : ducking;
    const nextLoop = updates.loop_audio !== undefined ? updates.loop_audio : loopAudio;
    const nextSec = updates.secondary_file_id !== undefined ? updates.secondary_file_id : selectedFileId;

    onParametersChange({
      ...parameters,
      video_volume: nextVVol,
      audio_volume: nextAVol,
      audio_ducking: nextDuck,
      loop_audio: nextLoop,
      secondary_file_id: nextSec,
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

  return (
    <div className="space-y-4">
      {/* 1. Video Player Monitor */}
      <VideoPlayerViewport
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={setCurrentTime}
      />

      {/* 2. Track 1: Original Video Soundtrack */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Track 1: Original Video Audio</div>
              <div className="text-[11px] text-slate-400">Dialogue, native ambient sound</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = videoVolume === 0 ? 100 : 0;
                setVideoVolume(next);
                updateParent({ video_volume: next });
              }}
              className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                videoVolume === 0
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {videoVolume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <span className="font-mono text-xs font-bold text-blue-400 min-w-[45px] text-right">
              {videoVolume}%
            </span>
          </div>
        </div>

        <WaveformTrack
          videoUrl={videoUrl}
          duration={duration}
          currentTime={currentTime}
          onSeek={handleSeek}
        />

        <div className="space-y-1 pt-1">
          <input
            type="range"
            min="0"
            max="200"
            value={videoVolume}
            onChange={(e) => {
              const val = Number(e.target.value);
              setVideoVolume(val);
              updateParent({ video_volume: val });
            }}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 3. Track 2: Background Music / Audio Dub */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Track 2: Background Music / Voiceover</div>
              <div className="text-[11px] text-slate-400">Select an uploaded audio file from library</div>
            </div>
          </div>

          <span className="font-mono text-xs font-bold text-cyan-400 min-w-[45px] text-right">
            {audioVolume}%
          </span>
        </div>

        {/* Secondary File Selector */}
        {availableFiles.length > 0 ? (
          <div className="space-y-1.5">
            <label htmlFor="bg-music-select" className="text-xs text-slate-400">Select Audio Track File:</label>
            <select
              id="bg-music-select"
              value={selectedFileId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedFileId(val);
                updateParent({ secondary_file_id: val });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
            >
              {availableFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.original_filename || f.filename}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
            <FileAudio className="w-4 h-4 text-cyan-400" />
            <span>Upload or queue an audio file (.mp3, .wav, .m4a) to mix with this video.</span>
          </div>
        )}

        {/* Background Volume Slider */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Volume Level</span>
            <span className="font-mono text-cyan-400">{audioVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={audioVolume}
            onChange={(e) => {
              const val = Number(e.target.value);
              setAudioVolume(val);
              updateParent({ audio_volume: val });
            }}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* Professional Mixing Toggles: Audio Ducking & Looping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          {/* Smart Audio Ducking */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                <span>Auto Audio Ducking</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Lowers music automatically during speech
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !ducking;
                setDucking(next);
                updateParent({ audio_ducking: next });
              }}
              className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                ducking ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  ducking ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Seamless Looping */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-emerald-400" />
                <span>Seamless Audio Loop</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Repeat track if shorter than video duration
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !loopAudio;
                setLoopAudio(next);
                updateParent({ loop_audio: next });
              }}
              className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                loopAudio ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  loopAudio ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
