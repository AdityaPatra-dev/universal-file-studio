import React from 'react';
import { Sliders } from 'lucide-react';
import { Operation, OperationParam, OperationSpec } from '../../types/api';

interface StepParameterFormProps {
  operation?: Operation;
  spec?: OperationSpec;
  parameters: Record<string, any>;
  onChange: (paramName: string, value: any) => void;
}

export const StepParameterForm: React.FC<StepParameterFormProps> = ({
  operation,
  spec,
  parameters,
  onChange,
}) => {
  // Prefer params from spec or operation
  const params: OperationParam[] = spec?.parameters || operation?.parameters || [];

  if (params.length === 0) {
    return (
      <div className="text-[11px] text-slate-500 italic py-1">
        Standard operation settings (no manual parameters required)
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <Sliders className="h-3 w-3 text-brand-400" />
        <span>Step Parameters</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {params.map((p) => {
          const val = parameters[p.name] !== undefined ? parameters[p.name] : p.default;

          return (
            <div key={p.name} className={p.name === 'quality' || p.name === 'crf' ? 'sm:col-span-2' : ''}>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="capitalize">{p.name.replace(/_/g, ' ')}</span>
                {p.type === 'number' && (
                  <span className="font-mono text-brand-400 font-bold">
                    {val ?? p.default ?? ''}
                    {p.name === 'quality' ? '%' : ''}
                  </span>
                )}
              </div>

              {/* SELECT */}
              {p.type === 'select' && (
                <select
                  value={val ?? (p.options && p.options[0]) ?? ''}
                  onChange={(e) => onChange(p.name, e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-900 border border-surface-750 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                >
                  {p.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.toUpperCase()} {opt === 'webp' ? '(Modern Web)' : opt === 'jpeg' ? '(Photo/Comic)' : ''}
                    </option>
                  ))}
                </select>
              )}

              {/* NUMBER SLIDER */}
              {p.type === 'number' && p.min !== undefined && p.max !== undefined && (
                <div className="space-y-1">
                  <input
                    type="range"
                    min={p.min}
                    max={p.max}
                    step={p.name === 'crf' ? 1 : 5}
                    value={val ?? p.default ?? p.min}
                    onChange={(e) => onChange(p.name, parseInt(e.target.value, 10))}
                    className="w-full accent-brand-500 h-1.5 bg-surface-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>{p.min}</span>
                    <span>{p.max}</span>
                  </div>
                </div>
              )}

              {/* NUMBER INPUT (unbounded) */}
              {p.type === 'number' && (p.min === undefined || p.max === undefined) && (
                <input
                  type="number"
                  value={val ?? ''}
                  onChange={(e) => onChange(p.name, parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-900 border border-surface-750 text-xs text-slate-200 focus:outline-none"
                />
              )}

              {/* TEXT */}
              {p.type === 'text' && (
                <input
                  type="text"
                  value={val ?? ''}
                  placeholder={`Enter ${p.name}...`}
                  onChange={(e) => onChange(p.name, e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-900 border border-surface-750 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              )}

              {/* BOOLEAN */}
              {p.type === 'boolean' && (
                <button
                  type="button"
                  onClick={() => onChange(p.name, !val)}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    val
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'bg-surface-900 text-slate-400 border border-surface-750'
                  }`}
                >
                  {val ? 'Enabled' : 'Disabled'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

