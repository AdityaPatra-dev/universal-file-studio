import React from 'react';
import { 
  ShieldCheck, Cpu, HardDrive, RefreshCw, HelpCircle, 
  Menu, Smartphone, QrCode, Sparkles 
} from 'lucide-react';
import { TabType } from './Sidebar';

interface HeaderProps {
  activeJobsCount: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onNavigateTab: (tab: TabType) => void;
  onToggleMobileSidebar?: () => void;
  onOpenHelpGuide?: () => void;
  onOpenMobileConnect?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeJobsCount, 
  onRefresh, 
  isRefreshing,
  onNavigateTab,
  onToggleMobileSidebar,
  onOpenHelpGuide,
  onOpenMobileConnect
}) => {
  return (
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
                v1.0 Local
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[130px] sm:max-w-none">
              9 engines • 100% on-device
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1.5 sm:space-x-2.5">
        {/* Privacy Badge (Desktop) */}
        <div 
          onClick={onOpenHelpGuide}
          className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium cursor-pointer hover:bg-emerald-500/15 transition-colors"
          title="Click to learn about 100% local hardware processing"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>100% Local & Private</span>
        </div>

        {/* Mobile Connect Button (Desktop & Mobile) */}
        {onOpenMobileConnect && (
          <button
            onClick={onOpenMobileConnect}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 hover:text-white transition-all text-xs font-semibold border border-surface-700 shadow-sm cursor-pointer group"
            title="Connect your Android or iPhone over Wi-Fi"
          >
            <Smartphone className="h-4 w-4 text-brand-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Phone Connect</span>
            <span className="sm:hidden text-[11px]">Phone</span>
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
  );
};
