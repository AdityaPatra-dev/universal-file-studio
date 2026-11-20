import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface WaveformTrackProps {
  mediaUrl?: string;
  videoUrl?: string;
  duration: number;
  currentTime: number;
  onSeek: (timeSeconds: number) => void;
  trimStart?: number;
  trimEnd?: number;
  startTime?: number;
  endTime?: number;
  height?: number;
  barColor?: string;
  activeColor?: string;
  muted?: boolean;
  onToggleMute?: () => void;
  title?: string;
}

export const WaveformTrack: React.FC<WaveformTrackProps> = ({
  mediaUrl: propMediaUrl,
  videoUrl,
  duration,
  currentTime,
  onSeek,
  trimStart,
  trimEnd,
  startTime,
  endTime,
  height = 48,
  barColor = 'rgba(148, 163, 184, 0.35)', // slate-400 with opacity
  activeColor = '#38bdf8', // sky-400
  muted = false,
  onToggleMute,
  title = 'Audio Waveform',
}) => {
  const mediaUrl = propMediaUrl || videoUrl || '';
  const effectiveTrimStart = trimStart !== undefined ? trimStart : (startTime !== undefined ? startTime : 0);
  const effectiveTrimEnd = trimEnd !== undefined ? trimEnd : (endTime !== undefined ? endTime : duration);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const numBars = 120;

  const generateSyntheticEnvelope = useCallback(() => {
    const synth: number[] = [];
    for (let i = 0; i < numBars; i++) {
      const t = i / numBars;
      const rhythm = Math.sin(i * 0.45) * Math.cos(i * 0.18);
      const envelope = 0.25 + 0.65 * Math.abs(rhythm * Math.sin(t * Math.PI));
      const microDynamics = Math.sin(i * 1.7) * 0.15;
      synth.push(Math.max(0.08, Math.min(1.0, envelope + microDynamics)));
    }
    return synth;
  }, [numBars]);

  // Extract real audio peaks using Web Audio API decodeAudioData with memory-safe bounds
  useEffect(() => {
    if (!mediaUrl) return;

    let active = true;
    setIsLoading(true);

    const extractPeaks = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(mediaUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        const contentLength = Number(response.headers.get('content-length') || 0);
        // Safety guard: files over 35MB will OOM mobile WebViews if fully decoded in JS heap
        if (contentLength > 35 * 1024 * 1024) {
          if (!active) return;
          setPeaks(generateSyntheticEnvelope());
          setIsLoading(false);
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        if (!active) return;

        if (arrayBuffer.byteLength > 35 * 1024 * 1024) {
          setPeaks(generateSyntheticEnvelope());
          setIsLoading(false);
          return;
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          setPeaks(generateSyntheticEnvelope());
          setIsLoading(false);
          return;
        }

        const audioCtx = new AudioContextClass();
        try {
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          if (!active) {
            audioCtx.close();
            return;
          }

          const channelData = audioBuffer.getChannelData(0);
          const step = Math.floor(channelData.length / numBars);
          const rawPeaks: number[] = [];

          for (let i = 0; i < numBars; i++) {
            let max = 0;
            const start = i * step;
            const end = Math.min(channelData.length, start + step);
            for (let j = start; j < end; j += 4) {
              const val = Math.abs(channelData[j]);
              if (val > max) max = val;
            }
            rawPeaks.push(max);
          }

          // Normalize peaks 0.05 to 1.0
          const maxPeak = Math.max(...rawPeaks, 0.01);
          const normalized = rawPeaks.map((p) => Math.max(0.06, p / maxPeak));

          setPeaks(normalized);
          setIsLoading(false);
          audioCtx.close();
        } catch {
          audioCtx.close();
          if (!active) return;
          setPeaks(generateSyntheticEnvelope());
          setIsLoading(false);
        }
      } catch {
        // Fallback: Generate synthetic organic speech-like envelope if decodeAudioData fails or aborts
        if (!active) return;
        setPeaks(generateSyntheticEnvelope());
        setIsLoading(false);
      }
    };

    extractPeaks();

    return () => {
      active = false;
    };
  }, [mediaUrl, generateSyntheticEnvelope]);

  // Render canvas waveform
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement?.clientWidth || 300;
    const h = height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const barWidth = Math.max(2, (w / numBars) - 1.5);
    const progressIndex = duration > 0 ? (currentTime / duration) * numBars : 0;
    const startIndex = duration > 0 ? (effectiveTrimStart / duration) * numBars : 0;
    const endIndex = duration > 0 ? ((effectiveTrimEnd || duration) / duration) * numBars : numBars;

    peaks.forEach((peak, i) => {
      const x = i * (w / numBars);
      const barH = peak * (h * 0.85);
      const y = (h - barH) / 2;

      // Determine bar styling
      const isTrimmedOut = i < startIndex || i > endIndex;
      const isPlayed = i <= progressIndex && !isTrimmedOut;

      if (isTrimmedOut) {
        ctx.fillStyle = 'rgba(71, 85, 105, 0.25)'; // slate-600 faded
      } else if (isPlayed) {
        ctx.fillStyle = activeColor;
      } else {
        ctx.fillStyle = barColor;
      }

      ctx.beginPath();
      // Round pill bars
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barWidth, barH, 2);
      } else {
        ctx.rect(x, y, barWidth, barH);
      }
      ctx.fill();
    });

    // Draw playhead needle
    if (duration > 0) {
      const playheadX = (currentTime / duration) * w;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(playheadX - 1, 0, 2, h);
    }
  }, [peaks, currentTime, duration, effectiveTrimStart, effectiveTrimEnd, height, barColor, activeColor]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Handle pointer scrub on waveform
  const handleSeekFromPointer = useCallback(
    (clientX: number) => {
      if (!containerRef.current || duration <= 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const targetSec = (clickX / rect.width) * duration;
      onSeek(targetSec);
    },
    [duration, onSeek]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    handleSeekFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handleSeekFromPointer(e.clientX);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full bg-surface-950/80 border border-surface-800 rounded-xl p-2.5 space-y-1.5 select-none">
      <div className="flex items-center justify-between text-[11px] px-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          {onToggleMute ? (
            <button
              type="button"
              onClick={onToggleMute}
              className={`p-1 rounded hover:bg-surface-800 transition ${muted ? 'text-red-400' : 'text-slate-400'}`}
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <Volume2 className="h-3.5 w-3.5 text-slate-400" />
          )}
          <span>{title}</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {isLoading ? 'Decoding peaks...' : `${peaks.length} bands`}
        </span>
      </div>

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full relative rounded-lg overflow-hidden bg-surface-900/90 cursor-pointer touch-none"
        style={{ height }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
