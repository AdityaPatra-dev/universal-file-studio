import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Play, Sliders, CheckCircle2, AlertCircle, FileText,
  UploadCloud, ArrowRight, Download, RefreshCw, Eye, EyeOff,
  FolderOpen, ChevronUp, ChevronDown, Check, Sparkles, FileArchive, Folder, FolderUp, FolderArchive,
  Share2, ExternalLink, FileCheck, Mic, Square
} from 'lucide-react';
import { StudioTool, ToolParameter } from '../../data/catalog/types';
import { FileRecord, Job } from '../../types/api';
import { api } from '../../services/api';
import { universalEngine } from '../../services/universalEngine';
import { formatBytes } from '../../utils/format';
import { CatalogIcon } from './CatalogIcon';

const EXT_TO_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mp3': 'audio/mpeg,audio/mp3',
  '.wav': 'audio/wav,audio/x-wav',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4,audio/x-m4a',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.epub': 'application/epub+zip',
  '.zip': 'application/zip,application/x-zip-compressed',
  '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.tar.gz': 'application/gzip,application/x-tar',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.md': 'text/markdown,text/plain',
  '.html': 'text/html',
};

function getAcceptFilter(formats: string[]): string | undefined {
  if (!formats || formats.length === 0 || formats.includes('*') || formats.includes('.*')) {
    return undefined;
  }
  const set = new Set<string>();
  for (const fmt of formats) {
    const lower = fmt.toLowerCase();
    set.add(lower);
    if (EXT_TO_MIME[lower]) {
      EXT_TO_MIME[lower].split(',').forEach((m) => set.add(m.trim()));
    }
  }
  return Array.from(set).join(',');
}

interface ProcessRunnerModalProps {
  tool: StudioTool | null;
  isOpen: boolean;
  onClose: () => void;
  preselectedFiles?: FileRecord[];
  initialParameters?: Record<string, any>;
  libraryFiles?: FileRecord[];
  onJobStarted?: (job?: Job) => void;
  onFilesUploaded?: (files: FileRecord[]) => void;
}

export const ProcessRunnerModal: React.FC<ProcessRunnerModalProps> = ({
  tool,
  isOpen,
  onClose,
  preselectedFiles = [],
  initialParameters = {},
  libraryFiles = [],
  onJobStarted,
  onFilesUploaded,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileRecord[]>([]);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [executionStage, setExecutionStage] = useState<string>('');
  const [completedJob, setCompletedJob] = useState<Job | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLibraryPicker, setShowLibraryPicker] = useState<boolean>(false);
  const [savedLocation, setSavedLocation] = useState<string | null>(null);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const [showLocationDetails, setShowLocationDetails] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const prevOpenRef = useRef(false);
  const prevToolIdRef = useRef<string | null>(null);

  // Audio Recording State for Microphone Tool
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const recFile = new File([audioBlob], `voice_recording_${Date.now()}.wav`, { type: 'audio/wav' });
        const uploaded = await universalEngine.uploadFiles([recFile]);
        onFilesUploaded?.(uploaded);
        setSelectedFiles(uploaded);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(`Microphone access error: ${err.message}. Please allow microphone permissions.`);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Initialize modal state on tool or file change (guarded against reference instability)
  useEffect(() => {
    const isOpening = isOpen && (!prevOpenRef.current || prevToolIdRef.current !== tool?.id);
    prevOpenRef.current = isOpen;
    prevToolIdRef.current = tool?.id || null;

    if (!isOpen || !tool) {
      setSelectedFiles([]);
      setParameters({});
      setIsExecuting(false);
      setCompletedJob(null);
      setErrorMessage(null);
      return;
    }

    if (isOpening) {
      // Initialize default parameters
      const initial: Record<string, any> = { ...(tool.defaultParameters || {}), ...(initialParameters || {}) };
      tool.parameters.forEach((param) => {
        if (initial[param.name] === undefined) {
          if (param.default !== undefined) {
            initial[param.name] = param.default;
          } else if (param.type === 'select' && param.options && param.options.length > 0) {
            initial[param.name] = param.options[0].value;
          } else if (param.type === 'boolean') {
            initial[param.name] = false;
          } else if (param.type === 'compression_tier') {
            initial[param.name] = 'recommended';
          } else if (param.type === 'alignment_grid') {
            initial[param.name] = 'center';
          }
        }
      });
      setParameters(initial);

      // Filter preselected files to match tool formats
      if (preselectedFiles && preselectedFiles.length > 0) {
        if (tool.acceptsMultipleFiles) {
          setSelectedFiles(preselectedFiles);
        } else {
          setSelectedFiles([preselectedFiles[0]]);
        }
      } else {
        setSelectedFiles([]);
      }

      setCompletedJob(null);
      setErrorMessage(null);
      setIsExecuting(false);
    }
  }, [isOpen, tool?.id]);

  // Detect if any files belong to a selected folder
  const detectedFolderName = useMemo(() => {
    for (const f of selectedFiles) {
      if (f.metadata_json?.folder) return f.metadata_json.folder;
      if (f.original_filename && f.original_filename.includes('/')) {
        return f.original_filename.split('/')[0];
      }
    }
    return null;
  }, [selectedFiles]);

  if (!isOpen || !tool) return null;

  // Format checks
  const isFormatMatching = (file: FileRecord): boolean => {
    if (tool.inputFormats.includes('*') || tool.inputFormats.includes('.*')) return true;
    const ext = '.' + file.filename.split('.').pop()?.toLowerCase();
    return tool.inputFormats.some((fmt) => fmt.toLowerCase() === ext);
  };

  const matchingLibraryFiles = libraryFiles.filter(isFormatMatching);

  // Handle local device file picker
  const handleDeviceFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setExecutionStage('Importing local files...');
    try {
      const filesArray = Array.from(fileList);
      const uploaded = await universalEngine.uploadFiles(filesArray);
      onFilesUploaded?.(uploaded);

      if (tool.acceptsMultipleFiles) {
        setSelectedFiles((prev) => [...prev, ...uploaded]);
      } else {
        setSelectedFiles([uploaded[0]]);
      }
    } catch (err: any) {
      setErrorMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setExecutionStage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleSelectFromLibrary = (file: FileRecord) => {
    if (tool.acceptsMultipleFiles) {
      if (!selectedFiles.some((f) => f.id === file.id)) {
        setSelectedFiles((prev) => [...prev, file]);
      }
    } else {
      setSelectedFiles([file]);
      setShowLibraryPicker(false);
    }
  };

  const handleRemoveFile = (id: number) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMoveFile = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= selectedFiles.length) return;
    const reordered = [...selectedFiles];
    const temp = reordered[index];
    reordered[index] = reordered[newIdx];
    reordered[newIdx] = temp;
    setSelectedFiles(reordered);
  };

  // Run the Tool Operation
  const handleExecute = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('Please select or upload at least one file to process.');
      return;
    }

    setIsExecuting(true);
    setErrorMessage(null);
    setProgressPercent(10);
    setExecutionStage(`Starting ${tool.name}...`);

    try {
      // Build effective parameters
      const runParams: Record<string, any> = { ...parameters };

      // Multi-file tools
      if (tool.acceptsMultipleFiles && selectedFiles.length > 1) {
        runParams.additional_file_ids = selectedFiles.slice(1).map((f) => f.id);
        runParams.all_file_ids = selectedFiles.map((f) => f.id);
      }

      const primaryFile = selectedFiles[0];

      setExecutionStage('Executing with high-performance engine...');
      setProgressPercent(30);

      const job = await universalEngine.createJob({
        file_id: primaryFile.id,
        operation: tool.operation,
        engine_used: tool.backendEngine,
        parameters: runParams,
      });

      onJobStarted?.(job);

      // Poll until completion or failure
      let finishedJob = job;
      let attempts = 0;
      const maxAttempts = 120; // 60 seconds

      while (['pending', 'queued', 'running'].includes(finishedJob.status) && attempts < maxAttempts) {
        attempts++;
        await new Promise((r) => setTimeout(r, 600));
        try {
          finishedJob = await universalEngine.getJob(finishedJob.id);
          setProgressPercent(Math.max(35, Math.min(95, finishedJob.progress_percent || 50)));
          if (finishedJob.progress_percent >= 50) {
            setExecutionStage('Processing streams & metadata...');
          }
        } catch {
          // Continue polling
        }
      }

      if (finishedJob.status === 'completed') {
        setProgressPercent(100);
        setExecutionStage('Finished successfully!');
        setCompletedJob(finishedJob);
      } else if (finishedJob.status === 'failed') {
        throw new Error(finishedJob.error_message || 'Processing failed.');
      } else {
        // Still running in background
        setCompletedJob(finishedJob);
      }
    } catch (err: any) {
      console.error('Execution error:', err);
      setErrorMessage(err.message || 'Operation failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownloadOutput = async () => {
    if (!completedJob) return;
    try {
      setIsSaving(true);
      const res = await universalEngine.saveOrDownloadJobOutput(completedJob.id);
      setSavedLocation(res.displayPath);
      if (res.filePath) setSavedFilePath(res.filePath);
      setShowLocationDetails(true);
      // Automatically prompt to open file in system viewer app (like WhatsApp)
      if (res.filePath) {
        await universalEngine.openFile(res.filePath, undefined, completedJob.output_filename || undefined);
      }
    } catch (err: any) {
      console.error('Download error:', err);
      try {
        const url = await universalEngine.getJobDownloadUrl(completedJob.id);
        const a = document.createElement('a');
        a.href = url;
        a.download = completedJob.output_filename || `result_${completedJob.id}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setSavedLocation(`Downloads/${completedJob.output_filename || 'processed_file'}`);
        setShowLocationDetails(true);
      } catch {
        window.open(api.getJobDownloadUrl(completedJob.id), '_blank');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenFile = async () => {
    if (!completedJob) return;
    try {
      let targetPath = savedFilePath || completedJob.output_path || completedJob.id;
      if (!savedFilePath && (!completedJob.output_path || !completedJob.output_path.startsWith('/'))) {
        try {
          const res = await universalEngine.saveOrDownloadJobOutput(completedJob.id);
          setSavedLocation(res.displayPath);
          if (res.filePath) {
            targetPath = res.filePath;
            setSavedFilePath(res.filePath);
          }
        } catch {}
      }
      await universalEngine.openFile(targetPath, undefined, completedJob.output_filename || undefined);
    } catch (err: any) {
      console.error('Failed to open file in viewer:', err);
      try {
        const url = await universalEngine.getJobDownloadUrl(completedJob.id);
        window.open(url, '_blank');
      } catch {}
    }
  };

  const handleShareFile = async () => {
    if (!completedJob) return;
    try {
      let targetPath = savedFilePath || completedJob.output_path || completedJob.id;
      if (!savedFilePath && (!completedJob.output_path || !completedJob.output_path.startsWith('/'))) {
        const res = await universalEngine.saveOrDownloadJobOutput(completedJob.id);
        if (res.filePath) targetPath = res.filePath;
      }
      await universalEngine.shareFile(targetPath, completedJob.output_filename);
    } catch (err: any) {
      console.error('Failed to share file:', err);
    }
  };

  // Render individual parameter control
  const renderParameterInput = (param: ToolParameter) => {
    const value = parameters[param.name];

    switch (param.type) {
      case 'compression_tier':
        return (
          <div key={param.name} className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">{param.label}</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'extreme',
                  label: 'Extreme Compression',
                  sub: 'Less quality, high compression',
                  badge: 'Smallest Size',
                },
                {
                  id: 'recommended',
                  label: 'Recommended Compression',
                  sub: 'Good quality, good compression',
                  badge: 'Most Popular',
                  isRecommended: true,
                },
                {
                  id: 'less',
                  label: 'Less Compression',
                  sub: 'High quality, less compression',
                  badge: 'Highest Quality',
                },
              ].map((tier) => {
                const isSelected = (value || 'recommended') === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setParameters({ ...parameters, [param.name]: tier.id })}
                    className={`p-3 rounded-2xl border text-left transition-all btn-press relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-brand-600/20 border-brand-500 shadow-md shadow-brand-500/20 text-white ring-1 ring-brand-500'
                        : 'bg-surface-900 border-surface-700/60 text-slate-300 hover:border-surface-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold leading-tight">{tier.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-brand-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{tier.sub}</p>
                    </div>
                    <span
                      className={`inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded-md font-mono self-start ${
                        isSelected
                          ? 'bg-brand-500/30 text-brand-300 font-semibold'
                          : 'bg-surface-800 text-slate-400'
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'alignment_grid':
        const positions = [
          { id: 'top-left', label: '↖' },
          { id: 'top-center', label: '↑' },
          { id: 'top-right', label: '↗' },
          { id: 'center-left', label: '←' },
          { id: 'center', label: '• Center' },
          { id: 'center-right', label: '→' },
          { id: 'bottom-left', label: '↙' },
          { id: 'bottom-center', label: '↓' },
          { id: 'bottom-right', label: '↘' },
        ];
        return (
          <div key={param.name} className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">{param.label}</label>
            <div className="grid grid-cols-3 gap-1.5 max-w-[260px]">
              {positions.map((pos) => {
                const isSelected = (value || 'center') === pos.id;
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setParameters({ ...parameters, [param.name]: pos.id })}
                    className={`py-2 px-1 text-center text-xs font-mono rounded-xl border transition-all btn-press ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-500 font-bold shadow-md shadow-brand-500/30'
                        : 'bg-surface-900 border-surface-700/60 text-slate-300 hover:border-surface-600'
                    }`}
                  >
                    {pos.label}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'pagerange':
        return (
          <div key={param.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">{param.label}</label>
              <span className="text-[11px] text-slate-400">e.g. 1-5, 8, 11-14</span>
            </div>
            <input
              type="text"
              value={value ?? ''}
              placeholder={param.placeholder || 'e.g. 1-3, 5'}
              onChange={(e) => setParameters({ ...parameters, [param.name]: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-900 border border-surface-700/60 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: 'All Pages', val: 'all' },
                { label: 'Pages 1-5', val: '1-5' },
                { label: 'Odd Pages', val: 'odd' },
                { label: 'Even Pages', val: 'even' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => setParameters({ ...parameters, [param.name]: chip.val })}
                  className="px-2.5 py-1 rounded-lg bg-surface-850 hover:bg-surface-800 border border-surface-700/50 text-[11px] text-slate-300 btn-press"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'timerange':
        return (
          <div key={param.name} className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">{param.label}</label>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Start Time (sec or mm:ss)</span>
                <input
                  type="text"
                  placeholder="00:00"
                  value={parameters['start_time'] ?? ''}
                  onChange={(e) => setParameters({ ...parameters, start_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700/60 text-white text-xs font-mono focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">End Time (sec or mm:ss)</span>
                <input
                  type="text"
                  placeholder="00:30"
                  value={parameters['end_time'] ?? ''}
                  onChange={(e) => setParameters({ ...parameters, end_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700/60 text-white text-xs font-mono focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        );

      case 'slider':
        const minVal = param.min ?? 0;
        const maxVal = param.max ?? 100;
        const currentVal = value ?? param.default ?? minVal;
        return (
          <div key={param.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">{param.label}</label>
              <span className="text-xs font-mono text-brand-300 font-bold bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-500/20">
                {currentVal} {param.unit || ''}
              </span>
            </div>
            <input
              type="range"
              min={minVal}
              max={maxVal}
              step={param.step ?? 1}
              value={currentVal}
              onChange={(e) => setParameters({ ...parameters, [param.name]: Number(e.target.value) })}
              className="w-full accent-brand-500 cursor-pointer h-1.5 bg-surface-800 rounded-lg"
            />
            {param.description && (
              <p className="text-[11px] text-slate-400 leading-snug">{param.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={param.name} className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">{param.label}</label>
            <div className="flex flex-wrap gap-1.5">
              {param.options?.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setParameters({ ...parameters, [param.name]: opt.value })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all btn-press flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-500 shadow-sm shadow-brand-500/30'
                        : 'bg-surface-900 border-surface-700/60 text-slate-300 hover:border-surface-600'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.badge && (
                      <span className="text-[10px] px-1 rounded bg-black/20 font-mono">
                        {opt.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {param.description && (
              <p className="text-[11px] text-slate-400 leading-snug">{param.description}</p>
            )}
          </div>
        );

      case 'password':
        const isVisible = showPassword[param.name] || false;
        return (
          <div key={param.name} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">{param.label}</label>
            <div className="relative">
              <input
                type={isVisible ? 'text' : 'password'}
                value={value ?? ''}
                placeholder={param.placeholder || 'Enter password...'}
                onChange={(e) => setParameters({ ...parameters, [param.name]: e.target.value })}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-surface-900 border border-surface-700/60 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, [param.name]: !isVisible })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {param.description && (
              <p className="text-[11px] text-slate-400 leading-snug">{param.description}</p>
            )}
          </div>
        );

      case 'boolean':
        const checked = Boolean(value);
        return (
          <div key={param.name} className="flex items-center justify-between py-1">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">{param.label}</span>
              {param.description && (
                <span className="text-[11px] text-slate-400 block">{param.description}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setParameters({ ...parameters, [param.name]: !checked })}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                checked ? 'bg-brand-600' : 'bg-surface-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform top-1 absolute ${
                  checked ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        );

      case 'text':
      default:
        return (
          <div key={param.name} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">{param.label}</label>
            <input
              type="text"
              value={value ?? ''}
              placeholder={param.placeholder || ''}
              onChange={(e) => setParameters({ ...parameters, [param.name]: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-900 border border-surface-700/60 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
            {param.description && (
              <p className="text-[11px] text-slate-400 leading-snug">{param.description}</p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 pb-24 sm:pb-4 pt-12 sm:pt-4">
      <div className="relative w-full max-w-2xl bg-surface-950 border border-surface-750/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[78vh] sm:max-h-[85vh] my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-surface-800/80 bg-surface-900/60 flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${tool.color} text-white shadow-lg`}>
              <CatalogIcon name={tool.iconName} className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {tool.name}
                </h3>
                {tool.badge === 'popular' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    🔥 Most Popular
                  </span>
                )}
                {tool.badge === 'top' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    ⚡ Top Tool
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{tool.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-800 transition-colors btn-press"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: File Selection Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {tool.acceptsMultipleFiles ? 'Input Files (Multiple Allowed)' : 'Input File'}
              </label>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>Supports:</span>
                <span className="font-mono text-slate-300">
                  {tool.inputFormats.slice(0, 4).join(', ')}
                  {tool.inputFormats.length > 4 ? ` +${tool.inputFormats.length - 4}` : ''}
                </span>
              </div>
            </div>

            {/* Live Microphone Recording Studio */}
            {tool.id === 'audio_record' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-surface-900 to-surface-900 border border-red-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${isRecording ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-surface-800 text-slate-400'}`}>
                      <Mic className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Built-in Voice Recorder</span>
                        {isRecording && (
                          <span className="flex items-center gap-1 text-[10px] text-red-400 font-mono font-semibold">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping inline-block" />
                            REC {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">Capture voice notes or live audio with your device microphone</div>
                    </div>
                  </div>
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 btn-press animate-pulse"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      <span>Stop & Save</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 btn-press"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      <span>Start Recording</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Selected File(s) List */}
            {selectedFiles.length > 0 ? (
              <div className="space-y-2">
                {/* Folder Identification Banner if files belong to a folder */}
                {detectedFolderName && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-950/40 border border-indigo-700/50 text-indigo-200">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                        <FolderArchive className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Folder Selected:</span>
                          <span className="text-indigo-300 font-mono">{detectedFolderName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {selectedFiles.length} file{selectedFiles.length === 1 ? '' : 's'} included
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedFiles.map((f, idx) => (
                  <div
                    key={`${f.id}-${idx}`}
                    className="p-3 rounded-2xl bg-surface-900 border border-surface-700/70 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="p-2 rounded-xl bg-surface-800 text-brand-400 flex-shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{f.filename}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                          {f.metadata_json?.folder && (
                            <span className="text-indigo-400 font-semibold font-mono">📁 {f.metadata_json.folder} •</span>
                          )}
                          <span>{formatBytes(f.size_bytes)} • {f.mime_type || 'binary'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {tool.acceptsMultipleFiles && (
                        <>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveFile(idx, 'up')}
                            className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === selectedFiles.length - 1}
                            onClick={() => handleMoveFile(idx, 'down')}
                            className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(f.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Allow adding more files if multi-file */}
                {tool.acceptsMultipleFiles && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-surface-850 border border-surface-700/60 text-xs text-slate-300 font-semibold btn-press flex items-center gap-1.5"
                    >
                      <UploadCloud className="h-3.5 w-3.5 text-brand-400" />
                      <span>Add More Files</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-surface-850 border border-surface-700/60 text-xs text-slate-300 font-semibold btn-press flex items-center gap-1.5"
                      title="Add an entire folder of files"
                    >
                      <FolderArchive className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Add Folder</span>
                    </button>
                    {matchingLibraryFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowLibraryPicker(!showLibraryPicker)}
                        className="px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-surface-850 border border-surface-700/60 text-xs text-slate-300 font-semibold btn-press flex items-center gap-1.5"
                      >
                        <FolderOpen className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Pick from Library</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Dropzone / Select Box when no file is chosen */
              <div className="border-2 border-dashed border-surface-700/80 hover:border-brand-500/60 rounded-3xl p-6 text-center bg-surface-900/40 transition-all flex flex-col items-center justify-center space-y-3">
                <div className="p-3.5 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Select input file or folder to begin</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose from your library or import from your device
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/30 transition-all btn-press flex items-center gap-1.5"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>{isUploading ? 'Importing...' : 'Browse Device Files'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3.5 py-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-200 font-semibold text-xs border border-surface-700 transition-all btn-press flex items-center gap-1.5"
                    title="Select an entire folder or directory from device"
                  >
                    <FolderArchive className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Select Folder</span>
                  </button>
                  {matchingLibraryFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowLibraryPicker(!showLibraryPicker)}
                      className="px-3.5 py-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-200 font-semibold text-xs border border-surface-700 transition-all btn-press flex items-center gap-1.5"
                    >
                      <FolderOpen className="h-3.5 w-3.5 text-indigo-400" />
                      <span>From Library ({matchingLibraryFiles.length})</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Hidden file and folder inputs */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleDeviceFilesSelected}
              multiple={tool.acceptsMultipleFiles}
              accept={getAcceptFilter(tool.inputFormats)}
              className="hidden"
            />
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleDeviceFilesSelected}
              multiple
              // @ts-ignore
              webkitdirectory="true"
              directory="true"
              className="hidden"
            />

            {/* Library Picker Dropdown Drawer */}
            {showLibraryPicker && matchingLibraryFiles.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-surface-900 border border-surface-700/80 space-y-2.5 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Matching Library Files:</span>
                  <button
                    type="button"
                    onClick={() => setShowLibraryPicker(false)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {matchingLibraryFiles.map((lf) => (
                    <button
                      key={lf.id}
                      type="button"
                      onClick={() => handleSelectFromLibrary(lf)}
                      className="w-full p-2.5 rounded-xl bg-surface-850 hover:bg-surface-800 border border-surface-700/50 flex items-center justify-between text-left transition-colors btn-press"
                    >
                      <div className="truncate mr-2">
                        <div className="text-xs font-semibold text-white truncate">{lf.filename}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatBytes(lf.size_bytes)}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-500/20">
                        Choose +
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Tool Configuration Parameters */}
          {tool.parameters.length > 0 && (
            <div className="space-y-4 pt-3 border-t border-surface-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-brand-400" />
                  <span>Tool Options & Parameters</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  Engine: {tool.backendEngine}
                </span>
              </div>

              <div className="space-y-4">{tool.parameters.map(renderParameterInput)}</div>
            </div>
          )}

          {/* Execution Progress & Status */}
          {isExecuting && (
            <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-brand-300 flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>{executionStage || 'Processing...'}</span>
                </span>
                <span className="font-mono font-bold text-white">{progressPercent}%</span>
              </div>
              <div className="w-full bg-surface-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start space-x-3 text-rose-200 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Completion Card */}
          {completedJob && completedJob.status === 'completed' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/15 border border-emerald-500/40 space-y-3.5 animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="font-bold text-sm text-white">Job Completed Successfully!</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {completedJob.duration_seconds ? `${completedJob.duration_seconds.toFixed(1)}s` : 'Instant'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-900/90 border border-surface-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div 
                  onClick={handleOpenFile}
                  className="truncate mr-2 cursor-pointer group flex items-center gap-2.5 flex-1 select-none"
                  title="Click to directly open file in external viewer"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500/30 transition-colors shrink-0">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                      <span>{completedJob.output_filename || 'Processed Output'}</span>
                      <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      {completedJob.output_size_bytes && <span>{formatBytes(completedJob.output_size_bytes)}</span>}
                      <span className="text-emerald-400/90 font-sans">• Tap to open in viewer</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Primary Direct Opener Button (Like WhatsApp) */}
                  <button
                    type="button"
                    onClick={handleOpenFile}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all btn-press flex items-center gap-1.5"
                    title="Open directly with viewer app (Google PDF, Photos, MX Player)"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open</span>
                  </button>

                  <button
                    onClick={handleDownloadOutput}
                    disabled={isSaving}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all btn-press flex items-center gap-1.5"
                    title="Save to Public Downloads folder"
                  >
                    {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    <span>{isSaving ? 'Saving...' : 'Download'}</span>
                  </button>

                  {/* File / Folder Location Icon just beside download option */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!savedLocation && completedJob) {
                        setSavedLocation(completedJob.output_path || `Downloads/${completedJob.output_filename || 'result'}`);
                      }
                      setShowLocationDetails(!showLocationDetails);
                    }}
                    className={`p-1.5 px-2 rounded-xl border transition-all btn-press flex items-center gap-1 text-xs font-semibold ${
                      showLocationDetails
                        ? 'bg-brand-500/25 text-brand-300 border-brand-500/50 shadow-sm'
                        : 'bg-surface-800 hover:bg-surface-750 text-slate-300 hover:text-white border-surface-700/70'
                    }`}
                    title="View file location on device"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-brand-400" />
                    <span className="text-[11px]">Location</span>
                  </button>
                </div>
              </div>

              {/* Saved File Location & Storage Inspection Card */}
              {(showLocationDetails || savedLocation) && (
                <div className="p-3 rounded-xl bg-surface-950/80 border border-brand-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <FileCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 text-left">
                      <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                        <span>Storage Location:</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {savedLocation ? 'Saved to Device' : 'Ready to Download'}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-brand-200 truncate select-all mt-0.5">
                        {savedLocation || completedJob.output_path || `Downloads/${completedJob.output_filename || 'result'}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={handleOpenFile}
                      className="px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-200 border border-surface-700 text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Open file with viewer"
                    >
                      <ExternalLink className="h-3 w-3 text-brand-400" />
                      <span>Open</span>
                    </button>
                    {savedFilePath && (
                      <button
                        type="button"
                        onClick={handleShareFile}
                        className="px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-200 border border-surface-700 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Share file"
                      >
                        <Share2 className="h-3 w-3 text-brand-400" />
                        <span>Share</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-surface-800/80 bg-surface-900/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-300 text-xs font-semibold border border-surface-700 transition-colors btn-press"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={isExecuting || isUploading || selectedFiles.length === 0}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all btn-press flex items-center gap-2 ${
              isExecuting || isUploading || selectedFiles.length === 0
                ? 'bg-surface-800 text-slate-500 cursor-not-allowed border border-surface-700'
                : `bg-gradient-to-r ${tool.color} text-white shadow-brand-500/20 hover:brightness-110 active:scale-95`
            }`}
          >
            {isExecuting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Run {tool.name}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

