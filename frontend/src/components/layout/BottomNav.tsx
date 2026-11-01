import React, { useState, useRef } from 'react';
import { 
  Files, Wand2, ListOrdered, Grid, 
  Wrench, Activity, Settings, Terminal, Smartphone, 
  HelpCircle, ChevronRight
} from 'lucide-react';
import { TabType } from './Sidebar';
import { EngineInfo } from '../../types/api';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  filesCount: number;
  jobsCount: number;
  activeJobsCount: number;
  engines: EngineInfo[];
  onOpenMobileConnect: () => void;
  onOpenHelpGuide: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  filesCount,
  jobsCount,
  activeJobsCount,
  engines,
  onOpenMobileConnect,
  onOpenHelpGuide,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const installedEnginesCount = engines.filter(e => e.installed).length;

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
      setIsMoreMenuOpen(false);
    }
    setDragOffsetY(0);
    isDraggingRef.current = false;
  };

  const mainTabs = [
    {
      id: 'pipelines' as TabType,
      label: 'Tools',
      icon: Wand2,
    },
    {
      id: 'files' as TabType,
      label: 'Files',
      icon: Files,
      badge: filesCount > 0 ? filesCount : undefined,
    },
    {
      id: 'jobs' as TabType,
      label: 'Queue',
      icon: ListOrdered,
      badge: activeJobsCount > 0 ? activeJobsCount : undefined,
      isPulse: activeJobsCount > 0,
    },
  ];

  const secondaryTabs = [
    {
      id: 'engines' as TabType,
      label: 'Engines & Tools',
      icon: Wrench,
      badge: `${installedEnginesCount}/${engines.length || 9} Ready`,
      desc: 'FFmpeg, ImageMagick, Pandoc, Poppler...',
    },
    {
      id: 'diagnostics' as TabType,
      label: 'System Diagnostics',
      icon: Activity,
      desc: 'RAM, CPU, and Disk metrics',
    },
    {
      id: 'developer' as TabType,
      label: 'Developer & API',
      icon: Terminal,
      desc: 'REST API, WebSocket & Typer CLI',
    },
    {
      id: 'settings' as TabType,
      label: 'App Settings',
      icon: Settings,
      desc: 'Concurrency, paths, and preferences',
    },
  ];

  const handleSelectTab = (tab: TabType) => {
    onSelectTab(tab);
    setIsMoreMenuOpen(false);
  };

  const isSecondaryActive = ['engines', 'diagnostics', 'developer', 'settings'].includes(currentTab);

  return (
    <>
      {/* Bottom Sheet Menu for "More" */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden flex flex-col justify-end animate-in fade-in duration-150">
          <div 
            onClick={() => setIsMoreMenuOpen(false)}
            className="flex-1"
          />
          <div 
            style={{
              transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
              transition: dragOffsetY === 0 ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            }}
            className="bg-surface-900 border-t border-surface-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto safe-bottom animate-in slide-in-from-bottom duration-200 shadow-2xl"
          >
            {/* Sheet Handle */}
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="pt-1 pb-2 cursor-grab active:cursor-grabbing select-none flex flex-col items-center justify-center -mt-2 -mx-5 px-5"
            >
              <div className="w-14 h-1.5 bg-surface-600/80 hover:bg-surface-500 rounded-full transition-colors" />
              <span className="text-[10px] text-slate-500 font-mono mt-1">Swipe down to close</span>
            </div>

            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="border-b border-surface-800 pb-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight">System & Diagnostics</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Engines, system metrics & settings</p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                  UFS v1.0
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenMobileConnect();
                }}
                className="p-3.5 rounded-2xl bg-surface-950/80 border border-surface-800 flex items-center space-x-3 text-left btn-press hover:border-brand-500/40 transition-all"
              >
                <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 shrink-0">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white">Phone Connect</div>
                  <div className="text-[10px] text-slate-400">Scan QR Code</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenHelpGuide();
                }}
                className="p-3.5 rounded-2xl bg-surface-950/80 border border-surface-800 flex items-center space-x-3 text-left btn-press hover:border-brand-500/40 transition-all"
              >
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white">Studio Guide</div>
                  <div className="text-[10px] text-slate-400">Formats & Help</div>
                </div>
              </button>
            </div>

            {/* Secondary Navigation List */}
            <div className="space-y-2">
              {secondaryTabs.map((item) => {
                const Icon = item.icon;
                const isSelected = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between text-left transition-all btn-press ${
                      isSelected
                        ? 'bg-brand-600/20 border border-brand-500/40 text-brand-300 shadow-sm'
                        : 'bg-surface-950/60 border border-surface-800/80 text-slate-300 hover:border-surface-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-brand-500 text-white shadow-md' : 'bg-surface-800 text-slate-300'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface-900/95 backdrop-blur-md border-t border-surface-800 md:hidden safe-bottom shadow-xl">
        <div className="flex items-center justify-around px-2 py-1.5">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`flex-1 py-1 px-1 flex flex-col items-center justify-center relative rounded-xl transition-all btn-press ${
                  isSelected
                    ? 'text-brand-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <div className={`p-1 rounded-xl transition-transform ${isSelected ? 'bg-brand-500/15 scale-110' : ''}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {tab.badge !== undefined && (
                    <span className={`absolute -top-1 -right-2 text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center ${
                      tab.isPulse 
                        ? 'bg-amber-500 text-black animate-pulse font-extrabold shadow-sm shadow-amber-500/50' 
                        : 'bg-brand-600 text-white'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight font-medium">
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More Tab Trigger */}
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(prev => !prev)}
            className={`flex-1 py-1 px-1 flex flex-col items-center justify-center relative rounded-xl transition-all btn-press ${
              isSecondaryActive || isMoreMenuOpen
                ? 'text-brand-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-transform ${isSecondaryActive || isMoreMenuOpen ? 'bg-brand-500/15 scale-110' : ''}`}>
              <Grid className="h-5 w-5" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight font-medium">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
