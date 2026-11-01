import React, { useState } from 'react';
import { X, Sparkles, Download, CheckCircle2, ArrowRight, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { UpdateInfo, updaterService } from '../../services/updater';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
  onRefresh: () => Promise<void>;
  isChecking: boolean;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  onRefresh,
  isChecking,
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstall = async () => {
    if (!updateInfo?.downloadUrl) return;
    setIsInstalling(true);
    setInstallError(null);
    try {
      await updaterService.installUpdate(updateInfo.downloadUrl);
    } catch (err: any) {
      setInstallError(err.message || 'Failed to start installation');
      setIsInstalling(false);
    }
  };

  const hasUpdate = updateInfo?.hasUpdate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-surface-950 border border-surface-750/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-surface-800/80 bg-surface-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl ${hasUpdate ? 'bg-gradient-to-br from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/30' : 'bg-surface-800 text-slate-300'}`}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Software Updates</h3>
              <p className="text-xs text-slate-400">Current version: v{updateInfo?.currentVersion || '1.0.0'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-colors btn-press"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {hasUpdate ? (
            <>
              {/* Update Banner */}
              <div className="p-4 rounded-2xl bg-brand-950/60 border border-brand-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    New Update Available
                  </span>
                  <span className="text-xs font-mono font-semibold text-brand-400">
                    v{updateInfo.latestVersion}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A newer version of Universal File Studio is ready for download.
                </p>
              </div>

              {/* Release Notes */}
              {updateInfo.releaseNotes && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">What's New</label>
                  <div className="p-3.5 rounded-xl bg-surface-900/80 border border-surface-800 text-xs text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {updateInfo.releaseNotes}
                  </div>
                </div>
              )}

              {/* Seamless Install Notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Seamless Update:</strong> The update installs directly over your current app with verified signing. Your files and settings are safely preserved.
                </span>
              </div>

              {installError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{installError}</span>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">You're up to date!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Universal File Studio v{updateInfo?.currentVersion || '1.0.0'} is the latest version available.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-surface-800/80 bg-surface-900/40 flex items-center justify-between gap-3">
          <button
            onClick={onRefresh}
            disabled={isChecking || isInstalling}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-surface-900 border border-surface-750/70 hover:bg-surface-800 transition-all btn-press disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Check Again'}</span>
          </button>

          {hasUpdate ? (
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/25 transition-all btn-press disabled:opacity-50"
            >
              {isInstalling ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Starting Install...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download & Install</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-surface-900 border border-surface-750/70 transition-all btn-press"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

