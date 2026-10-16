import React, { useState, useEffect } from 'react';
import { Settings, Save, Check, RotateCcw, AlertCircle, Shield } from 'lucide-react';
import { AppSetting } from '../../types/api';
import { api } from '../../services/api';

interface SettingsViewProps {
  settings: AppSetting[];
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onRefresh }) => {
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value; });
    setLocalSettings(map);
  }, [settings]);

  // Check if any setting changed
  const hasChanges = settings.some(s => localSettings[s.key] !== s.value);

  const handleSaveAll = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Save all modified settings
      const modifiedKeys = settings.filter(s => localSettings[s.key] !== s.value);
      await Promise.all(modifiedKeys.map(s => api.updateSetting(s.key, localSettings[s.key])));
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      onRefresh();
    } catch (err: any) {
      setIsSaving(false);
      setError(err?.message || 'Failed to update settings');
    }
  };

  const handleReset = () => {
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value; });
    setLocalSettings(map);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-surface-900/40 border border-surface-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <Settings className="h-5 w-5 text-brand-400" />
              Application & Engine Settings
            </h2>
            <p className="text-xs text-slate-400">
              Fine-tune local concurrency workers, scratch disk cleanup, and security limits.
            </p>
          </div>

          {/* Global Save Toolbar (P1 Fixed: Replaced individual save buttons) */}
          <div className="flex items-center gap-2.5">
            {hasChanges && (
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-medium border border-surface-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Discard Changes</span>
              </button>
            )}

            <button
              onClick={handleSaveAll}
              disabled={!hasChanges || isSaving}
              className={`flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : hasChanges
                  ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/30'
                  : 'bg-surface-800 text-slate-500 opacity-60 cursor-not-allowed'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Changes Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : 'Save All Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3.5">
          {settings.map((item) => {
            const currentVal = localSettings[item.key] ?? item.value;
            const isBool = currentVal === 'true' || currentVal === 'false';
            const isNumeric = !isNaN(Number(currentVal)) && !isBool;
            const isModified = currentVal !== item.value;

            return (
              <div
                key={item.key}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isModified
                    ? 'bg-brand-500/5 border-brand-500/40 shadow-sm'
                    : 'bg-surface-950/60 border-surface-800'
                }`}
              >
                <div className="space-y-0.5 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{item.key}</span>
                    {isModified && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 font-semibold">
                        Modified
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">{item.description}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    Category: {item.category}
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  {/* Boolean Toggle Switch */}
                  {isBool ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          [item.key]: currentVal === 'true' ? 'false' : 'true',
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        currentVal === 'true' ? 'bg-brand-600' : 'bg-surface-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          currentVal === 'true' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  ) : isNumeric ? (
                    /* Numeric Input with bounds */
                    <input
                      type="number"
                      value={currentVal}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, [item.key]: e.target.value })
                      }
                      className="px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 w-full sm:w-36 font-mono font-medium"
                    />
                  ) : (
                    /* String/Text Input */
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, [item.key]: e.target.value })
                      }
                      className="px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 w-full sm:w-56 font-mono text-xs"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
