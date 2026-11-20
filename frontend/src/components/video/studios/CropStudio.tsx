import React, { useState, useRef } from 'react';
import { Crop, Sparkles, Grid, Eye, Sliders, Check, Smartphone, Square, Monitor, Film } from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';
import { InteractiveCanvasOverlay, CropRect, NativeCropRect } from '../core/InteractiveCanvasOverlay';

interface CropStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const CropStudio: React.FC<CropStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [containerRect, setContainerRect] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [videoNativeDims, setVideoNativeDims] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showCrosshair, setShowCrosshair] = useState<boolean>(true);

  // Normalized crop rectangle: default center 9:16 or user coordinates
  const [crop, setCrop] = useState<CropRect>({
    x: 0.15,
    y: 0.05,
    width: 0.7,
    height: 0.9,
  });

  const updateParam = (key: string, value: any) => {
    onParametersChange({ ...parameters, [key]: value });
  };

  const handleLoadedMetadata = (dims: { width: number; height: number }) => {
    setVideoNativeDims(dims);
  };

  const handleCropChange = (newCrop: CropRect, nativeCrop: NativeCropRect) => {
    setCrop(newCrop);
    onParametersChange({
      ...parameters,
      x: nativeCrop.x,
      y: nativeCrop.y,
      width: nativeCrop.width,
      height: nativeCrop.height,
    });
  };

  // Preset aspect ratio locks
  const aspectPresets = [
    { label: '9:16', sub: 'TikTok / Reels', ratio: 9 / 16, icon: Smartphone },
    { label: '1:1', sub: 'Square Feed', ratio: 1 / 1, icon: Square },
    { label: '4:5', sub: 'Insta Portrait', ratio: 4 / 5, icon: Square },
    { label: '16:9', sub: 'Landscape YouTube', ratio: 16 / 9, icon: Monitor },
    { label: '21:9', sub: 'Cinemascope', ratio: 21 / 9, icon: Film },
    { label: 'Free', sub: 'Custom Freeform', ratio: null, icon: Sliders },
  ];

  const currentRatio = parameters.aspect_ratio || '9:16';

  const applyAspectPreset = (ratioVal: number | null, ratioLabel: string) => {
    updateParam('aspect_ratio', ratioLabel);

    if (ratioVal === null) return;

    // Center the crop box with the new aspect ratio
    const videoAspect = videoNativeDims.width / videoNativeDims.height || 16 / 9;
    const targetNormalized = ratioVal / videoAspect;

    let newW = 0.8;
    let newH = newW / targetNormalized;

    if (newH > 0.95) {
      newH = 0.9;
      newW = newH * targetNormalized;
    }

    const newX = Math.max(0, (1 - newW) / 2);
    const newY = Math.max(0, (1 - newH) / 2);

    const updatedCrop: CropRect = { x: newX, y: newY, width: newW, height: newH };
    setCrop(updatedCrop);

    // Compute native coords
    const vW = videoNativeDims.width || 1920;
    const vH = videoNativeDims.height || 1080;
    let nX = Math.round(newX * vW);
    let nY = Math.round(newY * vH);
    let nW = Math.round(newW * vW);
    let nH = Math.round(newH * vH);
    if (nW % 2 !== 0) nW -= 1;
    if (nH % 2 !== 0) nH -= 1;

    onParametersChange({
      ...parameters,
      aspect_ratio: ratioLabel,
      x: nX,
      y: nY,
      width: nW,
      height: nH,
    });
  };

  const getAspectLockRatio = (): number | null => {
    const matched = aspectPresets.find((p) => p.label === currentRatio);
    return matched ? matched.ratio : null;
  };

  return (
    <div className="space-y-4">
      {/* 1. Dedicated Interactive Viewport Canvas */}
      <VideoPlayerViewport
        videoRef={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onContainerRectChange={setContainerRect}
        aspectRatioClass="aspect-video max-h-[320px] sm:max-h-[380px]"
      >
        <InteractiveCanvasOverlay
          containerRect={containerRect}
          videoNativeDimensions={videoNativeDims}
          crop={crop}
          onChange={handleCropChange}
          aspectRatioLock={getAspectLockRatio()}
          showRuleOfThirds={showGrid}
          showCrosshair={showCrosshair}
        />
      </VideoPlayerViewport>

      {/* 2. Floating Aspect Ratio Preset Toolbar */}
      <div className="p-3 bg-surface-900 border border-brand-500/30 rounded-2xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider">
            <Crop className="h-4 w-4 text-brand-400" />
            <span>Interactive Crop Aspect Ratio Locks</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded-lg border text-xs transition ${
                showGrid ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'bg-surface-950 border-surface-800 text-slate-500'
              }`}
              title="Toggle Rule-of-Thirds Grid"
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowCrosshair(!showCrosshair)}
              className={`p-1.5 rounded-lg border text-xs transition ${
                showCrosshair ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'bg-surface-950 border-surface-800 text-slate-500'
              }`}
              title="Toggle Center Crosshair"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {aspectPresets.map((preset) => {
            const active = currentRatio === preset.label;
            const Icon = preset.icon;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyAspectPreset(preset.ratio, preset.label)}
                className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  active
                    ? 'bg-brand-500/20 border-brand-500 text-white shadow-md shadow-brand-500/20 scale-[1.02]'
                    : 'bg-surface-950 border-surface-800 text-slate-400 hover:border-surface-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-brand-400' : 'text-slate-500'}`} />
                <div className="text-xs font-bold leading-none">{preset.label}</div>
                <div className="text-[9px] text-slate-400 leading-none">{preset.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Coordinate HUD & Edge Sharpening Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Precise Pixel Coordinate Inspector */}
        <div className="p-3 bg-surface-900 border border-surface-800 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-slate-400" />
            Exact Output Dimensions (Even Parity Clamped)
          </span>
          <div className="grid grid-cols-4 gap-2 font-mono text-center">
            <div className="p-1.5 bg-surface-950 rounded-lg border border-surface-800">
              <div className="text-[9px] text-slate-500 uppercase">Width</div>
              <div className="text-xs font-bold text-white">{parameters.width || 1080}px</div>
            </div>
            <div className="p-1.5 bg-surface-950 rounded-lg border border-surface-800">
              <div className="text-[9px] text-slate-500 uppercase">Height</div>
              <div className="text-xs font-bold text-white">{parameters.height || 1920}px</div>
            </div>
            <div className="p-1.5 bg-surface-950 rounded-lg border border-surface-800">
              <div className="text-[9px] text-slate-500 uppercase">X Offset</div>
              <div className="text-xs font-bold text-slate-300">{parameters.x || 0}px</div>
            </div>
            <div className="p-1.5 bg-surface-950 rounded-lg border border-surface-800">
              <div className="text-[9px] text-slate-500 uppercase">Y Offset</div>
              <div className="text-xs font-bold text-slate-300">{parameters.y || 0}px</div>
            </div>
          </div>
        </div>

        {/* Lanczos Sinc Sharpening Filter */}
        <div className="p-3 bg-surface-900 border border-surface-800 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5 pr-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-brand-400" />
              <span className="text-xs font-bold text-white">Lanczos Sinc Edge Sharpening</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Restores crisp pixel edge fidelity lost when zoomed into a cropped sensor region.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={parameters.sharpen !== false}
              onChange={(e) => updateParam('sharpen', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500" />
          </label>
        </div>
      </div>
    </div>
  );
};
