import React, { useRef, useState, useEffect, useCallback, forwardRef } from 'react';
import { Play, Pause, Film, AlertCircle } from 'lucide-react';

export interface VideoPlayerViewportProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  src: string;
  onTimeUpdate?: (currentTime: number) => void;
  onLoadedMetadata?: (dimensions: { width: number; height: number; duration?: number }, duration?: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  children?: React.ReactNode; // Interactive overlays rendered on top of video canvas
  aspectRatioClass?: string;
  style?: React.CSSProperties;
  videoStyle?: React.CSSProperties;
  onContainerRectChange?: (rect: { width: number; height: number }) => void;
}

export const VideoPlayerViewport = forwardRef<HTMLVideoElement, VideoPlayerViewportProps>(({
  videoRef: propVideoRef,
  src,
  onTimeUpdate,
  onLoadedMetadata,
  onPlayStateChange,
  children,
  aspectRatioClass = 'aspect-video max-h-[300px] sm:max-h-[360px]',
  style,
  videoStyle,
  onContainerRectChange,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalRef = useRef<HTMLVideoElement>(null);

  // Support forwarded ref, prop videoRef, or internal fallback
  const resolvedRef = (ref as React.RefObject<HTMLVideoElement | null>) || propVideoRef || internalRef;

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // ResizeObserver to track container pixel bounds for overlay math
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onContainerRectChange) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onContainerRectChange({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [onContainerRectChange]);

  const handleLoadedMetadata = () => {
    const v = resolvedRef.current;
    if (!v) return;
    setIsLoading(false);
    setHasError(false);

    if (onLoadedMetadata) {
      onLoadedMetadata(
        { width: v.videoWidth || 1920, height: v.videoHeight || 1080, duration: v.duration || 0 },
        v.duration || 0
      );
    }
  };

  const handleTimeUpdate = () => {
    const v = resolvedRef.current;
    if (!v) return;
    if (onTimeUpdate) {
      onTimeUpdate(v.currentTime);
    }
  };

  const togglePlay = useCallback(() => {
    const v = resolvedRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => {
          setIsPlaying(true);
          onPlayStateChange?.(true);
        })
        .catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
    }
  }, [resolvedRef, onPlayStateChange]);

  return (
    <div
      ref={containerRef}
      style={style}
      className={`relative w-full ${aspectRatioClass} flex items-center justify-center bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group select-none touch-none`}
    >
      {src ? (
        <video
          ref={resolvedRef}
          src={src}
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => {
            setIsPlaying(true);
            onPlayStateChange?.(true);
          }}
          onPause={() => {
            setIsPlaying(false);
            onPlayStateChange?.(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          style={videoStyle}
          className="w-full h-full object-contain pointer-events-none"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
          <Film className="h-8 w-8 animate-pulse text-slate-600" />
          <span>Loading video monitor...</span>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && src && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-rose-400 text-xs gap-2 p-4 text-center">
          <AlertCircle className="h-8 w-8" />
          <span>Unable to decode video format for preview</span>
        </div>
      )}

      {/* Interactive Overlays (Crop box, Watermark, Subtitles) */}
      {children}

      {/* Center Play / Pause Floating Toggle (appears on hover or when paused) */}
      {!isLoading && !hasError && (
        <button
          type="button"
          onClick={togglePlay}
          className={`absolute inset-0 m-auto h-12 w-12 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 ${
            isPlaying ? 'opacity-0 group-hover:opacity-90' : 'opacity-90 shadow-xl'
          }`}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
      )}
    </div>
  );
});

VideoPlayerViewport.displayName = 'VideoPlayerViewport';
