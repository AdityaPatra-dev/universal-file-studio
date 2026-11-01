import React, { useState } from 'react';
import { 
  HardDrive, RefreshCw, HelpCircle, 
  Sun, Moon, ShieldCheck, X, Sparkles
} from 'lucide-react';
import { TabType } from './Sidebar';
import { EngineMode } from '../../services/universalEngine';

interface HeaderProps {
  activeJobsCount?: number;
  engineMode?: EngineMode;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onNavigateTab: (tab: TabType) => void;
  onOpenHelpGuide?: () => void;
  onOpenMobileConnect?: () => void;
  onOpenUpdates?: () => void;
  hasUpdate?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  theme = 'dark',
  onToggleTheme,
  onRefresh, 
  isRefreshing,
  onNavigateTab,
  onOpenHelpGuide,
  onOpenUpdates,
  hasUpdate = false,
}) => {
  return (
    <header className="border-b border-surface-800/80 bg-surface-950/80 backdrop-blur-2xl px-4 sm:px-6 sticky top-0 z-30 transition-all safe-top pb-3 sm:py-3.5">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onNavigateTab('pipelines')}
          className="flex items-center space-x-3 cursor-pointer group select-none btn-press"
          title="Tools & Studio Home"
        >
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl overflow-hidden shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform shrink-0 border border-surface-700/50 bg-surface-900">
            <img src="/icon.png" alt="UFS Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                File Studio
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              100% on-device • Private & offline processing
            </p>
          </div>
        </div>

        {/* Actions & Utilities */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Theme Bright / Dark Mode Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-surface-900 hover:bg-surface-850 text-slate-300 hover:text-white transition-all text-xs font-medium border border-surface-800 btn-press flex items-center space-x-1.5"
              title={theme === 'dark' ? 'Switch to Bright Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-500" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
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

          {/* Software Updates */}
          {onOpenUpdates && (
            <button
              onClick={onOpenUpdates}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl transition-all text-xs font-medium border btn-press flex items-center space-x-1.5 ${
                hasUpdate
                  ? 'bg-brand-600/20 text-brand-300 border-brand-500/40 hover:bg-brand-600/30'
                  : 'bg-surface-900 hover:bg-surface-850 text-slate-300 hover:text-white border-surface-800'
              }`}
              title="Check for Software Updates"
            >
              <Sparkles className={`h-4 w-4 ${hasUpdate ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{hasUpdate ? 'Update' : 'v1.0.0'}</span>
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
  );
};
