import React from 'react';
import { Activity, Cpu, HardDrive, Server, Folder, ShieldCheck } from 'lucide-react';
import { SystemDiagnostics } from '../../types/api';

interface DiagnosticsProps {
  diagnostics: SystemDiagnostics | null;
}

export const Diagnostics: React.FC<DiagnosticsProps> = ({ diagnostics }) => {
  if (!diagnostics) {
    return (
      <div className="p-12 text-center rounded-3xl bg-surface-900/30 border border-surface-800 text-slate-400">
        Loading system telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-surface-900/40 border border-surface-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
          <Activity className="h-5 w-5 text-brand-400" />
          Hardware & Resource Diagnostics
        </h2>
        <p className="text-xs text-slate-400">Real-time local hardware capacity and system health.</p>

        {/* Resource Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* CPU */}
          <div className="p-5 rounded-2xl bg-surface-950/60 border border-surface-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Cpu className="h-4 w-4 text-brand-400" />
                Processor (CPU)
              </span>
              <span className="font-mono text-white font-bold">{diagnostics.cpu_percent}%</span>
            </div>
            <div className="w-full bg-surface-900 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(diagnostics.cpu_percent, 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {diagnostics.cpu_count} Logical Cores Available
            </div>
          </div>

          {/* RAM */}
          <div className="p-5 rounded-2xl bg-surface-950/60 border border-surface-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Server className="h-4 w-4 text-emerald-400" />
                Memory (RAM)
              </span>
              <span className="font-mono text-white font-bold">{diagnostics.ram_percent}%</span>
            </div>
            <div className="w-full bg-surface-900 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${diagnostics.ram_percent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {diagnostics.ram_available_gb} GB Available / {diagnostics.ram_total_gb} GB Total
            </div>
          </div>

          {/* Disk */}
          <div className="p-5 rounded-2xl bg-surface-950/60 border border-surface-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <HardDrive className="h-4 w-4 text-indigo-400" />
                Storage Space
              </span>
              <span className="font-mono text-white font-bold">{diagnostics.disk_percent}%</span>
            </div>
            <div className="w-full bg-surface-900 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${diagnostics.disk_percent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {diagnostics.disk_free_gb} GB Free / {diagnostics.disk_total_gb} GB Total
            </div>
          </div>
        </div>
      </div>

      {/* Host Environment */}
      <div className="p-6 rounded-3xl bg-surface-900/40 border border-surface-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Host Machine Environment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-surface-950/60 border border-surface-800/60">
            <div className="text-slate-500 text-[10px] uppercase font-sans mb-1 font-semibold">Operating System</div>
            <div className="text-slate-200 truncate">{diagnostics.os}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-950/60 border border-surface-800/60">
            <div className="text-slate-500 text-[10px] uppercase font-sans mb-1 font-semibold">Platform</div>
            <div className="text-slate-200 truncate">{diagnostics.platform}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-950/60 border border-surface-800/60">
            <div className="text-slate-500 text-[10px] uppercase font-sans mb-1 font-semibold">Python Engine</div>
            <div className="text-brand-400 font-bold">{diagnostics.python_version}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-950/60 border border-surface-800/60">
            <div className="text-slate-500 text-[10px] uppercase font-sans mb-1 font-semibold">Privacy Sandbox</div>
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Localhost 127.0.0.1
            </div>
          </div>
        </div>
      </div>

      {/* Directory Paths */}
      <div className="p-6 rounded-3xl bg-surface-900/40 border border-surface-800 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Folder className="h-4 w-4 text-brand-400" />
          Active Storage Mounts
        </h3>
        <div className="divide-y divide-surface-800/60 text-xs font-mono">
          {Object.entries(diagnostics.storage_paths).map(([key, val]) => (
            <div key={key} className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 capitalize">{key} Path:</span>
              <span className="text-slate-200 break-all select-all font-semibold">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

