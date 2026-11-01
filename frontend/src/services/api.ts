import { 
  FileRecord, Job, EngineInfo, SystemDiagnostics, Operation, 
  Preset, AppSetting, FileHashesResponse, FileMetadataResponse,
  Pipeline, PipelineCreatePayload, PipelineUpdatePayload,
  DeveloperInfo, OperationSpec, PipelineValidationResponse,
  NetworkInfo
} from '../types/api';

let activeApiBase = 'http://127.0.0.1:8000/api/v1';

export const setApiBase = (url: string) => {
  activeApiBase = url.replace(/\/+$/, '');
};

export const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ufs_backend_url');
    if (saved) return saved.replace(/\/+$/, '') + '/api/v1';

    const isCapacitor = Boolean(
      (window as any).Capacitor?.isNativePlatform?.() ||
      window.location.origin.startsWith('capacitor:') ||
      window.location.protocol === 'file:' ||
      (window.location.hostname === 'localhost' && window.location.port === '')
    );
    if (!isCapacitor && window.location.origin && window.location.origin !== 'null') {
      return `${window.location.origin}/api/v1`;
    }
  }
  return activeApiBase;
};

async function fetchSafe(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error(
        `Cannot connect to Universal File Studio backend (${getApiBase()}). ` +
        `Make sure the UFS backend is running.`
      );
    }
    throw err;
  }
}

async function parseResponse<T = any>(res: Response, fallbackErrMsg = 'Request failed'): Promise<T> {
  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) {
      if (text.startsWith('<!doctype') || text.startsWith('<html')) {
        throw new Error(`${fallbackErrMsg}: Server returned HTML (${res.status}). Make sure the UFS backend is running.`);
      }
      throw new Error(`${fallbackErrMsg}: ${text.slice(0, 150) || res.statusText}`);
    }
    throw new Error(`Unexpected non-JSON response from server: ${text.slice(0, 100)}`);
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.detail || data?.error || fallbackErrMsg;
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }

  return data;
}

export const api = {
  // Files
  async uploadFiles(files: File[]): Promise<FileRecord[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const res = await fetchSafe(`${getApiBase()}/files/upload`, {
      method: 'POST',
      body: formData,
    });
    return await parseResponse<FileRecord[]>(res, 'Failed to upload files');
  },

  async listFiles(category?: string): Promise<FileRecord[]> {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000';
    const url = new URL(`${getApiBase()}/files`, origin);
    if (category) url.searchParams.set('category', category);
    const res = await fetchSafe(url.toString());
    return await parseResponse<FileRecord[]>(res, 'Failed to fetch files');
  },

  async getFile(id: number): Promise<FileRecord> {
    const res = await fetchSafe(`${getApiBase()}/files/${id}`);
    return await parseResponse<FileRecord>(res, 'Failed to fetch file');
  },

  async deleteFile(id: number): Promise<void> {
    const res = await fetchSafe(`${getApiBase()}/files/${id}`, { method: 'DELETE' });
    await parseResponse(res, 'Failed to delete file');
  },

  async analyzeFile(id: number): Promise<any> {
    const res = await fetchSafe(`${getApiBase()}/files/${id}/analyze`, { method: 'POST' });
    return await parseResponse(res, 'Failed to analyze file');
  },

  getFileDownloadUrl(id: number): string {
    return `${getApiBase()}/files/${id}/download`;
  },

  getFilePreviewUrl(id: number): string {
    return `${getApiBase()}/files/${id}/preview`;
  },

  // Jobs
  async createJob(payload: { file_id: number; operation: string; engine_used?: string; parameters?: Record<string, any> }): Promise<Job> {
    const res = await fetchSafe(`${getApiBase()}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        engine_used: payload.engine_used || 'auto',
        parameters: payload.parameters || {},
      }),
    });
    return await parseResponse<Job>(res, 'Failed to create job');
  },

  async listJobs(status?: string): Promise<Job[]> {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000';
    const url = new URL(`${getApiBase()}/jobs`, origin);
    if (status) url.searchParams.set('status', status);
    const res = await fetchSafe(url.toString());
    return await parseResponse<Job[]>(res, 'Failed to fetch jobs');
  },

  async getJob(id: string): Promise<Job> {
    const res = await fetchSafe(`${getApiBase()}/jobs/${id}`);
    return await parseResponse<Job>(res, 'Failed to fetch job');
  },

  async cancelJob(id: string): Promise<void> {
    const res = await fetchSafe(`${getApiBase()}/jobs/${id}/cancel`, { method: 'POST' });
    await parseResponse(res, 'Failed to cancel job');
  },

  async retryJob(id: string): Promise<Job> {
    const res = await fetchSafe(`${getApiBase()}/jobs/${id}/retry`, { method: 'POST' });
    return await parseResponse<Job>(res, 'Failed to retry job');
  },

  async deleteJob(id: string): Promise<void> {
    const res = await fetchSafe(`${getApiBase()}/jobs/${id}`, { method: 'DELETE' });
    await parseResponse(res, 'Failed to delete job');
  },

  async deleteJobsBulk(status?: string): Promise<{ success: boolean; deleted_count: number }> {
    const url = status ? `${getApiBase()}/jobs?status=${encodeURIComponent(status)}` : `${getApiBase()}/jobs`;
    const res = await fetchSafe(url, { method: 'DELETE' });
    return await parseResponse(res, 'Failed to bulk delete jobs');
  },

  getJobDownloadUrl(id: string): string {
    return `${getApiBase()}/jobs/${id}/download`;
  },

  // Batch Operations
  async batchConvert(fileIds: number[], targetFormat: string, parameters: Record<string, any> = {}): Promise<any> {
    const res = await fetchSafe(`${getApiBase()}/batch/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_ids: fileIds, target_format: targetFormat, parameters }),
    });
    return await parseResponse(res, 'Failed to perform batch convert');
  },

  async batchCompress(fileIds: number[], qualityOrCrf?: number): Promise<any> {
    const res = await fetchSafe(`${getApiBase()}/batch/compress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_ids: fileIds, quality_or_crf: qualityOrCrf }),
    });
    return await parseResponse(res, 'Failed to perform batch compress');
  },

  async batchArchive(fileIds: number[], archiveFormat: string = 'zip', archiveName?: string): Promise<any> {
    const res = await fetchSafe(`${getApiBase()}/batch/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_ids: fileIds, archive_format: archiveFormat, archive_name: archiveName }),
    });
    return await parseResponse(res, 'Failed to create batch archive');
  },

  // Presets
  async listPresets(): Promise<Preset[]> {
    const res = await fetchSafe(`${getApiBase()}/presets`);
    return await parseResponse<Preset[]>(res, 'Failed to fetch presets');
  },

  async createPreset(preset: Partial<Preset>): Promise<Preset> {
    const res = await fetchSafe(`${getApiBase()}/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preset),
    });
    return await parseResponse<Preset>(res, 'Failed to create preset');
  },

  // Operations
  async listOperations(): Promise<Operation[]> {
    const res = await fetchSafe(`${getApiBase()}/operations`);
    return await parseResponse<Operation[]>(res, 'Failed to fetch operations');
  },

  async getFileOperations(fileId: number): Promise<Operation[]> {
    const res = await fetchSafe(`${getApiBase()}/operations/file/${fileId}`);
    return await parseResponse<Operation[]>(res, 'Failed to fetch file operations');
  },

  // System & Engines
  async getHealth(): Promise<{ status: string; app: string; version: string; mode: string }> {
    const res = await fetchSafe(`${getApiBase()}/system/health`);
    return await parseResponse(res, 'Failed to check health');
  },

  async getEngines(): Promise<EngineInfo[]> {
    const res = await fetchSafe(`${getApiBase()}/system/engines`);
    return await parseResponse<EngineInfo[]>(res, 'Failed to fetch engines');
  },

  async rescanEngines(): Promise<EngineInfo[]> {
    const res = await fetchSafe(`${getApiBase()}/system/engines/scan`, { method: 'POST' });
    return await parseResponse<EngineInfo[]>(res, 'Failed to rescan engines');
  },

  async getDiagnostics(): Promise<SystemDiagnostics> {
    const res = await fetchSafe(`${getApiBase()}/system/diagnostics`);
    return await parseResponse<SystemDiagnostics>(res, 'Failed to fetch diagnostics');
  },

  async getSettings(): Promise<AppSetting[]> {
    const res = await fetchSafe(`${getApiBase()}/system/settings`);
    return await parseResponse<AppSetting[]>(res, 'Failed to fetch settings');
  },

  async updateSetting(key: string, value: string): Promise<AppSetting> {
    const res = await fetchSafe(`${getApiBase()}/system/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    return await parseResponse<AppSetting>(res, 'Failed to update setting');
  },

  // Advanced Operations
  async getFileHashes(fileId: number): Promise<FileHashesResponse> {
    const res = await fetchSafe(`${getApiBase()}/files/${fileId}/hash`);
    return await parseResponse<FileHashesResponse>(res, 'Failed to fetch file hashes');
  },

  async getFileMetadata(fileId: number): Promise<FileMetadataResponse> {
    const res = await fetchSafe(`${getApiBase()}/files/${fileId}/metadata`);
    return await parseResponse<FileMetadataResponse>(res, 'Failed to fetch file metadata');
  },

  async stripFileMetadata(fileId: number): Promise<{ success: boolean; job: Job; output_file_id?: number }> {
    const res = await fetchSafe(`${getApiBase()}/files/${fileId}/strip-metadata`, { method: 'POST' });
    return await parseResponse(res, 'Failed to strip metadata');
  },

  // Pipelines
  async listPipelines(): Promise<Pipeline[]> {
    const res = await fetchSafe(`${getApiBase()}/pipelines`);
    return await parseResponse<Pipeline[]>(res, 'Failed to fetch pipelines');
  },

  async getPipeline(id: number): Promise<Pipeline> {
    const list = await this.listPipelines();
    const found = list.find((p) => p.id === id);
    if (!found) throw new Error(`Pipeline ${id} not found`);
    return found;
  },

  async createPipeline(payload: PipelineCreatePayload): Promise<Pipeline> {
    const res = await fetchSafe(`${getApiBase()}/pipelines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await parseResponse<Pipeline>(res, 'Failed to create pipeline');
  },

  async updatePipeline(id: number, payload: PipelineUpdatePayload): Promise<Pipeline> {
    const res = await fetchSafe(`${getApiBase()}/pipelines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await parseResponse<Pipeline>(res, 'Failed to update pipeline');
  },

  async deletePipeline(id: number): Promise<void> {
    const res = await fetchSafe(`${getApiBase()}/pipelines/${id}`, { method: 'DELETE' });
    await parseResponse(res, 'Failed to delete pipeline');
  },

  async executePipeline(id: number, fileId: number): Promise<Job> {
    const res = await fetchSafe(`${getApiBase()}/pipelines/${id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId }),
    });
    return await parseResponse<Job>(res, 'Failed to execute pipeline');
  },

  async batchExecutePipeline(id: number, fileIds: number[], onConflict: string = 'skip'): Promise<{ jobs: Job[]; queued_count: number }> {
    const res = await fetchSafe(`${getApiBase()}/pipelines/${id}/batch-execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_ids: fileIds, on_conflict: onConflict }),
    });
    return await parseResponse(res, 'Failed to batch execute pipeline');
  },

  async exportPipeline(id: number): Promise<any> {
    const res = await fetchSafe(`${getApiBase()}/pipelines/${id}/export`);
    return await parseResponse(res, 'Failed to export pipeline');
  },

  async importPipeline(payload: any): Promise<Pipeline> {
    const res = await fetchSafe(`${getApiBase()}/pipelines/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await parseResponse<Pipeline>(res, 'Failed to import pipeline');
  },

  async validatePipeline(payload: { name?: string; description?: string; steps: any[]; test_file_category?: string }): Promise<PipelineValidationResponse> {
    const res = await fetchSafe(`${getApiBase()}/pipelines/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await parseResponse<PipelineValidationResponse>(res, 'Failed to validate pipeline');
  },

  async getOperationSpecs(): Promise<Record<string, OperationSpec>> {
    const res = await fetchSafe(`${getApiBase()}/pipelines/operation-specs`);
    return await parseResponse<Record<string, OperationSpec>>(res, 'Failed to fetch specs');
  },

  // Developer & System
  async getDeveloperInfo(): Promise<DeveloperInfo> {
    const res = await fetchSafe(`${getApiBase()}/developer/info`);
    return await parseResponse<DeveloperInfo>(res, 'Failed to fetch developer info');
  },

  async triggerTestEvent(eventType: string, payload: any): Promise<any> {
    const res = await fetchSafe(`${getApiBase()}/developer/test-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, payload }),
    });
    return await parseResponse(res, 'Failed to trigger event');
  },

  async getNetworkInfo(): Promise<NetworkInfo> {
    const res = await fetchSafe(`${getApiBase()}/system/network`);
    return await parseResponse<NetworkInfo>(res, 'Failed to fetch network info');
  },
};
