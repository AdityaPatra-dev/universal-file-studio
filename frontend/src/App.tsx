import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { FileDropZone } from './components/files/FileDropZone';
import { FileList } from './components/files/FileList';
import { FileProcessModal } from './components/files/FileProcessModal';
import { JobList } from './components/jobs/JobList';
import { EngineManager } from './components/system/EngineManager';
import { Diagnostics } from './components/system/Diagnostics';
import { SettingsView } from './components/system/SettingsView';
import { api } from './services/api';
import { FileRecord, Job, EngineInfo, SystemDiagnostics, AppSetting } from './types/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('upload');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [engines, setEngines] = useState<EngineInfo[]>([]);
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [settings, setSettings] = useState<AppSetting[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFileForProcess, setSelectedFileForProcess] = useState<FileRecord | null>(null);

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
    loadData();
  }, [loadData]);

  // Polling for jobs when any job is active
  useEffect(() => {
    const hasActiveJobs = jobs.some(j => ['pending', 'queued', 'running'].includes(j.status));
    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      api.listJobs().then(setJobs).catch(() => {});
    }, 1500);

    return () => clearInterval(interval);
  }, [jobs]);

  // Handle files selected for upload
  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress(20);
    try {
      setUploadProgress(60);
      const uploaded = await api.uploadFiles(selectedFiles);
      setUploadProgress(100);
      setFiles(prev => [...uploaded, ...prev]);
      // If single file uploaded, switch to files tab or show process modal
      if (uploaded.length === 1) {
        setSelectedFileForProcess(uploaded[0]);
      } else {
        setCurrentTab('files');
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (id: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.deleteFile(id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      alert('Failed to delete file');
    }
  };

  const handleDownloadFile = (id: number) => {
    window.open(api.getFileDownloadUrl(id), '_blank');
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

  const handleDownloadOutput = (id: string) => {
    window.open(api.getJobDownloadUrl(id), '_blank');
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
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          filesCount={files.length}
          jobsCount={jobs.length}
          engines={engines}
        />

        {/* Main Content View */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {currentTab === 'upload' && (
              <div className="space-y-8">
                <FileDropZone
                  onFilesSelected={handleFilesSelected}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                />

                {files.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">Recent Uploads</h3>
                      <button
                        onClick={() => setCurrentTab('files')}
                        className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                      >
                        View all {files.length} files →
                      </button>
                    </div>
                    <FileList
                      files={files.slice(0, 5)}
                      onSelectFileForProcess={setSelectedFileForProcess}
                      onDeleteFile={handleDeleteFile}
                      onDownloadFile={handleDownloadFile}
                    />
                  </div>
                )}
              </div>
            )}

            {currentTab === 'files' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">File Library</h2>
                  <p className="text-xs text-slate-400">All uploaded media and documents ready for conversion and processing.</p>
                </div>
                <FileList
                  files={files}
                  onSelectFileForProcess={setSelectedFileForProcess}
                  onDeleteFile={handleDeleteFile}
                  onDownloadFile={handleDownloadFile}
                />
              </div>
            )}

            {currentTab === 'jobs' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Job Queue & Processing History</h2>
                  <p className="text-xs text-slate-400">Monitor active asynchronous workers, inspection commands, and download completed results.</p>
                </div>
                <JobList
                  jobs={jobs}
                  onCancelJob={handleCancelJob}
                  onRetryJob={handleRetryJob}
                  onDeleteJob={handleDeleteJob}
                  onDownloadOutput={handleDownloadOutput}
                />
              </div>
            )}

            {currentTab === 'engines' && (
              <EngineManager
                engines={engines}
                onRescan={handleRescanEngines}
                isRescanning={isRefreshing}
              />
            )}

            {currentTab === 'diagnostics' && (
              <Diagnostics diagnostics={diagnostics} />
            )}

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
    </div>
  );
}

export default App;
