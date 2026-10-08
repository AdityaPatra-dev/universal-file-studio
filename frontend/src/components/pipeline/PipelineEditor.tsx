import React, { useState, useEffect } from 'react';
import { 
  GitMerge, Play, Plus, Trash2, ArrowRight, Sparkles, 
  Layers, CheckCircle, RefreshCw, X, Sliders, FileText,
  ChevronUp, ChevronDown, BookOpen, Archive, Film, Shield,
  Music, Info, FolderArchive, ArrowDown
} from 'lucide-react';
import { Pipeline, FileRecord, Operation, OperationParam } from '../../types/api';
import { api } from '../../services/api';

interface PipelineEditorProps {
  files: FileRecord[];
  onJobStarted: () => void;
}

interface PipelineTemplate {
  name: string;
  description: string;
  badge: string;
  icon: string;
  steps: Array<{ operation: string; parameters: Record<string, any> }>;
}

const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    name: 'Comic / Manga: ZIP to WebP to PDF',
    description: 'Extract image archive, optimize all pages into WebP, and compile into a single ordered PDF book',
    badge: 'Manga / Comic',
    icon: '📚',
    steps: [
      { operation: 'archive_extract', parameters: {} },
      { operation: 'image_convert', parameters: { format: 'webp', quality: 85 } },
      { operation: 'images_to_pdf', parameters: { quality: 85, compress: 'jpeg' } }
    ]
  },
  {
    name: 'Archive to Single PDF Book',
    description: 'Extract scanned images or comic book from ZIP/CBZ and compile directly into PDF',
    badge: 'Direct PDF',
    icon: '📦',
    steps: [
      { operation: 'archive_to_pdf', parameters: { quality: 85, compress: 'jpeg' } }
    ]
  },
  {
    name: 'ZIP to WebP Compressed Archive',
    description: 'Extract image archive, compress all pages into modern WebP format, and repackage into ZIP',
    badge: 'Batch WebP',
    icon: '🗜️',
    steps: [
      { operation: 'archive_extract', parameters: {} },
      { operation: 'image_convert', parameters: { format: 'webp', quality: 80 } },
      { operation: 'archive_create', parameters: { format: 'zip' } }
    ]
  },
  {
    name: 'Image Sanitize & WebP',
    description: 'Scrub EXIF and GPS tags, then encode to modern WebP 80% format',
    badge: 'Sanitize Image',
    icon: '🛡️',
    steps: [
      { operation: 'strip_metadata', parameters: {} },
      { operation: 'image_convert', parameters: { format: 'webp', quality: 80 } }
    ]
  },
  {
    name: 'Video Privacy Clean & WebM',
    description: 'Strip camera/device metadata and transcode video to lightweight WebM format',
    badge: 'Web Video',
    icon: '🎬',
    steps: [
      { operation: 'strip_metadata', parameters: {} },
      { operation: 'video_convert', parameters: { format: 'webm', crf: 28 } }
    ]
  },
  {
    name: 'Video Audio Rip & Sanitize',
    description: 'Extract MP3 audio track from video and remove author tags',
    badge: 'Audio Rip',
    icon: '🎵',
    steps: [
      { operation: 'extract_audio', parameters: { format: 'mp3', bitrate: 192 } },
      { operation: 'strip_metadata', parameters: {} }
    ]
  }
];

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
    { operation: 'archive_extract', parameters: {} },
    { operation: 'image_convert', parameters: { format: 'webp', quality: 85 } },
    { operation: 'images_to_pdf', parameters: { quality: 85, compress: 'jpeg' } }
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

  const getOpDefaults = (opId: string): Record<string, any> => {
    const op = operations.find((o) => o.id === opId);
    const defaults: Record<string, any> = {};
    if (op?.parameters) {
      for (const p of op.parameters) {
        if (p.default !== undefined) {
          defaults[p.name] = p.default;
        } else if (p.type === 'select' && p.options && p.options.length > 0) {
          defaults[p.name] = p.options[0];
        } else if (p.type === 'number') {
          defaults[p.name] = p.min || 0;
        }
      }
    }
    // Hardcoded sensible defaults for key operations
    if (opId === 'image_convert' && !defaults.format) {
      defaults.format = 'webp';
      defaults.quality = 85;
    }
    if (opId === 'images_to_pdf') {
      defaults.quality = 85;
      defaults.compress = 'jpeg';
    }
    if (opId === 'archive_to_pdf') {
      defaults.quality = 85;
      defaults.compress = 'jpeg';
    }
    return defaults;
  };

  const handleAddStep = () => {
    const defaultOp = operations.length > 0 ? operations[0].id : 'image_convert';
    setNewSteps([...newSteps, { operation: defaultOp, parameters: getOpDefaults(defaultOp) }]);
  };

  const handleRemoveStep = (idx: number) => {
    setNewSteps(newSteps.filter((_, i) => i !== idx));
  };

  const handleMoveStep = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSteps.length) return;
    const updated = [...newSteps];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setNewSteps(updated);
  };

  const handleOperationChange = (idx: number, opId: string) => {
    const updated = [...newSteps];
    updated[idx] = {
      operation: opId,
      parameters: getOpDefaults(opId),
    };
    setNewSteps(updated);
  };

  const handleParameterChange = (stepIdx: number, paramName: string, value: any) => {
    const updated = [...newSteps];
    updated[stepIdx].parameters = {
      ...updated[stepIdx].parameters,
      [paramName]: value,
    };
    setNewSteps(updated);
  };

  const applyTemplate = (template: PipelineTemplate) => {
    setNewPipeName(template.name);
    setNewPipeDesc(template.description);
    setNewSteps(template.steps.map(s => ({ ...s, parameters: { ...s.parameters } })));
    setIsCreating(true);
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

  const selectedFile = files.find((f) => f.id === selectedFileId);

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
            Chain transformation operations in sequence. Unpack archives, process multi-file sets, and compile to final formats.
          </p>
        </div>

        <button
          onClick={() => {
            setNewPipeName('');
            setNewPipeDesc('');
            setNewSteps([
              { operation: 'archive_extract', parameters: {} },
              { operation: 'image_convert', parameters: { format: 'webp', quality: 85 } },
              { operation: 'images_to_pdf', parameters: { quality: 85, compress: 'jpeg' } }
            ]);
            setIsCreating(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-md shadow-brand-600/30"
        >
          <Plus className="h-4 w-4" />
          <span>New Pipeline</span>
        </button>
      </div>

      {/* Quick Templates Bar */}
      <div className="p-4 rounded-2xl bg-surface-900/60 border border-surface-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            Quick Pipeline Templates (1-Click Setup)
          </span>
          <span className="text-[10px] text-slate-500">Click any template to customize or run</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PIPELINE_TEMPLATES.map((tmpl, idx) => (
            <div
              key={idx}
              onClick={() => applyTemplate(tmpl)}
              className="p-3 rounded-xl bg-surface-950/70 border border-surface-800 hover:border-brand-500/50 hover:bg-surface-800/40 cursor-pointer transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-white group-hover:text-brand-300 transition-colors flex items-center gap-1.5">
                    <span>{tmpl.icon}</span>
                    <span>{tmpl.name}</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    {tmpl.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{tmpl.description}</p>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                {tmpl.steps.map((s, si) => (
                  <React.Fragment key={si}>
                    <span className="text-slate-300">{s.operation.replace(/_/g, ' ')}</span>
                    {si < tmpl.steps.length - 1 && <span className="text-slate-600">→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Grid: Pipelines List & Node Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pipeline Presets List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Available Pipelines ({pipelines.length})</span>
            <button 
              onClick={loadPipelines} 
              disabled={isLoading}
              className="text-slate-500 hover:text-slate-300 p-1"
              title="Refresh pipelines"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {pipelines.map((p) => {
              const isSelected = selectedPipeline?.id === p.id;
              const isMultiFile = p.steps.some(s => s.operation === 'archive_extract' || s.operation === 'images_to_pdf');
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
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-white">{p.name}</h4>
                        {isMultiFile && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                            Multi-File
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                    </div>
                    {p.id > 7 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePipeline(p.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Delete custom pipeline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-brand-400 font-semibold">
                      {p.steps.length} {p.steps.length === 1 ? 'Step' : 'Steps'}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {p.steps.map(s => s.operation.replace(/_/g, ' ')).join(' → ')}
                    </span>
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedPipeline.name}</h3>
                    {selectedPipeline.steps.some(s => s.operation === 'archive_extract' || s.operation === 'images_to_pdf') && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ⚡ Multi-File Batch Enabled
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-800 text-slate-400">
                    Pipeline #{selectedPipeline.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedPipeline.description}</p>
              </div>

              {/* Visual Node Flow */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Execution Flow Nodes ({selectedPipeline.steps.length} Steps)
                </label>

                <div className="space-y-3">
                  {selectedPipeline.steps.map((step, idx) => {
                    const hasParams = step.parameters && Object.keys(step.parameters).length > 0;
                    const isExtraction = step.operation === 'archive_extract';
                    const isMerge = step.operation === 'images_to_pdf' || step.operation === 'archive_to_pdf';

                    return (
                      <div key={idx} className="flex flex-col sm:flex-row items-center gap-3">
                        {/* Node Box */}
                        <div className="flex-1 w-full p-4 rounded-2xl bg-surface-950 border border-surface-800 hover:border-surface-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center space-x-3.5">
                            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-xs text-white capitalize flex items-center gap-2">
                                <span>{step.operation.replace(/_/g, ' ')}</span>
                                {isExtraction && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                    Extracts Multiple Files
                                  </span>
                                )}
                                {isMerge && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                                    Merges to Single PDF
                                  </span>
                                )}
                              </div>

                              {/* Formatted Parameter Badges */}
                              {hasParams ? (
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {Object.entries(step.parameters).map(([key, val]) => (
                                    <span
                                      key={key}
                                      className="px-2 py-0.5 rounded bg-surface-800 text-[10px] font-mono text-slate-300 border border-surface-700/50"
                                    >
                                      <span className="text-slate-500">{key}:</span> {String(val)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {isExtraction ? 'Extracts all images and files into working directory' : 'Default parameters'}
                                </div>
                              )}
                            </div>
                          </div>

                          <span className="self-end sm:self-auto px-2.5 py-1 rounded-md text-[10px] font-mono bg-surface-900 border border-surface-800 text-slate-400">
                            Stage {idx + 1} of {selectedPipeline.steps.length}
                          </span>
                        </div>

                        {/* Connector Arrow */}
                        {idx < selectedPipeline.steps.length - 1 && (
                          <div className="rotate-90 sm:rotate-0 text-slate-600 flex items-center justify-center">
                            <ArrowRight className="h-4 w-4 text-brand-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Execution Panel */}
              <div className="p-5 rounded-2xl bg-surface-950/80 border border-surface-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                    Select Input File to Run Pipeline
                  </label>
                  {selectedFile && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {(selectedFile.size_bytes / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedFileId || ''}
                      onChange={(e) => setSelectedFileId(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="">-- Choose file from library --</option>
                      {files.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.filename} [{f.category.toUpperCase()}]
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

                {/* Helpful contextual tip */}
                {selectedFile && (
                  <div className="p-2.5 rounded-xl bg-surface-900/60 border border-surface-800 flex items-center gap-2 text-[11px] text-slate-400">
                    <Info className="h-4 w-4 text-brand-400 shrink-0" />
                    {selectedFile.category === 'archive' && selectedPipeline.steps.some(s => s.operation === 'archive_extract') ? (
                      <span className="text-emerald-400">
                        Archive detected: All images will be extracted, batch-processed in order, and compiled.
                      </span>
                    ) : (
                      <span>
                        Intermediate files are isolated in a temporary directory and automatically cleaned after the final stage completes.
                      </span>
                    )}
                  </div>
                )}
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <GitMerge className="h-4 w-4 text-brand-400" />
                  Custom Pipeline Builder
                </h3>
                <p className="text-[11px] text-slate-400">Configure multi-stage chaining with fine-grained parameter controls</p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1.5 rounded-xl bg-surface-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
              {/* Quick Template Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Start from Template
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PIPELINE_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewPipeName(tmpl.name);
                        setNewPipeDesc(tmpl.description);
                        setNewSteps(tmpl.steps.map(s => ({ ...s, parameters: { ...s.parameters } })));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-surface-950 border border-surface-800 hover:border-brand-500/60 hover:text-white text-slate-400 text-[11px] font-medium transition-all flex items-center gap-1"
                    >
                      <span>{tmpl.icon}</span>
                      <span>{tmpl.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pipeline Name & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-200 font-semibold mb-1">Pipeline Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Manga ZIP to WebP PDF"
                    value={newPipeName}
                    onChange={(e) => setNewPipeName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-200 font-semibold mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Batch extracts and converts all pages"
                    value={newPipeDesc}
                    onChange={(e) => setNewPipeDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Step Sequence Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-brand-400" />
                    Pipeline Steps ({newSteps.length})
                  </label>
                  <button
                    onClick={handleAddStep}
                    className="px-2.5 py-1 rounded-lg bg-brand-600/20 text-brand-300 hover:bg-brand-600/30 text-xs flex items-center gap-1 font-semibold transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {newSteps.map((step, idx) => {
                    const currentOp = operations.find((o) => o.id === step.operation);
                    const isExtract = step.operation === 'archive_extract';
                    const isMerge = step.operation === 'images_to_pdf' || step.operation === 'archive_to_pdf';

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-surface-950 border border-surface-800 space-y-3 hover:border-surface-700 transition-colors"
                      >
                        {/* Step Header: Number, Op Dropdown, Reorder, Delete */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2.5 flex-1">
                            <span className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-300 font-mono text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <select
                              value={step.operation}
                              onChange={(e) => handleOperationChange(idx, e.target.value)}
                              className="px-3 py-1.5 rounded-xl bg-surface-900 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                            >
                              {operations.map((op) => (
                                <option key={op.id} value={op.id}>
                                  {op.name} ({op.engine})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleMoveStep(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded bg-surface-900 hover:bg-surface-800 text-slate-400 hover:text-white disabled:opacity-30"
                              title="Move step up"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveStep(idx, 'down')}
                              disabled={idx === newSteps.length - 1}
                              className="p-1 rounded bg-surface-900 hover:bg-surface-800 text-slate-400 hover:text-white disabled:opacity-30"
                              title="Move step down"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(idx)}
                              disabled={newSteps.length <= 1}
                              className="p-1 rounded bg-surface-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 disabled:opacity-30 transition-colors ml-1"
                              title="Remove step"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Multi-file Context Callouts */}
                        {isExtract && (
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
                            <span>📂</span>
                            <span>Unpacks ZIP/CBZ. Downstream image steps will automatically batch-process all extracted images in order.</span>
                          </div>
                        )}

                        {isMerge && (
                          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-2">
                            <span>📑</span>
                            <span>Compiles all extracted and processed images sequentially into a single consolidated PDF book.</span>
                          </div>
                        )}

                        {/* Step Parameter Controls */}
                        <div className="pt-1 border-t border-surface-900">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Sliders className="h-3 w-3 text-brand-400" />
                            Step Parameters
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {/* Format selector if applicable */}
                            {(step.operation.includes('convert') || step.operation === 'archive_create') && (
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Target Format</label>
                                <select
                                  value={step.parameters.format || (step.operation.includes('image') ? 'webp' : 'mp4')}
                                  onChange={(e) => handleParameterChange(idx, 'format', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-900 border border-surface-750 text-xs text-slate-200 focus:outline-none"
                                >
                                  {step.operation.includes('image') && (
                                    <>
                                      <option value="webp">WebP (Modern & Lightweight)</option>
                                      <option value="png">PNG (Lossless)</option>
                                      <option value="jpg">JPG (Standard)</option>
                                      <option value="avif">AVIF (Ultra Compressed)</option>
                                    </>
                                  )}
                                  {step.operation.includes('video') && (
                                    <>
                                      <option value="webm">WebM (VP9 + Opus)</option>
                                      <option value="mp4">MP4 (H.264 Universal)</option>
                                      <option value="mkv">MKV</option>
                                    </>
                                  )}
                                  {step.operation.includes('audio') && (
                                    <>
                                      <option value="mp3">MP3</option>
                                      <option value="aac">AAC</option>
                                      <option value="wav">WAV</option>
                                      <option value="flac">FLAC</option>
                                    </>
                                  )}
                                  {step.operation === 'archive_create' && (
                                    <>
                                      <option value="zip">ZIP</option>
                                      <option value="7z">7Z</option>
                                    </>
                                  )}
                                  {!step.operation.includes('image') && !step.operation.includes('video') && !step.operation.includes('audio') && step.operation !== 'archive_create' && (
                                    <>
                                      <option value="pdf">PDF</option>
                                      <option value="docx">DOCX</option>
                                      <option value="html">HTML</option>
                                      <option value="txt">TXT</option>
                                    </>
                                  )}
                                </select>
                              </div>
                            )}

                            {/* Quality Slider for Images / PDF */}
                            {(step.operation.includes('image') || step.operation.includes('pdf')) && step.operation !== 'archive_extract' && (
                              <div className="sm:col-span-2">
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                  <span>Compression Quality</span>
                                  <span className="font-mono text-brand-400 font-bold">
                                    {step.parameters.quality ?? 85}%
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="20"
                                  max="100"
                                  step="5"
                                  value={step.parameters.quality ?? 85}
                                  onChange={(e) => handleParameterChange(idx, 'quality', parseInt(e.target.value, 10))}
                                  className="w-full accent-brand-500 h-1.5 bg-surface-800 rounded-lg cursor-pointer"
                                />
                              </div>
                            )}

                            {/* PDF Compression algorithm */}
                            {(step.operation === 'images_to_pdf' || step.operation === 'archive_to_pdf') && (
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-1">PDF Engine Compression</label>
                                <select
                                  value={step.parameters.compress || 'jpeg'}
                                  onChange={(e) => handleParameterChange(idx, 'compress', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-900 border border-surface-750 text-xs text-slate-200 focus:outline-none"
                                >
                                  <option value="jpeg">JPEG (Fast, Optimized for Manga/Photos)</option>
                                  <option value="deflate">Deflate / ZIP (Lossless, Larger file)</option>
                                </select>
                              </div>
                            )}

                            {/* Video CRF for Video Convert */}
                            {step.operation.includes('video') && !step.operation.includes('extract_audio') && (
                              <div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                  <span>Encoding CRF</span>
                                  <span className="font-mono text-brand-400 font-bold">{step.parameters.crf ?? 28}</span>
                                </div>
                                <input
                                  type="range"
                                  min="18"
                                  max="35"
                                  value={step.parameters.crf ?? 28}
                                  onChange={(e) => handleParameterChange(idx, 'crf', parseInt(e.target.value, 10))}
                                  className="w-full accent-brand-500 h-1.5 bg-surface-800 rounded-lg cursor-pointer"
                                />
                              </div>
                            )}

                            {/* Audio Bitrate */}
                            {(step.operation === 'extract_audio' || step.operation === 'audio_convert') && (
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Audio Bitrate</label>
                                <select
                                  value={step.parameters.bitrate || 192}
                                  onChange={(e) => handleParameterChange(idx, 'bitrate', parseInt(e.target.value, 10))}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-900 border border-surface-750 text-xs text-slate-200 focus:outline-none"
                                >
                                  <option value={128}>128 kbps (Standard)</option>
                                  <option value={192}>192 kbps (High)</option>
                                  <option value={256}>256 kbps (Very High)</option>
                                  <option value={320}>320 kbps (Max Fidelity)</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-surface-800 bg-surface-950/60 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                {newSteps.length} {newSteps.length === 1 ? 'stage' : 'stages'} in sequence
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePipeline}
                  disabled={!newPipeName.trim() || newSteps.length === 0}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs disabled:opacity-50 transition-all shadow-md shadow-brand-600/30"
                >
                  Save & Use Pipeline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
