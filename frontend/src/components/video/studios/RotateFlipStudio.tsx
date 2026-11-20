import React, { useState, useRef } from 'react';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Zap,
  Sparkles,
  Sliders,
  Check,
  RefreshCw,
  Eye,
  Compass
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';

interface RotateFlipStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const RotateFlipStudio: React.FC<RotateFlipStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });

  const [degrees, setDegrees] = useState<number>(
    Number(parameters.degrees ?? parameters.rotation ?? 90)
  );
  const [flipH, setFlipH] = useState<boolean>(parameters.flip_h === true);
  const [flipV, setFlipV] = useState<boolean>(parameters.flip_v === true);
  const [losslessMeta, setLosslessMeta] = useState<boolean>(
    parameters.lossless_metadata === true
  );

  const updateParent = (updates: Partial<{
    degrees: number;
    flip_h: boolean;
    flip_v: boolean;
    lossless_metadata: boolean;
  }>) => {
    const nextDeg = updates.degrees !== undefined ? updates.degrees : degrees;
    const nextFlipH = updates.flip_h !== undefined ? updates.flip_h : flipH;
    const nextFlipV = updates.flip_v !== undefined ? updates.flip_v : flipV;
    const nextMeta = updates.lossless_metadata !== undefined ? updates.lossless_metadata : losslessMeta;

    onParametersChange({
      ...parameters,
      degrees: nextDeg,
      rotation: nextDeg,
      flip_h: nextFlipH,
      flip_v: nextFlipV,
      lossless_metadata: nextMeta,
    });
  };

  const handleLoadedMetadata = (dims: { width: number; height: number }) => {
    setVideoDims(dims);
  };

  const rotateBy = (delta: number) => {
    const next = (degrees + delta + 360) % 360;
    setDegrees(next);
    updateParent({ degrees: next });
  };

  const setExactAngle = (angle: number) => {
    setDegrees(angle);
    updateParent({ degrees: angle });
  };

  const toggleFlipH = () => {
    const next = !flipH;
    setFlipH(next);
    updateParent({ flip_h: next });
  };

  const toggleFlipV = () => {
    const next = !flipV;
    setFlipV(next);
    updateParent({ flip_v: next });
  };

  const resetOrientation = () => {
    setDegrees(0);
    setFlipH(false);
    setFlipV(false);
    updateParent({ degrees: 0, flip_h: false, flip_v: false });
  };

  // Determine if video dimensions will flip (at 90 or 270 deg)
  const isTransposed = degrees === 90 || degrees === 270;
  const outW = isTransposed ? videoDims.height : videoDims.width;
  const outH = isTransposed ? videoDims.width : videoDims.height;

  return (
    <div className="space-y-4">
      {/* 1. Live Video Viewport with Real-time 3D CSS Transform */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-3 flex items-center justify-center">
        <VideoPlayerViewport
          ref={videoRef}
          src={videoUrl}
          onLoadedMetadata={handleLoadedMetadata}
          videoStyle={{
            transform: `rotate(${degrees}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {/* Orientation Telemetry Floating Badge */}
        <div className="absolute top-5 right-5 z-20 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/20 font-mono text-xs text-cyan-300 flex items-center gap-2 shadow-xl">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>{degrees}°</span>
          {flipH && <span className="text-[10px] bg-cyan-950 px-1 rounded text-cyan-400">FLIP-H</span>}
          {flipV && <span className="text-[10px] bg-cyan-950 px-1 rounded text-cyan-400">FLIP-V</span>}
        </div>
      </div>

      {/* 2. Quick 90° Rotation & Mirror Control Deck */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <RotateCw className="w-4 h-4" />
            <span>Orientation Deck</span>
          </span>
          <button
            type="button"
            onClick={resetOrientation}
            className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset (0°)</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => rotateBy(-90)}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 text-slate-200 font-semibold text-xs"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Turn Left 90°</span>
          </button>

          <button
            type="button"
            onClick={() => rotateBy(90)}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 text-slate-200 font-semibold text-xs"
          >
            <RotateCw className="w-4 h-4 text-cyan-400" />
            <span>Turn Right 90°</span>
          </button>

          <button
            type="button"
            onClick={toggleFlipH}
            className={`p-3 rounded-xl border active:scale-95 transition-all flex items-center justify-center gap-2 text-xs font-semibold ${
              flipH
                ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-500/10'
                : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
            }`}
          >
            <FlipHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Flip Horizontal</span>
          </button>

          <button
            type="button"
            onClick={toggleFlipV}
            className={`p-3 rounded-xl border active:scale-95 transition-all flex items-center justify-center gap-2 text-xs font-semibold ${
              flipV
                ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-500/10'
                : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
            }`}
          >
            <FlipVertical className="w-4 h-4 text-cyan-400" />
            <span>Flip Vertical</span>
          </button>
        </div>

        {/* 90° Cardinal Snapping Pills */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800">
          {[0, 90, 180, 270].map((angle) => (
            <button
              key={angle}
              type="button"
              onClick={() => setExactAngle(angle)}
              className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                degrees === angle
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {angle}°
            </button>
          ))}
        </div>
      </div>

      {/* 3. Output Dimensions & Encoding Engine Mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Dimensions HUD */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">Resulting Aspect & Size</div>
            <div className="text-[11px] text-slate-400">
              {isTransposed ? 'Aspect ratio inverted from landscape to portrait' : 'Original aspect preserved'}
            </div>
          </div>
          <div className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
            {outW}×{outH}
          </div>
        </div>

        {/* Lossless Metadata vs Hardcode Transpose */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              {losslessMeta ? (
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{losslessMeta ? 'Instant Metadata Rotate' : 'Hardcoded Pixel Rotate'}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {losslessMeta
                ? '50ms stream copy (updates MP4 header tag)'
                : 'Physically rotates pixels for 100% device compatibility'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !losslessMeta;
              setLosslessMeta(next);
              updateParent({ lossless_metadata: next });
            }}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
              losslessMeta ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                losslessMeta ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
