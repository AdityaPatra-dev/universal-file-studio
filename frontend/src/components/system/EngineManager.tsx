import React, { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Terminal, Wrench, Info, Copy, Check, ExternalLink } from 'lucide-react';
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
  const [copiedEngine, setCopiedEngine] = useState<string | null>(null);
  const [selectedOs, setSelectedOs] = useState<'debian' | 'fedora' | 'arch' | 'mac' | 'windows'>('debian');

  const getPackageInstallCommand = (engineName: string, os: 'debian' | 'fedora' | 'arch' | 'mac' | 'windows') => {
    const pkgMap: Record<string, { debian: string; fedora: string; arch: string; mac: string; windows: string }> = {
      ffmpeg: {
        debian: 'sudo apt update && sudo apt install ffmpeg',
        fedora: 'sudo dnf install ffmpeg',
        arch: 'sudo pacman -S ffmpeg',
        mac: 'brew install ffmpeg',
        windows: 'winget install Gyan.FFmpeg',
      },
      imagemagick: {
        debian: 'sudo apt install imagemagick',
        fedora: 'sudo dnf install ImageMagick',
        arch: 'sudo pacman -S imagemagick',
        mac: 'brew install imagemagick',
        windows: 'winget install ImageMagick.ImageMagick',
      },
      pandoc: {
        debian: 'sudo apt install pandoc',
        fedora: 'sudo dnf install pandoc',
        arch: 'sudo pacman -S pandoc',
        mac: 'brew install pandoc',
        windows: 'winget install JohnMacFarlane.Pandoc',
      },
      poppler: {
        debian: 'sudo apt install poppler-utils',
        fedora: 'sudo dnf install poppler-utils',
        arch: 'sudo pacman -S poppler',
        mac: 'brew install poppler',
        windows: 'choco install poppler',
      },
      ghostscript: {
        debian: 'sudo apt install ghostscript',
        fedora: 'sudo dnf install ghostscript',
        arch: 'sudo pacman -S ghostscript',
        mac: 'brew install ghostscript',
        windows: 'winget install Artifex.Ghostscript',
      },
      libreoffice: {
        debian: 'sudo apt install libreoffice',
        fedora: 'sudo dnf install libreoffice',
        arch: 'sudo pacman -S libreoffice-fresh',
        mac: 'brew install --cask libreoffice',
        windows: 'winget install TheDocumentFoundation.LibreOffice',
      },
      tesseract: {
        debian: 'sudo apt install tesseract-ocr',
        fedora: 'sudo dnf install tesseract',
        arch: 'sudo pacman -S tesseract',
        mac: 'brew install tesseract',
        windows: 'winget install UB-Mannheim.TesseractOCR',
      },
      '7z': {
        debian: 'sudo apt install p7zip-full',
        fedora: 'sudo dnf install p7zip p7zip-plugins',
        arch: 'sudo pacman -S p7zip',
        mac: 'brew install p7zip',
        windows: 'winget install 7zip.7zip',
      },
      exiftool: {
        debian: 'sudo apt install libimage-exiftool-perl',
        fedora: 'sudo dnf install perl-Image-ExifTool',
        arch: 'sudo pacman -S perl-image-exiftool',
        mac: 'brew install exiftool',
        windows: 'winget install PhilHarvey.ExifTool',
      },
    };

    const entry = pkgMap[engineName.toLowerCase()];
    if (entry) return entry[os];
    return `sudo apt install ${engineName}`;
  };

  const handleCopy = (engineName: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEngine(engineName);
    setTimeout(() => setCopiedEngine(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-surface-900 to-surface-900/60 border border-surface-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="h-5 w-5 text-brand-400" />
            Local Hardware CLI Engines
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {installedCount} of {engines.length} engines detected and ready for high-speed local processing.
          </p>
        </div>
        <button
          onClick={onRescan}
          disabled={isRescanning}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-md shadow-brand-600/30 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRescanning ? 'animate-spin' : ''}`} />
          <span>Rescan System $PATH</span>
        </button>
      </div>

      {/* Package Manager OS Selector for Missing Engines (P1 Fixed) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface-950/60 border border-surface-800">
        <div className="text-xs text-slate-300 font-medium">
          Choose your operating system for engine installation commands:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'debian', label: 'Ubuntu / Debian (apt)' },
            { id: 'fedora', label: 'Fedora / RHEL (dnf)' },
            { id: 'arch', label: 'Arch Linux (pacman)' },
            { id: 'mac', label: 'macOS (Homebrew)' },
            { id: 'windows', label: 'Windows (winget)' },
          ].map((os) => (
            <button
              key={os.id}
              onClick={() => setSelectedOs(os.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedOs === os.id
                  ? 'bg-brand-600 text-white font-semibold shadow-sm'
                  : 'bg-surface-800 text-slate-400 hover:text-white'
              }`}
            >
              {os.label}
            </button>
          ))}
        </div>
      </div>

      {/* Engines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {engines.map((engine) => {
          const installCmd = getPackageInstallCommand(engine.name, selectedOs);
          const isCopied = copiedEngine === engine.name;

          return (
            <div
              key={engine.name}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                engine.installed
                  ? 'bg-surface-900/40 border-surface-800 hover:border-surface-700 shadow-md'
                  : 'bg-surface-950/40 border-surface-900 opacity-80'
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
                      <span>Ready</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-800 text-rose-400 border border-rose-500/20">
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Not Found</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 font-mono text-xs text-slate-400">
                  <div>Version: <span className="text-slate-200 font-semibold">{engine.version || 'N/A'}</span></div>
                  <div className="truncate">Executable: <span className="text-slate-400 text-[11px]">{engine.path || 'In system $PATH'}</span></div>
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
                          {engine.capabilities.languages.length} OCR languages
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              {/* Install command helper for missing engines (P1 Fixed with 1-click copy) */}
              {!engine.installed && (
                <div className="mt-4 pt-3 border-t border-surface-900 space-y-1.5">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Install via Terminal</div>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface-950 border border-surface-800 text-[11px] font-mono">
                    <span className="truncate text-brand-300 select-all">{installCmd}</span>
                    <button
                      onClick={() => handleCopy(engine.name, installCmd)}
                      className="p-1 rounded-md bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-white shrink-0 cursor-pointer"
                      title="Copy terminal command"
                    >
                      {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
