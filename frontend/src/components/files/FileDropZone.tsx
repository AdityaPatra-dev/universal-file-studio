import React, { useRef, useState } from 'react';
import { 
  UploadCloud, FolderUp, FileUp, Shield, Sparkles, CheckCircle2, 
  Film, Music, Image as ImageIcon, FileText, Archive
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
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 transition-all text-center flex flex-col items-center justify-center ${
        isDragOver
          ? 'border-brand-500 bg-brand-500/10 scale-[1.01] shadow-2xl shadow-brand-500/10'
          : 'border-surface-700 bg-surface-900/40 hover:border-surface-600 hover:bg-surface-900/60'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
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

      <div className="h-20 w-20 rounded-3xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-5 shadow-xl shadow-brand-500/5">
        <UploadCloud className="h-10 w-10 animate-pulse" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
        Drop files or folders anywhere to start
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
        Convert, compress, extract, merge, split, or inspect. All processing happens 100% locally on your machine with zero cloud uploads.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-7">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-brand-600/30 hover:shadow-brand-500/40 disabled:opacity-50 cursor-pointer"
        >
          <FileUp className="h-4 w-4" />
          <span>Select Files</span>
        </button>
        <button
          onClick={() => folderInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 font-semibold text-xs sm:text-sm border border-surface-700 transition-all disabled:opacity-50 cursor-pointer"
          title="Import an entire folder of files for batch conversion or archive bundling"
        >
          <FolderUp className="h-4 w-4 text-slate-400" />
          <span>Select Folder</span>
        </button>
      </div>

      {/* Uploading State */}
      {isUploading && (
        <div className="w-full max-w-md bg-surface-800/80 rounded-2xl p-4 border border-surface-700 mb-6 animate-pulse">
          <div className="flex justify-between text-xs text-slate-300 font-medium mb-2">
            <span>Importing and verifying files...</span>
            <span className="font-mono">{uploadProgress || 100}%</span>
          </div>
          <div className="w-full h-2 bg-surface-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress || 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Supported Format Pills (Crucial Beginner Feature) */}
      <div className="w-full max-w-2xl pt-5 border-t border-surface-800/80 mb-5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
          Supported Format Categories
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800/70 border border-surface-700/60 text-purple-300 font-medium">
            <Film className="h-3 w-3 text-purple-400" />
            <span>Video (MP4, MKV, WebM, MOV)</span>
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800/70 border border-surface-700/60 text-amber-300 font-medium">
            <Music className="h-3 w-3 text-amber-400" />
            <span>Audio (MP3, WAV, FLAC, AAC)</span>
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800/70 border border-surface-700/60 text-emerald-300 font-medium">
            <ImageIcon className="h-3 w-3 text-emerald-400" />
            <span>Image (PNG, JPG, WebP, GIF, SVG)</span>
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800/70 border border-surface-700/60 text-rose-300 font-medium">
            <FileText className="h-3 w-3 text-rose-400" />
            <span>Docs & Books (PDF, DOCX, EPUB)</span>
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800/70 border border-surface-700/60 text-blue-300 font-medium">
            <Archive className="h-3 w-3 text-blue-400" />
            <span>Archives (ZIP, 7Z, TAR, RAR, CBZ)</span>
          </span>
        </div>
      </div>

      {/* Security & Feature Badges */}
      <div className="flex flex-wrap justify-center items-center gap-5 text-xs text-slate-400 pt-3">
        <div className="flex items-center space-x-1.5">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Localhost Isolation (No Cloud)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Sparkles className="h-4 w-4 text-brand-400" />
          <span>Magic Byte Header Detection</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <CheckCircle2 className="h-4 w-4 text-indigo-400" />
          <span>CLI Engines Hardware Acceleration</span>
        </div>
      </div>
    </div>
  );
};
