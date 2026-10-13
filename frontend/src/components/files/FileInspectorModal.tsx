import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Hash, FileCode, Copy, Check, Sparkles, RefreshCw } from 'lucide-react';
import { FileRecord, FileHashesResponse, FileMetadataResponse } from '../../types/api';
import { api } from '../../services/api';
import { formatBytes } from '../../utils/format';

interface FileInspectorModalProps {
  file: FileRecord | null;
  onClose: () => void;
  onTriggerStripMetadata: (file: FileRecord) => void;
}

export const FileInspectorModal: React.FC<FileInspectorModalProps> = ({
  file,
  onClose,
  onTriggerStripMetadata,
}) => {
  const [activeTab, setActiveTab] = useState<'hashes' | 'metadata'>('hashes');
  const [hashes, setHashes] = useState<FileHashesResponse | null>(null);
  const [deepMeta, setDeepMeta] = useState<FileMetadataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    setIsLoading(true);
    Promise.all([
      api.getFileHashes(file.id).catch(() => null),
      api.getFileMetadata(file.id).catch(() => null),
    ]).then(([h, m]) => {
      setHashes(h);
      setDeepMeta(m);
      setIsLoading(false);
    });
  }, [file]);

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-800 flex items-center justify-between bg-surface-900/60">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-400" />
              Advanced File Inspector & Security
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-md">{file.filename} ({formatBytes(file.size_bytes)})</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-4 flex items-center justify-between border-b border-surface-800 bg-surface-950/40">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('hashes')}
              className={`px-4 py-2 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'hashes'
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hash className="h-3.5 w-3.5" />
              <span>Cryptographic Checksums</span>
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-4 py-2 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'metadata'
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Deep Metadata & EXIF</span>
            </button>
          </div>

          <button
            onClick={() => onTriggerStripMetadata(file)}
            className="mb-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center gap-1.5 transition-all"
            title="Remove all EXIF, GPS, camera and author tags"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Sanitize Privacy</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-brand-400" />
              <p>Analyzing file structures and computing digests...</p>
            </div>
          )}

          {!isLoading && activeTab === 'hashes' && hashes && (
            <div className="space-y-3 font-mono">
              {[
                { label: 'SHA-256', val: hashes.sha256, desc: 'NIST Standard Cryptographic Hash' },
                { label: 'MD5', val: hashes.md5, desc: 'Legacy Distribution Checksum' },
                { label: 'SHA-1', val: hashes.sha1, desc: 'Git & VCS Blob Digest' },
                { label: 'CRC-32', val: hashes.crc32, desc: 'Cyclic Redundancy Integrity Check' },
                { label: 'SHA-512', val: hashes.sha512, desc: 'High Entropy Cryptographic Digest' },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-2xl bg-surface-950 border border-surface-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-sans">
                    <span className="font-bold text-slate-200">{item.label}</span>
                    <span className="text-slate-500 text-[10px]">{item.desc}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="truncate text-brand-300 text-[11px] select-all">{item.val}</span>
                    <button
                      onClick={() => handleCopy(item.label, item.val)}
                      className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-white transition-colors shrink-0"
                      title="Copy to clipboard"
                    >
                      {copiedKey === item.label ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && activeTab === 'metadata' && (
            <div className="rounded-2xl bg-surface-950 border border-surface-800 p-4 font-mono text-[11px] overflow-x-auto max-h-96">
              <pre className="text-slate-300">
                {JSON.stringify(deepMeta?.metadata || file.metadata_json || {}, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-800 bg-surface-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
