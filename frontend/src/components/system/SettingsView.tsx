import React, { useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';
import { AppSetting } from '../../types/api';
import { api } from '../../services/api';

interface SettingsViewProps {
  settings: AppSetting[];
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onRefresh }) => {
  const [localSettings, setLocalSettings] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value; });
    return map;
  });
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const handleSave = async (key: string) => {
    try {
      await api.updateSetting(key, localSettings[key]);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
      onRefresh();
    } catch (err) {
      alert('Failed to update setting');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-surface-900/40 border border-surface-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-brand-400" />
          Application Configuration
        </h2>
        <p className="text-xs text-slate-400">Fine-tune performance, concurrency limits, and studio parameters.</p>

        <div className="mt-6 space-y-4">
          {settings.map((item) => (
            <div
              key={item.key}
              className="p-4 rounded-2xl bg-surface-950/60 border border-surface-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-0.5 max-w-md">
                <div className="text-xs font-bold text-white font-mono">{item.key}</div>
                <div className="text-xs text-slate-400">{item.description}</div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Category: {item.category}</div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={localSettings[item.key] ?? item.value}
                  onChange={(e) => setLocalSettings({ ...localSettings, [item.key]: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 w-full sm:w-48 font-mono"
                />
                <button
                  onClick={() => handleSave(item.key)}
                  className={`p-2 rounded-xl font-medium text-xs transition-all shrink-0 flex items-center gap-1 ${
                    savedKey === item.key
                      ? 'bg-emerald-600 text-white'
                      : 'bg-brand-600 hover:bg-brand-500 text-white'
                  }`}
                  title="Save setting"
                >
                  {savedKey === item.key ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

