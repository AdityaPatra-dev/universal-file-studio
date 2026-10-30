import React, { useState } from 'react';
import { 
  Cpu, HardDrive, RefreshCw, HelpCircle, 
  Zap, Laptop, CheckCircle2, ShieldCheck, X
} from 'lucide-react';
import { TabType } from './Sidebar';
import { EngineMode } from '../../services/universalEngine';

interface HeaderProps {
  activeJobsCount: number;
  engineMode?: EngineMode;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onNavigateTab: (tab: TabType) => void;
  onOpenHelpGuide?: () => void;
  onOpenMobileConnect?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeJobsCount, 
  engineMode = 'mobile_standalone',
  onRefresh, 
  isRefreshing,
  onNavigateTab,
  onOpenHelpGuide,
  onOpenMobileConnect
}) => {
  const [showEngineInfo, setShowEngineInfo] = useState(false);
  const isDesktop = engineMode === 'desktop';

  return (
    <>
      <header className="border-b border-surface-800/80 bg-surface-950/80 backdrop-blur-2xl px-4 sm:px-6 sticky top-0 z-30 transition-all safe-top pb-3 sm:py-3.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Brand Logo & Name */}
          <div 
            onClick={() => onNavigateTab('upload')}
            className="flex items-center space-x-3 cursor-pointer group select-none btn-press"
            title="Studio Dashboard"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform shrink-0">
              <HardDrive className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  File Studio
                </h1>
                <span className="hidden md:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-850 text-slate-300 border border-surface-700/60">
                  {isDesktop ? 'PC Server' : 'Standalone'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {isDesktop ? 'Hardware accelerated engines connected' : '100% on-device • Private & offline'}
              </p>
            </div>
          </div>

          {/* Actions & Status */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Dual-Engine Mode Pill */}
            <button
              onClick={() => setShowEngineInfo(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer btn-press ${
                isDesktop
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-brand-500/10 border-brand-500/30 text-brand-300 hover:bg-brand-500/20'
              }`}
              title="View Engine details"
            >
              {isDesktop ? (
                <>
                  <Laptop className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Desktop Server</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 text-brand-400" />
                  <span>On-Device</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                </>
              )}
            </button>

            {/* Active Jobs Counter Pill */}
            {activeJobsCount > 0 && (
              <button
                onClick={() => onNavigateTab('jobs')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse btn-press"
                title="View running jobs"
              >
                <Cpu className="h-3.5 w-3.5 text-amber-400" />
                <span>{activeJobsCount} Active</span>
              </button>
            )}

            {/* Help / Guide */}
            {onOpenHelpGuide && (
              <button
                onClick={onOpenHelpGuide}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-surface-900 hover:bg-surface-850 text-slate-300 hover:text-white transition-all text-xs font-medium border border-surface-800 btn-press flex items-center space-x-1.5"
                title="Studio Guide & Help"
              >
                <HelpCircle className="h-4 w-4 text-brand-400" />
                <span className="hidden sm:inline">Guide</span>
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-surface-900 hover:bg-surface-850 text-slate-300 hover:text-white transition-all disabled:opacity-50 border border-surface-800 btn-press"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Engine Architecture Details Modal */}
      {showEngineInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg card-glass rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-surface-800">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-2xl ${isDesktop ? 'bg-emerald-500/10 text-emerald-400' : 'bg-brand-500/10 text-brand-400'}`}>
                  {isDesktop ? <Laptop className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Processing Engine Status</h3>
                  <p className="text-xs text-slate-400">
                    {isDesktop ? 'Connected to high-performance PC backend' : 'Running 100% on-device in standalone mode'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowEngineInfo(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-surface-850 btn-press"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-surface-850/80 border border-surface-700/50 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Dual-Tier Engine Pipeline</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  When running on mobile or in the standalone APK, processing happens locally via WebAssembly, HTML5 Canvas, and PDF-Lib. When connected to a PC server, it automatically unlocks full FFmpeg, LibreOffice, and native engines.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className={`p-3 rounded-2xl border ${!isDesktop ? 'bg-brand-950/30 border-brand-500/40' : 'bg-surface-850/40 border-surface-800'}`}>
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs mb-1">
                    <Zap className="h-3.5 w-3.5 text-brand-400" />
                    <span>Mobile / APK</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
                    <li>Canvas Image Studio</li>
                    <li>PDF-Lib Document Engine</li>
                    <li>JSZip Compression</li>
                    <li>Web Audio WAV Studio</li>
                  </ul>
                </div>

                <div className={`p-3 rounded-2xl border ${isDesktop ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-surface-850/40 border-surface-800'}`}>
                  <div className="flex items-center gap-1.5 font-bold text-white text-xs mb-1">
                    <Laptop className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Desktop Server</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
                    <li>FFmpeg Transcoding</li>
                    <li>ImageMagick & Pillow</li>
                    <li>LibreOffice & Pandoc</li>
                    <li>Tesseract OCR & 7-Zip</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-surface-800 flex justify-end">
              <button
                onClick={() => setShowEngineInfo(false)}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-500/25 btn-press"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
