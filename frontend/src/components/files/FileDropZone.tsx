import React, { useRef, useState } from 'react';
import { 
  UploadCloud, FolderUp, FileUp, Shield, Sparkles, CheckCircle2, 
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
  const docInputRef = useRef<HTMLInputElement>(null);
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
      // reset value so re-selecting same file works
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-3xl p-5 sm:p-8 md:p-12 transition-all text-center flex flex-col items-center justify-center ${
        isDragOver
          ? 'border-brand-500 bg-brand-500/10 scale-[1.01] shadow-2xl shadow-brand-500/10'
          : 'border-surface-700 bg-surface-900/40 hover:border-surface-600 hover:bg-surface-900/60'
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
        ref={docInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.epub,.odt,.html,.md,.xlsx,.pptx"
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
        className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-gradient-to-tr from-brand-600/20 via-indigo-600/20 to-cyan-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-4 sm:mb-5 shadow-xl shadow-brand-500/10 cursor-pointer active:scale-95 transition-transform"
      >
        <UploadCloud className="h-8 w-8 sm:h-10 sm:w-10 animate-pulse text-brand-400" />
      </div>

      <h2 className="text-lg sm:text-2xl font-bold text-white mb-2 tracking-tight">
        Drop files here or tap to upload
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 max-w-lg mb-5 sm:mb-6 leading-relaxed px-2">
        Convert, compress, extract, merge, split, or inspect. All processing happens 100% locally on your machine with zero cloud uploads.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-6 w-full max-w-md">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-brand-600/30 hover:shadow-brand-500/40 disabled:opacity-50 cursor-pointer min-h-[46px]"
        >
          <FileUp className="h-4 w-4" />
          <span>Select Files</span>
        </button>

        {/* Mobile Quick Media Button */}
        <button
          onClick={() => mediaInputRef.current?.click()}
          disabled={isUploading}
          className="sm:hidden flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-surface-800 hover:bg-surface-700 text-purple-300 font-semibold text-xs border border-purple-500/30 transition-all disabled:opacity-50 cursor-pointer min-h-[46px]"
          title="Photos & Videos"
        >
          <Camera className="h-4 w-4 text-purple-400" />
          <span>Photos & Videos</span>
        </button>

        <button
          onClick={() => folderInputRef.current?.click()}
          disabled={isUploading}
          className="hidden sm:flex items-center space-x-2 px-5 py-3 rounded-2xl bg-surface-800 hover:bg-surface-700 text-slate-200 font-semibold text-xs sm:text-sm border border-surface-700 transition-all disabled:opacity-50 cursor-pointer min-h-[46px]"
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
              className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress || 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Supported Format Pills */}
      <div className="w-full max-w-2xl pt-4 sm:pt-5 border-t border-surface-800/80 mb-4 sm:mb-5">
        <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 sm:mb-2.5">
          Supported Format Categories
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px]">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800/70 border border-surface-700/60 text-purple-300 font-medium">
            <Film className="h-3 w-3 text-purple-400" />
            <span>Video (MP4, MKV, WebM, MOV, AVI)</span>
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800/70 border border-surface-700/60 text-amber-300 font-medium">
            <Music className="h-3 w-3 text-amber-400" />
            <span>Audio (MP3, WAV, FLAC, AAC, OGG)</span>
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800/70 border border-surface-700/60 text-emerald-300 font-medium">
            <ImageIcon className="h-3 w-3 text-emerald-400" />
            <span>Image (PNG, JPG, WebP, AVIF, GIF)</span>
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800/70 border border-surface-700/60 text-rose-300 font-medium">
            <FileText className="h-3 w-3 text-rose-400" />
            <span>Docs (PDF, DOCX, EPUB, TXT)</span>
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-800/70 border border-surface-700/60 text-blue-300 font-medium">
            <Archive className="h-3 w-3 text-blue-400" />
            <span>Archives (ZIP, 7Z, TAR, CBZ)</span>
          </span>
        </div>
      </div>

      {/* Security & Feature Badges */}
      <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-5 text-[11px] sm:text-xs text-slate-400 pt-2">
        <div className="flex items-center space-x-1.5">
          <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
          <span>Localhost Isolation (No Cloud)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-400 shrink-0" />
          <span>Auto Format Detection</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-400 shrink-0" />
          <span>Hardware Accelerated Engines</span>
        </div>
      </div>
    </div>
  );
};
