import React, { useState, useMemo } from 'react';
import {
  Search, Sparkles, Filter, ArrowRight, Wand2, CheckCircle2,
  Sliders, Layers, Zap, Flame, FileText, Film, Music, Image as ImageIcon,
  Archive, ChevronRight, X, ExternalLink
} from 'lucide-react';
import { StudioTool, ToolCategory } from '../../data/catalog/types';
import {
  ALL_STUDIO_TOOLS,
  STUDIO_CATEGORIES,
  getToolsByCategory,
  getPinnedTools,
  StudioCategoryMeta
} from '../../data/catalog';
import { parseSearchQuery, SearchIntentMatch } from '../../utils/searchParser';
import { CatalogIcon } from './CatalogIcon';
import { ProcessRunnerModal } from './ProcessRunnerModal';
import { FileRecord, Job } from '../../types/api';

interface ProcessDirectoryProps {
  libraryFiles?: FileRecord[];
  onJobStarted?: (job?: Job) => void;
  onFilesUploaded?: (files: FileRecord[]) => void;
  onOpenPipelineEditor?: () => void;
}

export const ProcessDirectory: React.FC<ProcessDirectoryProps> = ({
  libraryFiles = [],
  onJobStarted,
  onFilesUploaded,
  onOpenPipelineEditor,
}) => {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalTool, setActiveModalTool] = useState<StudioTool | null>(null);
  const [modalInitialParams, setModalInitialParams] = useState<Record<string, any>>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Parse search query for intent match (e.g. "pdf to word", "cut video")
  const searchIntent: SearchIntentMatch | null = useMemo(() => {
    return parseSearchQuery(searchQuery, ALL_STUDIO_TOOLS);
  }, [searchQuery]);

  // Filter tools based on category and search query
  const filteredTools = useMemo(() => {
    let list = getToolsByCategory(activeCategory);

    // Filter by text search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      if (q === 'popular' || q === 'top') {
        list = list.filter((t) => t.isPinnedTop || t.badge === 'popular' || t.badge === 'top');
      } else {
        list = list.filter((t) => {
          return (
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.subCategory.toLowerCase().includes(q) ||
            t.keywords.some((k) => k.toLowerCase().includes(q)) ||
            t.inputFormats.some((fmt) => fmt.toLowerCase().replace('.', '').includes(q)) ||
            t.outputFormats.some((fmt) => fmt.toLowerCase().replace('.', '').includes(q))
          );
        });
      }
    }

    // Sort: pinned top first, then by rank
    return [...list].sort((a, b) => {
      if (a.isPinnedTop && !b.isPinnedTop) return -1;
      if (!a.isPinnedTop && b.isPinnedTop) return 1;
      return a.rank - b.rank;
    });
  }, [activeCategory, searchQuery]);

  // Pinned top tools for the current view
  const pinnedTopTools = useMemo(() => {
    if (searchQuery.trim()) return []; // Hide pinned banner during free-form search
    return getPinnedTools(activeCategory);
  }, [activeCategory, searchQuery]);

  // Open Tool Modal
  const handleLaunchTool = (tool: StudioTool, prefillParams?: Record<string, any>) => {
    setActiveModalTool(tool);
    setModalInitialParams(prefillParams || {});
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Search Bar with Instant Intent Parsing */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search 102+ tools or type queries like 'pdf to word', 'cut video', 'mp4 to mkv', 'compress pdf'..."
          className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-surface-900 border border-surface-750/80 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Instant Intent Match Banner (e.g. user typed "pdf to word") */}
      {searchIntent && searchIntent.matchedTool && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-brand-600/25 via-indigo-600/20 to-purple-600/25 border-2 border-brand-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-3.5">
            <div
              className={`p-3 rounded-2xl bg-gradient-to-br ${searchIntent.matchedTool.color} text-white shadow-md flex-shrink-0`}
            >
              <CatalogIcon name={searchIntent.matchedTool.iconName} className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/30 text-brand-200 border border-brand-500/40">
                  ⚡ Direct Intent Detected: {searchIntent.sourceFormat ? `${searchIntent.sourceFormat.toUpperCase()} → ${searchIntent.targetFormat?.toUpperCase()}` : searchIntent.actionType}
                </span>
                <span className="text-[11px] font-semibold text-slate-300 font-mono">
                  {searchIntent.matchedTool.categoryLabel}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {searchIntent.matchedTool.name}
              </h3>
              <p className="text-xs text-slate-300 line-clamp-1">
                {searchIntent.matchedTool.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              handleLaunchTool(
                searchIntent.matchedTool!,
                searchIntent.inferredParameters
              )
            }
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/40 transition-all btn-press flex items-center gap-2 self-stretch sm:self-center justify-center flex-shrink-0"
          >
            <span>Launch {searchIntent.matchedTool.name}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Primary Category Studios Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Select Studio
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} shown
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {/* "All Tools" tab */}
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
            }}
            className={`p-3 rounded-2xl border text-left transition-all btn-press flex flex-col justify-between ${
              activeCategory === 'all'
                ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/25 ring-1 ring-brand-400'
                : 'bg-surface-900 border-surface-750/70 text-slate-300 hover:border-surface-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`p-1.5 rounded-xl ${
                  activeCategory === 'all' ? 'bg-white/20' : 'bg-surface-800 text-brand-400'
                }`}
              >
                <Layers className="h-4 w-4" />
              </div>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                  activeCategory === 'all' ? 'bg-black/20 text-white' : 'bg-surface-800 text-slate-400'
                }`}
              >
                102
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold leading-tight">All Studios</div>
              <div
                className={`text-[10px] truncate mt-0.5 ${
                  activeCategory === 'all' ? 'text-brand-100' : 'text-slate-400'
                }`}
              >
                Every local tool
              </div>
            </div>
          </button>

          {/* Specific categories */}
          {STUDIO_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                }}
                className={`p-3 rounded-2xl border text-left transition-all btn-press flex flex-col justify-between ${
                  isSelected
                    ? `bg-gradient-to-br ${cat.color} text-white border-white/20 shadow-md shadow-brand-500/20 ring-1 ring-white/30`
                    : 'bg-surface-900 border-surface-750/70 text-slate-300 hover:border-surface-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`p-1.5 rounded-xl ${
                      isSelected ? 'bg-white/20' : 'bg-surface-800 text-slate-300'
                    }`}
                  >
                    <CatalogIcon name={cat.iconName} className="h-4 w-4" />
                  </div>
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-black/20 text-white' : 'bg-surface-800 text-slate-400'
                    }`}
                  >
                    {cat.toolCount}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold leading-tight truncate">{cat.shortName}</div>
                  <div
                    className={`text-[10px] truncate mt-0.5 ${
                      isSelected ? 'text-white/80' : 'text-slate-400'
                    }`}
                  >
                    {cat.id === 'document' ? '27 iLovePDF + more' : `${cat.toolCount} specialized`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pinned Top / Most-Used Tools Row (Always pinned at top of active view) */}
      {pinnedTopTools.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Flame className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight">
              🔥 Top & Most-Used Tools ({pinnedTopTools.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinnedTopTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => handleLaunchTool(tool)}
                className="group relative p-4 rounded-3xl bg-gradient-to-br from-surface-900 to-surface-850 border border-brand-500/30 hover:border-brand-500/60 transition-all duration-200 shadow-lg hover:shadow-brand-500/10 flex flex-col justify-between cursor-pointer btn-press"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2.5 rounded-2xl bg-gradient-to-br ${tool.color} text-white shadow-md flex-shrink-0`}
                      >
                        <CatalogIcon name={tool.iconName} className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            🔥 Top Tool
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {tool.subCategory}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors mt-0.5 leading-tight">
                          {tool.name}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-snug line-clamp-2">
                    {tool.description}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <div className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-800 text-slate-300 border border-surface-700/60">
                      In: {tool.inputFormats.slice(0, 3).join(', ')}
                    </div>
                    <ArrowRight className="h-2.5 w-2.5 text-slate-500" />
                    <div className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-800 text-brand-300 border border-surface-700/60">
                      Out: {tool.outputFormats.slice(0, 2).join(', ')}
                    </div>
                  </div>
                </div>

                <div className="pt-3.5 mt-3 border-t border-surface-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    Engine: {tool.backendEngine}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLaunchTool(tool)}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all btn-press flex items-center gap-1.5"
                  >
                    <span>Use Tool</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Available Tools Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            {`All ${activeCategory === 'all' ? 'Tools' : STUDIO_CATEGORIES.find((c) => c.id === activeCategory)?.shortName} (${filteredTools.length})`}
          </h3>
          <span className="text-xs text-slate-400 font-mono">100% Offline Hardware Execution</span>
        </div>

        {filteredTools.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-surface-900 border border-surface-800 space-y-3">
            <div className="p-3 rounded-2xl bg-surface-800 text-slate-400 inline-block">
              <Filter className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No tools match your search</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try searching for common terms like "PDF", "Video", "Compress", "Convert", "Trim", or
              reset your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs btn-press"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => handleLaunchTool(tool)}
                className="group p-4 rounded-3xl bg-surface-900/90 hover:bg-surface-850/90 border border-surface-750/70 hover:border-surface-650 transition-all duration-200 shadow-sm flex flex-col justify-between cursor-pointer btn-press"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`p-2.5 rounded-2xl bg-gradient-to-br ${tool.color} text-white shadow-sm flex-shrink-0`}
                    >
                      <CatalogIcon name={tool.iconName} className="h-5 w-5" />
                    </div>
                    {tool.badge === 'popular' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        🔥 Popular
                      </span>
                    )}
                    {tool.badge === 'top' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        ⚡ Top Tool
                      </span>
                    )}
                    {tool.badge === 'essential' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ⭐ Essential
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
                      {tool.categoryLabel} • {tool.subCategory}
                    </span>
                    <h4 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors leading-tight">
                      {tool.name}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                    {tool.description}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] font-mono text-slate-400">
                    <span className="bg-surface-800 px-1.5 py-0.5 rounded border border-surface-700/50">
                      {tool.inputFormats.slice(0, 2).join(', ')}
                    </span>
                    <span>→</span>
                    <span className="bg-surface-800 text-brand-300 px-1.5 py-0.5 rounded border border-surface-700/50">
                      {tool.outputFormats[0] || 'auto'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-surface-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    {tool.parameters.length} {tool.parameters.length === 1 ? 'option' : 'options'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLaunchTool(tool)}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm shadow-brand-600/30 transition-all btn-press flex items-center gap-1.5"
                  >
                    <span>Use Tool</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Process Runner Modal */}
      <ProcessRunnerModal
        tool={activeModalTool}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveModalTool(null);
        }}
        initialParameters={modalInitialParams}
        libraryFiles={libraryFiles}
        onJobStarted={onJobStarted}
        onFilesUploaded={onFilesUploaded}
      />
    </div>
  );
};

