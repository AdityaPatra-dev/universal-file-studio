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
  getSubCategories,
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

const QUICK_SUGGESTION_CHIPS = [
  { label: '🔥 Top Tools', query: 'popular' },
  { label: '📄 PDF to Word', query: 'pdf to word' },
  { label: '🗜️ Compress PDF', query: 'compress pdf' },
  { label: '🎬 Trim Video', query: 'cut video' },
  { label: '🎵 Extract MP3', query: 'extract audio' },
  { label: '🖼️ Photos to PDF', query: 'photos to pdf' },
  { label: '📦 Unpack ZIP', query: 'unzip' },
  { label: '⚡ MP4 to MKV', query: 'mp4 to mkv' },
];

export const ProcessDirectory: React.FC<ProcessDirectoryProps> = ({
  libraryFiles = [],
  onJobStarted,
  onFilesUploaded,
  onOpenPipelineEditor,
}) => {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalTool, setActiveModalTool] = useState<StudioTool | null>(null);
  const [modalInitialParams, setModalInitialParams] = useState<Record<string, any>>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Subcategories for current category tab
  const subCategories = useMemo(() => {
    return getSubCategories(activeCategory);
  }, [activeCategory]);

  // Parse search query for intent match (e.g. "pdf to word", "cut video")
  const searchIntent: SearchIntentMatch | null = useMemo(() => {
    return parseSearchQuery(searchQuery, ALL_STUDIO_TOOLS);
  }, [searchQuery]);

  // Filter tools based on category, subcategory, and search query
  const filteredTools = useMemo(() => {
    let list = getToolsByCategory(activeCategory);

    // Filter by subcategory
    if (activeSubCategory !== 'all') {
      list = list.filter((t) => t.subCategory === activeSubCategory);
    }

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
  }, [activeCategory, activeSubCategory, searchQuery]);

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
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-900 via-surface-900 to-surface-850 border border-surface-750/70 p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="px-2.5 py-1 rounded-xl bg-brand-500/20 text-brand-300 font-bold text-[11px] border border-brand-500/30 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>102+ Offline Local Tools</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">100% On-Device Privacy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
                Process Directory & Recipes
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Full 27-tool iLovePDF parity, hardware-accelerated FFmpeg video transcoding, lossless
                audio mastering, TinyPNG image compression, and multi-format archives. Zero cloud uploads.
              </p>
            </div>

            {onOpenPipelineEditor && (
              <button
                type="button"
                onClick={onOpenPipelineEditor}
                className="px-4 py-2.5 rounded-2xl bg-surface-800 hover:bg-surface-750 border border-surface-700/80 text-xs text-slate-200 font-bold transition-all btn-press flex items-center gap-2 self-start sm:self-center shadow-md flex-shrink-0"
              >
                <Layers className="h-4 w-4 text-brand-400" />
                <span>Multi-Step Pipeline Builder →</span>
              </button>
            )}
          </div>

          {/* Search Bar with Instant Intent Parsing */}
          <div className="space-y-2.5 pt-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 102+ tools or type queries like 'pdf to word', 'cut video', 'mp4 to mkv', 'compress pdf'..."
                className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-surface-950/90 border border-surface-700/80 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-inner transition-all"
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

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 flex-shrink-0 mr-1">
                <Zap className="h-3 w-3 text-brand-400" />
                <span>Quick:</span>
              </span>
              {QUICK_SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setSearchQuery(chip.query)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all btn-press whitespace-nowrap flex-shrink-0 ${
                    searchQuery === chip.query
                      ? 'bg-brand-600 text-white font-bold shadow-sm shadow-brand-500/30'
                      : 'bg-surface-850 hover:bg-surface-800 text-slate-300 border border-surface-700/60'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
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
              setActiveSubCategory('all');
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
                  setActiveSubCategory('all');
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

      {/* Subcategory Filter Pills */}
      {subCategories.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {subCategories.map((sub) => {
            const isSelected = activeSubCategory === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setActiveSubCategory(sub.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all btn-press flex items-center gap-1.5 flex-shrink-0 ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                    : 'bg-surface-850 hover:bg-surface-800 text-slate-300 border border-surface-700/60'
                }`}
              >
                <span>{sub.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isSelected ? 'bg-black/25 text-white' : 'bg-surface-750 text-slate-400'
                  }`}
                >
                  {sub.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Pinned Top / Most-Used Tools Row (Always pinned at top of active view) */}
      {pinnedTopTools.length > 0 && activeSubCategory === 'all' && (
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
                className="group relative p-4 rounded-3xl bg-gradient-to-br from-surface-900 to-surface-850 border border-brand-500/30 hover:border-brand-500/60 transition-all duration-200 shadow-lg hover:shadow-brand-500/10 flex flex-col justify-between"
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
            {activeSubCategory === 'all'
              ? `All ${activeCategory === 'all' ? 'Tools' : STUDIO_CATEGORIES.find((c) => c.id === activeCategory)?.shortName} (${filteredTools.length})`
              : `${activeSubCategory} (${filteredTools.length})`}
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
                setActiveSubCategory('all');
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
                className="group p-4 rounded-3xl bg-surface-900/90 hover:bg-surface-850/90 border border-surface-750/70 hover:border-surface-650 transition-all duration-200 shadow-sm flex flex-col justify-between"
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
                    className="px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-brand-600 text-slate-200 hover:text-white font-semibold text-xs border border-surface-700/60 hover:border-brand-500 transition-all btn-press flex items-center gap-1"
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

