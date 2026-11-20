import React, { useState, useRef } from 'react';
import {
  Type,
  Move,
  Layers,
  Sparkles,
  Sliders,
  Check,
  Grid,
  Shield,
  Eye,
  Maximize2
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';

interface WatermarkStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
}

export const WatermarkStudio: React.FC<WatermarkStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [text, setText] = useState<string>(
    parameters.text || parameters.watermark_text || '@UniversalFileStudio'
  );
  const [position, setPosition] = useState<string>(parameters.position || 'bottom-right');
  const [opacity, setOpacity] = useState<number>(Number(parameters.opacity || 85));
  const [fontSize, setFontSize] = useState<number>(Number(parameters.font_size || 36));
  const [boxBg, setBoxBg] = useState<boolean>(parameters.box_bg !== false);

  // Position coordinates in percentage (0 to 100)
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 80, y: 88 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const updateParent = (updates: Partial<{
    text: string;
    position: string;
    opacity: number;
    font_size: number;
    box_bg: boolean;
    x_pct: number;
    y_pct: number;
  }>) => {
    const nextText = updates.text !== undefined ? updates.text : text;
    const nextPos = updates.position !== undefined ? updates.position : position;
    const nextOpacity = updates.opacity !== undefined ? updates.opacity : opacity;
    const nextFontSize = updates.font_size !== undefined ? updates.font_size : fontSize;
    const nextBoxBg = updates.box_bg !== undefined ? updates.box_bg : boxBg;
    const nextXPct = updates.x_pct !== undefined ? updates.x_pct : coords.x;
    const nextYPct = updates.y_pct !== undefined ? updates.y_pct : coords.y;

    onParametersChange({
      ...parameters,
      text: nextText,
      watermark_text: nextText,
      position: nextPos,
      x_pct: nextXPct,
      y_pct: nextYPct,
      opacity: nextOpacity,
      font_size: nextFontSize,
      box_bg: nextBoxBg,
    });
  };

  const handlePositionPreset = (posKey: string, xPct: number, yPct: number) => {
    setPosition(posKey);
    setCoords({ x: xPct, y: yPct });
    updateParent({ position: posKey, x_pct: xPct, y_pct: yPct });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const xPct = Math.max(5, Math.min(95, (clientX / rect.width) * 100));
    const yPct = Math.max(5, Math.min(95, (clientY / rect.height) * 100));

    setCoords({ x: xPct, y: yPct });
    setPosition('custom');
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture release ignore
      }
      updateParent({ position: 'custom', x_pct: coords.x, y_pct: coords.y });
    }
  };

  // 9-point anchor grid presets
  const anchorPoints = [
    { key: 'top-left', label: 'TL', x: 15, y: 12 },
    { key: 'top-center', label: 'TC', x: 50, y: 12 },
    { key: 'top-right', label: 'TR', x: 85, y: 12 },
    { key: 'center-left', label: 'CL', x: 15, y: 50 },
    { key: 'center', label: 'C', x: 50, y: 50 },
    { key: 'center-right', label: 'CR', x: 85, y: 50 },
    { key: 'bottom-left', label: 'BL', x: 15, y: 88 },
    { key: 'bottom-center', label: 'BC', x: 50, y: 88 },
    { key: 'bottom-right', label: 'BR', x: 85, y: 88 },
  ];

  const watermarkChips = [
    '@UniversalFileStudio',
    'CONFIDENTIAL',
    'PREVIEW ONLY',
    'DO NOT DISTRIBUTE',
    `© ${new Date().getFullYear()} All Rights Reserved`,
  ];

  return (
    <div className="space-y-4">
      {/* 1. Video Player Monitor with Interactive Watermark Draggable Canvas */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative select-none"
      >
        <VideoPlayerViewport ref={videoRef} src={videoUrl}>
          {/* Draggable Watermark Badge */}
          <div
            style={{
              left: `${coords.x}%`,
              top: `${coords.y}%`,
              transform: 'translate(-50%, -50%)',
              opacity: opacity / 100,
              fontSize: `${Math.max(12, Math.min(32, fontSize * 0.45))}px`,
            }}
            onPointerDown={handlePointerDown}
            className={`absolute cursor-move touch-none z-30 transition-shadow select-none ${
              boxBg
                ? 'bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/20 text-white font-medium shadow-xl'
                : 'text-white font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
            } ${isDragging ? 'ring-2 ring-cyan-400 scale-105' : 'hover:ring-1 hover:ring-cyan-500/50'}`}
          >
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Move className="w-3 h-3 text-cyan-400/80 cursor-grab" />
              <span>{text || 'Enter watermark text'}</span>
            </div>
          </div>
        </VideoPlayerViewport>
      </div>

      {/* 2. Text Input & Preset Chips */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <label htmlFor="watermark-input" className="flex items-center gap-1.5 text-cyan-400">
            <Type className="w-4 h-4" />
            <span>Watermark Content & Branding</span>
          </label>
          <span className="text-[11px] text-slate-500">{text.length} characters</span>
        </div>

        <input
          id="watermark-input"
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            updateParent({ text: e.target.value });
          }}
          placeholder="e.g. @YourBrand, CONFIDENTIAL, © 2026..."
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 font-medium"
        />

        {/* Quick chip presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {watermarkChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setText(chip);
                updateParent({ text: chip });
              }}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Snapping Grid & Styling Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 9-Point Snapping Position Pad */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Grid className="w-4 h-4" />
              <span>Snap Alignment Anchor</span>
            </span>
            <span className="text-[11px] text-slate-500 capitalize">{position}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800/80 max-w-[240px] mx-auto">
            {anchorPoints.map((anchor) => (
              <button
                key={anchor.key}
                type="button"
                onClick={() => handlePositionPreset(anchor.key, anchor.x, anchor.y)}
                className={`py-2 text-xs font-mono font-bold rounded-md transition-all ${
                  position === anchor.key
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {anchor.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-center text-slate-500">
            Tip: You can also drag the watermark directly on the video player!
          </div>
        </div>

        {/* Styling Adjustments: Font Size, Opacity, Backing Pill */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Sliders className="w-4 h-4" />
              <span>Appearance & Typography</span>
            </span>
          </div>

          {/* Opacity Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Opacity</span>
              <span className="font-mono text-cyan-400 font-semibold">{opacity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={opacity}
              onChange={(e) => {
                const val = Number(e.target.value);
                setOpacity(val);
                updateParent({ opacity: val });
              }}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Font Size Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Font Size</span>
              <span className="font-mono text-cyan-400 font-semibold">{fontSize}px</span>
            </div>
            <input
              type="range"
              min="16"
              max="96"
              value={fontSize}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFontSize(val);
                updateParent({ font_size: val });
              }}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Contrast Backing Box Pill Toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs">
              <div className="font-medium text-slate-200">High-Contrast Backing Box</div>
              <div className="text-[11px] text-slate-500">Readable over bright or complex backgrounds</div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !boxBg;
                setBoxBg(next);
                updateParent({ box_bg: next });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                boxBg ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  boxBg ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
