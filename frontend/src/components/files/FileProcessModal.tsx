import React, { useState, useEffect } from 'react';
import { 
  X, Play, Sliders, CheckCircle2, Sparkles, AlertCircle, 
  Film, Music, Image as ImageIcon, FileText, Check, ArrowRight
} from 'lucide-react';
import { FileRecord, Operation, Preset } from '../../types/api';
import { api } from '../../services/api';
import { formatBytes, formatDuration } from '../../utils/format';

interface FileProcessModalProps {
  file: FileRecord | null;
  onClose: () => void;
  onJobStarted: () => void;
}

export const FileProcessModal: React.FC<FileProcessModalProps> = ({
  file,
  onClose,
  onJobStarted,
}) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    setError(null);
    api.getFileOperations(file.id)
      .then((ops) => {
        setOperations(ops);
        if (ops.length > 0) {
          setSelectedOp(ops[0]);
          const defaultParams: Record<string, any> = {};
          ops[0].parameters?.forEach(p => {
            if (p.default !== undefined) defaultParams[p.name] = p.default;
            else if (p.type === 'select' && p.options?.length) defaultParams[p.name] = p.options[0];
          });
          setParams(defaultParams);
        }
      })
      .catch(() => setError('Failed to load available operations for this file.'));

    api.listPresets()
      .then(setPresets)
      .catch(() => {});
  }, [file]);

  const handleApplyPreset = (preset: Preset) => {
    const matchingOp = operations.find(
      (op) => op.id === preset.operation || op.id.includes(preset.operation) || preset.operation.includes(op.id)
    );
    if (matchingOp) {
      setSelectedOp(matchingOp);
    }
    setParams(prev => ({ ...prev, ...(preset.parameters || {}) }));
  };

  const handleSelectOp = (op: Operation) => {
    setSelectedOp(op);
    const defaultParams: Record<string, any> = {};
    op.parameters?.forEach(p => {
      if (p.default !== undefined) defaultParams[p.name] = p.default;
      else if (p.type === 'select' && p.options?.length) defaultParams[p.name] = p.options[0];
    });
    setParams(defaultParams);
  };

  const handleStartJob = async () => {
    if (!file || !selectedOp) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.createJob({
        file_id: file.id,
        operation: selectedOp.id,
        engine_used: selectedOp.engine,
        parameters: params,
      });
      setIsSubmitting(false);
      onJobStarted();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to start processing job');
    }
  };

  if (!file) return null;

  // Find format parameter to elevate to dedicated section
  const formatParam = selectedOp?.parameters?.find(p => p.name === 'format');
  const otherParams = selectedOp?.parameters?.filter(p => p.name !== 'format') || [];

  // Filter presets relevant to operations available for this file
  const relevantPresets = presets.filter(p => operations.some(op => op.id === p.operation));

  // Dynamic friendly action label
  const getActionLabel = () => {
    if (isSubmitting) return 'Starting Job...';
    if (!selectedOp) return 'Execute Processing';

    const currentFormat = params.format || formatParam?.default;
    const fmt = currentFormat ? `.${String(currentFormat).toUpperCase()}` : '';

    if (selectedOp.id === 'video_convert') {
      return fmt ? `Convert to ${fmt}` : 'Convert Video';
    }
    if (selectedOp.id === 'image_convert') {
      return fmt ? `Convert to ${fmt}` : 'Convert Image';
    }
    if (selectedOp.id === 'document_convert') {
      return fmt ? `Convert to ${fmt}` : 'Convert Document';
    }
    if (selectedOp.id === 'extract_audio') {
      return fmt ? `Extract Audio (${fmt})` : 'Extract Audio';
    }
    if (selectedOp.id === 'audio_convert') {
      return fmt ? `Convert Audio to ${fmt}` : 'Convert Audio';
    }
    if (selectedOp.id === 'archive_create') {
      return fmt ? `Package as ${fmt}` : 'Create Archive';
    }
    if (selectedOp.id === 'compress_video') {
      return params.crf ? `Compress Video (CRF ${params.crf})` : 'Compress Video';
    }
    if (selectedOp.id === 'compress_image') {
      return params.quality ? `Compress Image (${params.quality}%)` : 'Compress Image';
    }
    if (formatParam && currentFormat) {
      return `Process to ${fmt}`;
    }
    return `Execute ${selectedOp.name}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-800 flex items-center justify-between bg-surface-900/70">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-400" />
              Configure File Operation
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-md">{file.filename}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File Metadata Overview */}
          <div className="p-4 rounded-2xl bg-surface-950/70 border border-surface-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300 font-mono text-[11px]">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Current Format</div>
              <div className="text-brand-400 font-bold">{file.detected_format ? `.${file.detected_format.toUpperCase()}` : file.category.toUpperCase()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Size</div>
              <div>{formatBytes(file.size_bytes)}</div>
            </div>
            {file.width ? (
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Dimensions</div>
                <div>{file.width} x {file.height}</div>
              </div>
            ) : null}
            {file.duration_seconds ? (
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Duration</div>
                <div>{formatDuration(file.duration_seconds)}</div>
              </div>
            ) : null}
          </div>

          {/* Relevant Presets (Quick 1-Click Fill) */}
          {relevantPresets.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                  Quick Presets
                </label>
                <span className="text-[10px] text-slate-500">1-Click autofill parameters</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {relevantPresets.map((preset) => {
                  const isMatchingActive = selectedOp?.id === preset.operation && 
                    (!preset.parameters?.format || params.format === preset.parameters.format);
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-3 rounded-xl border text-left transition-all group cursor-pointer ${
                        isMatchingActive
                          ? 'border-brand-500/80 bg-brand-500/10 shadow-sm'
                          : 'border-surface-800 bg-surface-950/50 hover:bg-surface-800/80 hover:border-brand-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-xs ${isMatchingActive ? 'text-brand-300' : 'text-slate-200 group-hover:text-brand-300'}`}>
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-900 text-slate-400">
                          {preset.engine}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{preset.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Operation Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2.5">
              Step 1: Select Operation
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {operations.map((op) => {
                const isSelected = selectedOp?.id === op.id;
                return (
                  <button
                    key={op.id}
                    onClick={() => handleSelectOp(op)}
                    className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 shadow-md shadow-brand-500/10 ring-1 ring-brand-500/50'
                        : 'border-surface-800 bg-surface-950/60 hover:bg-surface-800 hover:border-surface-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-xs sm:text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {op.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-900 text-slate-400 border border-surface-800">
                        {op.engine}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{op.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: High-Visibility Target Format Selector (Elevated from buried dropdown) */}
          {formatParam && formatParam.options && formatParam.options.length > 0 && (
            <div className="p-4 rounded-2xl bg-surface-950/90 border border-surface-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Film className="h-4 w-4 text-brand-400" />
                  Step 2: Choose Target Format
                </label>
                <span className="text-xs font-mono font-bold text-brand-300 bg-brand-500/15 border border-brand-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  Selected: <span className="underline">.{(params.format || formatParam.default || formatParam.options[0]).toUpperCase()}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Click a format below to select your desired output container.
              </p>

              {/* Format Pills Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                {formatParam.options.map((opt) => {
                  const isSelected = (params.format || formatParam.default) === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setParams({ ...params, format: opt })}
                      className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500/20 text-white shadow-md shadow-brand-500/20 ring-2 ring-brand-500/60'
                          : 'border-surface-800 bg-surface-900/70 text-slate-400 hover:border-surface-700 hover:bg-surface-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {isSelected && <Check className="h-3 w-3 text-brand-400 stroke-[3]" />}
                        <span className={`font-mono text-xs font-bold ${isSelected ? 'text-brand-300' : 'text-slate-200'}`}>
                          .{opt.toUpperCase()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Additional Parameters (Sliders, Numbers, Booleans) */}
          {otherParams.length > 0 && (
            <div className="p-4 rounded-2xl bg-surface-950/80 border border-surface-800 space-y-4">
              <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-brand-400" />
                Additional Options
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherParams.map((param) => {
                  const val = params[param.name] ?? param.default;
                  const isSlider = param.type === 'number' && param.min !== undefined && param.max !== undefined && param.max <= 100;

                  return (
                    <div key={param.name} className={isSlider ? 'sm:col-span-2' : ''}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-300 capitalize font-medium">
                          {param.name.replace(/_/g, ' ')}
                        </label>
                        {isSlider && (
                          <span className="font-mono text-brand-400 font-bold text-xs">
                            {val}
                          </span>
                        )}
                      </div>

                      {param.type === 'select' && (
                        <select
                          value={val || ''}
                          onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                        >
                          {param.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      )}

                      {isSlider && (
                        <input
                          type="range"
                          min={param.min}
                          max={param.max}
                          value={val ?? param.min}
                          onChange={(e) => setParams({ ...params, [param.name]: parseFloat(e.target.value) })}
                          className="w-full accent-brand-500 cursor-pointer h-2 bg-surface-800 rounded-lg"
                        />
                      )}

                      {param.type === 'number' && !isSlider && (
                        <input
                          type="number"
                          min={param.min}
                          max={param.max}
                          value={val ?? 0}
                          onChange={(e) => setParams({ ...params, [param.name]: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                        />
                      )}

                      {param.type === 'boolean' && (
                        <label className="flex items-center space-x-2 mt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(val)}
                            onChange={(e) => setParams({ ...params, [param.name]: e.target.checked })}
                            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 bg-surface-900 border-surface-700"
                          />
                          <span className="text-xs text-slate-300">Enable {param.name.replace(/_/g, ' ')}</span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-surface-800 bg-surface-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-400 hidden sm:block">
            {selectedOp && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Ready to execute via engine: <span className="font-mono text-slate-300">{selectedOp.engine}</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleStartJob}
              disabled={isSubmitting || !selectedOp}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-600/30 hover:shadow-brand-500/40 disabled:opacity-50 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{getActionLabel()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
