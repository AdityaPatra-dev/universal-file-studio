import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react';

interface FilmstripScrubberProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoSrc?: string;
  videoUrl?: string;
  duration: number;
  currentTime: number;
  onSeek: (timeSeconds: number) => void;
  // Optional trim range (if in trim mode)
  trimStart?: number;
  trimEnd?: number;
  startTime?: number;
  endTime?: number;
  onTrimChange?: (start: number, end: number) => void;
  onRangeChange?: (start: number, end: number) => void;
  isTrimMode?: boolean;
}

export const FilmstripScrubber: React.FC<FilmstripScrubberProps> = ({
  videoRef,
  videoSrc: propVideoSrc,
  videoUrl,
  duration,
  currentTime,
  onSeek,
  trimStart,
  trimEnd,
  startTime,
  endTime,
  onTrimChange: propOnTrimChange,
  onRangeChange,
  isTrimMode: propIsTrimMode,
}) => {
  const videoSrc = propVideoSrc || videoUrl || '';
  const effectiveTrimStart = trimStart !== undefined ? trimStart : (startTime !== undefined ? startTime : 0);
  const effectiveTrimEnd = trimEnd !== undefined ? trimEnd : (endTime !== undefined ? endTime : duration);
  const onTrimChange = propOnTrimChange || onRangeChange;
  const isTrimMode = propIsTrimMode !== undefined ? propIsTrimMode : Boolean(onTrimChange || startTime !== undefined || trimStart !== undefined);

  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeDrag, setActiveDrag] = useState<'playhead' | 'start' | 'end' | null>(null);

  const numThumbnails = 12;

  // Extract thumbnail snapshots across the video duration using offscreen canvas
  useEffect(() => {
    if (!videoSrc || !duration || duration <= 0) return;

    let active = true;
    const thumbs: string[] = [];
    setIsExtracting(true);

    const hiddenVideo = document.createElement('video');
    hiddenVideo.src = videoSrc;
    hiddenVideo.crossOrigin = 'anonymous';
    hiddenVideo.muted = true;
    hiddenVideo.playsInline = true;

    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 68;
    const ctx = canvas.getContext('2d');

    const step = duration / numThumbnails;
    let currentIndex = 0;
    let seekTimeout: any = null;

    const captureNextFrame = () => {
      if (!active) return;
      if (currentIndex >= numThumbnails) {
        if (seekTimeout) clearTimeout(seekTimeout);
        setThumbnails(thumbs);
        setIsExtracting(false);
        hiddenVideo.removeAttribute('src');
        hiddenVideo.load();
        return;
      }

      if (seekTimeout) clearTimeout(seekTimeout);
      seekTimeout = setTimeout(() => {
        if (!active) return;
        currentIndex++;
        captureNextFrame();
      }, 450);

      try {
        hiddenVideo.currentTime = Math.min(Math.max(0, duration - 0.05), currentIndex * step + step / 2);
      } catch {
        currentIndex++;
        captureNextFrame();
      }
    };

    hiddenVideo.addEventListener('seeked', () => {
      if (!active || !ctx) return;
      if (seekTimeout) clearTimeout(seekTimeout);
      try {
        ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
        thumbs.push(canvas.toDataURL('image/jpeg', 0.65));
      } catch {
        // ignore canvas drawing errors
      }
      currentIndex++;
      captureNextFrame();
    });

    hiddenVideo.addEventListener('loadedmetadata', () => {
      captureNextFrame();
    });

    hiddenVideo.addEventListener('error', () => {
      if (seekTimeout) clearTimeout(seekTimeout);
      if (active) setIsExtracting(false);
    });

    return () => {
      active = false;
      if (seekTimeout) clearTimeout(seekTimeout);
      hiddenVideo.removeAttribute('src');
      hiddenVideo.load();
    };
  }, [videoSrc, duration]);

  // Sync play state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [videoRef]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Step micro-frames (assuming ~30fps -> 0.033s per frame)
  const stepFrame = (frames: number) => {
    const frameDuration = 1 / 30;
    const newTime = Math.max(0, Math.min(duration, currentTime + frames * frameDuration));
    onSeek(newTime);
  };

  // Convert pixel click on track to seconds
  const getSecondsFromPointer = useCallback(
    (clientX: number): number => {
      if (!trackRef.current || duration <= 0) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      return (clickX / rect.width) * duration;
    },
    [duration]
  );

  const handlePointerDown = (e: React.PointerEvent, target: 'playhead' | 'start' | 'end' | 'track') => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (target === 'track') {
      const time = getSecondsFromPointer(e.clientX);
      onSeek(time);
      setActiveDrag('playhead');
    } else {
      setActiveDrag(target);
    }
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!activeDrag || duration <= 0) return;
      const targetSec = getSecondsFromPointer(e.clientX);

      if (activeDrag === 'playhead') {
        onSeek(targetSec);
      } else if (activeDrag === 'start' && onTrimChange) {
        const newStart = Math.min(targetSec, (effectiveTrimEnd || duration) - 0.2);
        onTrimChange(Math.max(0, newStart), effectiveTrimEnd);
      } else if (activeDrag === 'end' && onTrimChange) {
        const newEnd = Math.max(targetSec, (effectiveTrimStart || 0) + 0.2);
        onTrimChange(effectiveTrimStart, Math.min(duration, newEnd));
      }
    },
    [activeDrag, duration, getSecondsFromPointer, onSeek, onTrimChange, effectiveTrimStart, effectiveTrimEnd]
  );

  const handlePointerUp = useCallback(() => {
    setActiveDrag(null);
  }, []);

  useEffect(() => {
    if (activeDrag) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [activeDrag, handlePointerMove, handlePointerUp]);

  // Position percentages
  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const startPercent = duration > 0 ? (effectiveTrimStart / duration) * 100 : 0;
  const endPercent = duration > 0 ? ((effectiveTrimEnd || duration) / duration) * 100 : 100;

  return (
    <div className="w-full bg-surface-950/90 border border-surface-800 rounded-2xl p-3.5 space-y-3 select-none">
      {/* 1. Header Toolbar: HUD Timecode & Micro-Stepping Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-400 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <div className="font-mono text-xs">
            <span className="font-bold text-white">{formatTime(currentTime)}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-slate-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Frame Stepping Buttons */}
        <div className="flex items-center gap-1 bg-surface-900 border border-surface-800 rounded-xl p-1">
          <button
            type="button"
            onClick={() => onSeek(Math.max(0, currentTime - 1))}
            title="-1 Second"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-surface-800 transition text-[10px] font-mono font-bold"
          >
            -1s
          </button>
          <button
            type="button"
            onClick={() => stepFrame(-1)}
            title="-1 Frame (33ms)"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-surface-800 transition"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] text-slate-500 font-mono px-1">FRAME</span>
          <button
            type="button"
            onClick={() => stepFrame(1)}
            title="+1 Frame (33ms)"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-surface-800 transition"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSeek(Math.min(duration, currentTime + 1))}
            title="+1 Second"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-surface-800 transition text-[10px] font-mono font-bold"
          >
            +1s
          </button>
        </div>
      </div>

      {/* 2. Visual Filmstrip Storyboard Scrubber */}
      <div
        ref={trackRef}
        onPointerDown={(e) => handlePointerDown(e, 'track')}
        className="relative h-14 w-full rounded-xl overflow-hidden bg-surface-900 border border-surface-800 cursor-pointer touch-none group"
      >
        {/* Thumbnails Row */}
        <div className="absolute inset-0 flex">
          {thumbnails.length > 0 ? (
            thumbnails.map((thumb, idx) => (
              <div key={idx} className="flex-1 h-full overflow-hidden border-r border-black/30 relative">
                <img src={thumb} alt={`frame ${idx}`} className="w-full h-full object-cover" />
              </div>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-mono">
              {isExtracting ? 'Generating filmstrip thumbnails...' : 'Filmstrip Timeline'}
            </div>
          )}
        </div>

        {/* Trim Dimming Overlays */}
        {isTrimMode && (
          <>
            {/* Left Dim Area (Cut Out) */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-black/75 pointer-events-none"
              style={{ width: `${startPercent}%` }}
            />
            {/* Right Dim Area (Cut Out) */}
            <div
              className="absolute top-0 bottom-0 right-0 bg-black/75 pointer-events-none"
              style={{ width: `${100 - endPercent}%` }}
            />
            {/* Active Trim Range Highlight Box */}
            <div
              className="absolute top-0 bottom-0 border-y-2 border-amber-400 pointer-events-none"
              style={{
                left: `${startPercent}%`,
                width: `${endPercent - startPercent}%`,
              }}
            />

            {/* In Bracket Handle */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'start')}
              style={{ left: `${startPercent}%` }}
              className="absolute top-0 bottom-0 -translate-x-1/2 w-4 z-20 cursor-ew-resize flex items-center justify-center group/h"
            >
              <div className="w-2.5 h-full bg-amber-400 rounded-l-md shadow-lg flex items-center justify-center group-hover/h:scale-110 transition-transform">
                <div className="w-0.5 h-4 bg-black/60 rounded" />
              </div>
            </div>

            {/* Out Bracket Handle */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'end')}
              style={{ left: `${endPercent}%` }}
              className="absolute top-0 bottom-0 -translate-x-1/2 w-4 z-20 cursor-ew-resize flex items-center justify-center group/h"
            >
              <div className="w-2.5 h-full bg-amber-400 rounded-r-md shadow-lg flex items-center justify-center group-hover/h:scale-110 transition-transform">
                <div className="w-0.5 h-4 bg-black/60 rounded" />
              </div>
            </div>
          </>
        )}

        {/* 3. Playhead Marker Line */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'playhead')}
          style={{ left: `${playheadPercent}%` }}
          className="absolute top-0 bottom-0 -translate-x-1/2 w-4 z-30 flex flex-col items-center cursor-ew-resize pointer-events-auto"
        >
          {/* Top handle pill */}
          <div className="w-3 h-3 bg-white rounded-full border-2 border-brand-500 shadow-md -mt-1 hover:scale-125 transition-transform" />
          {/* Vertical scrubber needle */}
          <div className="w-0.5 flex-1 bg-white shadow-sm" />
        </div>
      </div>

      {/* 3. Trim Range Information (if in trim mode) */}
      {isTrimMode && onTrimChange && (
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
          <div>
            <span className="text-slate-500">In: </span>
            <span className="text-amber-400 font-bold">{formatTime(effectiveTrimStart)}</span>
          </div>
          <div>
            <span className="text-slate-500">Duration: </span>
            <span className="text-white font-bold">{formatTime(Math.max(0, (effectiveTrimEnd || duration) - effectiveTrimStart))}</span>
          </div>
          <div>
            <span className="text-slate-500">Out: </span>
            <span className="text-amber-400 font-bold">{formatTime(effectiveTrimEnd || duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
