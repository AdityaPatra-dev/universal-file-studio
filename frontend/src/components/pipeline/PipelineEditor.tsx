import React, { useState, useEffect, useRef } from 'react';
import { 
  GitMerge, Play, Plus, Trash2, ArrowRight, Sparkles, 
  Layers, CheckCircle, RefreshCw, X, Sliders, FileText,
  ChevronUp, ChevronDown, BookOpen, Archive, Film, Shield,
  Music, Info, FolderArchive, Download, Upload, AlertTriangle,
  Check, CheckSquare, Square, Search, Edit3
} from 'lucide-react';
import { Pipeline, FileRecord, Operation, OperationSpec, PipelineValidationIssue } from '../../types/api';
import { api } from '../../services/api';
import { StepParameterForm } from './StepParameterForm';

interface PipelineEditorProps {
  files: FileRecord[];
  onJobStarted: () => void;
  preSelectedFileIds?: number[];
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
    name: 'Merge Multiple PDFs into One',
    description: 'Concatenate multiple PDF documents into a single consolidated PDF file',
    badge: 'Merge PDF',
    icon: '📑',
    steps: [
      { operation: 'pdf_merge', parameters: {} }
    ]
  },
  {
    name: 'Video Audio Rip & Sanitize',
    description: 'Extract MP3 audio track from video and remove author tags',
    badge: 'Audio Rip',
    icon: '🎵',
    steps: [
      { operation: 'extract_audio', parameters: { format: 'mp3', bitrate: '192' } },
      { operation: 'strip_metadata', parameters: {} }
    ]
  }
];

export const PipelineEditor: React.FC<PipelineEditorProps> = ({
  files,
  onJobStarted,
  preSelectedFileIds = [],
}) => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [specs, setSpecs] = useState<Record<string, OperationSpec>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  
  // Execution file selection (multi-select supported)
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>(preSelectedFileIds);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [fileCategoryFilter, setFileCategoryFilter] = useState('all');

  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Pipeline Modal
  const [isCreating, setIsCreating] = useState(false);
  const [newPipeName, setNewPipeName] = useState('');
  const [newPipeDesc, setNewPipeDesc] = useState('');
  const [newSteps, setNewSteps] = useState<Array<{ operation: string; parameters: Record<string, any> }>>([
    { operation: 'archive_extract', parameters: {} },
    { operation: 'image_convert', parameters: { format: 'webp', quality: 85 } },
    { operation: 'images_to_pdf', parameters: { quality: 85, compress: 'jpeg' } }
  ]);
  const [validationIssues, setValidationIssues] = useState<PipelineValidationIssue[]>([]);
  const [confirmDeletePipe, setConfirmDeletePipe] = useState<Pipeline | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPipelinesAndSpecs = async () => {
    setIsLoading(true);
    try {
      const [pipeList, opList, specMap] = await Promise.all([
        api.listPipelines(),
        api.listOperations(),
        api.getOperationSpecs().catch(() => ({} as Record<string, OperationSpec>)),
      ]);
      setPipelines(pipeList);
      setOperations(opList);
      setSpecs(specMap);
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
    loadPipelinesAndSpecs();
  }, []);

  useEffect(() => {
    if (preSelectedFileIds.length > 0) {
      setSelectedFileIds(preSelectedFileIds);
    }
  }, [preSelectedFileIds]);

  // Validate pipeline steps whenever steps change in create modal
  useEffect(() => {
    if (!isCreating || newSteps.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        const res = await api.validatePipeline({
          name: newPipeName || 'Draft',
          description: newPipeDesc,
          steps: newSteps,
        });
        setValidationIssues(res.issues || []);
      } catch (e) {
        // Soft fail
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newSteps, isCreating, newPipeName, newPipeDesc]);

  const toggleFileSelection = (id: number) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiles = () => {
    const visibleIds = filteredFilesForExecution.map(f => f.id);
    const allVisibleSelected = visibleIds.every(id => selectedFileIds.includes(id));

    if (allVisibleSelected) {
      setSelectedFileIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedFileIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleExecute = async () => {
    if (!selectedPipeline || selectedFileIds.length === 0) return;
    setIsExecuting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (selectedFileIds.length === 1) {
        await api.executePipeline(selectedPipeline.id, selectedFileIds[0]);
      } else {
        await api.batchExecutePipeline(selectedPipeline.id, selectedFileIds, 'skip');
      }

      setIsExecuting(false);
      setSuccessMsg(`Enqueued ${selectedFileIds.length} file(s) for pipeline "${selectedPipeline.name}"`);
      onJobStarted();
    } catch (err: any) {
      setIsExecuting(false);
      setError(err?.message || 'Pipeline execution failed');
    }
  };

  const getOpDefaults = (opId: string): Record<string, any> => {
    const spec = specs[opId];
    const op = operations.find((o) => o.id === opId);
    const params = spec?.parameters || op?.parameters || [];
    const defaults: Record<string, any> = {};

    for (const p of params) {
      if (p.default !== undefined) {
        defaults[p.name] = p.default;
      } else if (p.type === 'select' && p.options && p.options.length > 0) {
        defaults[p.name] = p.options[0];
      } else if (p.type === 'number') {
        defaults[p.name] = p.min ?? 0;
      }
    }

    if (opId === 'image_convert' && !defaults.format) {
      defaults.format = 'webp';
      defaults.quality = 85;
    }
    if (opId === 'images_to_pdf' || opId === 'archive_to_pdf') {
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

  // 1-Click Template activation (P1 Fixed: Selects/loads directly in view without forcing editor modal)
  const applyTemplate = async (template: PipelineTemplate) => {
    const existing = pipelines.find(p => p.name.toLowerCase() === template.name.toLowerCase());
    if (existing) {
      setSelectedPipeline(existing);
      setSuccessMsg(`Loaded preset: "${existing.name}". Select input files below and run!`);
      return;
    }

    // Otherwise create it and select it
    try {
      const created = await api.createPipeline({
        name: template.name,
        description: template.description,
        steps: template.steps,
      });
      setPipelines(prev => [...prev, created]);
      setSelectedPipeline(created);
      setSuccessMsg(`Loaded preset: "${created.name}". Ready for execution!`);
    } catch (err) {
      // Fallback: open builder
      setNewPipeName(template.name);
      setNewPipeDesc(template.description);
      setNewSteps(template.steps.map(s => ({ ...s, parameters: { ...s.parameters } })));
      setIsCreating(true);
    }
  };

  const openEditPipelineModal = (p: Pipeline) => {
    setNewPipeName(p.name);
    setNewPipeDesc(p.description);
    setNewSteps(p.steps.map(s => ({ ...s, parameters: { ...s.parameters } })));
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
      setSuccessMsg(`Pipeline "${created.name}" saved successfully!`);
    } catch (err: any) {
      alert(`Failed to create pipeline: ${err.message}`);
    }
  };

  const handleDeletePipeline = async (id: number) => {
    try {
      await api.deletePipeline(id);
      setPipelines(pipelines.filter((p) => p.id !== id));
      if (selectedPipeline?.id === id) {
        setSelectedPipeline(pipelines.find((p) => p.id !== id) || null);
      }
      setConfirmDeletePipe(null);
      setSuccessMsg('Pipeline deleted.');
    } catch (err: any) {
      alert(`Failed to delete pipeline: ${err.message}`);
    }
  };

  const handleExportJson = async (p: Pipeline) => {
    try {
      const data = await api.exportPipeline(p.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${p.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_pipeline.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    }
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.name || !Array.isArray(json.steps)) {
          throw new Error('Invalid pipeline JSON format. Must contain "name" and "steps" array.');
        }
        const imported = await api.importPipeline({
          name: json.name,
          description: json.description || '',
          steps: json.steps,
        });
        setPipelines([...pipelines, imported]);
        setSelectedPipeline(imported);
        setSuccessMsg(`Successfully imported pipeline: "${imported.name}"`);
      } catch (err: any) {
        alert(`Failed to import pipeline: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtered files for pipeline execution
  const filteredFilesForExecution = files.filter(f => {
    const matchesSearch = f.filename.toLowerCase().includes(fileSearchQuery.toLowerCase());
    const matchesCat = fileCategoryFilter === 'all' || f.category === fileCategoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Hidden File Input for JSON Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJsonFile}
        accept=".json"
        className="hidden"
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-brand-400" />
            Universal Multi-Stage Pipeline Studio
          </h2>
          <p className="text-xs text-slate-400">
            Chain transformation operations in sequence. Unpack archives, process multi-file sets, batch-convert any media, and compile.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 font-medium text-xs transition-colors border border-surface-700 cursor-pointer"
            title="Import Pipeline from JSON"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import JSON</span>
          </button>

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
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-md shadow-brand-600/30 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Custom Pipeline</span>
          </button>
        </div>
      </div>

      {/* Quick Templates Bar */}
      <div className="p-4 rounded-3xl bg-surface-900/60 border border-surface-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            1-Click Workflow Recipes
          </span>
          <span className="text-[10px] text-slate-500">Click any preset to select & run immediately</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {PIPELINE_TEMPLATES.map((tmpl, idx) => (
            <div
              key={idx}
              onClick={() => applyTemplate(tmpl)}
              className="p-3 rounded-2xl bg-surface-950/70 border border-surface-800 hover:border-brand-500/50 hover:bg-surface-800/40 cursor-pointer transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-white group-hover:text-brand-300 transition-colors flex items-center gap-1.5">
                    <span>{tmpl.icon}</span>
                    <span className="line-clamp-1">{tmpl.name}</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 shrink-0">
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
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white cursor-pointer">
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
              onClick={loadPipelinesAndSpecs} 
              disabled={isLoading}
              className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
              title="Refresh pipelines"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {pipelines.map((p) => {
              const isSelected = selectedPipeline?.id === p.id;
              const isMultiFile = p.steps.some(s => s.operation === 'archive_extract' || s.operation === 'images_to_pdf' || s.operation === 'pdf_merge' || s.operation === 'video_concat');
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

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportJson(p);
                        }}
                        className="text-slate-500 hover:text-brand-300 p-1 transition-colors cursor-pointer"
                        title="Export JSON"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditPipelineModal(p);
                        }}
                        className="text-slate-500 hover:text-white p-1 transition-colors cursor-pointer"
                        title="Edit pipeline steps"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      {p.id > 7 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeletePipe(p);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title="Delete custom pipeline"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-brand-400 font-semibold">
                      {p.steps.length} {p.steps.length === 1 ? 'Step' : 'Steps'}
                    </span>
                    <span className="text-slate-500 text-[10px] line-clamp-1 max-w-[200px]">
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
                    {selectedPipeline.steps.some(s => s.operation === 'archive_extract' || s.operation === 'images_to_pdf' || s.operation === 'pdf_merge') && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ⚡ Batch Capable
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditPipelineModal(selectedPipeline)}
                      className="px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors border border-surface-700 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit Steps</span>
                    </button>
                    <button
                      onClick={() => handleExportJson(selectedPipeline)}
                      className="px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors border border-surface-700 cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export</span>
                    </button>
                  </div>
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
                    const isMerge = ['images_to_pdf', 'archive_to_pdf', 'pdf_merge', 'video_concat', 'audio_merge'].includes(step.operation);

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
                                    Extracts Directory
                                  </span>
                                )}
                                {isMerge && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                                    Consolidates to File
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
                                  {isExtraction ? 'Extracts all contents into isolated working directory' : 'Default parameters'}
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

              {/* Execution Panel with Filterable Multi-File Selection (P2 Fixed) */}
              <div className="p-5 rounded-2xl bg-surface-950/80 border border-surface-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                    Select Input File(s) for Execution
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiles}
                      className="text-[11px] text-brand-400 hover:text-brand-300 font-medium transition-colors cursor-pointer"
                    >
                      {selectedFileIds.length === files.length && files.length > 0 ? 'Deselect All' : 'Select All Filtered'}
                    </button>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-800 text-slate-300">
                      {selectedFileIds.length} Selected
                    </span>
                  </div>
                </div>

                {/* Search & Filter Toolbar for Files Checklist */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter files by name..."
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-surface-900 border border-surface-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <select
                    value={fileCategoryFilter}
                    onChange={(e) => setFileCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-surface-900 border border-surface-800 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="audio">Audio</option>
                    <option value="pdf">PDFs</option>
                    <option value="document">Documents</option>
                    <option value="archive">Archives</option>
                  </select>
                </div>

                {/* Multi-Select Files List */}
                <div className="max-h-52 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-surface-900/60 border border-surface-800">
                  {filteredFilesForExecution.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs">
                      {files.length === 0
                        ? 'No files uploaded yet. Drag files into library to process.'
                        : 'No files match the search/category filter.'}
                    </div>
                  ) : (
                    filteredFilesForExecution.map((f) => {
                      const isChecked = selectedFileIds.includes(f.id);
                      return (
                        <div
                          key={f.id}
                          onClick={() => toggleFileSelection(f.id)}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-brand-500/10 border border-brand-500/30'
                              : 'bg-surface-950/70 border border-surface-800 hover:border-surface-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {isChecked ? (
                              <CheckSquare className="h-4 w-4 text-brand-400 shrink-0" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-500 shrink-0" />
                            )}
                            <span className="text-xs text-white truncate font-medium">{f.filename}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 shrink-0">
                            <span className="px-1.5 py-0.5 rounded bg-surface-800 text-slate-400 uppercase">
                              {f.category}
                            </span>
                            <span>{(f.size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Execution Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] text-slate-400">
                    {selectedFileIds.length > 1
                      ? `Batch Mode: Will trigger ${selectedFileIds.length} parallel pipeline jobs.`
                      : selectedFileIds.length === 1
                      ? 'Single Run: Executes sequential chain with isolated scratch buffers.'
                      : 'Please select at least one file above to run this pipeline.'}
                  </div>

                  <button
                    onClick={handleExecute}
                    disabled={selectedFileIds.length === 0 || isExecuting}
                    className="flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-600/30 hover:shadow-brand-500/40 disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>
                      {isExecuting
                        ? 'Starting Pipeline...'
                        : selectedFileIds.length > 1
                        ? `Run Batch Pipeline (${selectedFileIds.length} Files)`
                        : 'Run Pipeline'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-surface-900/40 border border-surface-800 text-slate-400 text-xs">
              Select a pipeline on the left or click a template recipe above to inspect its execution nodes.
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
                className="p-1.5 rounded-xl bg-surface-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                      className="px-2.5 py-1 rounded-lg bg-surface-950 border border-surface-800 hover:border-brand-500/60 hover:text-white text-slate-400 text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
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

              {/* Validation Issues Banner */}
              {validationIssues.length > 0 && (
                <div className="p-3 rounded-2xl bg-surface-950 border border-surface-800 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Pipeline Chain Validation Analysis</span>
                  </div>
                  {validationIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`text-[11px] p-2 rounded-xl flex items-start gap-2 ${
                        issue.severity === 'error'
                          ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                      }`}
                    >
                      <span>{issue.severity === 'error' ? '❌' : '⚠️'}</span>
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Step Sequence Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-brand-400" />
                    Pipeline Steps ({newSteps.length})
                  </label>
                  <button
                    onClick={handleAddStep}
                    className="px-2.5 py-1 rounded-lg bg-brand-600/20 text-brand-300 hover:bg-brand-600/30 text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {newSteps.map((step, idx) => {
                    const currentOp = operations.find((o) => o.id === step.operation);
                    const currentSpec = specs[step.operation];

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-surface-950 border border-surface-800 space-y-3 hover:border-surface-700 transition-colors"
                      >
                        {/* Step Header */}
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
                              className="p-1 rounded bg-surface-900 hover:bg-surface-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="Move step up"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveStep(idx, 'down')}
                              disabled={idx === newSteps.length - 1}
                              className="p-1 rounded bg-surface-900 hover:bg-surface-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="Move step down"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(idx)}
                              disabled={newSteps.length <= 1}
                              className="p-1 rounded bg-surface-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 disabled:opacity-30 transition-colors ml-1 cursor-pointer"
                              title="Remove step"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Dynamic Step Parameter Form */}
                        <StepParameterForm
                          operation={currentOp}
                          spec={currentSpec}
                          parameters={step.parameters}
                          onChange={(paramName, value) => handleParameterChange(idx, paramName, value)}
                        />
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
                  className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePipeline}
                  disabled={!newPipeName.trim() || newSteps.length === 0}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs disabled:opacity-50 transition-all shadow-md shadow-brand-600/30 cursor-pointer"
                >
                  Save & Use Pipeline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Pipeline Confirmation Modal */}
      {confirmDeletePipe && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Delete Custom Pipeline?</h4>
                <p className="text-xs text-slate-400 truncate max-w-[260px]">{confirmDeletePipe.name}</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this custom pipeline recipe? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmDeletePipe(null)}
                className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePipeline(confirmDeletePipe.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                Delete Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
