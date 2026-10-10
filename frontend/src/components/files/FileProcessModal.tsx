import React, { useState, useEffect } from 'react';
import { X, Play, Sliders, CheckCircle, Info, Sparkles } from 'lucide-react';
import { FileRecord, Operation } from '../../types/api';
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
          });
          setParams(defaultParams);
        }
      })
      .catch((err) => setError('Failed to load available operations for this file.'));
  }, [file]);

  const handleSelectOp = (op: Operation) => {
    setSelectedOp(op);
    const defaultParams: Record<string, any> = {};
    op.parameters?.forEach(p => {
      if (p.default !== undefined) defaultParams[p.name] = p.default;
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-800 flex items-center justify-between bg-surface-900/60">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-400" />
              Configure File Operation
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-md">{file.filename}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {error}
            </div>
          )}

          {/* File Metadata Overview */}
          <div className="p-4 rounded-2xl bg-surface-950/60 border border-surface-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300 font-mono text-[11px]">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Format</div>
              <div className="text-brand-400 font-bold">{file.detected_format || file.category.toUpperCase()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Size</div>
              <div>{formatBytes(file.size_bytes)}</div>
            </div>
            {file.width && (
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Dimensions</div>
                <div>{file.width} x {file.height}</div>
              </div>
            )}
            {file.duration_seconds && (
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Duration</div>
                <div>{formatDuration(file.duration_seconds)}</div>
              </div>
            )}
          </div>

          {/* Operation Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2.5">
              Available Operations
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {operations.map((op) => {
                const isSelected = selectedOp?.id === op.id;
                return (
                  <button
                    key={op.id}
                    onClick={() => handleSelectOp(op)}
                    className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 shadow-md shadow-brand-500/10'
                        : 'border-surface-800 bg-surface-800/40 hover:bg-surface-800 hover:border-surface-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {op.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-800 text-slate-400 border border-surface-700">
                        {op.engine}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{op.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parameters Configuration */}
          {selectedOp && selectedOp.parameters && selectedOp.parameters.length > 0 && (
            <div className="p-4 rounded-2xl bg-surface-800/30 border border-surface-800 space-y-4">
              <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-brand-400" />
                Parameters
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedOp.parameters.map((param) => (
                  <div key={param.name}>
                    <label className="block text-xs text-slate-400 mb-1 capitalize font-medium">
                      {param.name}
                    </label>
                    {param.type === 'select' && (
                      <select
                        value={params[param.name] || param.default || ''}
                        onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                      >
                        {param.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    )}
                    {param.type === 'number' && (
                      <input
                        type="number"
                        min={param.min}
                        max={param.max}
                        value={params[param.name] ?? param.default ?? 0}
                        onChange={(e) => setParams({ ...params, [param.name]: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-surface-800 bg-surface-900/60 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStartJob}
            disabled={isSubmitting || !selectedOp}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-600/30 hover:shadow-brand-500/40 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{isSubmitting ? 'Starting...' : 'Start Processing'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

