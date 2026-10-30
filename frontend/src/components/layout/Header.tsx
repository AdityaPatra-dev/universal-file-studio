import React, { useState } from 'react';
import { 
  ShieldCheck, Cpu, HardDrive, RefreshCw, HelpCircle, 
  Smartphone, Zap, Laptop, CheckCircle2, Info, ChevronDown
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
      <header className="border-b border-surface-800/80 bg-surface-900/95 backdrop-blur-xl px-4 sm:px-6 sticky top-0 z-30 transition-all safe-top pb-3.5 sm:py-3.5">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div 
            onClick={() => onNavigateTab('upload')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
            title="Return to Studio Dashboard"
          >
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform shrink-0">
              <HardDrive className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white truncate">
                  Universal File Studio
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                  {isDesktop ? 'PC Server' : 'Standalone APK'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[170px] sm:max-w-none">
                {isDesktop ? 'High-Performance Heavy Engines Active' : '100% On-Device • Zero Cloud Uploads'}
              </p>
            </div>
          </div>

          {/* Action Badges & Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Dual-Engine Mode Indicator Pill */}
            <button
              onClick={() => setShowEngineInfo(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-sm active:scale-95 ${
                isDesktop
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-brand-500/10 border-brand-500/30 text-brand-300 hover:bg-brand-500/20'
              }`}
              title="Click to view Active Engine Architecture details"
            >
              {isDesktop ? (
                <>
                  <Laptop className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Desktop Server</span>
                  <span className="sm:hidden text-[11px]">Server</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 text-brand-400" />
                  <span className="hidden sm:inline">On-Device APK</span>
                  <span className="sm:hidden text-[11px]">On-Device</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                </>
              )}
            </button>

            {/* Mobile Connect Button (Desktop Mode only) */}
            {onOpenMobileConnect && isDesktop && (
              <button
                onClick={onOpenMobileConnect}
                className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 hover:text-white transition-all text-xs font-semibold border border-surface-700 shadow-sm cursor-pointer group"
                title="Connect your Android or iPhone over Wi-Fi"
              >
                <Smartphone className="h-4 w-4 text-brand-400 group-hover:scale-110 transition-transform" />
                <span>Phone Connect</span>
              </button>
            )}

            {/* Active Jobs Counter Pill */}
            {activeJobsCount > 0 && (
              <button
                onClick={() => onNavigateTab('jobs')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse hover:bg-amber-500/25 active:scale-95 transition-all cursor-pointer shadow-sm shadow-amber-500/10"
                title="Click to view running background jobs"
              >
                <Cpu className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[11px] sm:text-xs">{activeJobsCount} Active</span>
              </button>
            )}

            {/* Studio Guide & Help */}
            <button
              onClick={onOpenHelpGuide}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-surface-800/80 hover:bg-surface-700 text-slate-300 hover:text-white transition-all text-xs font-semibold border border-surface-700/60 cursor-pointer active:scale-95 flex items-center space-x-1.5"
              title="Studio Guide & Help"
            >
              <HelpCircle className="h-4 w-4 text-brand-400" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-surface-800/80 hover:bg-surface-700 text-slate-300 hover:text-white transition-all disabled:opacity-50 border border-surface-700/60 cursor-pointer active:scale-95"
              title="Refresh telemetry"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Engine Architecture Details Modal */}
      {showEngineInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-surface-900 border border-surface-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-surface-800">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-2xl ${isDesktop ? 'bg-emerald-500/10 text-emerald-400' : 'bg-brand-500/10 text-brand-400'}`}>
                  {isDesktop ? <Laptop className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg">Dual-Engine Architecture</h3>
                  <p className="text-xs text-slate-400">
                    {isDesktop ? 'Desktop High-Performance Engine Connected' : 'On-Device Mobile Fallback Active'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowEngineInfo(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-surface-800/80 hover:bg-surface-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="p-3.5 rounded-2xl bg-surface-850/80 border border-surface-700/50 space-y-2">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-400" />
                  <span>How Universal File Studio Operates:</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-xs">
                  Universal File Studio is engineered with an intelligent dual-engine pipeline. When running inside an Android APK or on mobile, it runs 100% locally with on-device engines (zero network needed). When connected to a laptop/PC server, it automatically harnesses high-speed native binaries (FFmpeg, LibreOffice, ImageMagick).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-3.5 rounded-2xl border ${!isDesktop ? 'bg-brand-950/30 border-brand-500/40' : 'bg-surface-800/40 border-surface-700/40'}`}>
                  <div className="flex items-center gap-2 font-semibold text-white text-xs mb-1.5">
                    <Zap className="h-4 w-4 text-brand-400" />
                    <span>Mobile / APK Engine</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>HTML5 Canvas & WebCodecs</li>
                    <li>PDF-Lib (Merge/Split/Watermark)</li>
                    <li>JSZip (Zip & Unzip)</li>
                    <li>Web Audio API (WAV Conversion)</li>
                    <li>Hardware WebCrypto Hashes</li>
                  </ul>
                </div>

                <div className={`p-3.5 rounded-2xl border ${isDesktop ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-surface-800/40 border-surface-700/40'}`}>
                  <div className="flex items-center gap-2 font-semibold text-white text-xs mb-1.5">
                    <Laptop className="h-4 w-4 text-emerald-400" />
                    <span>Laptop / Desktop Engine</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>FFmpeg (4K Video & Audio)</li>
                    <li>ImageMagick & Pillow</li>
                    <li>LibreOffice & Pandoc</li>
                    <li>Poppler & Ghostscript</li>
                    <li>Tesseract OCR & 7-Zip</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-surface-800 flex justify-end">
              <button
                onClick={() => setShowEngineInfo(false)}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-brand-500/20 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
