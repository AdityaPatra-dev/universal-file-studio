import React, { useState, useEffect } from 'react';
import { X, Play, Archive, Sliders, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { FileRecord, Preset } from '../../types/api';
import { api } from '../../services/api';
import { formatBytes } from '../../utils/format';

interface BatchProcessModalProps {
  files: FileRecord[];
  onClose: () => void;
  onBatchStarted: () => void;
  initialMode?: 'convert' | 'compress' | 'archive';
}

export const BatchProcessModal: React.FC<BatchProcessModalProps> = ({
  files,
  onClose,
  onBatchStarted,
  initialMode = 'convert',
}) => {
  const [mode, setMode] = useState<'convert' | 'compress' | 'archive'>(initialMode);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [targetFormat, setTargetFormat] = useState('mp4');
  const [compressionQuality, setCompressionQuality] = useState(80);
  const [archiveFormat, setArchiveFormat] = useState('zip');
  const [archiveName, setArchiveName] = useState('ufs_archive');
  const [archivePassword, setArchivePassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listPresets()
      .then(setPresets)
      .catch(() => {});
  }, []);

  const totalSize = files.reduce((acc, f) => acc + f.size_bytes, 0);

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    const fileIds = files.map((f) => f.id);

    try {
      if (mode === 'convert') {
        await api.batchConvert(fileIds, targetFormat);
      } else if (mode === 'compress') {
        await api.batchCompress(fileIds, compressionQuality);
      } else if (mode === 'archive') {
        await api.batchArchive(fileIds, archiveFormat, archiveName || 'ufs_archive');
      }

      setIsSubmitting(false);
      onBatchStarted();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Batch operation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-800 flex items-center justify-between bg-surface-900/60">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-brand-400" />
              Batch Process ({files.length} {files.length === 1 ? 'file' : 'files'})
            </h3>
            <p className="text-xs text-slate-400">Total size: {formatBytes(totalSize)}</p>
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

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-surface-950 border border-surface-800">
            <button
              onClick={() => setMode('convert')}
              className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all ${
                mode === 'convert'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Convert All
            </button>
            <button
              onClick={() => setMode('compress')}
              className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all ${
                mode === 'compress'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compress All
            </button>
            <button
              onClick={() => setMode('archive')}
              className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all ${
                mode === 'archive'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Archive Together
            </button>
          </div>

          {/* Mode 1: Convert */}
          {mode === 'convert' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                  Target Format
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {['mp4', 'webm', 'mp3', 'wav', 'webp', 'png', 'jpg', 'pdf', 'docx', 'csv', 'xlsx', 'html', 'txt', 'md', 'zip'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setTargetFormat(fmt)}
                      className={`py-2 px-3 rounded-xl border text-center font-mono font-semibold transition-all ${
                        targetFormat === fmt
                          ? 'border-brand-500 bg-brand-500/10 text-white shadow-sm'
                          : 'border-surface-800 bg-surface-800/40 text-slate-400 hover:bg-surface-800 hover:text-slate-200'
                      }`}
                    >
                      .{fmt}
                    </button>
                  ))}
                </div>
              </div>

              {presets.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                    Quick Preset Profiles
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {presets.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (p.parameters?.format) {
                            setTargetFormat(p.parameters.format);
                          }
                        }}
                        className="p-3 rounded-xl border border-surface-800 bg-surface-800/30 hover:bg-surface-800 text-left transition-all"
                      >
                        <div className="font-semibold text-slate-200 flex items-center justify-between">
                          <span>{p.name}</span>
                          <span className="text-[10px] text-brand-400 font-mono">
                            {p.parameters?.format ? `.${p.parameters.format}` : p.operation}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Compress */}
          {mode === 'compress' && (
            <div className="space-y-4 p-4 rounded-2xl bg-surface-800/20 border border-surface-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Compression Balance
                </label>
                <span className="font-mono text-brand-400 font-bold">{compressionQuality}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="95"
                step="5"
                value={compressionQuality}
                onChange={(e) => setCompressionQuality(parseInt(e.target.value, 10))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Smaller Size (30%)</span>
                <span>Balanced (80%)</span>
                <span>Higher Quality (95%)</span>
              </div>
            </div>
          )}

          {/* Mode 3: Archive */}
          {mode === 'archive' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Archive File Name
                  </label>
                  <input
                    type="text"
                    value={archiveName}
                    onChange={(e) => setArchiveName(e.target.value)}
                    placeholder="ufs_archive"
                    className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Archive Format
                  </label>
                  <select
                    value={archiveFormat}
                    onChange={(e) => setArchiveFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                  >
                    <option value="zip">ZIP (.zip)</option>
                    <option value="7z">7-Zip (.7z)</option>
                    <option value="tar.gz">GZip Tarball (.tar.gz)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Optional Password Protection
                </label>
                <input
                  type="password"
                  value={archivePassword}
                  onChange={(e) => setArchivePassword(e.target.value)}
                  placeholder="Leave empty for unencrypted archive"
                  className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          )}

          {/* Files List Preview */}
          <div className="p-3 rounded-2xl bg-surface-950/50 border border-surface-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Selected Files ({files.length})
            </div>
            <div className="max-h-36 overflow-y-auto divide-y divide-surface-800/40 font-mono text-[11px]">
              {files.map((f) => (
                <div key={f.id} className="py-1.5 flex items-center justify-between">
                  <span className="truncate max-w-[360px] text-slate-300">{f.filename}</span>
                  <span className="text-slate-500">{formatBytes(f.size_bytes)}</span>
                </div>
              ))}
            </div>
          </div>
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
            onClick={handleSubmit}
            disabled={isSubmitting || files.length === 0}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-600/30 hover:shadow-brand-500/40 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>
              {isSubmitting
                ? 'Queueing Jobs...'
                : mode === 'archive'
                ? `Archive ${files.length} Files`
                : `Batch Process ${files.length} Files`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
