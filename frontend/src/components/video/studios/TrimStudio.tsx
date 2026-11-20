import React, { useState, useRef } from 'react';
import {
  Scissors,
  Zap,
  Sparkles,
  Smartphone,
  Share2,
  Clock,
  Sliders,
  Check,
  ChevronRight,
  Flame,
  Volume2
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';
import { FilmstripScrubber } from '../core/FilmstripScrubber';
import { WaveformTrack } from '../core/WaveformTrack';

interface TrimStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const TrimStudio: React.FC<TrimStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // In / Out range in seconds
  const [startTime, setStartTime] = useState<number>(Number(parameters.start || 0));
  const [endTime, setEndTime] = useState<number>(Number(parameters.end || 0));

  const [trimMode, setTrimMode] = useState<'single' | 'cut_out' | 'split_chunks'>(
    (parameters.trim_mode as any) || 'single'
  );
  const [lossless, setLossless] = useState<boolean>(parameters.lossless !== false);
  const [chunkSeconds, setChunkSeconds] = useState<number>(Number(parameters.chunk_seconds || 30));

  // Sync to parent parameters
  const updateParent = (updates: Partial<{
    start: number;
    end: number;
    trim_mode: string;
    lossless: boolean;
    chunk_seconds: number;
  }>) => {
    const nextStart = updates.start !== undefined ? updates.start : startTime;
    const nextEnd = updates.end !== undefined ? updates.end : (endTime > 0 ? endTime : duration);
    const nextMode = updates.trim_mode !== undefined ? updates.trim_mode : trimMode;
    const nextLossless = updates.lossless !== undefined ? updates.lossless : lossless;
    const nextChunk = updates.chunk_seconds !== undefined ? updates.chunk_seconds : chunkSeconds;

    onParametersChange({
      ...parameters,
      start: formatSeconds(nextStart),
      end: formatSeconds(nextEnd),
      trim_mode: nextMode,
      lossless: nextLossless,
      chunk_seconds: nextChunk,
    });
  };

  const formatSeconds = (sec: number): string => {
    if (isNaN(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0').slice(0, 2)}`;
  };

  const handleLoadedMetadata = (dims: { width: number; height: number; duration?: number }) => {
    if (dims.duration && dims.duration > 0) {
      setDuration(dims.duration);
      if (endTime === 0 || endTime > dims.duration) {
        setEndTime(dims.duration);
        updateParent({ start: startTime, end: dims.duration });
      }
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleRangeChange = (start: number, end: number) => {
    setStartTime(start);
    setEndTime(end);
    updateParent({ start, end });
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const setInToCurrent = () => {
    const newStart = Math.min(currentTime, endTime > 0 ? endTime - 0.2 : duration);
    setStartTime(newStart);
    updateParent({ start: newStart });
  };

  const setOutToCurrent = () => {
    const newEnd = Math.max(currentTime, startTime + 0.2);
    setEndTime(newEnd);
    updateParent({ end: newEnd });
  };

  const applyChunkPreset = (secs: number) => {
    setChunkSeconds(secs);
    setTrimMode('split_chunks');
    updateParent({ trim_mode: 'split_chunks', chunk_seconds: secs });
  };

  const selectedDuration = Math.max(0, endTime - startTime);
  const estimatedChunks = duration > 0 ? Math.ceil(duration / chunkSeconds) : 0;

  return (
    <div className="space-y-4">
      {/* 1. Video Player Monitor */}
      <VideoPlayerViewport
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* 2. Audio Waveform Display (Speech & Beat Detection) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-inner">
        <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audio Waveform Peak Track</span>
          </div>
          <span className="text-[11px] text-slate-500">Decoded with Web Audio API</span>
        </div>
        <WaveformTrack
          videoUrl={videoUrl}
          duration={duration}
          currentTime={currentTime}
          startTime={startTime}
          endTime={endTime}
          onSeek={handleSeek}
        />
      </div>

      {/* 3. Visual Filmstrip Scrubber with Yellow Bracket Handles & Micro-Steppers */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-inner">
        <FilmstripScrubber
          videoRef={videoRef}
          videoUrl={videoUrl}
          duration={duration}
          currentTime={currentTime}
          startTime={startTime}
          endTime={endTime}
          onRangeChange={handleRangeChange}
          onSeek={handleSeek}
        />

        {/* Quick In/Out buttons from Current Playhead */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={setInToCurrent}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-medium hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-1"
            >
              <span>[ Mark In</span>
              <span className="text-[10px] text-amber-400/80">({formatSeconds(currentTime)})</span>
            </button>
            <button
              type="button"
              onClick={setOutToCurrent}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-medium hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-1"
            >
              <span>Mark Out ]</span>
              <span className="text-[10px] text-amber-400/80">({formatSeconds(currentTime)})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Selected Span:</span>
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-semibold">
              {formatSeconds(selectedDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Trimming Mode Bar: Single / Cut Out / WhatsApp Chunker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setTrimMode('single');
            updateParent({ trim_mode: 'single' });
          }}
          className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
            trimMode === 'single'
              ? 'bg-cyan-500/10 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2 rounded-lg mt-0.5 ${trimMode === 'single' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200">Keep Selection</div>
            <div className="text-xs text-slate-400 mt-0.5">Extract clip between Mark In and Mark Out</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setTrimMode('cut_out');
            updateParent({ trim_mode: 'cut_out' });
          }}
          className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
            trimMode === 'cut_out'
              ? 'bg-rose-500/10 border-rose-500/50 shadow-sm shadow-rose-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2 rounded-lg mt-0.5 ${trimMode === 'cut_out' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200">Cut Out Middle</div>
            <div className="text-xs text-slate-400 mt-0.5">Remove errors or ads, merge front & back</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setTrimMode('split_chunks');
            updateParent({ trim_mode: 'split_chunks' });
          }}
          className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
            trimMode === 'split_chunks'
              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className={`p-2 rounded-lg mt-0.5 ${trimMode === 'split_chunks' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200">Story / Status Chunker</div>
            <div className="text-xs text-slate-400 mt-0.5">Split whole video into equal social chunks</div>
          </div>
        </button>
      </div>

      {/* 5. Chunker Quick Presets (when split_chunks is active) */}
      {trimMode === 'split_chunks' && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              1-Tap Social Story Presets
            </span>
            <span className="font-mono text-emerald-400/90 font-medium">
              Produces ~{estimatedChunks} video clips ({chunkSeconds}s each)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { sec: 15, label: '15s Instagram Story' },
              { sec: 30, label: '30s WhatsApp Status' },
              { sec: 60, label: '60s TikTok / Shorts' },
            ].map((preset) => (
              <button
                key={preset.sec}
                type="button"
                onClick={() => applyChunkPreset(preset.sec)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  chunkSeconds === preset.sec
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. Dual Engine Selector: Lossless Stream Copy vs Frame-Accurate Smart Cut */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200">Trimming Engine</span>
            {lossless ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3" /> 0.1s Stream Copy
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Frame-Accurate
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {lossless
              ? 'Lossless cuts in 100 milliseconds with zero re-encoding. 100% original video/audio quality preserved.'
              : 'Re-encodes boundary GOPs with CRF 18 visually lossless quality for microsecond-precise cuts.'}
          </p>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setLossless(true);
              updateParent({ lossless: true });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              lossless
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Lossless (Instant)
          </button>
          <button
            type="button"
            onClick={() => {
              setLossless(false);
              updateParent({ lossless: false });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              !lossless
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Smart Cut (Accurate)
          </button>
        </div>
      </div>
    </div>
  );
};
