import React from 'react';
import { CheckCircle2, XCircle, RefreshCw, Terminal, Wrench, Info } from 'lucide-react';
import { EngineInfo } from '../../types/api';

interface EngineManagerProps {
  engines: EngineInfo[];
  onRescan: () => void;
  isRescanning?: boolean;
}

export const EngineManager: React.FC<EngineManagerProps> = ({
  engines,
  onRescan,
  isRescanning,
}) => {
  const installedCount = engines.filter(e => e.installed).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-surface-900 to-surface-900/60 border border-surface-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="h-5 w-5 text-brand-400" />
            Local Processing Engines
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {installedCount} of {engines.length} engines detected and ready for hardware-accelerated processing.
          </p>
        </div>
        <button
          onClick={onRescan}
          disabled={isRescanning}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs transition-all shadow-md shadow-brand-600/30 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRescanning ? 'animate-spin' : ''}`} />
          <span>Rescan Local System</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {engines.map((engine) => (
          <div
            key={engine.name}
            className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
              engine.installed
                ? 'bg-surface-900/40 border-surface-800 hover:border-surface-700'
                : 'bg-surface-950/40 border-surface-900 opacity-70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-base text-white capitalize flex items-center gap-2">
                  {engine.name}
                </span>
                {engine.installed ? (
                  <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Installed</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-800 text-slate-500">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Not Found</span>
                  </span>
                )}
              </div>

              <div className="space-y-1.5 font-mono text-xs text-slate-400">
                <div>Version: <span className="text-slate-200">{engine.version || 'N/A'}</span></div>
                <div>Executable: <span className="text-slate-400 text-[11px]">{engine.path || 'In system $PATH'}</span></div>
              </div>

              {/* Capabilities snippet */}
              {engine.installed && engine.capabilities && (
                <div className="mt-4 pt-3 border-t border-surface-800/60">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Capabilities</div>
                  <div className="flex flex-wrap gap-1">
                    {engine.capabilities.formats?.slice(0, 8).map((f) => (
                      <span key={f} className="px-1.5 py-0.5 rounded bg-surface-800 text-[10px] text-slate-300 font-mono">
                        {f}
                      </span>
                    ))}
                    {(engine.capabilities.formats?.length || 0) > 8 && (
                      <span className="px-1.5 py-0.5 rounded bg-surface-800 text-[10px] text-brand-400 font-mono">
                        +{engine.capabilities.formats!.length - 8} more
                      </span>
                    )}
                    {engine.capabilities.languages?.length ? (
                      <span className="px-1.5 py-0.5 rounded bg-brand-500/10 text-[10px] text-brand-300 font-mono">
                        {engine.capabilities.languages.length} languages
                      </span>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {!engine.installed && (
              <div className="mt-4 pt-3 border-t border-surface-900 text-[11px] text-slate-500">
                Install via system package manager: <code className="text-slate-400 font-mono">sudo dnf install {engine.name}</code>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

