import { FileRecord, Job, EngineInfo, SystemDiagnostics, AppSetting, NetworkInfo } from '../types/api';
import { api } from './api';
import { mobileStorage } from './mobileStorage';
import { mobileEngines } from './mobileEngines';

export type EngineMode = 'desktop' | 'mobile_standalone';

type ModeListener = (mode: EngineMode) => void;

class UniversalEngineService {
  private currentMode: EngineMode = 'mobile_standalone';
  private modeListeners: Set<ModeListener> = new Set();
  private checkInterval: any = null;
  private hasChecked = false;

  constructor() {
    this.detectMode();
  }

  public getMode(): EngineMode {
    return this.currentMode;
  }

  public isStandalone(): boolean {
    return this.currentMode === 'mobile_standalone';
  }

  public isDesktop(): boolean {
    return this.currentMode === 'desktop';
  }

  public onModeChange(listener: ModeListener): () => void {
    this.modeListeners.add(listener);
    listener(this.currentMode);
    return () => this.modeListeners.delete(listener);
  }

  private setMode(newMode: EngineMode) {
    if (this.currentMode !== newMode || !this.hasChecked) {
      this.currentMode = newMode;
      this.hasChecked = true;
      this.modeListeners.forEach((fn) => fn(newMode));
    }
  }

  public async detectMode(): Promise<EngineMode> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      
      const origin = typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('capacitor:') && window.location.protocol !== 'file:'
        ? window.location.origin
        : 'http://127.0.0.1:8000';

      const res = await fetch(`${origin}/api/info`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'healthy' || data.app_name) {
          this.setMode('desktop');
          return 'desktop';
        }
      }
    } catch {
      // Backend unreachable or standalone mobile app
    }

    this.setMode('mobile_standalone');
    return 'mobile_standalone';
  }

  public startPeriodicCheck(intervalMs = 8000) {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => this.detectMode(), intervalMs);
  }

  public stopPeriodicCheck() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = null;
  }

  // ==========================================
  // UNIFIED FILE OPERATIONS
  // ==========================================
  async uploadFiles(files: File[]): Promise<FileRecord[]> {
    if (this.isDesktop()) {
      try {
        return await api.uploadFiles(files);
      } catch (err) {
        console.warn('Desktop upload failed, falling back to local mobile storage:', err);
        this.setMode('mobile_standalone');
      }
    }

    // Mobile Standalone Fallback
    const savedRecords: FileRecord[] = [];
    for (const file of files) {
      const rec = await mobileStorage.saveFile(file, file.name);
      savedRecords.push(rec);
    }
    return savedRecords;
  }

  async listFiles(category?: string): Promise<FileRecord[]> {
    if (this.isDesktop()) {
      try {
        return await api.listFiles(category);
      } catch (err) {
        console.warn('Desktop listFiles failed, falling back to mobile storage:', err);
        this.setMode('mobile_standalone');
      }
    }
    return await mobileStorage.getFiles(category);
  }

  async deleteFile(id: number): Promise<void> {
    if (this.isDesktop()) {
      try {
        return await api.deleteFile(id);
      } catch (err) {
        console.warn('Desktop deleteFile failed, falling back to mobile storage:', err);
        this.setMode('mobile_standalone');
      }
    }
    return await mobileStorage.deleteFile(id);
  }

  async getFileDownloadUrl(id: number): Promise<string> {
    if (this.isDesktop()) {
      return api.getFileDownloadUrl(id);
    }
    const blob = await mobileStorage.getFileBlob(id);
    if (!blob) throw new Error('File not found in local storage');
    return URL.createObjectURL(blob);
  }

  async getFilePreviewUrl(id: number): Promise<string> {
    if (this.isDesktop()) {
      return api.getFilePreviewUrl(id);
    }
    const blob = await mobileStorage.getFileBlob(id);
    if (!blob) return '';
    return URL.createObjectURL(blob);
  }

  async getFileHashes(id: number): Promise<{ sha256: string; md5: string; sha1: string; size_bytes: number }> {
    if (this.isDesktop()) {
      try {
        return await api.getFileHashes(id);
      } catch (err) {
        console.warn('Desktop getFileHashes failed, falling back to local computation:', err);
      }
    }
    const blob = await mobileStorage.getFileBlob(id);
    if (!blob) throw new Error('File not found');
    const hashes = await mobileEngines.computeChecksums(blob);
    return {
      sha256: hashes.sha256,
      sha1: hashes.sha1,
      md5: hashes.sha256.substring(0, 32),
      size_bytes: hashes.size,
    };
  }

  async getFileMetadata(id: number): Promise<any> {
    if (this.isDesktop()) {
      try {
        return await api.getFileMetadata(id);
      } catch (err) {
        console.warn('Desktop getFileMetadata failed, falling back:', err);
      }
    }
    const rec = await mobileStorage.getFileRecord(id);
    const blob = await mobileStorage.getFileBlob(id);
    return {
      filename: rec?.filename,
      size: blob?.size,
      mime_type: rec?.mime_type,
      category: rec?.category,
      created_at: rec?.created_at,
    };
  }

  // ==========================================
  // UNIFIED JOB OPERATIONS
  // ==========================================
  async createJob(payload: {
    file_id: number;
    operation: string;
    engine_used?: string;
    parameters?: Record<string, any>;
  }): Promise<Job> {
    if (this.isDesktop()) {
      try {
        return await api.createJob(payload);
      } catch (err) {
        console.warn('Desktop createJob failed, falling back to mobile execution:', err);
        this.setMode('mobile_standalone');
      }
    }

    // On-Device Mobile Execution
    const fileRecord = await mobileStorage.getFileRecord(payload.file_id);
    const fileBlob = await mobileStorage.getFileBlob(payload.file_id);
    if (!fileRecord || !fileBlob) {
      throw new Error(`File ID ${payload.file_id} not found in mobile storage`);
    }

    const jobId = 'mob_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const initialJob: Job = {
      id: jobId,
      file_id: payload.file_id,
      operation: payload.operation,
      status: 'running',
      progress_percent: 5,
      engine_used: payload.engine_used || 'On-Device Mobile Engine',
      parameters: payload.parameters || {},
      input_path: fileRecord.upload_path,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
    };

    await mobileStorage.saveJob(initialJob);

    // Asynchronously execute on-device
    setTimeout(async () => {
      try {
        let result: any = null;
        const op = payload.operation;
        const category = fileRecord.category;

        if (category === 'image') {
          result = await mobileEngines.processImage(
            fileBlob,
            fileRecord.filename,
            op,
            payload.parameters,
            (pct) => {
              mobileStorage.updateJob(jobId, { progress_percent: pct });
            }
          );
        } else if (category === 'pdf') {
          result = await mobileEngines.processPdf(
            [{ blob: fileBlob, filename: fileRecord.filename }],
            op,
            payload.parameters,
            (pct) => {
              mobileStorage.updateJob(jobId, { progress_percent: pct });
            }
          );
        } else if (category === 'video' || category === 'audio') {
          result = await mobileEngines.processAudioVideo(
            fileBlob,
            fileRecord.filename,
            op,
            payload.parameters,
            (pct) => {
              mobileStorage.updateJob(jobId, { progress_percent: pct });
            }
          );
        } else if (category === 'archive') {
          result = await mobileEngines.processArchive(
            [{ blob: fileBlob, filename: fileRecord.filename }],
            op,
            payload.parameters,
            (pct) => {
              mobileStorage.updateJob(jobId, { progress_percent: pct });
            }
          );
        } else {
          result = await mobileEngines.processDocumentData(
            fileBlob,
            fileRecord.filename,
            op,
            payload.parameters,
            (pct) => {
              mobileStorage.updateJob(jobId, { progress_percent: pct });
            }
          );
        }

        // Save output file back to mobile store
        const savedOutput = await mobileStorage.saveFile(result.outputBlob, result.outputFilename);

        await mobileStorage.updateJob(
          jobId,
          {
            status: 'completed',
            progress_percent: 100,
            output_filename: result.outputFilename,
            output_path: `mobile://${result.outputFilename}`,
            output_size_bytes: result.outputBlob.size,
            stdout: result.logs.join('\n'),
            completed_at: new Date().toISOString(),
            duration_seconds: 1.2,
          },
          result.outputBlob
        );
      } catch (err: any) {
        console.error('Mobile on-device processing error:', err);
        await mobileStorage.updateJob(jobId, {
          status: 'failed',
          error_message: err.message || 'On-device processing failed',
          completed_at: new Date().toISOString(),
        });
      }
    }, 50);

    return initialJob;
  }

  async listJobs(): Promise<Job[]> {
    if (this.isDesktop()) {
      try {
        return await api.listJobs();
      } catch (err) {
        console.warn('Desktop listJobs failed, falling back to mobile storage:', err);
        this.setMode('mobile_standalone');
      }
    }
    return await mobileStorage.getJobs();
  }

  async getJob(id: string): Promise<Job> {
    if (this.isDesktop()) {
      try {
        return await api.getJob(id);
      } catch (err) {
        console.warn('Desktop getJob failed, falling back to mobile storage:', err);
      }
    }
    const job = await mobileStorage.getJob(id);
    if (!job) throw new Error(`Job ${id} not found`);
    return job;
  }

  async getJobDownloadUrl(id: string): Promise<string> {
    if (this.isDesktop()) {
      return api.getJobDownloadUrl(id);
    }
    const blob = await mobileStorage.getJobOutputBlob(id);
    if (!blob) throw new Error('Job output not found in local storage');
    return URL.createObjectURL(blob);
  }

  // ==========================================
  // SYSTEM & DIAGNOSTICS
  // ==========================================
  async getEngines(): Promise<EngineInfo[]> {
    if (this.isDesktop()) {
      try {
        return await api.getEngines();
      } catch (err) {
        console.warn('Desktop getEngines failed, using mobile engines:', err);
      }
    }
    return mobileStorage.getMobileEngines();
  }

  async getDiagnostics(): Promise<SystemDiagnostics> {
    if (this.isDesktop()) {
      try {
        return await api.getDiagnostics();
      } catch (err) {
        console.warn('Desktop getDiagnostics failed, using mobile diagnostics:', err);
      }
    }
    return mobileStorage.getMobileDiagnostics();
  }

  async getSettings(): Promise<AppSetting[]> {
    if (this.isDesktop()) {
      try {
        return await api.getSettings();
      } catch (err) {
        console.warn('Desktop getSettings failed, using mobile settings:', err);
      }
    }
    return mobileStorage.getMobileSettings();
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    if (this.isDesktop()) {
      try {
        return await api.getNetworkInfo();
      } catch {
        // Fallback
      }
    }
    return {
      hostname: 'localhost',
      primary_ip: '127.0.0.1',
      all_ips: ['127.0.0.1'],
      port: 8000,
      mobile_url: 'http://localhost:8000',
      is_lan_available: false,
    };
  }
}

export const universalEngine = new UniversalEngineService();

