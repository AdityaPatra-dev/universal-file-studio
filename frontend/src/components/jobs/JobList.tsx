import React, { useState } from 'react';
import { 
  Play, CheckCircle2, AlertCircle, XCircle, Clock, 
  RotateCcw, Download, Trash2, StopCircle, Terminal, FileCheck,
  Check, Copy, Sparkles, Filter, FolderOpen, ExternalLink, Share2, X, FileText
} from 'lucide-react';
import { Job, JobStatus } from '../../types/api';
import { formatBytes, formatDuration, formatDate } from '../../utils/format';
import { universalEngine } from '../../services/universalEngine';

interface JobListProps {
  jobs: Job[];
  onCancelJob: (jobId: string) => void;
  onRetryJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
  onDownloadOutput: (jobId: string) => void;
  onClearCompleted?: () => void;
  onRetryAllFailed?: () => void;
  onCancelAllActive?: () => void;
  onClearAll?: () => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  onCancelJob,
  onRetryJob,
  onDeleteJob,
  onDownloadOutput,
  onClearCompleted,
  onRetryAllFailed,
  onCancelAllActive,
  onClearAll,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLogJob, setSelectedLogJob] = useState<Job | null>(null);
  const [locationJob, setLocationJob] = useState<Job | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Dynamic status counts
  const activeJobs = jobs.filter(j => ['pending', 'queued', 'running'].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const failedJobs = jobs.filter(j => j.status === 'failed');

  const filteredJobs = jobs.filter(j => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return ['pending', 'queued', 'running'].includes(j.status);
    return j.status === statusFilter;
  });

  const getStatusBadge = (status: JobStatus, progress: number) => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>Running {Math.max(5, Math.round(progress))}%</span>
          </span>
        );
      case 'queued':
      case 'pending':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Clock className="h-3.5 w-3.5 animate-spin" />
            <span>Queued (Ready)</span>
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Failed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 border border-slate-500/20 text-slate-400">
            <XCircle className="h-3.5 w-3.5" />
            <span>Cancelled</span>
          </span>
        );
    }
  };

  const handleCopyCmd = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Filters & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Dynamic Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Jobs', count: jobs.length },
            { id: 'active', label: 'Active', count: activeJobs.length },
            { id: 'completed', label: 'Completed', count: completedJobs.length },
            { id: 'failed', label: 'Failed', count: failedJobs.length },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all btn-press ${
                statusFilter === st.id
                  ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-600/30 ring-1 ring-brand-500/50'
                  : 'bg-surface-900/80 text-slate-300 hover:text-white hover:bg-surface-850 border border-surface-800'
              }`}
            >
              <span>{st.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                statusFilter === st.id ? 'bg-brand-700 text-white font-bold' : 'bg-surface-950 text-slate-400'
              }`}>
                {st.count}
              </span>
            </button>
          ))}
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeJobs.length > 0 && onCancelAllActive && (
            <button
              onClick={onCancelAllActive}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all btn-press"
              title="Cancel all active/queued jobs"
            >
              <StopCircle className="h-3.5 w-3.5" />
              <span>Cancel Active ({activeJobs.length})</span>
            </button>
          )}

          {failedJobs.length > 0 && onRetryAllFailed && (
            <button
              onClick={onRetryAllFailed}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-surface-850 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all btn-press"
              title="Retry all failed jobs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Failed ({failedJobs.length})</span>
            </button>
          )}

          {completedJobs.length > 0 && onClearCompleted && (
            <button
              onClick={onClearCompleted}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-surface-850 text-slate-300 hover:text-white border border-surface-800 text-xs font-medium transition-all btn-press"
              title="Clear all finished jobs from list"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Completed ({completedJobs.length})</span>
            </button>
          )}

          {jobs.length > 0 && onClearAll && (
            <button
              onClick={onClearAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-surface-800 text-xs font-medium transition-all btn-press"
              title="Clear all jobs history"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl card-glass border border-surface-800/80 space-y-2">
          <p className="text-sm font-semibold text-slate-300">No jobs found</p>
          <p className="text-xs text-slate-500">
            {jobs.length === 0 ? 'Start an operation or recipe to monitor execution.' : 'No jobs match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="p-4 rounded-2xl card-glass border border-surface-800/80 hover:border-surface-700/80 transition-all space-y-3 shadow-md"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-surface-850 text-brand-400 border border-surface-750">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white flex items-center gap-2">
                      <span>{job.operation.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-950 text-slate-400 border border-surface-800">
                        {job.engine_used}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono truncate max-w-sm sm:max-w-md">
                      ID: {job.id.slice(0, 8)}... • Created {formatDate(job.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {getStatusBadge(job.status, job.progress_percent)}
                </div>
              </div>

              {/* Progress Bar (Active for running or queued) */}
              {(job.status === 'running' || job.status === 'queued') && (
                <div className="space-y-1.5 pt-1">
                  <div className="w-full bg-surface-950 rounded-full h-2 overflow-hidden border border-surface-800/80 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        job.status === 'queued'
                          ? 'w-full bg-blue-500/30 animate-pulse'
                          : 'bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-400 shadow-sm shadow-brand-500/50'
                      }`}
                      style={{
                        width: job.status === 'queued' ? '100%' : `${Math.max(6, job.progress_percent)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="text-slate-400">
                      {job.status === 'queued' ? 'Queued in worker...' : 'Processing on device...'}
                    </span>
                    <span className="text-brand-300 font-bold">
                      {job.status === 'queued' ? 'In Queue' : `${Math.max(5, job.progress_percent).toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              )}

              {/* Details & Output Info */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-surface-800/60 gap-2">
                <div className="flex items-center space-x-4">
                  {job.duration_seconds ? (
                    <span>Duration: <strong className="text-slate-300 font-mono">{formatDuration(job.duration_seconds)}</strong></span>
                  ) : null}
                  {job.output_size_bytes ? (
                    <span>Output: <strong className="text-slate-300 font-mono">{formatBytes(job.output_size_bytes)}</strong></span>
                  ) : null}
                  {job.error_message && (
                    <span className="text-rose-400 font-medium truncate max-w-xs">{job.error_message}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {job.command_executed && (
                    <button
                      onClick={() => setSelectedLogJob(job)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-surface-850 hover:bg-surface-800 text-slate-300 hover:text-white text-xs border border-surface-700/60 transition-colors btn-press"
                      title="View execution logs"
                    >
                      <Terminal className="h-3.5 w-3.5 text-brand-400" />
                      <span>Logs</span>
                    </button>
                  )}

                  {['running', 'queued', 'pending'].includes(job.status) && (
                    <button
                      onClick={() => onCancelJob(job.id)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-surface-850 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors btn-press text-xs"
                      title="Cancel job"
                    >
                      <StopCircle className="h-3.5 w-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}

                  {job.status === 'completed' && job.output_path && (
                    <div className="flex items-center gap-1.5">
                      {/* Direct Viewer Opener Button */}
                      <button
                        type="button"
                        onClick={() => universalEngine.openFile(job.output_path || job.id, undefined, job.output_filename || undefined)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors btn-press text-xs shadow-sm shadow-brand-600/30"
                        title="Open directly with viewer app (Google PDF, Photos, etc.)"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open</span>
                      </button>

                      <button
                        onClick={() => onDownloadOutput(job.id)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-sm shadow-emerald-600/30 btn-press text-xs"
                        title="Save to Public Downloads folder"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Save</span>
                      </button>

                      {/* File / Folder Location Icon just beside download option */}
                      <button
                        type="button"
                        onClick={() => setLocationJob(job)}
                        className="p-1.5 rounded-lg bg-surface-850 hover:bg-surface-800 text-brand-400 hover:text-brand-300 transition-colors btn-press border border-surface-700/60"
                        title="View saved file location"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {job.status === 'failed' && (
                    <button
                      onClick={() => onRetryJob(job.id)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors btn-press text-xs shadow-sm shadow-brand-600/30"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Retry</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteJob(job.id)}
                    className="p-1.5 rounded-lg bg-surface-850 hover:bg-surface-800 text-slate-400 hover:text-rose-400 transition-colors btn-press border border-surface-700/60"
                    title="Remove job from list"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Terminal / Log Modal (Adaptive Mobile Sheet) */}
      {selectedLogJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
          <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:mt-auto sm:my-auto animate-in slide-in-from-bottom-4 duration-200">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-surface-700 rounded-full mx-auto sm:hidden mt-3" />

            <div className="px-5 sm:px-6 py-4 border-b border-surface-800 flex items-center justify-between bg-surface-900/80">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Terminal className="h-4 w-4 text-brand-400" />
                Execution Log — Job {selectedLogJob.id.slice(0, 8)}
              </h4>
              <button
                onClick={() => setSelectedLogJob(null)}
                className="px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white text-xs btn-press"
              >
                Close
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 font-mono text-xs safe-bottom">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] text-slate-500 uppercase">Command Executed</div>
                  <button
                    onClick={() => handleCopyCmd(selectedLogJob.command_executed || '')}
                    className="text-[10px] text-brand-400 hover:underline flex items-center gap-1 btn-press"
                  >
                    {copiedCmd ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-surface-950 text-emerald-400 break-all select-all border border-surface-800 text-[11px]">
                  {selectedLogJob.command_executed}
                </div>
              </div>
              {selectedLogJob.stdout && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Stdout Output</div>
                  <pre className="p-3 rounded-xl bg-surface-950 text-slate-300 overflow-x-auto max-h-48 border border-surface-800 text-[11px]">
                    {selectedLogJob.stdout}
                  </pre>
                </div>
              )}
              {selectedLogJob.stderr && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Stderr Stream</div>
                  <pre className="p-3 rounded-xl bg-surface-950 text-amber-300 overflow-x-auto max-h-48 border border-surface-800 text-[11px]">
                    {selectedLogJob.stderr}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Location Inspector Modal */}
      {locationJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-surface-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-surface-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5 text-brand-400" />
                <h3 className="font-bold text-sm text-white">File Location & Storage</h3>
              </div>
              <button 
                onClick={() => setLocationJob(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-white truncate">
                    {locationJob.output_filename || `result_${locationJob.id}`}
                  </span>
                </div>
                {locationJob.output_size_bytes && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    Size: {formatBytes(locationJob.output_size_bytes)}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Saved Storage Path
                </label>
                <div className="p-3 rounded-xl bg-surface-950 text-brand-200 font-mono text-xs break-all select-all border border-brand-500/30">
                  {locationJob.output_path || `Downloads/UniversalFileStudio/${locationJob.output_filename || 'result'}`}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Files are saved directly into your device's public <strong>Downloads</strong> folder.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (locationJob.output_path) {
                      await universalEngine.openFile(locationJob.output_path);
                    } else {
                      onDownloadOutput(locationJob.id);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open File</span>
                </button>
                {locationJob.output_path && (
                  <button
                    type="button"
                    onClick={async () => {
                      await universalEngine.shareFile(locationJob.output_path!, locationJob.output_filename);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 border border-surface-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5 text-brand-400" />
                    <span>Share</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLocationJob(null)}
                  className="px-3 py-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-300 text-xs font-semibold border border-surface-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
