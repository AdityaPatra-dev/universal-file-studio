import { 
  FileRecord, Job, EngineInfo, SystemDiagnostics, Operation, 
  Preset, AppSetting, FileHashesResponse, FileMetadataResponse,
  Pipeline, PipelineCreatePayload, PipelineUpdatePayload
} from '../types/api';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export const api = {
  // Files
  async uploadFiles(files: File[]): Promise<FileRecord[]> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async listFiles(category?: string): Promise<FileRecord[]> {
    const url = new URL(`${API_BASE}/files`);
    if (category) url.searchParams.set('category', category);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch files');
    return res.json();
  },

  async getFile(id: number): Promise<FileRecord> {
    const res = await fetch(`${API_BASE}/files/${id}`);
    if (!res.ok) throw new Error('Failed to fetch file');
    return res.json();
  },

  async deleteFile(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/files/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete file');
  },

  async analyzeFile(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/files/${id}/analyze`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to analyze file');
    return res.json();
  },

  getFileDownloadUrl(id: number): string {
    return `${API_BASE}/files/${id}/download`;
  },

  getFilePreviewUrl(id: number): string {
    return `${API_BASE}/files/${id}/preview`;
  },

  // Jobs
  async createJob(payload: { file_id: number; operation: string; engine_used?: string; parameters?: Record<string, any> }): Promise<Job> {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        engine_used: payload.engine_used || 'auto',
        parameters: payload.parameters || {}
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async listJobs(status?: string): Promise<Job[]> {
    const url = new URL(`${API_BASE}/jobs`);
    if (status) url.searchParams.set('status', status);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  async getJob(id: string): Promise<Job> {
    const res = await fetch(`${API_BASE}/jobs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch job');
    return res.json();
  },

  async cancelJob(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/jobs/${id}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to cancel job');
  },

  async retryJob(id: string): Promise<Job> {
    const res = await fetch(`${API_BASE}/jobs/${id}/retry`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to retry job');
    return res.json();
  },

  async deleteJob(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/jobs/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete job');
  },

  getJobDownloadUrl(id: string): string {
    return `${API_BASE}/jobs/${id}/download`;
  },

  // Batch Operations
  async batchConvert(fileIds: number[], targetFormat: string, parameters: Record<string, any> = {}): Promise<any> {
    const res = await fetch(`${API_BASE}/batch/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_ids: fileIds, target_format: targetFormat, parameters }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async batchCompress(fileIds: number[], qualityOrCrf?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/batch/compress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_ids: fileIds, quality_or_crf: qualityOrCrf }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async batchArchive(fileIds: number[], archiveFormat: string = 'zip', archiveName?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/batch/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_ids: fileIds, archive_format: archiveFormat, archive_name: archiveName }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Presets
  async listPresets(): Promise<Preset[]> {
    const res = await fetch(`${API_BASE}/presets`);
    if (!res.ok) throw new Error('Failed to fetch presets');
    return res.json();
  },

  async createPreset(preset: Partial<Preset>): Promise<Preset> {
    const res = await fetch(`${API_BASE}/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preset),
    });
    if (!res.ok) throw new Error('Failed to create preset');
    return res.json();
  },

  // Operations
  async listOperations(): Promise<Operation[]> {
    const res = await fetch(`${API_BASE}/operations`);
    if (!res.ok) throw new Error('Failed to fetch operations');
    return res.json();
  },

  async getFileOperations(fileId: number): Promise<Operation[]> {
    const res = await fetch(`${API_BASE}/operations/file/${fileId}`);
    if (!res.ok) throw new Error('Failed to fetch file operations');
    return res.json();
  },

  // System & Engines
  async getHealth(): Promise<{ status: string; app: string; version: string; mode: string }> {
    const res = await fetch(`${API_BASE}/system/health`);
    if (!res.ok) throw new Error('Failed to check health');
    return res.json();
  },

  async getEngines(): Promise<EngineInfo[]> {
    const res = await fetch(`${API_BASE}/system/engines`);
    if (!res.ok) throw new Error('Failed to fetch engines');
    return res.json();
  },

  async rescanEngines(): Promise<EngineInfo[]> {
    const res = await fetch(`${API_BASE}/system/engines/scan`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to rescan engines');
    return res.json();
  },

  async getDiagnostics(): Promise<SystemDiagnostics> {
    const res = await fetch(`${API_BASE}/system/diagnostics`);
    if (!res.ok) throw new Error('Failed to fetch diagnostics');
    return res.json();
  },

  async getSettings(): Promise<AppSetting[]> {
    const res = await fetch(`${API_BASE}/system/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSetting(key: string, value: string): Promise<AppSetting> {
    const res = await fetch(`${API_BASE}/system/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error('Failed to update setting');
    return res.json();
  },

  // Advanced Utilities (Phase 5)
  async getFileHashes(fileId: number): Promise<FileHashesResponse> {
    const res = await fetch(`${API_BASE}/files/${fileId}/hash`);
    if (!res.ok) throw new Error('Failed to compute file hashes');
    return res.json();
  },

  async getFileMetadata(fileId: number): Promise<FileMetadataResponse> {
    const res = await fetch(`${API_BASE}/files/${fileId}/metadata`);
    if (!res.ok) throw new Error('Failed to extract deep metadata');
    return res.json();
  },

  // Pipelines (Phase 6)
  async listPipelines(): Promise<Pipeline[]> {
    const res = await fetch(`${API_BASE}/pipelines`);
    if (!res.ok) throw new Error('Failed to fetch pipelines');
    return res.json();
  },

  async createPipeline(payload: PipelineCreatePayload): Promise<Pipeline> {
    const res = await fetch(`${API_BASE}/pipelines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create pipeline');
    return res.json();
  },

  async getPipeline(id: number): Promise<Pipeline> {
    const res = await fetch(`${API_BASE}/pipelines/${id}`);
    if (!res.ok) throw new Error('Failed to fetch pipeline');
    return res.json();
  },

  async updatePipeline(id: number, payload: PipelineUpdatePayload): Promise<Pipeline> {
    const res = await fetch(`${API_BASE}/pipelines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update pipeline');
    return res.json();
  },

  async deletePipeline(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/pipelines/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete pipeline');
    return res.json();
  },

  async executePipeline(id: number, fileId: number, parameters: Record<string, any> = {}): Promise<Job> {
    const res = await fetch(`${API_BASE}/pipelines/${id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId, parameters }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

