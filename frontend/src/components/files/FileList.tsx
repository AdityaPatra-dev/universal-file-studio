import React, { useState } from 'react';
import { 
  FileVideo, FileAudio, FileImage, FileText, Archive, File, 
  Trash2, Download, Sparkles, CheckSquare, Square, MinusSquare,
  Layers, Minimize2, FileArchive, X, FileSpreadsheet, Presentation, FileCode,
  ShieldCheck, GitMerge, Search, AlertTriangle
} from 'lucide-react';
import { FileRecord } from '../../types/api';
import { formatBytes, formatDate } from '../../utils/format';

interface FileListProps {
  files: FileRecord[];
  onSelectFileForProcess: (file: FileRecord) => void;
  onDeleteFile: (fileId: number) => void;
  onDownloadFile: (fileId: number) => void;
  onInspectFile?: (file: FileRecord) => void;
  onBatchAction?: (selectedFiles: FileRecord[], mode: 'convert' | 'compress' | 'archive') => void;
  onBatchDelete?: (selectedIds: number[]) => void;
  onBatchPipeline?: (selectedFiles: FileRecord[]) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onSelectFileForProcess,
  onDeleteFile,
  onDownloadFile,
  onInspectFile,
  onBatchAction,
  onBatchDelete,
  onBatchPipeline,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // In-app deletion confirm dialog state
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<FileRecord | null>(null);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState<boolean>(false);

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'video', label: 'Video' },
    { id: 'audio', label: 'Audio' },
    { id: 'image', label: 'Image' },
    { id: 'pdf', label: 'PDF' },
    { id: 'document', label: 'Document' },
    { id: 'spreadsheet', label: 'Spreadsheet' },
    { id: 'presentation', label: 'Presentation' },
    { id: 'text', label: 'Text/Notes' },
    { id: 'archive', label: 'Archive' },
  ];

  // Dynamic category counts
  const categoryCounts = categories.reduce((acc, cat) => {
    if (cat.id === 'all') {
      acc[cat.id] = files.length;
    } else {
      acc[cat.id] = files.filter(f => f.category === cat.id).length;
    }
    return acc;
  }, {} as Record<string, number>);

  const filteredFiles = files.filter((f) => {
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch = f.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.detected_format && f.detected_format.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const getFileIcon = (cat: string) => {
    switch (cat) {
      case 'video': return <FileVideo className="h-5 w-5 text-purple-400" />;
      case 'audio': return <FileAudio className="h-5 w-5 text-amber-400" />;
      case 'image': return <FileImage className="h-5 w-5 text-emerald-400" />;
      case 'pdf': return <FileText className="h-5 w-5 text-rose-400" />;
      case 'document': return <FileText className="h-5 w-5 text-blue-400" />;
      case 'spreadsheet': return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
      case 'presentation': return <Presentation className="h-5 w-5 text-amber-400" />;
      case 'text': return <FileCode className="h-5 w-5 text-cyan-400" />;
      case 'archive': return <Archive className="h-5 w-5 text-indigo-400" />;
      default: return <File className="h-5 w-5 text-slate-400" />;
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedFilesList = files.filter((f) => selectedIds.has(f.id));
  const isAllSelected = filteredFiles.length > 0 && selectedIds.size === filteredFiles.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < filteredFiles.length;

  return (
    <div className="space-y-4 relative">
      {/* Category Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const count = categoryCounts[c.id] || 0;
            const isSelected = selectedCategory === c.id;
            const isEmpty = count === 0 && c.id !== 'all';

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-600/30'
                    : isEmpty
                    ? 'bg-surface-900/60 text-slate-500 hover:text-slate-400 hover:bg-surface-800/40 opacity-70'
                    : 'bg-surface-800/80 text-slate-300 hover:text-white hover:bg-surface-800'
                }`}
              >
                <span>{c.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-brand-700 text-white font-bold' : 'bg-surface-900 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Enhanced Search Input with Clear Button */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search files or format..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-2 rounded-xl bg-surface-900 border border-surface-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Files Table / List */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-900/30 border border-surface-800 space-y-2">
          <p className="text-sm font-semibold text-slate-300">No files found matching the current filter.</p>
          <p className="text-xs text-slate-500">
            {searchQuery ? `Try clearing your search query "${searchQuery}".` : 'Drag and drop files to populate this category.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs text-brand-400 hover:underline font-medium"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-surface-800 bg-surface-900/40 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-900/90 text-slate-400 border-b border-surface-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={isAllSelected ? 'Deselect all' : 'Select all'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 text-brand-400" />
                    ) : isPartiallySelected ? (
                      <MinusSquare className="h-4 w-4 text-brand-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/60 text-slate-300">
              {filteredFiles.map((file) => {
                const isSelected = selectedIds.has(file.id);
                return (
                  <tr
                    key={file.id}
                    className={`transition-colors group ${
                      isSelected
                        ? 'bg-brand-500/10 hover:bg-brand-500/15'
                        : 'hover:bg-surface-800/40'
                    }`}
                  >
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleToggleSelect(file.id)}
                        className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-brand-400" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    {/* Clickable File Name to Inspect (P2 Fixed) */}
                    <td 
                      onClick={() => onInspectFile && onInspectFile(file)}
                      className="px-4 py-3 font-medium text-slate-100 cursor-pointer group-hover:text-brand-300 transition-colors"
                      title="Click to view file metadata & checksums"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-xl bg-surface-800 shrink-0 group-hover:bg-brand-500/20 transition-colors">
                          {getFileIcon(file.category)}
                        </div>
                        <div className="truncate max-w-[220px] md:max-w-[300px]">
                          <div className="truncate font-semibold">{file.filename}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">{file.mime_type}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="capitalize px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-800 text-slate-300">
                        {file.category}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-brand-400 font-semibold">
                      {file.detected_format ? `.${file.detected_format.toUpperCase()}` : 'N/A'}
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-400">
                      {formatBytes(file.size_bytes)}
                    </td>

                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatDate(file.created_at)}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onSelectFileForProcess(file)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors text-[11px] shadow-sm shadow-brand-600/30 cursor-pointer"
                          title="Convert or process file"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Process</span>
                        </button>

                        {onInspectFile && (
                          <button
                            onClick={() => onInspectFile(file)}
                            className="flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-brand-300 transition-colors text-[11px] border border-surface-700/60 cursor-pointer"
                            title="Inspect checksums, EXIF, and security metadata"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
                            <span className="hidden md:inline">Inspect</span>
                          </button>
                        )}

                        <button
                          onClick={() => onDownloadFile(file.id)}
                          className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-surface-700/60"
                          title="Download original file"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => setConfirmDeleteFile(file)}
                          className="p-1.5 rounded-lg bg-surface-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer border border-surface-700/60"
                          title="Delete file"
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
      )}

      {/* Floating Batch Action Bar (P1 Fixed with Pipeline Button) */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-40 bg-surface-900/95 backdrop-blur-md border border-brand-500/40 rounded-2xl p-3 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-300 font-bold text-xs font-mono">
              {selectedIds.size} {selectedIds.size === 1 ? 'file' : 'files'} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center space-x-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Deselect All</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            {/* Direct Route to Pipeline Studio (Crucial P1 Addition) */}
            {onBatchPipeline && (
              <button
                onClick={() => onBatchPipeline(selectedFilesList)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-brand-600/30 transition-all cursor-pointer"
                title="Send selected files to Pipeline Studio for multi-step chaining"
              >
                <GitMerge className="h-3.5 w-3.5" />
                <span>Run in Pipeline Studio</span>
              </button>
            )}

            <button
              onClick={() => onBatchAction && onBatchAction(selectedFilesList, 'convert')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 font-semibold text-xs transition-all border border-surface-700 cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 text-brand-400" />
              <span>Batch Convert</span>
            </button>

            <button
              onClick={() => onBatchAction && onBatchAction(selectedFilesList, 'compress')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 font-semibold text-xs transition-all border border-surface-700 cursor-pointer"
            >
              <Minimize2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Compress</span>
            </button>

            <button
              onClick={() => onBatchAction && onBatchAction(selectedFilesList, 'archive')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 font-semibold text-xs transition-all border border-surface-700 cursor-pointer"
            >
              <FileArchive className="h-3.5 w-3.5 text-blue-400" />
              <span>Archive ZIP</span>
            </button>

            {onBatchDelete && (
              <button
                onClick={() => setConfirmBatchDelete(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs transition-all border border-rose-500/20 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* In-App Single File Delete Confirmation Modal (Replacing window.confirm) */}
      {confirmDeleteFile && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Delete File?</h4>
                <p className="text-xs text-slate-400 truncate max-w-[260px]">{confirmDeleteFile.filename}</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently delete the file and all associated cached artifacts from your local studio storage. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmDeleteFile(null)}
                className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteFile(confirmDeleteFile.id);
                  setConfirmDeleteFile(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Batch Delete Confirmation Modal */}
      {confirmBatchDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Batch Delete {selectedIds.size} Files?</h4>
                <p className="text-xs text-slate-400">Permanently remove selected files</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete {selectedIds.size} files from your library? Any running jobs associated with these files will be halted.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmBatchDelete(false)}
                className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onBatchDelete) {
                    onBatchDelete(Array.from(selectedIds));
                    setSelectedIds(new Set());
                  }
                  setConfirmBatchDelete(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                Delete {selectedIds.size} Files
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
