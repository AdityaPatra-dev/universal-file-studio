import React, { useState, useEffect, useRef } from 'react';
import { 
  GitMerge, Play, Plus, Trash2, ArrowRight, Sparkles, 
  Layers, CheckCircle, RefreshCw, X, Sliders, FileText,
  ChevronUp, ChevronDown, BookOpen, Archive, Film, Shield,
  Music, Info, FolderArchive, Download, Upload, AlertTriangle,
  Check, CheckSquare, Square, Search, Edit3, Image as ImageIcon,
  FileCheck, Wand2, ArrowDown
} from 'lucide-react';
import { Pipeline, FileRecord, Operation, OperationSpec, PipelineValidationIssue } from '../../types/api';
import { universalEngine } from '../../services/universalEngine';
import { findToolById, ALL_STUDIO_TOOLS } from '../../data/catalog';

interface PipelineEditorProps {
  files: FileRecord[];
  onJobStarted: () => void;
  preSelectedFileIds?: number[];
}

export interface StepCompatibilityIssue {
  stepIndex?: number;
  severity: 'error' | 'warning';
  title: string;
  description: string;
  suggestion?: string;
}

export interface StepCompatibilityReport {
  isValid: boolean;
  hasWarnings: boolean;
  issues: StepCompatibilityIssue[];
}

export function validatePipelineCompatibility(
  steps: Array<{ name: string; operation: string; parameters?: Record<string, any> }>,
  selectedFiles: FileRecord[]
): StepCompatibilityReport {
  const issues: StepCompatibilityIssue[] = [];

  if (steps.length === 0) {
    return {
      isValid: false,
      hasWarnings: false,
      issues: [{ severity: 'error', title: 'Empty Pipeline', description: 'Add at least one action step to run this workflow.' }]
    };
  }

  // 1. Validate Input Files with Step 1
  const step1 = steps[0];
  const tool1 = findToolById(step1.operation);
  if (tool1 && selectedFiles.length > 0) {
    const supportedExts = new Set(tool1.inputFormats.map(f => f.toLowerCase().replace(/^\./, '')));
    for (const f of selectedFiles) {
      const ext = (f.filename.split('.').pop() || '').toLowerCase();
      if (!supportedExts.has(ext) && !supportedExts.has('*') && !supportedExts.has('all')) {
        issues.push({
          stepIndex: 0,
          severity: 'warning',
          title: `Incompatible Input File: ${f.filename}`,
          description: `Step 1 ("${step1.name}") expects [${tool1.inputFormats.join(', ')}] formats, but "${f.filename}" is .${ext}.`,
          suggestion: `Select compatible ${tool1.category} files or add a conversion step first.`
        });
      }
    }
  }

  // 2. Validate Step-to-Step Sequential Compatibility
  for (let i = 0; i < steps.length - 1; i++) {
    const curStep = steps[i];
    const nextStep = steps[i + 1];
    const curTool = findToolById(curStep.operation);
    const nextTool = findToolById(nextStep.operation);

    if (curTool && nextTool) {
      const curOutputs = new Set(curTool.outputFormats.map(f => f.toLowerCase().replace(/^\./, '')));
      const nextInputs = new Set(nextTool.inputFormats.map(f => f.toLowerCase().replace(/^\./, '')));

      const hasCommon = Array.from(curOutputs).some(o => nextInputs.has(o) || nextInputs.has('*') || nextInputs.has('all'));
      const isBothGeneralArchive = curTool.category === 'archive' || nextTool.category === 'archive';

      if (!hasCommon && !isBothGeneralArchive) {
        issues.push({
          stepIndex: i + 1,
          severity: 'error',
          title: `Incompatible Step Sequence (${i + 1} ➔ ${i + 2})`,
          description: `Step ${i + 1} ("${curStep.name}") outputs [${curTool.outputFormats.join(', ')}], which cannot be consumed by Step ${i + 2} ("${nextStep.name}") expecting [${nextTool.inputFormats.join(', ')}].`,
          suggestion: `Add an intermediate converter step between Step ${i + 1} and Step ${i + 2}.`
        });
      }
    }
  }

  const hasErrors = issues.some(i => i.severity === 'error');
  const hasWarnings = issues.some(i => i.severity === 'warning');

  return {
    isValid: !hasErrors,
    hasWarnings,
    issues
  };
}

export type CategoryFilter = 'all' | 'photo' | 'video' | 'doc' | 'archive';

interface FriendlyRecipe {
  id: string;
  name: string;
  category: 'photo' | 'video' | 'doc' | 'archive';
  categoryLabel: string;
  description: string;
  icon: any;
  color: string;
  badge: string;
  steps: Array<{ name: string; operation: string; parameters: Record<string, any> }>;
}

const FRIENDLY_RECIPES: FriendlyRecipe[] = [
  {
    id: 'photos_to_pdf',
    name: 'Combine Photos into PDF Document',
    category: 'doc',
    categoryLabel: 'Document & PDF',
    description: 'Merge multiple pictures or photo scans into a clean, readable PDF book.',
    icon: BookOpen,
    color: 'from-amber-500 to-orange-600',
    badge: 'Popular',
    steps: [
      { name: 'Convert Photos to PDF', operation: 'images_to_pdf', parameters: { quality: 85 } }
    ]
  },
  {
    id: 'zip_files',
    name: 'Zip Selected Files into Archive',
    category: 'archive',
    categoryLabel: 'Archive & ZIP',
    description: 'Compress photos, documents, or videos into a single organized ZIP package.',
    icon: FolderArchive,
    color: 'from-emerald-500 to-teal-600',
    badge: 'Archive',
    steps: [
      { name: 'Package into ZIP Archive', operation: 'create_zip', parameters: { archive_name: 'ufs_archive.zip' } }
    ]
  },
  {
    id: 'unzip_archive',
    name: 'Unpack & Extract ZIP Archive',
    category: 'archive',
    categoryLabel: 'Archive & ZIP',
    description: 'Decompress any ZIP file and list/extract all enclosed files.',
    icon: Archive,
    color: 'from-teal-500 to-emerald-600',
    badge: 'Extract',
    steps: [
      { name: 'Decompress Archive', operation: 'extract_zip', parameters: {} }
    ]
  },
  {
    id: 'compress_photos',
    name: 'Compress Photos for Web & Chat',
    category: 'photo',
    categoryLabel: 'Photos & Images',
    description: 'Shrink high-resolution photos to lightweight WebP without noticeable quality loss.',
    icon: ImageIcon,
    color: 'from-cyan-500 to-blue-600',
    badge: 'Fast',
    steps: [
      { name: 'Optimize & Compress', operation: 'convert', parameters: { format: 'webp', quality: 80 } }
    ]
  },
  {
    id: 'extract_audio_video',
    name: 'Extract Audio from Video',
    category: 'video',
    categoryLabel: 'Video & Audio',
    description: 'Rip background music, dialogue, or soundtracks from video files into audio.',
    icon: Music,
    color: 'from-rose-500 to-pink-600',
    badge: 'Audio',
    steps: [
      { name: 'Rip Audio Stream', operation: 'extract_audio', parameters: { format: 'wav' } }
    ]
  },
  {
    id: 'video_to_webm',
    name: 'Compress & Convert Video',
    category: 'video',
    categoryLabel: 'Video & Audio',
    description: 'Transcode large video clips into modern, web-ready MP4 or WebM formats.',
    icon: Film,
    color: 'from-indigo-500 to-violet-600',
    badge: 'Video',
    steps: [
      { name: 'Transcode Video', operation: 'convert', parameters: { format: 'webm', crf: 28 } }
    ]
  },
  {
    id: 'watermark_pdf',
    name: 'Add Security Watermark to PDF',
    category: 'doc',
    categoryLabel: 'Document & PDF',
    description: 'Stamp a bold "CONFIDENTIAL" or custom watermark across every page of your PDF.',
    icon: Shield,
    color: 'from-amber-600 to-amber-700',
    badge: 'Security',
    steps: [
      { name: 'Stamp Watermark', operation: 'watermark_pdf', parameters: { text: 'CONFIDENTIAL', opacity: '0.35' } }
    ]
  },
  {
    id: 'split_pdf_pages',
    name: 'Split & Extract PDF Pages',
    category: 'doc',
    categoryLabel: 'Document & PDF',
    description: 'Extract specific pages or page ranges from a large PDF document.',
    icon: FileText,
    color: 'from-orange-500 to-amber-600',
    badge: 'Pages',
    steps: [
      { name: 'Split Selected Pages', operation: 'split_pdf', parameters: { pages: '1-5' } }
    ]
  }
];

export const PipelineEditor: React.FC<PipelineEditorProps> = ({
  files,
  onJobStarted,
  preSelectedFileIds = [],
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<FriendlyRecipe | null>(FRIENDLY_RECIPES[0]);
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>(preSelectedFileIds);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Custom Workflow Creation Modal
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [builderCategory, setBuilderCategory] = useState<'photo' | 'video' | 'doc' | 'archive'>('photo');
  const [customSteps, setCustomSteps] = useState<Array<{ name: string; operation: string; parameters: Record<string, any> }>>([
    { name: 'Convert to WebP', operation: 'convert', parameters: { format: 'webp', quality: 80 } }
  ]);

  // Sync preSelectedFileIds when passed
  useEffect(() => {
    if (preSelectedFileIds.length > 0) {
      setSelectedFileIds(preSelectedFileIds);
    }
  }, [preSelectedFileIds]);

  const toggleFileSelection = (id: number) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllFiles = () => {
    if (selectedFileIds.length === files.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(files.map((f) => f.id));
    }
  };

  const handleRunWorkflow = async () => {
    if (!selectedRecipe) return;
    if (selectedFileIds.length === 0) {
      setError('Please select at least one file below to run this workflow.');
      return;
    }
    if (!validationReport.isValid) {
      setError('Please resolve pipeline compatibility errors before running this workflow.');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Execute steps for each selected file
      for (const fileId of selectedFileIds) {
        for (const step of selectedRecipe.steps) {
          await universalEngine.createJob({
            file_id: fileId,
            operation: step.operation,
            parameters: step.parameters,
          });
        }
      }

      setSuccessMsg(`Workflow "${selectedRecipe.name}" started for ${selectedFileIds.length} file(s)!`);
      onJobStarted();
    } catch (err: any) {
      setError(`Failed to execute workflow: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSaveCustomWorkflow = () => {
    if (!customName.trim()) {
      alert('Please enter a name for your custom workflow');
      return;
    }

    const newRecipe: FriendlyRecipe = {
      id: `custom_${Date.now()}`,
      name: customName,
      category: builderCategory,
      categoryLabel: builderCategory === 'photo' ? 'Photos & Images' : builderCategory === 'video' ? 'Video & Audio' : builderCategory === 'doc' ? 'Document & PDF' : 'Archive & ZIP',
      description: customDesc || 'Custom automated workflow',
      icon: Wand2,
      color: 'from-brand-600 to-indigo-600',
      badge: 'Custom',
      steps: customSteps,
    };

    FRIENDLY_RECIPES.unshift(newRecipe);
    setSelectedRecipe(newRecipe);
    setIsCreatingCustom(false);
    setSuccessMsg(`Custom workflow "${customName}" created successfully!`);
  };

  const filteredRecipes = activeCategory === 'all'
    ? FRIENDLY_RECIPES
    : FRIENDLY_RECIPES.filter((r) => r.category === activeCategory);

  const selectedFilesList = files.filter((f) => selectedFileIds.includes(f.id));
  const validationReport = selectedRecipe
    ? validatePipelineCompatibility(selectedRecipe.steps, selectedFilesList)
    : { isValid: true, hasWarnings: false, issues: [] };

  const customValidationReport = validatePipelineCompatibility(
    customSteps,
    selectedFilesList
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-surface-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 text-white shadow-lg shadow-brand-500/25">
              <Wand2 className="h-5 w-5" />
            </span>
            <span>Workflows & Recipes</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simple 1-tap automations. Combine photos to PDF, package ZIP files, extract audio, or build custom chains.
          </p>
        </div>

        <button
          onClick={() => {
            setCustomName('');
            setCustomDesc('');
            setCustomSteps([{ name: 'Convert Format', operation: 'convert', parameters: { format: 'webp', quality: 80 } }]);
            setIsCreatingCustom(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Custom Workflow</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between shadow-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>{successMsg}</span>
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All Recipes', icon: Sparkles },
          { id: 'photo', label: 'Photos & Images', icon: ImageIcon },
          { id: 'video', label: 'Video & Audio', icon: Film },
          { id: 'doc', label: 'Documents & PDF', icon: BookOpen },
          { id: 'archive', label: 'ZIP & Archives', icon: FolderArchive },
        ].map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as CategoryFilter)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'bg-surface-900 border border-surface-800 text-slate-300 hover:border-surface-700 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredRecipes.map((recipe) => {
          const Icon = recipe.icon;
          const isSelected = selectedRecipe?.id === recipe.id;
          return (
            <div
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-surface-850 border-brand-500 shadow-xl shadow-brand-500/10 scale-[1.01]'
                  : 'bg-surface-900/90 border-surface-800 hover:border-surface-700 hover:bg-surface-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-2xl bg-gradient-to-tr ${recipe.color} text-white shadow-md`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-800 text-slate-300 border border-surface-700">
                      {recipe.categoryLabel}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                      {recipe.badge}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-white mb-1">{recipe.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{recipe.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                  <span>{recipe.steps.length} Step(s)</span>
                </span>
                <span className={`text-xs font-bold flex items-center gap-1 ${isSelected ? 'text-brand-400' : 'text-slate-400'}`}>
                  <span>{isSelected ? 'Selected' : 'Select'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Workflow Execution Panel */}
      {selectedRecipe && (
        <div className="p-5 sm:p-6 rounded-3xl bg-surface-900 border border-surface-800 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-surface-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-2xl bg-gradient-to-tr ${selectedRecipe.color} text-white shadow-md`}>
                <selectedRecipe.icon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">{selectedRecipe.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedRecipe.description}</p>
              </div>
            </div>

            <button
              onClick={handleRunWorkflow}
              disabled={isExecuting || selectedFileIds.length === 0 || !validationReport.isValid}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-brand-500/25 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2 active:scale-95 shrink-0"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>
                {isExecuting
                  ? 'Running Workflow...'
                  : !validationReport.isValid
                  ? 'Resolve Compatibility Issues Below'
                  : selectedFileIds.length > 0
                  ? `Run on ${selectedFileIds.length} Selected File(s)`
                  : 'Select Files Below to Run'}
              </span>
            </button>
          </div>

          {/* Pipeline Step Compatibility Validator Ledger */}
          <div className="space-y-2">
            {validationReport.isValid && !validationReport.hasWarnings ? (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="font-medium">Compatibility Verified: Input files and step stream transitions are 100% compatible.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {validationReport.issues.map((iss, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border text-xs ${
                      iss.severity === 'error'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${iss.severity === 'error' ? 'text-rose-400' : 'text-amber-400'}`} />
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-2">
                        <span>{iss.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase ${iss.severity === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                          {iss.severity}
                        </span>
                      </div>
                      <div className="opacity-90">{iss.description}</div>
                      {iss.suggestion && (
                        <div className="text-[11px] opacity-80 pt-0.5 font-medium flex items-center gap-1">
                          <Sparkles className="h-3 w-3 shrink-0 text-brand-400" />
                          <span>{iss.suggestion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workflow Steps Sequence Visualizer */}
          <div className="p-4 rounded-2xl bg-surface-950/70 border border-surface-800/80 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-brand-400" />
              <span>Automated Sequence Steps</span>
            </span>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {selectedRecipe.steps.map((st, sidx) => (
                <div key={sidx} className="flex items-center gap-2">
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-surface-900 border border-surface-700 text-xs font-semibold text-white">
                    <span className="h-5 w-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px]">
                      {sidx + 1}
                    </span>
                    <span>{st.name}</span>
                  </div>
                  {sidx < selectedRecipe.steps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Target Files Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Select Files to Process ({selectedFileIds.length} of {files.length} selected)</span>
              </span>
              <button
                onClick={selectAllFiles}
                className="text-xs font-bold text-brand-400 hover:text-brand-300 cursor-pointer"
              >
                {selectedFileIds.length === files.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {files.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface-950/50 border border-surface-800 text-center text-slate-400 text-xs">
                No files uploaded yet. Switch to the <strong>Studio</strong> tab to add files or photos to your library.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 p-2 rounded-2xl bg-surface-950/60 border border-surface-800">
                {files.map((f) => {
                  const isChecked = selectedFileIds.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleFileSelection(f.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-brand-500/10 border border-brand-500/30'
                          : 'bg-surface-900 border border-surface-800/80 hover:border-surface-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-brand-400 shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-500 shrink-0" />
                        )}
                        <span className="text-xs text-white truncate font-medium">{f.filename}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 shrink-0 font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-surface-800 uppercase font-bold text-slate-300">
                          {f.category}
                        </span>
                        <span>{(f.size_bytes / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Friendly Custom Workflow Builder Modal */}
      {isCreatingCustom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Create Custom Workflow</h3>
                  <p className="text-xs text-slate-400">Non-technical step-by-step visual builder</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreatingCustom(false)}
                className="p-1.5 rounded-xl bg-surface-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
              {/* Step 1: Workflow Details */}
              <div className="space-y-3">
                <label className="block text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  1. Workflow Information
                </label>
                <input
                  type="text"
                  placeholder="e.g. Combine Photos into Album PDF"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-950 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                />
                <input
                  type="text"
                  placeholder="e.g. Automatically merge all images into single document"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-950 border border-surface-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              {/* Step 2: Choose File Category */}
              <div className="space-y-3">
                <label className="block text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  2. What type of files will this process?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'photo', label: 'Photos', icon: ImageIcon },
                    { id: 'doc', label: 'Documents', icon: BookOpen },
                    { id: 'video', label: 'Videos', icon: Film },
                    { id: 'archive', label: 'Archives', icon: FolderArchive },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = builderCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setBuilderCategory(cat.id as any)}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-500/15 border-brand-500 text-white shadow-md'
                            : 'bg-surface-950 border-surface-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5 mb-1 text-brand-400" />
                        <span className="font-semibold text-xs">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Configure Workflow Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                    3. Actions & Transformations ({customSteps.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSteps((prev) => [
                        ...prev,
                        { name: 'Convert Format', operation: 'convert', parameters: { format: 'png' } }
                      ]);
                    }}
                    className="px-3 py-1 rounded-xl bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Another Step</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {customSteps.map((st, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-surface-950 border border-surface-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>Step {idx + 1} Action</span>
                        </span>
                        {customSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCustomSteps(customSteps.filter((_, i) => i !== idx))}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <select
                        value={st.operation}
                        onChange={(e) => {
                          const op = e.target.value;
                          const updated = [...customSteps];
                          let name = 'Convert Format';
                          let params: Record<string, any> = {};

                          if (op === 'images_to_pdf') {
                            name = 'Combine Photos to PDF';
                            params = { quality: 85 };
                          } else if (op === 'create_zip') {
                            name = 'Create ZIP Archive';
                            params = { archive_name: 'custom_archive.zip' };
                          } else if (op === 'extract_audio') {
                            name = 'Extract Audio Track';
                            params = { format: 'wav' };
                          } else if (op === 'watermark_pdf') {
                            name = 'Watermark PDF';
                            params = { text: 'CONFIDENTIAL', opacity: '0.35' };
                          } else if (op === 'compress') {
                            name = 'Compress File';
                            params = { quality: 80 };
                          }

                          updated[idx] = { name, operation: op, parameters: params };
                          setCustomSteps(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 text-xs text-white"
                      >
                        <option value="convert">Convert Format (WebP / PNG / JPG / MP4)</option>
                        <option value="images_to_pdf">Combine Photos into a Single PDF Document</option>
                        <option value="create_zip">Pack into Compressed ZIP Archive</option>
                        <option value="extract_audio">Extract Lossless Audio Track (WAV/MP3)</option>
                        <option value="watermark_pdf">Watermark PDF Document</option>
                        <option value="compress">Compress File Size</option>
                      </select>
                    </div>
                  ))}
                  {/* Live Custom Workflow Step Compatibility Report */}
                  <div className="pt-2">
                    {customValidationReport.isValid && !customValidationReport.hasWarnings ? (
                      <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs">
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span>All custom steps have compatible input/output stream chains.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {customValidationReport.issues.map((iss, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-2 p-3 rounded-2xl border text-xs ${
                              iss.severity === 'error'
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            }`}
                          >
                            <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${iss.severity === 'error' ? 'text-rose-400' : 'text-amber-400'}`} />
                            <div className="space-y-0.5">
                              <div className="font-bold">{iss.title}</div>
                              <div className="opacity-90">{iss.description}</div>
                              {iss.suggestion && (
                                <div className="text-[11px] opacity-75 font-medium">{iss.suggestion}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-surface-800 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomWorkflow}
                disabled={!customValidationReport.isValid}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 cursor-pointer disabled:opacity-50"
              >
                Save & Use Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
