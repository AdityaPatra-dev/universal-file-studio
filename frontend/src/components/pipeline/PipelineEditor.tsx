import React, { useState, useEffect } from 'react';
import { 
  GitMerge, Play, Plus, Trash2, ArrowRight, Sparkles, 
  Layers, CheckCircle, RefreshCw, X, Sliders, FileText 
} from 'lucide-react';
import { Pipeline, FileRecord, Operation } from '../../types/api';
import { api } from '../../services/api';

interface PipelineEditorProps {
  files: FileRecord[];
  onJobStarted: () => void;
}

export const PipelineEditor: React.FC<PipelineEditorProps> = ({
  files,
  onJobStarted,
}) => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Pipeline Modal
  const [isCreating, setIsCreating] = useState(false);
  const [newPipeName, setNewPipeName] = useState('');
  const [newPipeDesc, setNewPipeDesc] = useState('');
  const [newSteps, setNewSteps] = useState<Array<{ operation: string; parameters: Record<string, any> }>>([
    { operation: 'strip_metadata', parameters: {} },
    { operation: 'image_convert', parameters: { format: 'webp' } }
  ]);

  const loadPipelines = async () => {
    setIsLoading(true);
    try {
      const [pipeList, opList] = await Promise.all([
        api.listPipelines(),
        api.listOperations(),
      ]);
      setPipelines(pipeList);
      setOperations(opList);
      if (pipeList.length > 0 && !selectedPipeline) {
        setSelectedPipeline(pipeList[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load pipelines');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPipelines();
  }, []);

  const handleExecute = async () => {
    if (!selectedPipeline || !selectedFileId) return;
    setIsExecuting(true);
    setError(null);
    try {
      await api.executePipeline(selectedPipeline.id, selectedFileId);
      setIsExecuting(false);
      onJobStarted();
    } catch (err: any) {
      setIsExecuting(false);
      setError(err?.message || 'Pipeline execution failed');
    }
  };

  const handleAddStep = () => {
    setNewSteps([...newSteps, { operation: 'strip_metadata', parameters: {} }]);
  };

  const handleRemoveStep = (idx: number) => {
    setNewSteps(newSteps.filter((_, i) => i !== idx));
  };

  const handleCreatePipeline = async () => {
    if (!newPipeName.trim() || newSteps.length === 0) return;
    try {
      const created = await api.createPipeline({
        name: newPipeName,
        description: newPipeDesc,
        steps: newSteps,
      });
      setPipelines([...pipelines, created]);
      setSelectedPipeline(created);
      setIsCreating(false);
      setNewPipeName('');
      setNewPipeDesc('');
    } catch (err: any) {
      alert(`Failed to create pipeline: ${err.message}`);
    }
  };

  const handleDeletePipeline = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pipeline?')) return;
    try {
      await api.deletePipeline(id);
      setPipelines(pipelines.filter((p) => p.id !== id));
      if (selectedPipeline?.id === id) {
        setSelectedPipeline(pipelines.find((p) => p.id !== id) || null);
      }
    } catch (err: any) {
      alert(`Failed to delete pipeline: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-brand-400" />
            Multi-Stage Pipeline Studio
          </h2>
          <p className="text-xs text-slate-400">
            Chain transformation operations in sequence. Intermediate outputs automatically feed downstream steps.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-md shadow-brand-600/30"
        >
          <Plus className="h-4 w-4" />
          <span>New Pipeline</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Grid: Pipelines List & Node Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pipeline Presets List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Available Pipelines ({pipelines.length})
          </div>

          <div className="space-y-2">
            {pipelines.map((p) => {
              const isSelected = selectedPipeline?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPipeline(p)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                      : 'border-surface-800 bg-surface-900/40 hover:bg-surface-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{p.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                    </div>
                    {p.id > 4 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePipeline(p.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete custom pipeline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-brand-400 font-semibold">
                    <span>{p.steps.length} {p.steps.length === 1 ? 'Step' : 'Steps'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Pipeline Node Visual Flow & Execution */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPipeline ? (
            <div className="p-6 rounded-3xl bg-surface-900/60 border border-surface-800 space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{selectedPipeline.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-800 text-slate-400">
                    ID #{selectedPipeline.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedPipeline.description}</p>
              </div>

              {/* Visual Node Flow */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Execution Flow Nodes
                </label>

                <div className="space-y-3">
                  {selectedPipeline.steps.map((step, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-3">
                      {/* Node Box */}
                      <div className="flex-1 w-full p-4 rounded-2xl bg-surface-950 border border-surface-800 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-7 h-7 rounded-xl bg-brand-500/20 text-brand-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-white capitalize">
                              {step.operation.replace(/_/g, ' ')}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                              {JSON.stringify(step.parameters)}
                            </div>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface-800 text-slate-400">
                          Step {idx + 1}
                        </span>
                      </div>

                      {/* Connector Arrow */}
                      {idx < selectedPipeline.steps.length - 1 && (
                        <div className="rotate-90 sm:rotate-0 text-slate-600">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Panel */}
              <div className="p-5 rounded-2xl bg-surface-950/80 border border-surface-800 space-y-4">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                  Select File to Run Pipeline
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedFileId || ''}
                      onChange={(e) => setSelectedFileId(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="">-- Choose input file from library --</option>
                      {files.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.filename} ({f.category.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleExecute}
                    disabled={!selectedFileId || isExecuting}
                    className="flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-600/30 hover:shadow-brand-500/40 disabled:opacity-50"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>{isExecuting ? 'Starting Pipeline...' : 'Run Pipeline'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-surface-900/40 border border-surface-800 text-slate-400 text-xs">
              Select a pipeline on the left or create a new one to inspect its flow.
            </div>
          )}
        </div>
      </div>

      {/* New Pipeline Builder Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-surface-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-brand-400" />
                Create Multi-Stage Pipeline
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1.5 rounded-xl bg-surface-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
              <div>
                <label className="block text-slate-200 font-semibold mb-1">Pipeline Name</label>
                <input
                  type="text"
                  placeholder="e.g. Clean & Convert Image"
                  value={newPipeName}
                  onChange={(e) => setNewPipeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Strips personal tags and compresses to WebP"
                  value={newPipeDesc}
                  onChange={(e) => setNewPipeDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                    Pipeline Steps ({newSteps.length})
                  </label>
                  <button
                    onClick={handleAddStep}
                    className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {newSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-surface-950 border border-surface-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-lg bg-surface-800 text-slate-300 font-mono text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <select
                          value={step.operation}
                          onChange={(e) => {
                            const updated = [...newSteps];
                            updated[idx].operation = e.target.value;
                            setNewSteps(updated);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none"
                        >
                          {operations.map((op) => (
                            <option key={op.id} value={op.id}>
                              {op.name} ({op.engine})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleRemoveStep(idx)}
                        disabled={newSteps.length <= 1}
                        className="text-slate-500 hover:text-rose-400 p-1 disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-surface-800 bg-surface-950/60 flex items-center justify-end space-x-3">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePipeline}
                disabled={!newPipeName.trim() || newSteps.length === 0}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs disabled:opacity-50"
              >
                Save Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
