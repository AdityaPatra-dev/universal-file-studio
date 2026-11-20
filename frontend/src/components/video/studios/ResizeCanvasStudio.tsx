import React, { useState, useRef } from 'react';
import {
  Layers,
  Sparkles,
  Smartphone,
  Square,
  Monitor,
  Film,
  Sliders,
  Check,
  Palette,
  Maximize2
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';

interface ResizeCanvasStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const ResizeCanvasStudio: React.FC<ResizeCanvasStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });

  const [preset, setPreset] = useState<string>(parameters.preset || '9:16');
  const [fitMode, setFitMode] = useState<string>(parameters.fit_mode || 'blurred_background');
  const [padColor, setPadColor] = useState<string>(parameters.pad_color || 'black');
  const [sharpen, setSharpen] = useState<boolean>(parameters.sharpen !== false);
  const [keepAspect, setKeepAspect] = useState<boolean>(parameters.keep_aspect_ratio !== false);

  const updateParent = (updates: Partial<{
    preset: string;
    fit_mode: string;
    pad_color: string;
    sharpen: boolean;
    keep_aspect_ratio: boolean;
  }>) => {
    const nextPreset = updates.preset !== undefined ? updates.preset : preset;
    const nextFit = updates.fit_mode !== undefined ? updates.fit_mode : fitMode;
    const nextColor = updates.pad_color !== undefined ? updates.pad_color : padColor;
    const nextSharp = updates.sharpen !== undefined ? updates.sharpen : sharpen;
    const nextKeep = updates.keep_aspect_ratio !== undefined ? updates.keep_aspect_ratio : keepAspect;

    onParametersChange({
      ...parameters,
      preset: nextPreset,
      fit_mode: nextFit,
      pad_color: nextColor,
      sharpen: nextSharp,
      keep_aspect_ratio: nextKeep,
    });
  };

  const handleLoadedMetadata = (dims: { width: number; height: number }) => {
    setVideoDims(dims);
  };

  const aspectPresets = [
    { key: '9:16', label: '9:16 Vertical', sub: 'TikTok / Reels / Shorts', icon: Smartphone, w: 1080, h: 1920 },
    { key: '1:1', label: '1:1 Square', sub: 'Instagram Feed Post', icon: Square, w: 1080, h: 1080 },
    { key: '4:5', label: '4:5 Portrait', sub: 'Instagram Feed Tall', icon: Square, w: 1080, h: 1350 },
    { key: '16:9', label: '16:9 Landscape', sub: 'YouTube / HDTV (1080p)', icon: Monitor, w: 1920, h: 1080 },
    { key: '21:9', label: '21:9 Cinematic', sub: 'Cinemascope Ultra-Wide', icon: Film, w: 2560, h: 1080 },
    { key: '720p', label: '720p HD', sub: 'Bandwidth Saver', icon: Monitor, w: 1280, h: 720 },
  ];

  const fitModes = [
    {
      key: 'blurred_background',
      title: 'Blurred Video Fill',
      desc: 'Clones video as an aesthetic blurred background (InShot signature look)',
    },
    {
      key: 'letterbox',
      title: 'Letterbox Padding',
      desc: 'Clean pillarbox or letterbox with solid backdrop color',
    },
    {
      key: 'fill',
      title: 'Center Zoom Fill',
      desc: 'Zooms in to fill frame without any bars (crops edges)',
    },
    {
      key: 'stretch',
      title: 'Non-Uniform Stretch',
      desc: 'Stretches pixels to fit exact canvas boundaries',
    },
  ];

  const colorPresets = [
    { key: 'black', hex: '#000000', label: 'Pitch Black' },
    { key: 'white', hex: '#ffffff', label: 'Pure White' },
    { key: '#0f172a', hex: '#0f172a', label: 'Slate Dark' },
    { key: '#1e1b4b', hex: '#1e1b4b', label: 'Deep Indigo' },
    { key: '#18181b', hex: '#18181b', label: 'Zinc Gray' },
  ];

  // Dynamic aspect ratio styling for the monitor preview
  const getContainerAspect = () => {
    switch (preset) {
      case '9:16':
        return 'aspect-[9/16] max-h-[360px] mx-auto';
      case '1:1':
        return 'aspect-square max-h-[320px] mx-auto';
      case '4:5':
        return 'aspect-[4/5] max-h-[340px] mx-auto';
      case '21:9':
        return 'aspect-[21/9] max-h-[220px] w-full';
      default:
        return 'aspect-video max-h-[300px] w-full';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Video Player Monitor with Canvas Fit Simulation */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 flex items-center justify-center">
        {/* Background Layer: Blurred Video simulation if fit_mode === 'blurred_background' */}
        {fitMode === 'blurred_background' && videoUrl && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 blur-xl scale-125">
            <video
              src={videoUrl}
              muted
              playsInline
              loop
              autoPlay
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div
          className={`${getContainerAspect()} transition-all duration-300 relative rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl z-10 flex items-center justify-center`}
          style={{
            backgroundColor: fitMode === 'letterbox' ? padColor : '#000',
          }}
        >
          <VideoPlayerViewport
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            aspectRatioClass="w-full h-full"
            videoStyle={{
              objectFit: fitMode === 'stretch' ? 'fill' : fitMode === 'fill' ? 'cover' : 'contain',
            }}
          />
        </div>
      </div>

      {/* 2. Target Aspect Ratio Presets */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Layers className="w-4 h-4" />
            <span>Target Social Aspect Ratio & Resolution</span>
          </span>
          <span className="font-mono text-cyan-400 font-bold">
            Source: {videoDims.width}×{videoDims.height}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {aspectPresets.map((p) => {
            const Icon = p.icon;
            const isSelected = preset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setPreset(p.key);
                  updateParent({ preset: p.key });
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-200 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">{p.label}</div>
                  <div className="text-[11px] text-slate-400">{p.sub}</div>
                  <div className="text-[10px] font-mono text-cyan-400/90 mt-0.5">{p.w}×{p.h}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Canvas Fit Mode Selector */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-amber-400">
            <Maximize2 className="w-4 h-4" />
            <span>Canvas Fit Strategy</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {fitModes.map((mode) => {
            const isSelected = fitMode === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => {
                  setFitMode(mode.key);
                  updateParent({ fit_mode: mode.key });
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/60 shadow-sm'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-200">{mode.title}</div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{mode.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Solid Color Bar (when letterbox is selected) */}
        {fitMode === 'letterbox' && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pillarbox / Letterbox Padding Color</span>
            </div>
            <div className="flex items-center gap-2">
              {colorPresets.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setPadColor(c.key);
                    updateParent({ pad_color: c.key });
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                    padColor === c.key
                      ? 'border-cyan-400 bg-slate-800 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-slate-600"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Lanczos Sinc Sharpening Engine */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lanczos-3 Sinc Edge Sharpening</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Prevents blurry or fuzzy edges during high-resolution scaling
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const next = !sharpen;
            setSharpen(next);
            updateParent({ sharpen: next });
          }}
          className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
            sharpen ? 'bg-cyan-500' : 'bg-slate-700'
          }`}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
              sharpen ? 'left-5' : 'left-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
