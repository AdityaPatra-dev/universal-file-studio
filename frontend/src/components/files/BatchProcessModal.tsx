import React, { useState, useEffect } from 'react';
import { 
  X, Play, Archive, Sliders, Layers, Sparkles, CheckCircle2, 
  AlertCircle, Film, Music, Image as ImageIcon, FileText, Lock
} from 'lucide-react';
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

  // Group files by category
  const categoriesInBatch = Array.from(new Set(files.map(f => f.category)));
  const primaryCategory = categoriesInBatch.length === 1 ? categoriesInBatch[0] : 'mixed';

  useEffect(() => {
    api.listPresets()
      .then(setPresets)
      .catch(() => {});

    // Set intelligent default target format based on category
    if (primaryCategory === 'image') setTargetFormat('webp');
    else if (primaryCategory === 'video') setTargetFormat('mp4');
    else if (primaryCategory === 'audio') setTargetFormat('mp3');
    else if (primaryCategory === 'document' || primaryCategory === 'pdf') setTargetFormat('pdf');
    else setTargetFormat('zip');
  }, [primaryCategory]);

  const totalSize = files.reduce((acc, f) => acc + f.size_bytes, 0);

  // Format definitions grouped with category affinity
  const formatGroups = [
    {
      category: 'video',
      label: 'Video Formats',
      icon: Film,
      formats: ['mp4', 'webm', 'mkv', 'mov', 'avi']
    },
    {
      category: 'audio',
      label: 'Audio Formats',
      icon: Music,
      formats: ['mp3', 'wav', 'aac', 'flac', 'ogg']
    },
    {
      category: 'image',
      label: 'Image Formats',
      icon: ImageIcon,
      formats: ['webp', 'png', 'jpg', 'gif', 'svg']
    },
    {
      category: 'document',
      label: 'Document Formats',
      icon: FileText,
      formats: ['pdf', 'docx', 'txt', 'html', 'epub']
    },
    {
      category: 'archive',
      label: 'Archive Containers',
      icon: Archive,
      formats: ['zip', '7z', 'tar.gz']
    }
  ];

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-800 flex items-center justify-between bg-surface-900/70">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-brand-400" />
              Batch Processor ({files.length} {files.length === 1 ? 'file' : 'files'})
            </h3>
            <p className="text-xs text-slate-400">
              Total input size: {formatBytes(totalSize)} • Types: {categoriesInBatch.join(', ')}
            </p>
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

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-surface-950 border border-surface-800">
            <button
              onClick={() => setMode('convert')}
              className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                mode === 'convert'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Batch Convert
            </button>
            <button
              onClick={() => setMode('compress')}
              className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                mode === 'compress'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Batch Compress
            </button>
            <button
              onClick={() => setMode('archive')}
              className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                mode === 'archive'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bundle into Archive
            </button>
          </div>

          {/* Mode 1: Convert (P0 Fixed: Organized by category with compatibility guidance) */}
          {mode === 'convert' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                    Choose Target Output Format
                  </label>
                  <span className="text-[11px] font-mono text-brand-300 font-bold bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                    Target: .{targetFormat.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3">
                  {formatGroups.map((grp) => {
                    const isRelevant = (categoriesInBatch as string[]).includes(grp.category) ||
                      (grp.category === 'audio' && (categoriesInBatch as string[]).includes('video')) ||
                      (grp.category === 'document' && (categoriesInBatch as string[]).includes('image')) ||
                      categoriesInBatch.length > 1;

                    const Icon = grp.icon;

                    return (
                      <div key={grp.category} className={`p-3 rounded-2xl bg-surface-950/60 border ${
                        isRelevant ? 'border-surface-800' : 'border-surface-900 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 text-brand-400" />
                            <span>{grp.label}</span>
                          </span>
                          {!isRelevant && (
                            <span className="text-[10px] text-slate-500">Cross-type conversion</span>
                          )}
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                          {grp.formats.map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => setTargetFormat(fmt)}
                              className={`py-2 px-2 rounded-xl border text-center font-mono font-semibold transition-all text-xs cursor-pointer ${
                                targetFormat === fmt
                                  ? 'border-brand-500 bg-brand-500/20 text-white shadow-sm ring-1 ring-brand-500'
                                  : 'border-surface-800 bg-surface-900/60 text-slate-400 hover:bg-surface-800 hover:text-slate-200'
                              }`}
                            >
                              .{fmt}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Presets List */}
              {presets.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                    Quick Preset Profiles
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {presets.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (p.parameters?.format) {
                            setTargetFormat(p.parameters.format);
                          }
                        }}
                        className="p-3 rounded-xl border border-surface-800 bg-surface-800/30 hover:bg-surface-800 text-left transition-all cursor-pointer group"
                      >
                        <div className="font-semibold text-slate-200 flex items-center justify-between text-xs group-hover:text-brand-300">
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
            <div className="space-y-4 p-5 rounded-2xl bg-surface-950/60 border border-surface-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-white uppercase tracking-wider block">
                    Compression Quality Factor
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Controls image/video encoding bitrate and size reduction.
                  </p>
                </div>
                <span className="font-mono text-brand-400 font-bold text-base bg-brand-500/10 px-3 py-1 rounded-xl border border-brand-500/20">
                  {compressionQuality}%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="95"
                step="5"
                value={compressionQuality}
                onChange={(e) => setCompressionQuality(parseInt(e.target.value, 10))}
                className="w-full accent-brand-500 cursor-pointer h-2 bg-surface-800 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Maximum Reduction (30%)</span>
                <span>Balanced Default (80%)</span>
                <span>Visually Lossless (95%)</span>
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
                    className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Archive Format
                  </label>
                  <select
                    value={archiveFormat}
                    onChange={(e) => setArchiveFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                  >
                    <option value="zip">ZIP (.zip) — Universal compatibility</option>
                    <option value="7z">7-Zip (.7z) — High compression ratio</option>
                    <option value="tar.gz">GZip Tarball (.tar.gz) — UNIX/Linux standard</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-brand-400" />
                    <span>Optional Password Encryption</span>
                  </label>
                  {archiveFormat === 'tar.gz' && (
                    <span className="text-[10px] text-amber-400 font-mono">
                      (Password requires ZIP or 7-Zip format)
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  disabled={archiveFormat === 'tar.gz'}
                  value={archivePassword}
                  onChange={(e) => setArchivePassword(e.target.value)}
                  placeholder={archiveFormat === 'tar.gz' ? 'Tarballs do not support password encryption' : 'Leave empty for standard unencrypted archive'}
                  className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Files List Preview */}
          <div className="p-3.5 rounded-2xl bg-surface-950/60 border border-surface-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Selected Files ({files.length})</span>
              <span className="font-mono text-slate-500">{formatBytes(totalSize)}</span>
            </div>
            <div className="max-h-32 overflow-y-auto divide-y divide-surface-800/40 font-mono text-[11px]">
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
            className="px-4 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || files.length === 0}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-600/30 hover:shadow-brand-500/40 disabled:opacity-50 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>
              {isSubmitting
                ? 'Queueing Jobs...'
                : mode === 'archive'
                ? `Create .${archiveFormat.toUpperCase()} Archive (${files.length} Files)`
                : mode === 'compress'
                ? `Compress ${files.length} Files (${compressionQuality}%)`
                : `Batch Convert to .${targetFormat.toUpperCase()} (${files.length} Files)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
