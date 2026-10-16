import React from 'react';
import { 
  UploadCloud, Files, ListOrdered, Wrench, Activity, Settings, 
  GitMerge, CheckCircle2, XCircle, Terminal, X, ChevronRight
} from 'lucide-react';
import { EngineInfo } from '../../types/api';

export type TabType = 'upload' | 'files' | 'pipelines' | 'jobs' | 'engines' | 'diagnostics' | 'developer' | 'settings';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  filesCount: number;
  jobsCount: number;
  engines: EngineInfo[];
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  filesCount,
  jobsCount,
  engines,
  mobileOpen,
  onCloseMobile
}) => {
  const installedEnginesCount = engines.filter(e => e.installed).length;

  const workspaceNavItems = [
    { 
      id: 'upload', 
      label: 'Studio Dashboard', 
      icon: UploadCloud, 
      desc: 'Drag & Drop Media' 
    },
    { 
      id: 'files', 
      label: 'File Library', 
      icon: Files, 
      badge: filesCount > 0 ? filesCount : undefined,
      desc: 'Browse & Inspect'
    },
    { 
      id: 'pipelines', 
      label: 'Pipelines Studio', 
      icon: GitMerge, 
      subtext: 'Chains & Recipes',
      desc: 'Multi-Step Chains'
    },
    { 
      id: 'jobs', 
      label: 'Job Queue & History', 
      icon: ListOrdered, 
      badge: jobsCount > 0 ? jobsCount : undefined,
      desc: 'Workers & Output'
    },
  ];

  const systemNavItems = [
    { 
      id: 'engines', 
      label: 'Engines & Tools', 
      icon: Wrench, 
      subtext: `${installedEnginesCount}/${engines.length || 9} Ready` 
    },
    { 
      id: 'diagnostics', 
      label: 'System Diagnostics', 
      icon: Activity 
    },
    { 
      id: 'developer', 
      label: 'Developer & API', 
      icon: Terminal, 
      subtext: 'Swagger & CLI' 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings 
    },
  ];

  const handleSelect = (tab: TabType) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 border-r border-surface-800 bg-surface-900/95 md:bg-surface-900/40 backdrop-blur-md p-4 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-5 overflow-y-auto pr-1">
          {/* Mobile Header Close Button */}
          <div className="flex md:hidden items-center justify-between pb-2 border-b border-surface-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Navigation Menu</span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg bg-surface-800 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Section 1: Core Workspace Navigation */}
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase flex items-center justify-between">
              <span>Workspace</span>
              <span className="text-[9px] text-brand-400 font-mono">Core Actions</span>
            </div>
            {workspaceNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id as TabType)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    {item.subtext && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? 'bg-brand-700 text-white' : 'bg-surface-800 text-slate-400'}`}>
                        {item.subtext}
                      </span>
                    )}
                    {item.badge !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${isActive ? 'bg-brand-800 text-white font-bold' : 'bg-surface-800 text-slate-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Section 2: System & Utilities Navigation */}
          <div className="space-y-1 pt-2 border-t border-surface-800/80">
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase flex items-center justify-between">
              <span>System & Tools</span>
              <span className="text-[9px] text-slate-500 font-mono">Telemetry</span>
            </div>
            {systemNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id as TabType)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    {item.subtext && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? 'bg-brand-700 text-white' : 'bg-surface-800 text-slate-400'}`}>
                        {item.subtext}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clickable Engine Status Mini-Widget */}
        <div 
          onClick={() => handleSelect('engines')}
          className="p-3 rounded-2xl bg-surface-800/40 hover:bg-surface-800/70 border border-surface-800 cursor-pointer transition-all mt-4 group"
          title="Click to manage local CLI processing engines"
        >
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between group-hover:text-white">
            <span className="flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-brand-400" />
              <span>Local Engines</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-brand-400 font-mono font-bold">
                {installedEnginesCount}/{engines.length || 9}
              </span>
              <ChevronRight className="h-3 w-3 text-slate-500 group-hover:text-brand-300 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            {engines.slice(0, 6).map((eng) => (
              <div
                key={eng.name}
                className={`flex items-center space-x-1 px-1.5 py-1 rounded border ${
                  eng.installed 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                    : 'bg-surface-900 border-surface-800 text-slate-500'
                }`}
              >
                {eng.installed ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <XCircle className="h-3 w-3 shrink-0" />}
                <span className="truncate capitalize">{eng.name}</span>
              </div>
            ))}
          </div>
          {engines.length > 6 && (
            <div className="text-[10px] text-slate-500 mt-1.5 text-right font-medium">
              +{engines.length - 6} more engines detected →
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
