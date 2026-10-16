import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Hash, FileCode, Copy, Check, Sparkles, RefreshCw, 
  Search, ShieldAlert, Code2, Table, Eye, CheckCircle2 
} from 'lucide-react';
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
  const [allCopied, setAllCopied] = useState(false);

  // Metadata search & view mode
  const [metaSearch, setMetaSearch] = useState('');
  const [viewRawJson, setViewRawJson] = useState(false);
  const [showSanitizeConfirm, setShowSanitizeConfirm] = useState(false);

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

  const handleCopyAllHashes = () => {
    if (!hashes) return;
    const text = [
      `File: ${file?.filename}`,
      `Size: ${file?.size_bytes} bytes`,
      `SHA-256: ${hashes.sha256}`,
      `MD5:     ${hashes.md5}`,
      `SHA-1:   ${hashes.sha1}`,
      `CRC-32:  ${hashes.crc32}`,
      `SHA-512: ${hashes.sha512}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  if (!file) return null;

  // Flatten and parse metadata key-values
  const rawMeta = deepMeta?.metadata || file.metadata_json || {};
  const metadataEntries: Array<{ key: string; value: any; category: string }> = [];

  const categorizeKey = (k: string) => {
    const lk = k.toLowerCase();
    if (lk.includes('gps') || lk.includes('lat') || lk.includes('lon') || lk.includes('location')) return 'Location & GPS';
    if (lk.includes('exif') || lk.includes('camera') || lk.includes('lens') || lk.includes('focal') || lk.includes('iso') || lk.includes('shutter') || lk.includes('aperture')) return 'Camera & Photography';
    if (lk.includes('author') || lk.includes('artist') || lk.includes('copyright') || lk.includes('creator')) return 'Author & Rights';
    if (lk.includes('audio') || lk.includes('video') || lk.includes('codec') || lk.includes('bitrate') || lk.includes('fps') || lk.includes('duration') || lk.includes('resolution')) return 'Media Specs';
    return 'General & File';
  };

  const traverse = (obj: any, prefix = '') => {
    if (!obj || typeof obj !== 'object') return;
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        traverse(v, fullKey);
      } else {
        metadataEntries.push({
          key: fullKey,
          value: Array.isArray(v) ? v.join(', ') : String(v),
          category: categorizeKey(fullKey),
        });
      }
    }
  };

  traverse(rawMeta);

  const filteredMetadata = metadataEntries.filter(
    (item) =>
      item.key.toLowerCase().includes(metaSearch.toLowerCase()) ||
      String(item.value).toLowerCase().includes(metaSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-surface-800 flex items-center justify-between bg-surface-900/70">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-400" />
              Advanced File Inspector & Security
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-md">
              {file.filename} ({formatBytes(file.size_bytes)}) • {file.detected_format?.toUpperCase() || file.category.toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Clean Navigation Tab Bar (P0 Fixed: Sanitize button removed from tabs) */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-surface-800 bg-surface-950/40">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('hashes')}
              className={`pb-3 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
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
              className={`pb-3 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'metadata'
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Deep Metadata & EXIF ({metadataEntries.length})</span>
            </button>
          </div>

          {activeTab === 'hashes' && hashes && (
            <button
              onClick={handleCopyAllHashes}
              className="mb-2 px-3 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white text-[11px] font-medium border border-surface-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="Copy all digests formatted to clipboard"
            >
              {allCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{allCopied ? 'Copied All!' : 'Copy All Hashes'}</span>
            </button>
          )}

          {activeTab === 'metadata' && (
            <button
              onClick={() => setViewRawJson(!viewRawJson)}
              className="mb-2 px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 text-[11px] font-mono flex items-center gap-1 border border-surface-700 cursor-pointer"
            >
              {viewRawJson ? <Table className="h-3 w-3" /> : <Code2 className="h-3 w-3" />}
              <span>{viewRawJson ? 'Table View' : 'Raw JSON'}</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 flex-1">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-brand-400" />
              <p>Extracting magic bytes, EXIF structures, and calculating hashes...</p>
            </div>
          )}

          {/* Tab 1: Hashes */}
          {!isLoading && activeTab === 'hashes' && hashes && (
            <div className="space-y-3 font-mono">
              {[
                { label: 'SHA-256', val: hashes.sha256, desc: 'NIST Standard High-Security Digest' },
                { label: 'MD5', val: hashes.md5, desc: 'Legacy Checksum Distribution Digest' },
                { label: 'SHA-1', val: hashes.sha1, desc: 'Git / VCS Blob Object Checksum' },
                { label: 'CRC-32', val: hashes.crc32, desc: 'Cyclic Redundancy Network Integrity Check' },
                { label: 'SHA-512', val: hashes.sha512, desc: 'Maximum Entropy 512-bit Cryptographic Hash' },
              ].map((item) => (
                <div key={item.label} className="p-3.5 rounded-2xl bg-surface-950 border border-surface-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-sans">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-brand-400" />
                      {item.label}
                    </span>
                    <span className="text-slate-500 text-[10px]">{item.desc}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="truncate text-brand-300 text-[11px] select-all bg-surface-900/60 px-2 py-1 rounded-lg border border-surface-800/80 w-full">
                      {item.val}
                    </span>
                    <button
                      onClick={() => handleCopy(item.label, item.val)}
                      className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
                      title="Copy checksum"
                    >
                      {copiedKey === item.label ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Deep Metadata & EXIF */}
          {!isLoading && activeTab === 'metadata' && (
            <div className="space-y-4">
              {/* Privacy Warning & Sanitization Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-surface-950 to-surface-900 border border-surface-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-emerald-400" />
                    Privacy & EXIF Sanitization
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Images and media often store embedded GPS coordinates, camera serials, and author details.
                  </p>
                </div>
                <button
                  onClick={() => setShowSanitizeConfirm(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Sanitize Privacy Tags</span>
                </button>
              </div>

              {viewRawJson ? (
                /* Raw JSON Developer View */
                <div className="rounded-2xl bg-surface-950 border border-surface-800 p-4 font-mono text-[11px] overflow-x-auto max-h-96">
                  <pre className="text-slate-300">
                    {JSON.stringify(rawMeta, null, 2)}
                  </pre>
                </div>
              ) : (
                /* Formatted Searchable Table View (P2 Fixed) */
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search metadata keys or values..."
                      value={metaSearch}
                      onChange={(e) => setMetaSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-950 border border-surface-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {filteredMetadata.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-surface-950 border border-surface-800 text-slate-500 text-xs">
                      {metadataEntries.length === 0
                        ? 'No embedded EXIF or deep metadata tags detected in this file.'
                        : 'No tags match the search query.'}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-surface-800 bg-surface-950 overflow-hidden max-h-80 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-900/80 text-slate-400 font-semibold text-[10px] uppercase border-b border-surface-800 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 w-1/3">Tag / Key</th>
                            <th className="px-3 py-2">Value</th>
                            <th className="px-3 py-2 w-28 text-right">Category</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-800/60 font-mono text-[11px]">
                          {filteredMetadata.map((m, idx) => (
                            <tr key={idx} className="hover:bg-surface-900/40">
                              <td className="px-3 py-2 text-brand-300 font-semibold break-all">
                                {m.key}
                              </td>
                              <td className="px-3 py-2 text-slate-200 break-all select-all font-sans">
                                {m.value}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-sans bg-surface-800 text-slate-400">
                                  {m.category}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-surface-800 bg-surface-900/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Integrity Verified Locally
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Sanitize Privacy */}
      {showSanitizeConfirm && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-emerald-400">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Sanitize File Privacy?</h4>
                <p className="text-xs text-slate-400 truncate max-w-[260px]">{file.filename}</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will create a new sanitized version of the file with all embedded GPS coordinates, camera model/serial numbers, author tags, and timestamp metadata completely stripped.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowSanitizeConfirm(false)}
                className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSanitizeConfirm(false);
                  onTriggerStripMetadata(file);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Proceed & Scrub Metadata
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
