import React, { useState, useRef } from 'react';
import {
  Captions,
  Type,
  Sliders,
  Palette,
  FileText,
  Sparkles,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';

interface SubtitleBurnStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  availableFiles?: Array<{ id: number; filename: string; original_filename?: string }>;
}

export const SubtitleBurnStudio: React.FC<SubtitleBurnStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
  availableFiles = [],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [fontSize, setFontSize] = useState<number>(Number(parameters.font_size || 22));
  const [primaryColor, setPrimaryColor] = useState<string>(
    parameters.primary_color || '&H00FFFFFF'
  );
  const [selectedSubId, setSelectedSubId] = useState<number | string>(
    parameters.secondary_file_id || (availableFiles[0]?.id ?? '')
  );

  // Live sample preview caption
  const [sampleCaption, setSampleCaption] = useState<string>(
    'The quick brown fox jumps over the lazy dog.'
  );
  const [alignment, setAlignment] = useState<'bottom' | 'middle' | 'top'>('bottom');
  const [hasBoxBg, setHasBoxBg] = useState<boolean>(true);

  const updateParent = (updates: Partial<{
    font_size: number;
    primary_color: string;
    secondary_file_id: any;
  }>) => {
    const nextSize = updates.font_size !== undefined ? updates.font_size : fontSize;
    const nextColor = updates.primary_color !== undefined ? updates.primary_color : primaryColor;
    const nextSub = updates.secondary_file_id !== undefined ? updates.secondary_file_id : selectedSubId;

    onParametersChange({
      ...parameters,
      font_size: nextSize,
      primary_color: nextColor,
      secondary_file_id: nextSub,
    });
  };

  const colorPresets = [
    { label: 'Crisp White', ass: '&H00FFFFFF', css: '#FFFFFF' },
    { label: 'Vibrant Yellow', ass: '&H0000FFFF', css: '#FFFF00' },
    { label: 'Cyan Electric', ass: '&H00FFFF00', css: '#00FFFF' },
    { label: 'Gold Highlight', ass: '&H0000D7FF', css: '#FFD700' },
  ];

  const getSubPositionClass = () => {
    switch (alignment) {
      case 'top':
        return 'top-8';
      case 'middle':
        return 'top-1/2 -translate-y-1/2';
      default:
        return 'bottom-8';
    }
  };

  const activeCssColor = colorPresets.find((c) => c.ass === primaryColor)?.css || '#FFFFFF';

  return (
    <div className="space-y-4">
      {/* 1. Live Video Viewport with Interactive Real-Time Subtitle Overlay */}
      <VideoPlayerViewport ref={videoRef} src={videoUrl}>
        <div
          className={`absolute left-0 right-0 ${getSubPositionClass()} px-6 text-center pointer-events-none z-30 transition-all`}
        >
          <span
            style={{
              fontSize: `${Math.max(14, Math.min(36, fontSize * 0.9))}px`,
              color: activeCssColor,
            }}
            className={`font-semibold inline-block max-w-[85%] select-none ${
              hasBoxBg
                ? 'bg-black/75 backdrop-blur-xs px-3.5 py-1.5 rounded-lg border border-white/20 shadow-2xl'
                : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]'
            }`}
          >
            {sampleCaption}
          </span>
        </div>
      </VideoPlayerViewport>

      {/* 2. Subtitle File Selector (.SRT / .VTT / .ASS) */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <label htmlFor="sub-file-picker" className="flex items-center gap-1.5 text-cyan-400">
            <FileText className="w-4 h-4" />
            <span>Subtitle Track File (.srt, .vtt, .ass)</span>
          </label>
        </div>

        {availableFiles.length > 0 ? (
          <select
            id="sub-file-picker"
            value={selectedSubId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedSubId(val);
              updateParent({ secondary_file_id: val });
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 font-medium"
          >
            {availableFiles.map((f) => (
              <option key={f.id} value={f.id}>
                {f.original_filename || f.filename}
              </option>
            ))}
          </select>
        ) : (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Captions className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Please queue or upload an SRT or VTT subtitle file to burn onto this video.</span>
          </div>
        )}

        {/* Live Text Preview Input */}
        <div className="space-y-1 pt-1">
          <label htmlFor="caption-preview-input" className="text-[11px] text-slate-400">Preview Caption Text:</label>
          <input
            id="caption-preview-input"
            type="text"
            value={sampleCaption}
            onChange={(e) => setSampleCaption(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden focus:border-cyan-500"
          />
        </div>
      </div>

      {/* 3. Typography & Styling Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Color Palette Presets */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Palette className="w-4 h-4" />
              <span>Subtitle Font Color</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {colorPresets.map((c) => (
              <button
                key={c.ass}
                type="button"
                onClick={() => {
                  setPrimaryColor(c.ass);
                  updateParent({ primary_color: c.ass });
                }}
                className={`p-2.5 rounded-lg border text-left transition-all flex items-center gap-2.5 ${
                  primaryColor === c.ass
                    ? 'bg-slate-800 border-cyan-400 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0"
                  style={{ backgroundColor: c.css }}
                />
                <span className="text-xs font-medium">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size & Position */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Sliders className="w-4 h-4" />
              <span>Size & Position</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">{fontSize}px</span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="14"
              max="48"
              value={fontSize}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFontSize(val);
                updateParent({ font_size: val });
              }}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Alignment Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">Position</span>
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(['top', 'middle', 'bottom'] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setAlignment(pos)}
                  className={`px-3 py-1 rounded text-xs capitalize transition-all ${
                    alignment === pos
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
