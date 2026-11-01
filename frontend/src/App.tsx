import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { FileDropZone } from './components/files/FileDropZone';
import { FileList } from './components/files/FileList';
import { FileProcessModal } from './components/files/FileProcessModal';
import { BatchProcessModal } from './components/files/BatchProcessModal';
import { FileInspectorModal } from './components/files/FileInspectorModal';
import { JobList } from './components/jobs/JobList';
import { PipelineEditor } from './components/pipeline/PipelineEditor';
import { EngineManager } from './components/system/EngineManager';
import { Diagnostics } from './components/system/Diagnostics';
import { SettingsView } from './components/system/SettingsView';
import { DeveloperHub } from './components/developer/DeveloperHub';
import { HelpGuideModal } from './components/common/HelpGuideModal';
import { MobileConnectModal } from './components/common/MobileConnectModal';
import { BottomNav } from './components/layout/BottomNav';
import { api } from './services/api';
import { socketService } from './services/socket';
import { universalEngine, EngineMode } from './services/universalEngine';
import { FileRecord, Job, EngineInfo, SystemDiagnostics, AppSetting } from './types/api';
import { Sparkles, X, GitMerge, Layers, Flame, ArrowRight, Wand2 } from 'lucide-react';
import { ProcessDirectory } from './components/processes/ProcessDirectory';
import { ProcessRunnerModal } from './components/processes/ProcessRunnerModal';
import { findToolById, StudioTool } from './data/catalog';

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('upload');
  const [engineMode, setEngineMode] = useState<EngineMode>(universalEngine.getMode());
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [engines, setEngines] = useState<EngineInfo[]>([]);
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [settings, setSettings] = useState<AppSetting[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFileForProcess, setSelectedFileForProcess] = useState<FileRecord | null>(null);
  const [inspectingFile, setInspectingFile] = useState<FileRecord | null>(null);
  const [batchModal, setBatchModal] = useState<{
    isOpen: boolean;
    files: FileRecord[];
    mode: 'convert' | 'compress' | 'archive';
  }>({
    isOpen: false,
    files: [],
    mode: 'convert',
  });

  // UI state for modals & drawers
  const [isHelpGuideOpen, setIsHelpGuideOpen] = useState(false);
  const [isMobileConnectOpen, setIsMobileConnectOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [uploadNotification, setUploadNotification] = useState<{
    files: FileRecord[];
    message: string;
  } | null>(null);
  const [pipelinePreSelectedFileIds, setPipelinePreSelectedFileIds] = useState<number[]>([]);
  const [pipelineViewMode, setPipelineViewMode] = useState<'directory' | 'builder'>('directory');
  const [dashboardTool, setDashboardTool] = useState<StudioTool | null>(null);

  // Load all initial data
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [filesData, jobsData, enginesData, diagData, settingsData] = await Promise.all([
        api.listFiles(),
        api.listJobs(),
        api.getEngines(),
        api.getDiagnostics(),
        api.getSettings(),
      ]);
      setFiles(filesData);
      setJobs(jobsData);
      setEngines(enginesData);
      setDiagnostics(diagData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubMode = universalEngine.onModeChange((mode) => setEngineMode(mode));
    loadData();

    if (engineMode === 'desktop') {
      socketService.connect();

      const unsubProgress = socketService.on('job:progress', (pkt) => {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === pkt.job_id
              ? { ...j, progress_percent: pkt.percent, status: 'running' }
              : j
          )
        );
      });

      const unsubCompleted = socketService.on('job:completed', () => {
        api.listJobs().then(setJobs).catch(() => {});
        api.listFiles().then(setFiles).catch(() => {});
      });

      const unsubFailed = socketService.on('job:failed', () => {
        api.listJobs().then(setJobs).catch(() => {});
      });

      const unsubCancelled = socketService.on('job:cancelled', () => {
        api.listJobs().then(setJobs).catch(() => {});
      });

      return () => {
        unsubMode();
        unsubProgress();
        unsubCompleted();
        unsubFailed();
        unsubCancelled();
      };
    }

    return () => {
      unsubMode();
    };
  }, [loadData, engineMode]);

  // Polling for jobs when any job is active
  useEffect(() => {
    const hasActiveJobs = jobs.some(j => ['pending', 'queued', 'running'].includes(j.status));
    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      api.listJobs().then(setJobs).catch(() => {});
    }, 800);

    return () => clearInterval(interval);
  }, [jobs]);

  // Handle files selected for upload (P1 Fixed: Predictable notification banner instead of surprise modal)
  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress(20);
    try {
      setUploadProgress(60);
      const uploaded = await api.uploadFiles(selectedFiles);
      setUploadProgress(100);
      setFiles(prev => [...uploaded, ...prev]);

      // Check if files came from a folder
      const folderNames = Array.from(new Set(
        selectedFiles
          .map(f => (f as any).webkitRelativePath ? (f as any).webkitRelativePath.split('/')[0] : null)
          .filter(Boolean)
      ));
      const folderLabel = folderNames.length > 0 ? `folder "${folderNames[0]}" (${uploaded.length} files)` : null;

      // Provide non-intrusive action notification banner
      setUploadNotification({
        files: uploaded,
        message: folderLabel
          ? `Imported ${folderLabel} successfully!`
          : (uploaded.length === 1
              ? `Imported "${uploaded[0].filename}" successfully!`
              : `Imported ${uploaded.length} files successfully!`)
      });
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (id: number) => {
    try {
      await api.deleteFile(id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      alert('Failed to delete file');
    }
  };

  const handleBatchDelete = async (ids: number[]) => {
    try {
      await Promise.all(ids.map(id => api.deleteFile(id)));
      setFiles(prev => prev.filter(f => !ids.includes(f.id)));
    } catch (err) {
      alert('Failed to delete some files');
    }
  };

  const handleBatchAction = (selectedFiles: FileRecord[], mode: 'convert' | 'compress' | 'archive') => {
    setBatchModal({
      isOpen: true,
      files: selectedFiles,
      mode,
    });
  };

  const handleBatchPipeline = (selectedFiles: FileRecord[]) => {
    setPipelinePreSelectedFileIds(selectedFiles.map(f => f.id));
    setPipelineViewMode('builder');
    setCurrentTab('pipelines');
  };

  const handleInspectFile = (file: FileRecord) => {
    setInspectingFile(file);
  };

  const handleTriggerStripMetadata = async (file: FileRecord) => {
    try {
      await api.createJob({
        file_id: file.id,
        operation: 'strip_metadata',
        engine_used: 'imagemagick',
        parameters: {},
      });
      setInspectingFile(null);
      const updatedJobs = await api.listJobs();
      setJobs(updatedJobs);
      setCurrentTab('jobs');
    } catch (err: any) {
      alert(`Failed to start metadata sanitization: ${err.message}`);
    }
  };

  const handleDownloadFile = async (id: number) => {
    try {
      const url = await universalEngine.getFileDownloadUrl(id);
      const a = document.createElement('a');
      a.href = url;
      const f = files.find((item) => item.id === id);
      a.download = f?.filename || `file_${id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(api.getFileDownloadUrl(id), '_blank');
    }
  };

  const handleCancelJob = async (id: string) => {
    try {
      await api.cancelJob(id);
      const updated = await api.listJobs();
      setJobs(updated);
    } catch (err) {
      alert('Failed to cancel job');
    }
  };

  const handleRetryJob = async (id: string) => {
    try {
      await api.retryJob(id);
      const updated = await api.listJobs();
      setJobs(updated);
    } catch (err) {
      alert('Failed to retry job');
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await api.deleteJob(id);
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (err) {
      alert('Failed to delete job');
    }
  };

  const handleClearCompletedJobs = async () => {
    const completed = jobs.filter(j => j.status === 'completed');
    try {
      await Promise.all(completed.map(j => api.deleteJob(j.id)));
      setJobs(prev => prev.filter(j => j.status !== 'completed'));
    } catch (err) {
      alert('Failed to clear some completed jobs');
    }
  };

  const handleRetryAllFailedJobs = async () => {
    const failed = jobs.filter(j => j.status === 'failed');
    try {
      await Promise.all(failed.map(j => api.retryJob(j.id)));
      const updated = await api.listJobs();
      setJobs(updated);
    } catch (err) {
      alert('Failed to retry some jobs');
    }
  };

  const handleDownloadOutput = async (id: string) => {
    try {
      const url = await universalEngine.getJobDownloadUrl(id);
      const a = document.createElement('a');
      a.href = url;
      const job = jobs.find((j) => j.id === id);
      a.download = job?.output_filename || `result_${id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(api.getJobDownloadUrl(id), '_blank');
    }
  };

  const handleRescanEngines = async () => {
    try {
      setIsRefreshing(true);
      const updatedEngines = await api.rescanEngines();
      setEngines(updatedEngines);
      const updatedDiag = await api.getDiagnostics();
      setDiagnostics(updatedDiag);
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeJobsCount = jobs.filter(j => ['pending', 'queued', 'running'].includes(j.status)).length;

  return (
    <div className="flex flex-col h-screen bg-surface-950 text-slate-100 overflow-hidden">
      {/* Global Header */}
      <Header
        activeJobsCount={activeJobsCount}
        engineMode={engineMode}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
        onNavigateTab={setCurrentTab}
        onOpenHelpGuide={() => setIsHelpGuideOpen(true)}
        onOpenMobileConnect={() => setIsMobileConnectOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          filesCount={files.length}
          jobsCount={jobs.length}
          engines={engines}
          mobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content View with responsive padding for mobile bottom bar */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
            {/* Tab 1: Studio Dashboard / Upload */}
            {currentTab === 'upload' && (
              <div className="space-y-6 sm:space-y-8">
                {/* Post-Upload Action Banner */}
                {uploadNotification && (
                  <div className="p-4 rounded-3xl bg-gradient-to-r from-brand-600/20 to-indigo-600/20 border border-brand-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-2xl bg-brand-500/20 text-brand-300">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs sm:text-sm">{uploadNotification.message}</div>
                        <div className="text-[11px] text-slate-400">Choose what you want to do with the uploaded files:</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {uploadNotification.files.length === 1 && (
                        <button
                          onClick={() => {
                            setSelectedFileForProcess(uploadNotification.files[0]);
                            setUploadNotification(null);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/30 transition-all btn-press"
                        >
                          Process File Now →
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setPipelinePreSelectedFileIds(uploadNotification.files.map(f => f.id));
                          setCurrentTab('pipelines');
                          setUploadNotification(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-200 font-semibold text-xs border border-surface-700/60 transition-all btn-press flex items-center gap-1.5"
                      >
                        <GitMerge className="h-3.5 w-3.5 text-brand-400" />
                        <span>Workflows Studio</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTab('files');
                          setUploadNotification(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-200 font-semibold text-xs border border-surface-700/60 transition-all btn-press"
                      >
                        View Library
                      </button>
                      <button
                        onClick={() => setUploadNotification(null)}
                        className="p-1.5 text-slate-400 hover:text-white btn-press ml-1"
                        title="Dismiss notification"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                <FileDropZone
                  onFilesSelected={handleFilesSelected}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                />

                {/* Quick 1-Tap Offline Tools */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Flame className="h-3.5 w-3.5" />
                      </span>
                      <h3 className="text-sm font-bold text-white tracking-tight">Popular Quick Tools</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPipelineViewMode('directory');
                        setCurrentTab('pipelines');
                      }}
                      className="text-xs text-brand-400 hover:text-brand-300 font-bold btn-press flex items-center gap-1"
                    >
                      <span>All 102+ Tools</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {[
                      { id: 'pdf_merge', label: 'Merge PDF', sub: 'iLovePDF Parity', color: 'from-amber-500 to-orange-600' },
                      { id: 'pdf_to_docx', label: 'PDF to Word', sub: 'Pandoc / Libre', color: 'from-amber-600 to-red-600' },
                      { id: 'pdf_compress', label: 'Compress PDF', sub: 'Ghostscript Lossless', color: 'from-orange-500 to-amber-600' },
                      { id: 'video_trim', label: 'Trim Video', sub: 'Fast Seek Cut', color: 'from-indigo-500 to-violet-600' },
                      { id: 'pdf_images_to_pdf', label: 'Photos to PDF', sub: '1-Tap Document', color: 'from-cyan-500 to-blue-600' },
                      { id: 'archive_extract', label: 'Unpack Archive', sub: 'ZIP, 7Z, RAR, TAR', color: 'from-emerald-500 to-teal-600' },
                    ].map((qt) => (
                      <button
                        key={qt.id}
                        type="button"
                        onClick={() => {
                          const tool = findToolById(qt.id);
                          if (tool) setDashboardTool(tool);
                        }}
                        className="p-3 rounded-2xl bg-surface-900 border border-surface-750/70 hover:border-brand-500/50 text-left transition-all btn-press group flex flex-col justify-between shadow-sm"
                      >
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${qt.color} text-white w-fit shadow-md group-hover:scale-105 transition-transform`}>
                          <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <div className="mt-2.5">
                          <div className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors leading-tight truncate">
                            {qt.label}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {qt.sub}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white tracking-tight">Recent Files</h3>
                      <button
                        onClick={() => setCurrentTab('files')}
                        className="text-xs text-brand-400 hover:text-brand-300 font-semibold btn-press"
                      >
                        View all {files.length} →
                      </button>
                    </div>
                    <FileList
                      files={files.slice(0, 5)}
                      onSelectFileForProcess={setSelectedFileForProcess}
                      onDeleteFile={handleDeleteFile}
                      onDownloadFile={handleDownloadFile}
                      onInspectFile={handleInspectFile}
                      onBatchPipeline={handleBatchPipeline}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: File Library */}
            {currentTab === 'files' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">File Library</h2>
                  <span className="text-xs text-slate-400 font-mono">{files.length} {files.length === 1 ? 'file' : 'files'}</span>
                </div>
                <FileList
                  files={files}
                  onSelectFileForProcess={setSelectedFileForProcess}
                  onDeleteFile={handleDeleteFile}
                  onDownloadFile={handleDownloadFile}
                  onInspectFile={handleInspectFile}
                  onBatchAction={handleBatchAction}
                  onBatchDelete={handleBatchDelete}
                  onBatchPipeline={handleBatchPipeline}
                />
              </div>
            )}

            {/* Tab 3: Tools & Pipelines Studio */}
            {currentTab === 'pipelines' && (
              <div className="space-y-6">
                {/* Mode Switcher */}
                <div className="flex items-center justify-between bg-surface-900/90 p-1.5 rounded-2xl border border-surface-750/70 max-w-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setPipelineViewMode('directory')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all btn-press flex items-center justify-center gap-2 ${
                      pipelineViewMode === 'directory'
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>102+ Tools Directory</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPipelineViewMode('builder')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all btn-press flex items-center justify-center gap-2 ${
                      pipelineViewMode === 'builder'
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <GitMerge className="h-3.5 w-3.5" />
                    <span>Workflows Builder</span>
                  </button>
                </div>

                {pipelineViewMode === 'directory' ? (
                  <ProcessDirectory
                    libraryFiles={files}
                    onJobStarted={async () => {
                      const updatedJobs = await api.listJobs();
                      setJobs(updatedJobs);
                      setCurrentTab('jobs');
                    }}
                    onFilesUploaded={(newFiles) => setFiles((prev) => [...newFiles, ...prev])}
                    onOpenPipelineEditor={() => setPipelineViewMode('builder')}
                  />
                ) : (
                  <PipelineEditor
                    files={files}
                    preSelectedFileIds={pipelinePreSelectedFileIds}
                    onJobStarted={async () => {
                      const updatedJobs = await api.listJobs();
                      setJobs(updatedJobs);
                      setCurrentTab('jobs');
                    }}
                  />
                )}
              </div>
            )}

            {/* Tab 4: Job Queue & History */}
            {currentTab === 'jobs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Job Queue</h2>
                  <span className="text-xs text-slate-400 font-mono">{jobs.length} total</span>
                </div>
                <JobList
                  jobs={jobs}
                  onCancelJob={handleCancelJob}
                  onRetryJob={handleRetryJob}
                  onDeleteJob={handleDeleteJob}
                  onDownloadOutput={handleDownloadOutput}
                  onClearCompleted={handleClearCompletedJobs}
                  onRetryAllFailed={handleRetryAllFailedJobs}
                />
              </div>
            )}

            {/* Tab 5: Engines & Tools */}
            {currentTab === 'engines' && (
              <EngineManager
                engines={engines}
                onRescan={handleRescanEngines}
                isRescanning={isRefreshing}
              />
            )}

            {/* Tab 6: System Diagnostics */}
            {currentTab === 'diagnostics' && (
              <Diagnostics 
                diagnostics={diagnostics} 
                onRefresh={loadData}
                isRefreshing={isRefreshing}
              />
            )}

            {/* Tab 7: Developer Hub */}
            {currentTab === 'developer' && (
              <DeveloperHub />
            )}

            {/* Tab 8: Settings */}
            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                onRefresh={loadData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Process File Modal */}
      <FileProcessModal
        file={selectedFileForProcess}
        onClose={() => setSelectedFileForProcess(null)}
        onJobStarted={async () => {
          const updatedJobs = await api.listJobs();
          setJobs(updatedJobs);
          setCurrentTab('jobs');
        }}
      />

      {/* Batch Process Modal */}
      {batchModal.isOpen && (
        <BatchProcessModal
          files={batchModal.files}
          initialMode={batchModal.mode}
          onClose={() => setBatchModal({ isOpen: false, files: [], mode: 'convert' })}
          onBatchStarted={async () => {
            const updatedJobs = await api.listJobs();
            setJobs(updatedJobs);
            setCurrentTab('jobs');
          }}
        />
      )}

      {/* Advanced File Inspector Modal */}
      {inspectingFile && (
        <FileInspectorModal
          file={inspectingFile}
          onClose={() => setInspectingFile(null)}
          onTriggerStripMetadata={handleTriggerStripMetadata}
        />
      )}

      {/* Help & Features Guide Modal */}
      <HelpGuideModal
        isOpen={isHelpGuideOpen}
        onClose={() => setIsHelpGuideOpen(false)}
        onNavigateTab={(tab) => setCurrentTab(tab as TabType)}
      />

      {/* Mobile Connect QR Code Modal */}
      <MobileConnectModal
        isOpen={isMobileConnectOpen}
        onClose={() => setIsMobileConnectOpen(false)}
      />

      {/* Dashboard Quick Tool Runner Modal */}
      {dashboardTool && (
        <ProcessRunnerModal
          tool={dashboardTool}
          isOpen={Boolean(dashboardTool)}
          onClose={() => setDashboardTool(null)}
          libraryFiles={files}
          onJobStarted={async () => {
            const updatedJobs = await api.listJobs();
            setJobs(updatedJobs);
            setCurrentTab('jobs');
          }}
          onFilesUploaded={(newFiles) => setFiles((prev) => [...newFiles, ...prev])}
        />
      )}

      {/* Mobile Adaptive Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        filesCount={files.length}
        jobsCount={jobs.length}
        activeJobsCount={activeJobsCount}
        engines={engines}
        onOpenMobileConnect={() => setIsMobileConnectOpen(true)}
        onOpenHelpGuide={() => setIsHelpGuideOpen(true)}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}

export default App;
