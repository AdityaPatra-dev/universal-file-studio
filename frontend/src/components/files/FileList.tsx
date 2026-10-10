import React, { useState } from 'react';
import { 
  FileVideo, FileAudio, FileImage, FileText, Archive, File, 
  Trash2, Download, Play, Info, Sparkles 
} from 'lucide-react';
import { FileRecord } from '../../types/api';
import { formatBytes, formatDate } from '../../utils/format';

interface FileListProps {
  files: FileRecord[];
  onSelectFileForProcess: (file: FileRecord) => void;
  onDeleteFile: (fileId: number) => void;
  onDownloadFile: (fileId: number) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onSelectFileForProcess,
  onDeleteFile,
  onDownloadFile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'video', label: 'Video' },
    { id: 'audio', label: 'Audio' },
    { id: 'image', label: 'Image' },
    { id: 'pdf', label: 'PDF' },
    { id: 'archive', label: 'Archive' },
    { id: 'document', label: 'Document' },
  ];

  const filteredFiles = files.filter((f) => {
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch = f.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getFileIcon = (cat: string) => {
    switch (cat) {
      case 'video': return <FileVideo className="h-5 w-5 text-purple-400" />;
      case 'audio': return <FileAudio className="h-5 w-5 text-amber-400" />;
      case 'image': return <FileImage className="h-5 w-5 text-emerald-400" />;
      case 'pdf': return <FileText className="h-5 w-5 text-rose-400" />;
      case 'archive': return <Archive className="h-5 w-5 text-blue-400" />;
      default: return <File className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === c.id
                  ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-600/30'
                  : 'bg-surface-800/80 text-slate-400 hover:text-slate-200 hover:bg-surface-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-surface-900 border border-surface-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 w-full sm:w-48"
        />
      </div>

      {/* Files Table / List */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface-900/30 border border-surface-800">
          <p className="text-sm text-slate-400">No files found matching the filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-surface-800 bg-surface-900/30">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-900/80 text-slate-400 border-b border-surface-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/60 text-slate-300">
              {filteredFiles.map((file) => (
                <tr
                  key={file.id}
                  className="hover:bg-surface-800/40 transition-colors group"
                >
                  <td className="px-4 py-3 font-medium text-slate-100 flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-surface-800 shrink-0">
                      {getFileIcon(file.category)}
                    </div>
                    <div className="truncate max-w-[240px] md:max-w-[320px]">
                      <div className="truncate font-semibold">{file.filename}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{file.mime_type}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-800 text-slate-300">
                      {file.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-brand-400 font-semibold">
                    {file.detected_format || 'N/A'}
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
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition-colors text-[11px] shadow-sm shadow-brand-600/30"
                        title="Process / Convert file"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Process</span>
                      </button>
                      <button
                        onClick={() => onDownloadFile(file.id)}
                        className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 transition-colors"
                        title="Download original file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteFile(file.id)}
                        className="p-1.5 rounded-lg bg-surface-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

