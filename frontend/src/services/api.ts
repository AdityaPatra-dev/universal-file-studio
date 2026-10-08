import { 
  FileRecord, Job, EngineInfo, SystemDiagnostics, Operation, 
  Preset, AppSetting, FileHashesResponse, FileMetadataResponse,
  Pipeline, PipelineCreatePayload, PipelineUpdatePayload,
  DeveloperInfo
} from '../types/api';

const getApiBase = (): string => {
  if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null' && window.location.protocol !== 'file:') {
    return `${window.location.origin}/api/v1`;
  }
  return 'http://127.0.0.1:8000/api/v1';
};

const API_BASE = getApiBase();

async function fetchSafe(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error(
        `Cannot connect to Universal File Studio backend (${API_BASE}). ` +
        `Please ensure the server is running (e.g. run './start.sh' or './ufs serve').`
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
    // Not valid JSON
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
    files.forEach(f => formData.append('files', f));
    const res = await fetchSafe(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: formData,
    });
    return parseResponse<FileRecord[]>(res, 'Failed to upload files');
  },

  async listFiles(category?: string): Promise<FileRecord[]> {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000';
    const url = new URL(`${API_BASE}/files`, origin);
    if (category) url.searchParams.set('category', category);
    const res = await fetchSafe(url.toString());
    return parseResponse<FileRecord[]>(res, 'Failed to fetch files');
  },

  async getFile(id: number): Promise<FileRecord> {
    const res = await fetchSafe(`${API_BASE}/files/${id}`);
    return parseResponse<FileRecord>(res, 'Failed to fetch file');
  },

  async deleteFile(id: number): Promise<void> {
    const res = await fetchSafe(`${API_BASE}/files/${id}`, { method: 'DELETE' });
    return parseResponse(res, 'Failed to delete file');
  },

  async analyzeFile(id: number): Promise<any> {
    const res = await fetchSafe(`${API_BASE}/files/${id}/analyze`, { method: 'POST' });
    return parseResponse(res, 'Failed to analyze file');
  },

  getFileDownloadUrl(id: number): string {
    return `${API_BASE}/files/${id}/download`;
  },

  getFilePreviewUrl(id: number): string {
    return `${API_BASE}/files/${id}/preview`;
  },

  // Jobs
  async createJob(payload: { file_id: number; operation: string; engine_used?: string; parameters?: Record<string, any> }): Promise<Job> {
    const res = await fetchSafe(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        engine_used: payload.engine_used || 'auto',
        parameters: payload.parameters || {}
      }),
    });
    return parseResponse<Job>(res, 'Failed to create job');
  },

  async listJobs(status?: string): Promise<Job[]> {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000';
    const url = new URL(`${API_BASE}/jobs`, origin);
    if (status) url.searchParams.set('status', status);
    const res = await fetchSafe(url.toString());
    return parseResponse<Job[]>(res, 'Failed to fetch jobs');
  },

  async getJob(id: string): Promise<Job> {
    const res = await fetchSafe(`${API_BASE}/jobs/${id}`);
    return parseResponse<Job>(res, 'Failed to fetch job');
  },

  async cancelJob(id: string): Promise<void> {
    const res = await fetchSafe(`${API_BASE}/jobs/${id}/cancel`, { method: 'POST' });
    return parseResponse(res, 'Failed to cancel job');
  },

  async retryJob(id: string): Promise<Job> {
    const res = await fetchSafe(`${API_BASE}/jobs/${id}/retry`, { method: 'POST' });
    return parseResponse<Job>(res, 'Failed to retry job');
  },

  async deleteJob(id: string): Promise<void> {
    const res = await fetchSafe(`${API_BASE}/jobs/${id}`, { method: 'DELETE' });
    return parseResponse(res, 'Failed to delete job');
  },

  getJobDownloadUrl(id: string): string {
    return `${API_BASE}/jobs/${id}/download`;
  },

  // Batch Operations
  async batchConvert(fileIds: number[], targetFormat: string, parameters: Record<string, any> = {}): Promise<any> {
    const res = await fetchSafe(`${API_BASE}/batch/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_ids: fileIds, target_format: targetFormat, parameters }),
    });
    return parseResponse(res, 'Failed to perform batch convert');
  },

  async batchCompress(fileIds: number[], qualityOrCrf?: number): Promise<any> {
    const res = await fetchSafe(`${API_BASE}/batch/compress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_ids: fileIds, quality_or_crf: qualityOrCrf }),
    });
    return parseResponse(res, 'Failed to perform batch compress');
  },

  async batchArchive(fileIds: number[], archiveFormat: string = 'zip', archiveName?: string): Promise<any> {
    const res = await fetchSafe(`${API_BASE}/batch/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_ids: fileIds, archive_format: archiveFormat, archive_name: archiveName }),
    });
    return parseResponse(res, 'Failed to create batch archive');
  },

  // Presets
  async listPresets(): Promise<Preset[]> {
    const res = await fetchSafe(`${API_BASE}/presets`);
    return parseResponse<Preset[]>(res, 'Failed to fetch presets');
  },

  async createPreset(preset: Partial<Preset>): Promise<Preset> {
    const res = await fetchSafe(`${API_BASE}/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preset),
    });
    return parseResponse<Preset>(res, 'Failed to create preset');
  },

  // Operations
  async listOperations(): Promise<Operation[]> {
    const res = await fetchSafe(`${API_BASE}/operations`);
    return parseResponse<Operation[]>(res, 'Failed to fetch operations');
  },

  async getFileOperations(fileId: number): Promise<Operation[]> {
    const res = await fetchSafe(`${API_BASE}/operations/file/${fileId}`);
    return parseResponse<Operation[]>(res, 'Failed to fetch file operations');
  },

  // System & Engines
  async getHealth(): Promise<{ status: string; app: string; version: string; mode: string }> {
    const res = await fetchSafe(`${API_BASE}/system/health`);
    return parseResponse(res, 'Failed to check health');
  },

  async getEngines(): Promise<EngineInfo[]> {
    const res = await fetchSafe(`${API_BASE}/system/engines`);
    return parseResponse<EngineInfo[]>(res, 'Failed to fetch engines');
  },

  async rescanEngines(): Promise<EngineInfo[]> {
    const res = await fetchSafe(`${API_BASE}/system/engines/scan`, { method: 'POST' });
    return parseResponse<EngineInfo[]>(res, 'Failed to rescan engines');
  },

  async getDiagnostics(): Promise<SystemDiagnostics> {
    const res = await fetchSafe(`${API_BASE}/system/diagnostics`);
    return parseResponse<SystemDiagnostics>(res, 'Failed to fetch diagnostics');
  },

  async getSettings(): Promise<AppSetting[]> {
    const res = await fetchSafe(`${API_BASE}/system/settings`);
    return parseResponse<AppSetting[]>(res, 'Failed to fetch settings');
  },

  async updateSetting(key: string, value: string): Promise<AppSetting> {
    const res = await fetchSafe(`${API_BASE}/system/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    return parseResponse<AppSetting>(res, 'Failed to update setting');
  },

  // Advanced Operations (Phase 5)
  async getFileHashes(fileId: number): Promise<FileHashesResponse> {
    const res = await fetchSafe(`${API_BASE}/files/${fileId}/hashes`);
    return parseResponse<FileHashesResponse>(res, 'Failed to compute file hashes');
  },

  async getFileMetadata(fileId: number): Promise<FileMetadataResponse> {
    const res = await fetchSafe(`${API_BASE}/files/${fileId}/metadata`);
    return parseResponse<FileMetadataResponse>(res, 'Failed to fetch file metadata');
  },

  async stripFileMetadata(fileId: number): Promise<{ success: boolean; job: Job; output_file_id?: number }> {
    const res = await fetchSafe(`${API_BASE}/files/${fileId}/strip-metadata`, {
      method: 'POST',
    });
    return parseResponse(res, 'Failed to strip metadata');
  },

  async runFileOcr(fileId: number, options: { format?: string; language?: string } = {}): Promise<{ success: boolean; job: Job }> {
    const params = new URLSearchParams();
    if (options.format) params.set('format', options.format);
    if (options.language) params.set('language', options.language);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await fetchSafe(`${API_BASE}/files/${fileId}/ocr${queryString}`, {
      method: 'POST',
    });
    return parseResponse(res, 'Failed to run OCR');
  },

  // Pipelines (Phase 6)
  async listPipelines(): Promise<Pipeline[]> {
    const res = await fetchSafe(`${API_BASE}/pipelines`);
    return parseResponse<Pipeline[]>(res, 'Failed to fetch pipelines');
  },

  async createPipeline(payload: PipelineCreatePayload): Promise<Pipeline> {
    const res = await fetchSafe(`${API_BASE}/pipelines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return parseResponse<Pipeline>(res, 'Failed to create pipeline');
  },

  async getPipeline(id: number): Promise<Pipeline> {
    const res = await fetchSafe(`${API_BASE}/pipelines/${id}`);
    return parseResponse<Pipeline>(res, 'Failed to fetch pipeline');
  },

  async updatePipeline(id: number, payload: PipelineUpdatePayload): Promise<Pipeline> {
    const res = await fetchSafe(`${API_BASE}/pipelines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return parseResponse<Pipeline>(res, 'Failed to update pipeline');
  },

  async deletePipeline(id: number): Promise<any> {
    const res = await fetchSafe(`${API_BASE}/pipelines/${id}`, {
      method: 'DELETE',
    });
    return parseResponse(res, 'Failed to delete pipeline');
  },

  async executePipeline(id: number, fileId: number, parameters: Record<string, any> = {}): Promise<Job> {
    const res = await fetchSafe(`${API_BASE}/pipelines/${id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId, parameters }),
    });
    return parseResponse<Job>(res, 'Failed to execute pipeline');
  },

  // Developer & Documentation
  async getDeveloperInfo(): Promise<DeveloperInfo> {
    const res = await fetchSafe(`${API_BASE}/developer/info`);
    return parseResponse<DeveloperInfo>(res, 'Failed to fetch developer diagnostics');
  },

  async triggerTestEvent(eventType = 'ping', message = 'Test broadcast'): Promise<any> {
    const res = await fetchSafe(`${API_BASE}/developer/test-event?event_type=${encodeURIComponent(eventType)}&message=${encodeURIComponent(message)}`, {
      method: 'POST',
    });
    return parseResponse(res, 'Failed to trigger test event');
  },

  async getOpenApiSchema(): Promise<any> {
    const res = await fetchSafe(`${API_BASE}/developer/openapi.json`);
    return parseResponse(res, 'Failed to fetch OpenAPI schema');
  }
};
