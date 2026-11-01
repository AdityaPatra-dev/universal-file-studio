import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, Cpu, GitMerge,
  Sparkles, Layers, Wrench, ArrowRight,
  CheckCircle2, FolderSync, FileText, Zap, BookOpen
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);

  if (!isOpen) return null;

  const handleGoTo = (tab: string) => {
    onClose();
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const diff = e.touches[0].clientY - startYRef.current;
    if (diff > 0) {
      setDragOffsetY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffsetY > 80) {
      onClose();
    }
    setDragOffsetY(0);
    isDraggingRef.current = false;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop tap to dismiss */}
      <div 
        onClick={onClose}
        className="absolute inset-0 -z-10"
      />

      <div 
        style={{
          transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
          transition: dragOffsetY === 0 ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
        className="bg-surface-900 border border-surface-800 rounded-t-3xl sm:rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 duration-200"
      >
        {/* Mobile Swipe Drag Bar Area */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="pt-3 pb-2 cursor-grab active:cursor-grabbing select-none flex flex-col items-center justify-center bg-surface-900 border-b border-surface-800/60"
        >
          <div className="w-14 h-1.5 bg-surface-600/80 hover:bg-surface-500 rounded-full transition-colors" />
          <span className="text-[10px] text-slate-500 font-mono mt-1 sm:hidden">Swipe down to close</span>
        </div>

        {/* Modal Header */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="px-5 sm:px-7 py-3 sm:py-4 border-b border-surface-800 flex items-center justify-between bg-surface-900/90"
        >
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-500/20 shrink-0">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Studio Guide & Quick Start
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                  Offline
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete local privacy • 102+ specialized conversion tools
              </p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* 100% Privacy Guarantee Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/25 flex items-start space-x-3.5 shadow-sm">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">
                100% Private, On-Device Processing
              </h4>
              <p className="text-slate-300 leading-relaxed text-xs">
                Your media, documents, and data never leave your hardware. All conversions run locally through high-performance sandboxed engines with zero telemetry and zero cloud dependencies.
              </p>
            </div>
          </div>

          {/* Quick 3-Step Workflow */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>How To Use In 3 Easy Steps</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-surface-950/70 border border-surface-800 space-y-1.5">
                <div className="h-6 w-6 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-xs font-mono">
                  1
                </div>
                <div className="font-bold text-white text-xs">Choose Any Tool</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Browse by category or search 102+ tools like PDF merge, video compression, or OCR.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-950/70 border border-surface-800 space-y-1.5">
                <div className="h-6 w-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs font-mono">
                  2
                </div>
                <div className="font-bold text-white text-xs">Select Files or Folder</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Pick from your device or select pre-imported items directly from your File Library.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-950/70 border border-surface-800 space-y-1.5">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs font-mono">
                  3
                </div>
                <div className="font-bold text-white text-xs">Execute & Save</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Review options, tap Run, and download your converted results instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-brand-400" />
              <span>Studio Navigation & Features</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                onClick={() => handleGoTo('pipelines')}
                className="p-4 rounded-2xl bg-surface-950/80 border border-surface-800 hover:border-brand-500/40 cursor-pointer transition-all group btn-press flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-2 group-hover:text-brand-300 transition-colors">
                    <Sparkles className="h-4 w-4 text-brand-400" />
                    <span>Tools & Recipes Directory</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Full 27-tool iLovePDF parity, video conversion, audio extraction, and image optimization.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
              </div>

              <div 
                onClick={() => handleGoTo('files')}
                className="p-4 rounded-2xl bg-surface-950/80 border border-surface-800 hover:border-brand-500/40 cursor-pointer transition-all group btn-press flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-2 group-hover:text-brand-300 transition-colors">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    <span>File Library & Inspector</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    View all stored files, compute cryptographic checksums, remove EXIF metadata, or batch actions.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
              </div>

              <div 
                onClick={() => handleGoTo('jobs')}
                className="p-4 rounded-2xl bg-surface-950/80 border border-surface-800 hover:border-brand-500/40 cursor-pointer transition-all group btn-press flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-2 group-hover:text-brand-300 transition-colors">
                    <Cpu className="h-4 w-4 text-amber-400" />
                    <span>Job Queue & Live Telemetry</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Real-time WebSocket progress streaming, terminal logs, retry failed tasks, and export outputs.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
              </div>

              <div 
                onClick={() => handleGoTo('engines')}
                className="p-4 rounded-2xl bg-surface-950/80 border border-surface-800 hover:border-brand-500/40 cursor-pointer transition-all group btn-press flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-2 group-hover:text-brand-300 transition-colors">
                    <Wrench className="h-4 w-4 text-emerald-400" />
                    <span>Hardware Engines Manager</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Scan FFmpeg, ImageMagick, LibreOffice, Pandoc, Poppler, Tesseract, and 7-Zip status.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
              </div>
            </div>
          </div>

          {/* Formats Matrix */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Supported Media & Formats
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="p-3 rounded-2xl bg-surface-950/60 border border-surface-800/80">
                <span className="text-purple-400 font-bold block mb-1">🎬 Video</span>
                <span className="text-slate-400 font-mono text-[10px]">MP4, MKV, WebM, MOV, AVI, FLV</span>
              </div>
              <div className="p-3 rounded-2xl bg-surface-950/60 border border-surface-800/80">
                <span className="text-amber-400 font-bold block mb-1">🎵 Audio</span>
                <span className="text-slate-400 font-mono text-[10px]">MP3, WAV, FLAC, AAC, OGG, M4A</span>
              </div>
              <div className="p-3 rounded-2xl bg-surface-950/60 border border-surface-800/80">
                <span className="text-emerald-400 font-bold block mb-1">🖼️ Images</span>
                <span className="text-slate-400 font-mono text-[10px]">PNG, JPG, WebP, GIF, SVG, AVIF</span>
              </div>
              <div className="p-3 rounded-2xl bg-surface-950/60 border border-surface-800/80">
                <span className="text-rose-400 font-bold block mb-1">📑 Documents</span>
                <span className="text-slate-400 font-mono text-[10px]">PDF, DOCX, EPUB, TXT, MD, HTML</span>
              </div>
              <div className="p-3 rounded-2xl bg-surface-950/60 border border-surface-800/80">
                <span className="text-blue-400 font-bold block mb-1">📦 Archives</span>
                <span className="text-slate-400 font-mono text-[10px]">ZIP, 7Z, TAR, GZ, RAR, CBZ</span>
              </div>
              <div className="p-3 rounded-2xl bg-surface-950/60 border border-surface-800/80">
                <span className="text-cyan-400 font-bold block mb-1">📊 Data & OCR</span>
                <span className="text-slate-400 font-mono text-[10px]">CSV, XLSX, JSON, Tesseract OCR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with One-Tap Close */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-surface-800 bg-surface-900 flex items-center justify-between safe-bottom">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Swipe down or tap to dismiss
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all shadow-md shadow-brand-600/25 btn-press"
          >
            Got It, Let's Start
          </button>
        </div>
      </div>
    </div>
  );
};
