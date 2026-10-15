import React from 'react';
import { UploadCloud, Files, ListOrdered, Wrench, Activity, Settings, GitMerge, CheckCircle2, XCircle, Terminal } from 'lucide-react';
import { EngineInfo } from '../../types/api';

export type TabType = 'upload' | 'files' | 'pipelines' | 'jobs' | 'engines' | 'diagnostics' | 'developer' | 'settings';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  filesCount: number;
  jobsCount: number;
  engines: EngineInfo[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  filesCount,
  jobsCount,
  engines
}) => {
  const installedEnginesCount = engines.filter(e => e.installed).length;

  const navItems = [
    { id: 'upload', label: 'Upload & Studio', icon: UploadCloud },
    { id: 'files', label: 'File Library', icon: Files, badge: filesCount > 0 ? filesCount : undefined },
    { id: 'pipelines', label: 'Pipelines Studio', icon: GitMerge },
    { id: 'jobs', label: 'Job Queue & History', icon: ListOrdered, badge: jobsCount > 0 ? jobsCount : undefined },
    { 
      id: 'engines', 
      label: 'Engines & Tools', 
      icon: Wrench, 
      subtext: `${installedEnginesCount}/${engines.length || 9} Ready` 
    },
    { id: 'diagnostics', label: 'System Diagnostics', icon: Activity },
    { id: 'developer', label: 'Developer & API', icon: Terminal, subtext: 'Swagger & CLI' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-surface-800 bg-surface-900/40 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Studio Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as TabType)}
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
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-brand-800 text-white' : 'bg-surface-800 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Engine Status Mini-Widget */}
      <div className="p-3 rounded-2xl bg-surface-800/40 border border-surface-800 mt-6">
        <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
          <span>Local Engines</span>
          <span className="text-[10px] text-brand-400 font-mono">{installedEnginesCount}/{engines.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          {engines.slice(0, 6).map((eng) => (
            <div
              key={eng.name}
              title={`${eng.name}: ${eng.installed ? `Installed (v${eng.version || 'unknown'})` : 'Not installed'}`}
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
      </div>
    </aside>
  );
};

