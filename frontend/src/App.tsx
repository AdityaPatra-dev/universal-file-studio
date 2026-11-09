import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { FileDropZone } from './components/files/FileDropZone';
import { FileList } from './components/files/FileList';
import { JobList } from './components/jobs/JobList';
import { BottomNav } from './components/layout/BottomNav';
import { ProcessDirectory } from './components/processes/ProcessDirectory';
import { MediaViewerModal, MediaViewerTarget } from './components/common/MediaViewerModal';
import { api } from './services/api';
import { socketService } from './services/socket';
import { universalEngine, EngineMode } from './services/universalEngine';
import { FileRecord, Job, EngineInfo, SystemDiagnostics, AppSetting } from './types/api';
import { Sparkles, X, GitMerge, Layers, Flame, ArrowRight, Wand2 } from 'lucide-react';
import { updaterService, UpdateInfo } from './services/updater';
import { findToolById, StudioTool } from './data/catalog';

// Lazy loaded secondary views and modals to optimize bundle size and startup speed
const PipelineEditor = lazy(() => import('./components/pipeline/PipelineEditor').then(m => ({ default: m.PipelineEditor })));
const EngineManager = lazy(() => import('./components/system/EngineManager').then(m => ({ default: m.EngineManager })));
const Diagnostics = lazy(() => import('./components/system/Diagnostics').then(m => ({ default: m.Diagnostics })));
const SettingsView = lazy(() => import('./components/system/SettingsView').then(m => ({ default: m.SettingsView })));
const DeveloperHub = lazy(() => import('./components/developer/DeveloperHub').then(m => ({ default: m.DeveloperHub })));
const FileProcessModal = lazy(() => import('./components/files/FileProcessModal').then(m => ({ default: m.FileProcessModal })));
const BatchProcessModal = lazy(() => import('./components/files/BatchProcessModal').then(m => ({ default: m.BatchProcessModal })));
const FileInspectorModal = lazy(() => import('./components/files/FileInspectorModal').then(m => ({ default: m.FileInspectorModal })));
const ProcessRunnerModal = lazy(() => import('./components/processes/ProcessRunnerModal').then(m => ({ default: m.ProcessRunnerModal })));
const HelpGuideModal = lazy(() => import('./components/common/HelpGuideModal').then(m => ({ default: m.HelpGuideModal })));
const MobileConnectModal = lazy(() => import('./components/common/MobileConnectModal').then(m => ({ default: m.MobileConnectModal })));
const UpdateModal = lazy(() => import('./components/updates/UpdateModal').then(m => ({ default: m.UpdateModal })));

const LazyFallback = () => (
  <div className="flex flex-col items-center justify-center p-12 space-y-3">
    <div className="h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs text-slate-400 font-medium">Loading module...</span>
  </div>
);

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('pipelines');
  const [engineMode, setEngineMode] = useState<EngineMode>(universalEngine.getMode());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('ufs_theme') : null;
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('ufs_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };
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
  const [previewTarget, setPreviewTarget] = useState<MediaViewerTarget | null>(null);
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

  // Update checking state
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const checkUpdates = useCallback(async (openModal = false) => {
    setIsCheckingUpdate(true);
    try {
      const info = await updaterService.checkForUpdates();
      setUpdateInfo(info);
      if (openModal || info.hasUpdate) {
        setIsUpdateModalOpen(true);
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  }, []);

  useEffect(() => {
    checkUpdates(false);
  }, [checkUpdates]);

  // Load all initial data
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await universalEngine.detectMode().catch(() => {});
      const filesData = await universalEngine.listFiles().catch(() => []);
      setFiles(filesData);

      const [jobsData, enginesData, diagData, settingsData] = await Promise.all([
        universalEngine.listJobs().catch(() => []),
        universalEngine.getEngines().catch(() => []),
        universalEngine.getDiagnostics().catch(() => null),
        universalEngine.getSettings().catch(() => []),
      ]);
      setJobs(jobsData);
      setEngines(enginesData);
      if (diagData) setDiagnostics(diagData);
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
        universalEngine.listJobs().then(setJobs).catch(() => {});
        universalEngine.listFiles().then(setFiles).catch(() => {});
      });

      const unsubFailed = socketService.on('job:failed', () => {
        universalEngine.listJobs().then(setJobs).catch(() => {});
      });

      const unsubCancelled = socketService.on('job:cancelled', () => {
        universalEngine.listJobs().then(setJobs).catch(() => {});
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
      universalEngine.listJobs().then(setJobs).catch(() => {});
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
      const uploaded = await universalEngine.uploadFiles(selectedFiles);
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
      await universalEngine.deleteFile(id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      alert('Failed to delete file');
    }
  };

  const handleBatchDelete = async (ids: number[]) => {
    try {
      await Promise.all(ids.map(id => universalEngine.deleteFile(id)));
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
      await universalEngine.createJob({
        file_id: file.id,
        operation: 'strip_metadata',
        engine_used: 'auto',
        parameters: {},
      });
      setInspectingFile(null);
      const updatedJobs = await universalEngine.listJobs();
      setJobs(updatedJobs);
      setCurrentTab('jobs');
    } catch (err: any) {
      alert(`Failed to start metadata sanitization: ${err.message}`);
    }
  };

  const handleDownloadFile = async (id: number) => {
    try {
      const res = await universalEngine.saveOrDownloadFile(id);
      console.log('File saved to:', res.displayPath);
    } catch {
      window.open(api.getFileDownloadUrl(id), '_blank');
    }
  };

  const handleCancelJob = async (id: string) => {
    try {
      await universalEngine.cancelJob(id);
      const updated = await universalEngine.listJobs();
      setJobs(updated);
    } catch (err) {
      alert('Failed to cancel job');
    }
  };

  const handleRetryJob = async (id: string) => {
    try {
      await universalEngine.retryJob(id);
      const updated = await universalEngine.listJobs();
      setJobs(updated);
    } catch (err) {
      alert('Failed to retry job');
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await universalEngine.deleteJob(id);
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (err) {
      alert('Failed to delete job');
    }
  };

  const handleClearCompletedJobs = async () => {
    try {
      await universalEngine.deleteJobsBulk('completed');
      setJobs(prev => prev.filter(j => j.status !== 'completed'));
    } catch (err) {
      console.warn('Failed to clear completed jobs', err);
    }
  };

  const handleCancelAllActiveJobs = async () => {
    const active = jobs.filter(j => ['pending', 'queued', 'running'].includes(j.status));
    try {
      await Promise.all(active.map(j => universalEngine.cancelJob(j.id).catch(() => {})));
      const updated = await universalEngine.listJobs();
      setJobs(updated);
    } catch (err) {
      console.warn('Failed to cancel active jobs', err);
    }
  };

  const handleClearAllJobs = async () => {
    try {
      await universalEngine.deleteJobsBulk();
      setJobs([]);
    } catch (err) {
      console.warn('Failed to clear all jobs', err);
    }
  };

  const handleRetryAllFailedJobs = async () => {
    const failed = jobs.filter(j => j.status === 'failed');
    try {
      await Promise.all(failed.map(j => universalEngine.retryJob(j.id)));
      const updated = await universalEngine.listJobs();
      setJobs(updated);
    } catch (err) {
      alert('Failed to retry some jobs');
    }
  };

  const handleDownloadOutput = async (id: string) => {
    try {
      const res = await universalEngine.saveOrDownloadJobOutput(id);
      console.log('Output saved to:', res.displayPath);
    } catch {
      window.open(api.getJobDownloadUrl(id), '_blank');
    }
  };

  const handleRescanEngines = async () => {
    try {
      setIsRefreshing(true);
      const updatedEngines = await universalEngine.getEngines();
      setEngines(updatedEngines);
      const updatedDiag = await universalEngine.getDiagnostics();
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
        theme={theme}
        onToggleTheme={toggleTheme}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
        onNavigateTab={setCurrentTab}
        onOpenHelpGuide={() => setIsHelpGuideOpen(true)}
        onOpenMobileConnect={() => setIsMobileConnectOpen(true)}
        onOpenUpdates={() => setIsUpdateModalOpen(true)}
        hasUpdate={Boolean(updateInfo?.hasUpdate)}
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

            {/* Tab: File Library */}
            {currentTab === 'files' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">File Library</h2>
                  <span className="text-xs text-slate-400 font-mono">{files.length} {files.length === 1 ? 'file' : 'files'}</span>
                </div>
                <FileDropZone onFilesSelected={handleFilesSelected} isUploading={isUploading} uploadProgress={uploadProgress} />
                <FileList
                  files={files}
                  onSelectFileForProcess={(file: FileRecord) => setSelectedFileForProcess(file)}
                  onDeleteFile={handleDeleteFile}
                  onDownloadFile={handleDownloadFile}
                  onInspectFile={handleInspectFile}
                  onPreviewFile={(file) => setPreviewTarget({
                    id: file.id,
                    filename: file.filename,
                    mimeType: file.mime_type,
                    sizeBytes: file.size_bytes,
                    isJobOutput: false,
                  })}
                  onBatchAction={handleBatchAction}
                  onBatchDelete={handleBatchDelete}
                  onBatchPipeline={handleBatchPipeline}
                />
              </div>
            )}

            {/* Tab: Tools & Pipelines Studio (Default Front Page) */}
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
                      const updatedJobs = await universalEngine.listJobs();
                      setJobs(updatedJobs);
                      setCurrentTab('jobs');
                    }}
                    onFilesUploaded={(newFiles) => setFiles((prev) => [...newFiles, ...prev])}
                    onOpenPipelineEditor={() => setPipelineViewMode('builder')}
                  />
                ) : (
                  <Suspense fallback={<LazyFallback />}>
                    <PipelineEditor
                      files={files}
                      preSelectedFileIds={pipelinePreSelectedFileIds}
                      onJobStarted={async () => {
                        const updatedJobs = await universalEngine.listJobs();
                        setJobs(updatedJobs);
                        setCurrentTab('jobs');
                      }}
                    />
                  </Suspense>
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
                  onPreviewOutput={(job) => setPreviewTarget({
                    id: job.id,
                    filename: job.output_filename || 'output',
                    sizeBytes: job.output_size_bytes || undefined,
                    isJobOutput: true,
                  })}
                  onClearCompleted={handleClearCompletedJobs}
                  onRetryAllFailed={handleRetryAllFailedJobs}
                  onCancelAllActive={handleCancelAllActiveJobs}
                  onClearAll={handleClearAllJobs}
                />
              </div>
            )}

            {/* Tab 5: Engines & Tools */}
            {currentTab === 'engines' && (
              <Suspense fallback={<LazyFallback />}>
                <EngineManager
                  engines={engines}
                  onRescan={handleRescanEngines}
                  isRescanning={isRefreshing}
                />
              </Suspense>
            )}

            {/* Tab 6: System Diagnostics */}
            {currentTab === 'diagnostics' && (
              <Suspense fallback={<LazyFallback />}>
                <Diagnostics 
                  diagnostics={diagnostics} 
                  onRefresh={loadData}
                  isRefreshing={isRefreshing}
                />
              </Suspense>
            )}

            {/* Tab 7: Developer Hub */}
            {currentTab === 'developer' && (
              <Suspense fallback={<LazyFallback />}>
                <DeveloperHub />
              </Suspense>
            )}

            {/* Tab 8: Settings */}
            {currentTab === 'settings' && (
              <Suspense fallback={<LazyFallback />}>
                <SettingsView
                  settings={settings}
                  onRefresh={loadData}
                />
              </Suspense>
            )}
          </div>
        </main>
      </div>

      <Suspense fallback={null}>
        {/* Process File Modal */}
        {selectedFileForProcess && (
          <FileProcessModal
            file={selectedFileForProcess}
            onClose={() => setSelectedFileForProcess(null)}
            onJobStarted={async () => {
              const updatedJobs = await universalEngine.listJobs();
              setJobs(updatedJobs);
              setCurrentTab('jobs');
            }}
          />
        )}

        {/* Batch Process Modal */}
        {batchModal.isOpen && (
          <BatchProcessModal
            files={batchModal.files}
            initialMode={batchModal.mode}
            onClose={() => setBatchModal({ isOpen: false, files: [], mode: 'convert' })}
            onBatchStarted={async () => {
              const updatedJobs = await universalEngine.listJobs();
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
        {isHelpGuideOpen && (
          <HelpGuideModal
            isOpen={isHelpGuideOpen}
            onClose={() => setIsHelpGuideOpen(false)}
            onNavigateTab={(tab) => setCurrentTab(tab as TabType)}
          />
        )}

        {/* Mobile Connect QR Code Modal */}
        {isMobileConnectOpen && (
          <MobileConnectModal
            isOpen={isMobileConnectOpen}
            onClose={() => setIsMobileConnectOpen(false)}
          />
        )}

        {/* Dashboard Quick Tool Runner Modal */}
        {dashboardTool && (
          <ProcessRunnerModal
            tool={dashboardTool}
            isOpen={Boolean(dashboardTool)}
            onClose={() => setDashboardTool(null)}
            libraryFiles={files}
            onJobStarted={async () => {
              const updatedJobs = await universalEngine.listJobs();
              setJobs(updatedJobs);
              setCurrentTab('jobs');
            }}
            onFilesUploaded={(newFiles) => setFiles((prev) => [...newFiles, ...prev])}
          />
        )}

        {/* Software Updates Modal */}
        {isUpdateModalOpen && (
          <UpdateModal
            isOpen={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
            updateInfo={updateInfo}
            onRefresh={() => checkUpdates(true)}
            isChecking={isCheckingUpdate}
          />
        )}

        {/* In-App Embedded Media Viewer Modal */}
        {previewTarget && (
          <MediaViewerModal
            target={previewTarget}
            onClose={() => setPreviewTarget(null)}
            onSave={(target) => {
              if (target.isJobOutput && target.id) {
                handleDownloadOutput(String(target.id));
              } else if (target.id) {
                handleDownloadFile(Number(target.id));
              }
            }}
          />
        )}
      </Suspense>

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
