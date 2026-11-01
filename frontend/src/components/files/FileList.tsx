import React, { useState, useMemo } from 'react';
import { 
  FileRecord, Job 
} from '../../types/api';
import { 
  Film, Music, Image as ImageIcon, FileText, Archive, FileQuestion, 
  Sparkles, Download, Trash2, ArrowUpDown, ChevronUp, ChevronDown, 
  Search, CheckSquare, Square, MinusSquare, ShieldCheck, 
  Check, X, FolderArchive, Layers, GitMerge, FileSpreadsheet, Presentation
} from 'lucide-react';
import { formatBytes, formatDate } from '../../utils/format';

interface FileListProps {
  files: FileRecord[];
  onSelectFileForProcess: (file: FileRecord) => void;
  onDeleteFile: (fileId: number) => void;
  onDownloadFile: (fileId: number) => void;
  onInspectFile?: (file: FileRecord) => void;
  onBatchAction?: (selectedFiles: FileRecord[], mode: 'convert' | 'compress' | 'archive') => void;
  onBatchDelete?: (fileIds: number[]) => void;
  onBatchPipeline?: (selectedFiles: FileRecord[]) => void;
}

type SortField = 'name' | 'size' | 'date' | 'category';
type SortDirection = 'asc' | 'desc';

export const FileList: React.FC<FileListProps> = ({
  files,
  onSelectFileForProcess,
  onDeleteFile,
  onDownloadFile,
  onInspectFile,
  onBatchAction,
  onBatchDelete,
  onBatchPipeline
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<FileRecord | null>(null);

  // Clean Categories
  const categories = useMemo(() => [
    { id: 'all', label: 'All Files' },
    { id: 'image', label: 'Images' },
    { id: 'video', label: 'Videos' },
    { id: 'pdf', label: 'PDFs' },
    { id: 'document', label: 'Docs' },
    { id: 'audio', label: 'Audio' },
    { id: 'archive', label: 'Archives' },
  ], []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: files.length };
    files.forEach((f) => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });
    return counts;
  }, [files]);

  // Filter & Sort
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        if (selectedCategory !== 'all' && file.category !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            file.filename.toLowerCase().includes(q) ||
            file.category.toLowerCase().includes(q) ||
            (file.detected_format && file.detected_format.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name') cmp = a.filename.localeCompare(b.filename);
        else if (sortField === 'size') cmp = a.size_bytes - b.size_bytes;
        else if (sortField === 'date') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
        return sortDirection === 'asc' ? cmp : -cmp;
      });
  }, [files, selectedCategory, sortField, sortDirection, searchQuery]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const selectedFilesList = files.filter((f) => selectedIds.has(f.id));
  const isAllSelected = filteredFiles.length > 0 && selectedIds.size === filteredFiles.length;

  const getFileIcon = (cat: string) => {
    switch (cat) {
      case 'video': return <Film className="h-5 w-5 text-violet-400" />;
      case 'audio': return <Music className="h-5 w-5 text-rose-400" />;
      case 'image': return <ImageIcon className="h-5 w-5 text-cyan-400" />;
      case 'pdf': return <FileText className="h-5 w-5 text-amber-400" />;
      case 'document': return <FileText className="h-5 w-5 text-blue-400" />;
      case 'archive': return <Archive className="h-5 w-5 text-emerald-400" />;
      default: return <FileQuestion className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4 relative">
      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1">
          {categories.map((c) => {
            const count = categoryCounts[c.id] || 0;
            const isSelected = selectedCategory === c.id;
            // Only hide empty categories if not 'all'
            if (count === 0 && c.id !== 'all' && files.length > 0) return null;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all btn-press cursor-pointer ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'bg-surface-900 border border-surface-800 text-slate-300 hover:text-white hover:border-surface-700'
                }`}
              >
                <span>{c.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-brand-700 text-white font-bold' : 'bg-surface-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60 shrink-0">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-2 rounded-xl bg-surface-900 border border-surface-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Select All Row */}
      {filteredFiles.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 py-0.5">
          <button
            onClick={handleToggleSelectAll}
            className="flex items-center space-x-2 text-slate-300 hover:text-white cursor-pointer btn-press"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 text-brand-400" />
            ) : (
              <Square className="h-4 w-4 text-slate-500" />
            )}
            <span>{isAllSelected ? 'Deselect All' : `Select All (${filteredFiles.length})`}</span>
          </button>
          <span className="text-[11px] font-mono text-slate-400">
            {filteredFiles.length} file{filteredFiles.length === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* Empty State */}
      {filteredFiles.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-surface-900/40 border border-surface-800 space-y-2">
          <p className="text-sm font-semibold text-slate-300">No files found.</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? 'Try clearing your search filter.' : 'Choose files from the Studio tab to get started.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile View: Touch-Friendly Responsive Cards */}
          <div className="md:hidden space-y-3">
            {filteredFiles.map((file) => {
              const isSelected = selectedIds.has(file.id);
              return (
                <div
                  key={file.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isSelected
                      ? 'bg-brand-500/10 border-brand-500/40 shadow-md shadow-brand-500/5'
                      : 'card-glass'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 min-w-0">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleSelect(file.id)}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer mt-0.5 shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-brand-400" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>

                      {/* Icon */}
                      <div className="p-2.5 rounded-xl bg-surface-850 shrink-0 border border-surface-700/60">
                        {getFileIcon(file.category)}
                      </div>

                      {/* Filename & Info */}
                      <div className="min-w-0 truncate">
                        <div 
                          onClick={() => onInspectFile && onInspectFile(file)}
                          className="font-bold text-sm text-white truncate cursor-pointer hover:text-brand-300 transition-colors"
                        >
                          {file.filename}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono flex-wrap">
                          {file.metadata_json?.folder && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-indigo-500/20">
                              <FolderArchive className="h-3 w-3 text-indigo-400" />
                              <span>{file.metadata_json.folder}</span>
                            </span>
                          )}
                          <span className="text-brand-400 font-semibold uppercase">
                            {file.detected_format || file.category}
                          </span>
                          <span>•</span>
                          <span>{formatBytes(file.size_bytes)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons (42px touch targets) */}
                  <div className="flex items-center gap-2 pt-1 border-t border-surface-800/80">
                    <button
                      onClick={() => onSelectFileForProcess(file)}
                      className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-500/25 btn-press cursor-pointer min-h-[42px]"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Process</span>
                    </button>

                    {onInspectFile && (
                      <button
                        onClick={() => onInspectFile(file)}
                        className="flex items-center justify-center p-2.5 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-300 hover:text-white border border-surface-700/60 btn-press min-h-[42px] min-w-[42px]"
                        title="Inspect file"
                      >
                        <ShieldCheck className="h-4 w-4 text-brand-400" />
                      </button>
                    )}

                    <button
                      onClick={() => onDownloadFile(file.id)}
                      className="flex items-center justify-center p-2.5 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-300 hover:text-white border border-surface-700/60 btn-press min-h-[42px] min-w-[42px]"
                      title="Save / Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setConfirmDeleteFile(file)}
                      className="flex items-center justify-center p-2.5 rounded-xl bg-surface-850 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-surface-700/60 btn-press min-h-[42px] min-w-[42px]"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block card-glass rounded-3xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-850/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-surface-800">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <button onClick={handleToggleSelectAll} className="p-1 text-slate-400 hover:text-white">
                      {isAllSelected ? <CheckSquare className="h-4 w-4 text-brand-400" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center space-x-1.5">
                      <span>Filename</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('category')}>
                    <div className="flex items-center space-x-1.5">
                      <span>Category</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('size')}>
                    <div className="flex items-center space-x-1.5">
                      <span>Size</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('date')}>
                    <div className="flex items-center space-x-1.5">
                      <span>Added</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/60">
                {filteredFiles.map((file) => {
                  const isSelected = selectedIds.has(file.id);
                  return (
                    <tr
                      key={file.id}
                      className={`hover:bg-surface-850/50 transition-colors ${isSelected ? 'bg-brand-500/10' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <button onClick={() => handleToggleSelect(file.id)} className="p-1 text-slate-400 hover:text-white">
                          {isSelected ? <CheckSquare className="h-4 w-4 text-brand-400" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-xl bg-surface-850 border border-surface-700/60">
                            {getFileIcon(file.category)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span 
                                onClick={() => onInspectFile && onInspectFile(file)}
                                className="font-bold text-white hover:text-brand-300 cursor-pointer text-xs"
                              >
                                {file.filename}
                              </span>
                              {file.metadata_json?.folder && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                  <FolderArchive className="h-2.5 w-2.5 text-indigo-400" />
                                  <span>{file.metadata_json.folder}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-surface-850 text-slate-300 font-mono text-[10px] uppercase font-bold border border-surface-700/60">
                          {file.detected_format || file.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {formatBytes(file.size_bytes)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {formatDate(file.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onSelectFileForProcess(file)}
                            className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm shadow-brand-500/20 btn-press"
                          >
                            Process
                          </button>
                          {onInspectFile && (
                            <button
                              onClick={() => onInspectFile(file)}
                              className="p-1.5 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-300 hover:text-white border border-surface-700/60 btn-press"
                              title="Inspect metadata"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
                            </button>
                          )}
                          <button
                            onClick={() => onDownloadFile(file.id)}
                            className="p-1.5 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-300 hover:text-white border border-surface-700/60 btn-press"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteFile(file)}
                            className="p-1.5 rounded-xl bg-surface-850 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-surface-700/60 btn-press"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Floating Batch Actions Dock */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 md:bottom-6 inset-x-4 sm:inset-x-auto sm:right-8 sm:left-auto z-40 animate-in slide-in-from-bottom duration-200">
          <div className="card-glass rounded-2xl p-2 sm:p-2.5 flex items-center space-x-2 border border-brand-500/40 shadow-2xl glow-brand">
            <span className="text-xs font-bold text-white px-2.5">
              {selectedIds.size} selected
            </span>

            {onBatchAction && (
              <>
                <button
                  onClick={() => onBatchAction(selectedFilesList, 'convert')}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs btn-press"
                >
                  Convert
                </button>
                <button
                  onClick={() => onBatchAction(selectedFilesList, 'compress')}
                  className="px-3 py-1.5 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-200 font-semibold text-xs border border-surface-700 btn-press"
                >
                  Compress
                </button>
                <button
                  onClick={() => onBatchAction(selectedFilesList, 'archive')}
                  className="px-3 py-1.5 rounded-xl bg-surface-850 hover:bg-surface-800 text-emerald-300 font-semibold text-xs border border-emerald-500/30 btn-press"
                >
                  ZIP
                </button>
              </>
            )}

            {onBatchDelete && (
              <button
                onClick={() => {
                  onBatchDelete(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 btn-press"
                title="Delete Selected"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm card-glass rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white">Delete File?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{confirmDeleteFile.filename}"</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setConfirmDeleteFile(null)}
                className="px-4 py-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-300 font-semibold text-xs btn-press"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteFile(confirmDeleteFile.id);
                  setConfirmDeleteFile(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 btn-press"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
