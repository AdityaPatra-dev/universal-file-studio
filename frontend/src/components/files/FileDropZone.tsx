import React, { useRef, useState } from 'react';
import { 
  UploadCloud, FolderUp, FileUp, Sparkles,
  Film, Music, Image as ImageIcon, FileText, Archive, Camera
} from 'lucide-react';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
  uploadProgress?: number;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  isUploading,
  uploadProgress
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-10 transition-all text-center flex flex-col items-center justify-center ${
        isDragOver
          ? 'border-brand-500 bg-brand-500/10 scale-[1.01] shadow-xl shadow-brand-500/10'
          : 'border-surface-800 bg-surface-900/60 hover:border-surface-700 hover:bg-surface-900/80'
      }`}
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Upload Icon */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-gradient-to-tr from-brand-600/20 to-cyan-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-4 shadow-lg shadow-brand-500/10 cursor-pointer btn-press group"
      >
        <UploadCloud className="h-8 w-8 sm:h-10 sm:w-10 text-brand-400 group-hover:scale-110 transition-transform" />
      </div>

      <h2 className="text-lg sm:text-2xl font-bold text-white mb-1.5 tracking-tight">
        Drop files here or choose below
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        Convert, compress, merge, split, or inspect. Zero cloud uploads.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-6 w-full max-w-md">
        {/* Media Button */}
        <button
          onClick={() => mediaInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 min-w-[130px] flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/25 disabled:opacity-50 btn-press cursor-pointer"
        >
          <Camera className="h-4 w-4" />
          <span>Photos & Videos</span>
        </button>

        {/* All Files Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 min-w-[130px] flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-surface-850 hover:bg-surface-800 text-slate-200 font-semibold text-xs sm:text-sm border border-surface-700/80 disabled:opacity-50 btn-press cursor-pointer"
        >
          <FileUp className="h-4 w-4 text-brand-400" />
          <span>Select Files</span>
        </button>

        {/* Folder Upload (Desktop) */}
        <button
          onClick={() => folderInputRef.current?.click()}
          disabled={isUploading}
          className="hidden sm:flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-surface-850 hover:bg-surface-800 text-slate-300 font-medium text-xs sm:text-sm border border-surface-700/60 disabled:opacity-50 btn-press cursor-pointer"
          title="Upload an entire directory"
        >
          <FolderUp className="h-4 w-4 text-slate-400" />
          <span>Folder</span>
        </button>
      </div>

      {/* Progress Bar when uploading */}
      {isUploading && (
        <div className="w-full max-w-md mb-4 space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-brand-300 font-medium px-1">
            <span>Importing files...</span>
            <span>{uploadProgress || 60}%</span>
          </div>
          <div className="w-full bg-surface-850 h-2 rounded-full overflow-hidden border border-surface-700">
            <div
              className="bg-gradient-to-r from-brand-500 to-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress || 60}%` }}
            />
          </div>
        </div>
      )}

      {/* Format Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-surface-800/80 w-full max-w-lg">
        {[
          { label: 'Images', icon: ImageIcon, color: 'text-cyan-400' },
          { label: 'Videos', icon: Film, color: 'text-violet-400' },
          { label: 'Documents', icon: FileText, color: 'text-amber-400' },
          { label: 'Audio', icon: Music, color: 'text-rose-400' },
          { label: 'ZIP Archives', icon: Archive, color: 'text-emerald-400' },
        ].map((cat, i) => {
          const Icon = cat.icon;
          return (
            <span
              key={i}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-surface-850/80 border border-surface-700/50 text-[11px] font-medium text-slate-300"
            >
              <Icon className={`h-3 w-3 ${cat.color}`} />
              <span>{cat.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
