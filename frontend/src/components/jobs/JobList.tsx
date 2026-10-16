import React, { useState } from 'react';
import { 
  Play, CheckCircle2, AlertCircle, XCircle, Clock, 
  RotateCcw, Download, Trash2, StopCircle, Terminal, FileCheck,
  Check, Copy, Sparkles, Filter
} from 'lucide-react';
import { Job, JobStatus } from '../../types/api';
import { formatBytes, formatDuration, formatDate } from '../../utils/format';

interface JobListProps {
  jobs: Job[];
  onCancelJob: (jobId: string) => void;
  onRetryJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
  onDownloadOutput: (jobId: string) => void;
  onClearCompleted?: () => void;
  onRetryAllFailed?: () => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  onCancelJob,
  onRetryJob,
  onDeleteJob,
  onDownloadOutput,
  onClearCompleted,
  onRetryAllFailed,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLogJob, setSelectedLogJob] = useState<Job | null>(null);
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
      {/* Top Toolbar: Filters & Bulk Actions (P1 Fixed) */}
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
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-600/30'
                  : 'bg-surface-800/80 text-slate-300 hover:text-white hover:bg-surface-800'
              }`}
            >
              <span>{st.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                statusFilter === st.id ? 'bg-brand-700 text-white font-bold' : 'bg-surface-900 text-slate-400'
              }`}>
                {st.count}
              </span>
            </button>
          ))}
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-2">
          {failedJobs.length > 0 && onRetryAllFailed && (
            <button
              onClick={onRetryAllFailed}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
              title="Retry all failed jobs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Failed ({failedJobs.length})</span>
            </button>
          )}

          {completedJobs.length > 0 && onClearCompleted && (
            <button
              onClick={onClearCompleted}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border border-surface-700 text-xs font-medium transition-all cursor-pointer"
              title="Clear all finished jobs from list"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Completed ({completedJobs.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-900/30 border border-surface-800 space-y-2">
          <p className="text-sm font-semibold text-slate-300">No jobs found in this view.</p>
          <p className="text-xs text-slate-500">
            {jobs.length === 0 ? 'Start an operation or pipeline to monitor execution history.' : 'No jobs match the selected filter tab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="p-4 rounded-2xl border border-surface-800 bg-surface-900/40 hover:bg-surface-900/70 transition-all space-y-3 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-surface-800 text-brand-400">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white flex items-center gap-2">
                      <span>{job.operation.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-800 text-slate-400 border border-surface-700">
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
                      {job.status === 'queued' ? 'Waiting in background worker queue...' : 'Local hardware execution in progress...'}
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
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white text-xs border border-surface-700/60 transition-colors cursor-pointer"
                      title="View command and terminal stdout/stderr logs"
                    >
                      <Terminal className="h-3.5 w-3.5 text-brand-400" />
                      <span>Logs</span>
                    </button>
                  )}

                  {job.status === 'running' && (
                    <button
                      onClick={() => onCancelJob(job.id)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer text-xs"
                      title="Cancel running job"
                    >
                      <StopCircle className="h-3.5 w-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}

                  {job.status === 'completed' && job.output_path && (
                    <button
                      onClick={() => onDownloadOutput(job.id)}
                      className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-sm shadow-emerald-600/30 cursor-pointer text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Result</span>
                    </button>
                  )}

                  {job.status === 'failed' && (
                    <button
                      onClick={() => onRetryJob(job.id)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors cursor-pointer text-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Retry</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteJob(job.id)}
                    className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer border border-surface-700/60"
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

      {/* Terminal / Log Modal */}
      {selectedLogJob && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-surface-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Terminal className="h-4 w-4 text-brand-400" />
                Execution Log — Job {selectedLogJob.id.slice(0, 8)}
              </h4>
              <button
                onClick={() => setSelectedLogJob(null)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] text-slate-500 uppercase">CLI Command Executed</div>
                  <button
                    onClick={() => handleCopyCmd(selectedLogJob.command_executed || '')}
                    className="text-[10px] text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedCmd ? 'Copied' : 'Copy Command'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-surface-950 text-emerald-400 break-all select-all border border-surface-800">
                  {selectedLogJob.command_executed}
                </div>
              </div>
              {selectedLogJob.stdout && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Stdout Output</div>
                  <pre className="p-3 rounded-xl bg-surface-950 text-slate-300 overflow-x-auto max-h-48 border border-surface-800">
                    {selectedLogJob.stdout}
                  </pre>
                </div>
              )}
              {selectedLogJob.stderr && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Stderr Stream</div>
                  <pre className="p-3 rounded-xl bg-surface-950 text-amber-300 overflow-x-auto max-h-48 border border-surface-800">
                    {selectedLogJob.stderr}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
