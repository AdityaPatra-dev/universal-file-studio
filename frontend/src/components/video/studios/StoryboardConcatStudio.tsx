import React, { useState, useRef } from 'react';
import {
  GitMerge,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Film,
  Zap,
  Sparkles,
  Layers,
  Clock,
  Check
} from 'lucide-react';
import { VideoPlayerViewport } from '../core/VideoPlayerViewport';

interface StoryboardConcatStudioProps {
  videoUrl: string;
  parameters: Record<string, any>;
  onParametersChange: (newParams: Record<string, any>) => void;
  primaryFileName?: string;
  availableFiles?: Array<{ id: number; filename: string; original_filename?: string }>;
}

export const StoryboardConcatStudio: React.FC<StoryboardConcatStudioProps> = ({
  videoUrl,
  parameters,
  onParametersChange,
  primaryFileName = 'Primary Clip',
  availableFiles = [],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [primaryDuration, setPrimaryDuration] = useState<number>(0);

  // Sequence of secondary file IDs
  const [sequence, setSequence] = useState<number[]>(
    parameters.additional_file_ids || []
  );
  const [streamCopy, setStreamCopy] = useState<boolean>(parameters.stream_copy !== false);
  const [scaleMatch, setScaleMatch] = useState<boolean>(parameters.scale_match !== false);

  const updateParent = (updates: Partial<{
    additional_file_ids: number[];
    stream_copy: boolean;
    scale_match: boolean;
  }>) => {
    const nextSeq = updates.additional_file_ids !== undefined ? updates.additional_file_ids : sequence;
    const nextCopy = updates.stream_copy !== undefined ? updates.stream_copy : streamCopy;
    const nextScale = updates.scale_match !== undefined ? updates.scale_match : scaleMatch;

    onParametersChange({
      ...parameters,
      additional_file_ids: nextSeq,
      stream_copy: nextCopy,
      scale_match: nextScale,
    });
  };

  const handleLoadedMetadata = (dims: { width: number; height: number; duration?: number }) => {
    if (dims.duration && dims.duration > 0) {
      setPrimaryDuration(dims.duration);
    }
  };

  const addClip = (fileId: number) => {
    const next = [...sequence, fileId];
    setSequence(next);
    updateParent({ additional_file_ids: next });
  };

  const removeClip = (index: number) => {
    const next = sequence.filter((_, i) => i !== index);
    setSequence(next);
    updateParent({ additional_file_ids: next });
  };

  const moveClip = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sequence.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const next = [...sequence];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;

    setSequence(next);
    updateParent({ additional_file_ids: next });
  };

  const availableToAdd = availableFiles.filter(
    (f) => !sequence.includes(f.id)
  );

  return (
    <div className="space-y-4">
      {/* 1. Primary Clip Video Monitor */}
      <VideoPlayerViewport
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* 2. Storyboard Sequence Timeline */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <GitMerge className="w-4 h-4" />
            <span>Timeline Concat Sequence</span>
          </div>
          <span className="font-mono text-cyan-400 font-bold">
            {sequence.length + 1} Total Clips in Sequence
          </span>
        </div>

        {/* Clip Sequence List */}
        <div className="space-y-2">
          {/* Card 1: Master Primary Clip */}
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <div className="text-xs font-bold text-slate-100 truncate max-w-[240px]">
                  {primaryFileName}
                </div>
                <div className="text-[10px] text-cyan-400 font-medium">Primary Active Video (Master Timing)</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Master
            </span>
          </div>

          {/* Cards 2..N: Additional Clips */}
          {sequence.map((fileId, idx) => {
            const fileItem = availableFiles.find((f) => f.id === fileId);
            const name = fileItem?.original_filename || fileItem?.filename || `Clip #${fileId}`;
            return (
              <div
                key={`${fileId}-${idx}`}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 2}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 truncate max-w-[220px]">
                      {name}
                    </div>
                    <div className="text-[10px] text-slate-500">Appends sequentially to timeline</div>
                  </div>
                </div>

                {/* Move & Delete controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveClip(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-md bg-slate-900 border border-slate-700/60 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveClip(idx, 'down')}
                    disabled={idx === sequence.length - 1}
                    className="p-1.5 rounded-md bg-slate-900 border border-slate-700/60 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeClip(idx)}
                    className="p-1.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Clip from Available Library Files */}
        {availableToAdd.length > 0 && (
          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-medium text-slate-400 mb-2">Append More Clips from Library:</div>
            <div className="flex flex-wrap gap-2">
              {availableToAdd.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => addClip(f.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs hover:border-cyan-500/50 hover:text-cyan-300 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="truncate max-w-[160px]">{f.original_filename || f.filename}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Conforming Engine & Stream Copy Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Stream copy toggle */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>0.1s Lossless Stream Copy</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Instant join when all clips share codec & dimensions
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !streamCopy;
              setStreamCopy(next);
              updateParent({ stream_copy: next });
            }}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
              streamCopy ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                streamCopy ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Conforming Scale Match */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Timeline Conforming</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Auto-scales different resolutions to match master clip
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !scaleMatch;
              setScaleMatch(next);
              updateParent({ scale_match: next });
            }}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
              scaleMatch ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                scaleMatch ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
