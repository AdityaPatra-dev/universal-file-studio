import React from 'react';
import { 
  X, ShieldCheck, Cpu, HardDrive, GitMerge, FileArchive, 
  Sparkles, Layers, Terminal, Wrench, CheckCircle2, ArrowRight
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose, onNavigateTab }) => {
  if (!isOpen) return null;

  const handleGoTo = (tab: string) => {
    onClose();
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-surface-800 flex items-center justify-between bg-surface-900/80">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Universal File Studio Guide
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Quick Start
                </span>
              </h3>
              <p className="text-xs text-slate-400">Everything you need to know to process, convert, and chain files locally.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* 100% Local Privacy Highlight */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start space-x-3.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm mb-1">100% Local & Private Processing</h4>
              <p className="text-slate-300 leading-relaxed text-xs">
                All files stay strictly on your local machine. No files, metadata, or telemetry are ever uploaded to cloud servers. Operations run via hardware-accelerated local CLI engines in isolated scratch sandboxes.
              </p>
            </div>
          </div>

          {/* Core Feature Tour */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Studio Features & Navigation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div 
                onClick={() => handleGoTo('upload')}
                className="p-3.5 rounded-2xl bg-surface-950/70 border border-surface-800 hover:border-brand-500/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between font-bold text-white text-xs mb-1 group-hover:text-brand-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                    Quick Convert & Upload
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Drag and drop any file or folder. Automatic magic-byte format detection identifies true types even with wrong extensions.
                </p>
              </div>

              <div 
                onClick={() => handleGoTo('files')}
                className="p-3.5 rounded-2xl bg-surface-950/70 border border-surface-800 hover:border-brand-500/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between font-bold text-white text-xs mb-1 group-hover:text-brand-300">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" />
                    File Library & Batch Actions
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Filter by category, inspect checksums (SHA-256, MD5) and EXIF metadata, sanitize privacy, or batch-convert/compress files together.
                </p>
              </div>

              <div 
                onClick={() => handleGoTo('pipelines')}
                className="p-3.5 rounded-2xl bg-surface-950/70 border border-surface-800 hover:border-brand-500/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between font-bold text-white text-xs mb-1 group-hover:text-brand-300">
                  <span className="flex items-center gap-1.5">
                    <GitMerge className="h-3.5 w-3.5 text-brand-400" />
                    Pipelines Studio
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Chain multi-stage operations (e.g. Manga ZIP → WebP → PDF, Video Concat, Archive splitting). Import/Export pipeline recipes as JSON.
                </p>
              </div>

              <div 
                onClick={() => handleGoTo('jobs')}
                className="p-3.5 rounded-2xl bg-surface-950/70 border border-surface-800 hover:border-brand-500/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between font-bold text-white text-xs mb-1 group-hover:text-brand-300">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-amber-400" />
                    Job Queue & Terminal Logs
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Monitor asynchronous workers in real time via WebSockets. View full CLI commands, stdout/stderr logs, retry failures, and download outputs.
                </p>
              </div>
            </div>
          </div>

          {/* Supported Categories & Formats */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Supported Formats & Categories
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-surface-950/60 border border-surface-800">
                <span className="text-purple-400 font-bold block mb-1 font-sans">🎬 Videos</span>
                <span className="text-slate-400">MP4, MKV, WebM, MOV, AVI, FLV, TS</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-950/60 border border-surface-800">
                <span className="text-amber-400 font-bold block mb-1 font-sans">🎵 Audios</span>
                <span className="text-slate-400">MP3, WAV, FLAC, AAC, OGG, M4A, Opus</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-950/60 border border-surface-800">
                <span className="text-emerald-400 font-bold block mb-1 font-sans">🖼️ Images</span>
                <span className="text-slate-400">PNG, JPG, WebP, GIF, SVG, TIFF, AVIF</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-950/60 border border-surface-800">
                <span className="text-rose-400 font-bold block mb-1 font-sans">📑 Documents</span>
                <span className="text-slate-400">PDF, DOCX, EPUB, TXT, MD, HTML, ODT</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-950/60 border border-surface-800">
                <span className="text-blue-400 font-bold block mb-1 font-sans">📦 Archives</span>
                <span className="text-slate-400">ZIP, 7Z, TAR, GZ, RAR, CBZ, CBR</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-950/60 border border-surface-800">
                <span className="text-cyan-400 font-bold block mb-1 font-sans">📊 Data & OCR</span>
                <span className="text-slate-400">CSV, XLSX, Tesseract OCR, EXIF metadata</span>
              </div>
            </div>
          </div>

          {/* Under the Hood Engines */}
          <div className="p-4 rounded-2xl bg-surface-950/80 border border-surface-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-brand-400" />
                Local Hardware Engines
              </span>
              <p className="text-[11px] text-slate-400">
                Powered by FFmpeg, ImageMagick, Ghostscript, Poppler, Pandoc, LibreOffice, Tesseract, 7-Zip, and ExifTool.
              </p>
            </div>
            <button
              onClick={() => handleGoTo('engines')}
              className="px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 text-xs font-semibold shrink-0 transition-colors border border-surface-700"
            >
              Check Engines Status →
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-surface-800 bg-surface-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Universal File Studio v1.0 • Privacy-First
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-md shadow-brand-600/30"
          >
            Got it, Let's Start!
          </button>
        </div>
      </div>
    </div>
  );
};

