import React from 'react';
import { ShieldCheck, Cpu, HardDrive, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeJobsCount: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeJobsCount, onRefresh, isRefreshing }) => {
  return (
    <header className="h-16 border-b border-surface-800 bg-surface-900/60 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <HardDrive className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Universal File Studio
            <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
              Local-First v1.0
            </span>
          </h1>
          <p className="text-xs text-slate-400">Unified local media & document engine</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Privacy Badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="h-4 w-4" />
          <span>100% Local & Private Processing</span>
        </div>

        {/* Active Jobs Counter */}
        {activeJobsCount > 0 && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium animate-pulse">
            <Cpu className="h-4 w-4" />
            <span>{activeJobsCount} Active Job{activeJobsCount > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};

