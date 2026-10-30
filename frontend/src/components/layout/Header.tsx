import React, { useState } from 'react';
import { 
  ShieldCheck, Cpu, HardDrive, RefreshCw, HelpCircle, 
  Menu, Smartphone, QrCode, Sparkles, Zap, Laptop, CheckCircle2, Info
} from 'lucide-react';
import { TabType } from './Sidebar';
import { EngineMode } from '../../services/universalEngine';

interface HeaderProps {
  activeJobsCount: number;
  engineMode?: EngineMode;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onNavigateTab: (tab: TabType) => void;
  onToggleMobileSidebar?: () => void;
  onOpenHelpGuide?: () => void;
  onOpenMobileConnect?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeJobsCount, 
  engineMode = 'mobile_standalone',
  onRefresh, 
  isRefreshing,
  onNavigateTab,
  onToggleMobileSidebar,
  onOpenHelpGuide,
  onOpenMobileConnect
}) => {
  const [showEngineInfo, setShowEngineInfo] = useState(false);
  const isDesktop = engineMode === 'desktop';

  return (
    <>
      <header className="h-16 border-b border-surface-800 bg-surface-900/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 transition-colors"
            title="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Brand Logo & Name */}
          <div 
            onClick={() => onNavigateTab('upload')}
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group"
            title="Return to Studio Dashboard"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform shrink-0">
              <HardDrive className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
                <span className="truncate">Universal File Studio</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Dual-Engine
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[130px] sm:max-w-none">
                {isDesktop ? 'Connected to PC Server • 9 Engines' : 'On-Device Mobile Mode • 100% Local'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Dual-Engine Mode Indicator Pill */}
          <button
            onClick={() => setShowEngineInfo(true)}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              isDesktop
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-brand-500/10 border-brand-500/25 text-brand-300 hover:bg-brand-500/20'
            }`}
            title="Click to view Active Engine Architecture details"
          >
            {isDesktop ? (
              <>
                <Laptop className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Desktop Server</span>
                <span className="sm:hidden text-[10px]">Server</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 text-brand-400" />
                <span className="hidden sm:inline">On-Device APK</span>
                <span className="sm:hidden text-[10px]">On-Device</span>
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              </>
            )}
          </button>

          {/* Privacy Badge (Desktop) */}
          <div 
            onClick={onOpenHelpGuide}
            className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer hover:bg-slate-700/80 transition-colors"
            title="Click to learn about 100% local hardware processing"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Zero Cloud Uploads</span>
          </div>

          {/* Mobile Connect Button (Desktop & Mobile) */}
          {onOpenMobileConnect && isDesktop && (
            <button
              onClick={onOpenMobileConnect}
              className="hidden md:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 hover:text-white transition-all text-xs font-semibold border border-surface-700 shadow-sm cursor-pointer group"
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
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse hover:bg-amber-500/25 active:scale-95 transition-all cursor-pointer shadow-sm shadow-amber-500/10"
              title="Click to view running background jobs"
            >
              <Cpu className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
              <span className="text-[11px] sm:text-xs">{activeJobsCount} Active →</span>
            </button>
          )}

          {/* Studio Guide & Help */}
          <button
            onClick={onOpenHelpGuide}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white transition-colors text-xs font-medium border border-surface-700/60 cursor-pointer"
            title="Studio Guide & Supported Formats"
          >
            <HelpCircle className="h-4 w-4 text-brand-400" />
            <span>Guide</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50 border border-surface-700/60 cursor-pointer"
            title="Refresh files, jobs telemetry, and engine health"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* Engine Architecture Details Modal */}
      {showEngineInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
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
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-surface-800/80 hover:bg-surface-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="p-3.5 rounded-2xl bg-surface-800/60 border border-surface-700/50 space-y-2">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-400" />
                  <span>How Universal File Studio Operates:</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-xs">
                  Universal File Studio is engineered with an intelligent dual-engine pipeline. When running on a laptop or connected to a desktop server, it harnesses native heavy binaries. When running inside an Android APK or offline mobile phone, it automatically falls back to client-side on-device engines.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-3.5 rounded-2xl border ${isDesktop ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-surface-800/40 border-surface-700/40'}`}>
                  <div className="flex items-center gap-2 font-semibold text-white text-xs mb-1.5">
                    <Laptop className="h-4 w-4 text-emerald-400" />
                    <span>Laptop / Desktop Engine</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>FFmpeg (Video & Audio)</li>
                    <li>ImageMagick & Pillow</li>
                    <li>LibreOffice & Pandoc</li>
                    <li>Poppler & Ghostscript</li>
                    <li>Tesseract OCR & 7-Zip</li>
                  </ul>
                </div>

                <div className={`p-3.5 rounded-2xl border ${!isDesktop ? 'bg-brand-950/20 border-brand-500/30' : 'bg-surface-800/40 border-surface-700/40'}`}>
                  <div className="flex items-center gap-2 font-semibold text-white text-xs mb-1.5">
                    <Zap className="h-4 w-4 text-brand-400" />
                    <span>Mobile / APK Engine</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>HTML5 Canvas & WebCodecs</li>
                    <li>PDF-Lib (Split/Merge/Watermark)</li>
                    <li>JSZip Compression & Extraction</li>
                    <li>Web Audio API (WAV Conversion)</li>
                    <li>Hardware WebCrypto Hashes</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-surface-800 flex justify-end">
              <button
                onClick={() => setShowEngineInfo(false)}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-brand-500/20 cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
