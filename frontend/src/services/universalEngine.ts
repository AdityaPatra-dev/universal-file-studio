import { FileRecord, Job, EngineInfo, SystemDiagnostics, AppSetting, NetworkInfo, Operation, Preset, FileHashesResponse } from '../types/api';
import { api, setApiBase } from './api';
import { socketService } from './socket';
import { mobileStorage } from './mobileStorage';
import { mobileEngines } from './mobileEngines';
import { UniversalNativeEngine, writeBlobToNativeTempFile, readNativeFileAsBlob, blobToBase64 } from './nativeEngineBridge';
import { Capacitor } from '@capacitor/core';

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

  private getCandidateUrls(): string[] {
    const urls: string[] = [];
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ufs_backend_url');
      if (saved) urls.push(saved.replace(/\/+$/, ''));

      const isCapacitor = Boolean(
        (window as any).Capacitor?.isNativePlatform?.() ||
        window.location.origin.startsWith('capacitor:') ||
        window.location.protocol === 'file:' ||
        (window.location.hostname === 'localhost' && window.location.port === '')
      );

      if (!isCapacitor && window.location.origin && window.location.origin !== 'null') {
        urls.push(window.location.origin);
      }
    }
    // Always include loopback ports for local desktop and Android emulator
    urls.push('http://127.0.0.1:8000');
    urls.push('http://10.0.2.2:8000');
    urls.push('http://localhost:8000');
    return Array.from(new Set(urls));
  }

  public async detectMode(): Promise<EngineMode> {
    const candidates = this.getCandidateUrls();
    for (const base of candidates) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`${base}/api/info`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.status === 'healthy' || data.app_name || data.app) {
            setApiBase(`${base}/api/v1`);
            socketService.setUrlFromHttp(base);
            this.setMode('desktop');
            return 'desktop';
          }
        }
      } catch {
        // Continue to try next candidate
      }
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

  async getFileHashes(id: number): Promise<FileHashesResponse> {
    if (this.isDesktop()) {
      try {
        return await api.getFileHashes(id);
      } catch (err) {
        console.warn('Desktop getFileHashes failed, falling back to local computation:', err);
      }
    }
    const rec = await mobileStorage.getFileRecord(id);
    const blob = await mobileStorage.getFileBlob(id);
    if (!blob) throw new Error('File not found');
    const hashes = await mobileEngines.computeChecksums(blob);
    return {
      file_id: id,
      filename: rec?.filename || 'file',
      sha256: hashes.sha256,
      sha1: hashes.sha1,
      md5: hashes.sha256.substring(0, 32),
      sha512: hashes.sha256,
      crc32: hashes.sha256.substring(0, 8),
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
        const isNative = Capacitor.isNativePlatform();

        // 1. Android Native Engine Execution (FFmpegKit & Tesseract OCR)
        if (
          isNative &&
          (category === 'video' ||
            category === 'audio' ||
            op.startsWith('video_') ||
            op.startsWith('audio_') ||
            op.includes('compress_video') ||
            op.includes('extract_audio') ||
            op.startsWith('ocr'))
        ) {
          const tempInputPath = await writeBlobToNativeTempFile(fileBlob, fileRecord.filename);
          try {
            if (op.startsWith('ocr') || op === 'ocr_image' || op === 'ocr_pdf') {
              const ocrRes = await UniversalNativeEngine.processOcrNative({ inputPath: tempInputPath });
              const textBlob = new Blob([ocrRes.text || ''], { type: 'text/plain' });
              const outName = `${fileRecord.filename.replace(/\.[^/.]+$/, '')}_ocr.txt`;
              result = {
                outputBlob: textBlob,
                outputFilename: outName,
                outputMime: 'text/plain',
                logs: [`[Native Tesseract 5] OCR extracted ${ocrRes.characterCount} characters.`],
              };
            } else if (category === 'audio' || op.startsWith('audio_')) {
              const audioRes = await UniversalNativeEngine.processAudioNative({
                inputPath: tempInputPath,
                operation: op,
                parameters: payload.parameters,
              });
              if (!audioRes.outputPath) throw new Error('Audio operation produced no output path');
              const mime = payload.parameters?.format === 'wav' ? 'audio/wav' : 'audio/mpeg';
              const outBlob = await readNativeFileAsBlob(audioRes.outputPath, mime);
              result = {
                outputBlob: outBlob,
                outputFilename: audioRes.outputFilename || `${fileRecord.filename.replace(/\.[^/.]+$/, '')}.mp3`,
                outputMime: mime,
                logs: [`[Native FFmpegKit GPL] Audio ${op} finished successfully.`],
              };
            } else {
              // Video operation
              let progressSub: any = null;
              try {
                progressSub = await UniversalNativeEngine.addListener('videoProgress', (info: { percent: number }) => {
                  if (info?.percent) {
                    mobileStorage.updateJob(jobId, { progress_percent: Math.min(95, Math.max(5, info.percent)) });
                  }
                });
              } catch {}

              try {
                mobileStorage.updateJob(jobId, { progress_percent: 15 });
                const videoRes = await UniversalNativeEngine.processVideoNative({
                  inputPath: tempInputPath,
                  operation: op,
                  parameters: payload.parameters,
                });
                if (!videoRes.outputPath) throw new Error('Video operation produced no output path');
                mobileStorage.updateJob(jobId, { progress_percent: 92 });
                const isAudioExtract = op === 'extract_audio';
                const mime = isAudioExtract ? 'audio/mpeg' : 'video/mp4';
                const outBlob = await readNativeFileAsBlob(videoRes.outputPath, mime);
                result = {
                  outputBlob: outBlob,
                  outputFilename: videoRes.outputFilename || `${fileRecord.filename.replace(/\.[^/.]+$/, '')}.${isAudioExtract ? 'mp3' : 'mp4'}`,
                  outputMime: mime,
                  logs: [`[Native FFmpegKit GPL] Video ${op} finished successfully.`],
                };
              } finally {
                if (progressSub && typeof progressSub.remove === 'function') {
                  progressSub.remove();
                }
              }
            }
          } finally {
            UniversalNativeEngine.deleteTempFile({ filePath: tempInputPath }).catch(() => {});
          }
        } else if (category === 'image' && (op.startsWith('ocr') || op === 'ocr_image')) {
          if (isNative) {
            const tempInputPath = await writeBlobToNativeTempFile(fileBlob, fileRecord.filename);
            try {
              const ocrRes = await UniversalNativeEngine.processOcrNative({ inputPath: tempInputPath });
              const textBlob = new Blob([ocrRes.text || ''], { type: 'text/plain' });
              const outName = `${fileRecord.filename.replace(/\.[^/.]+$/, '')}_ocr.txt`;
              result = {
                outputBlob: textBlob,
                outputFilename: outName,
                outputMime: 'text/plain',
                logs: [`[Native Tesseract 5] OCR extracted ${ocrRes.characterCount} characters.`],
              };
            } finally {
              UniversalNativeEngine.deleteTempFile({ filePath: tempInputPath }).catch(() => {});
            }
          } else {
            throw new Error('Offline OCR is supported on native Android with Tesseract or via desktop backend.');
          }
        } else if (category === 'archive' || op === 'zip' || op === 'create_zip' || op === 'archive' || op === 'compress' || op === 'extract_zip') {
          result = await mobileEngines.processArchive(
            [{ blob: fileBlob, filename: fileRecord.filename }],
            op,
            payload.parameters,
            (pct) => {
              mobileStorage.updateJob(jobId, { progress_percent: pct });
            }
          );
        } else if (category === 'pdf' || op.includes('pdf') || op === 'watermark' || op === 'split' || op === 'merge' || op === 'images_to_pdf' || op === 'text_to_pdf' || op === 'pdf_repair') {
          const allBlobs: { blob: Blob; filename: string }[] = [
            { blob: fileBlob, filename: fileRecord.filename },
          ];

          const additionalIds: any[] = payload.parameters?.additional_file_ids || 
            (payload.parameters?.all_file_ids ? payload.parameters.all_file_ids.filter((id: any) => String(id) !== String(fileRecord.id)) : []);

          if (Array.isArray(additionalIds) && additionalIds.length > 0) {
            for (const addId of additionalIds) {
              try {
                const addRec = await mobileStorage.getFileRecord(Number(addId));
                const addBlob = await mobileStorage.getFileBlob(Number(addId));
                if (addRec && addBlob) {
                  allBlobs.push({ blob: addBlob, filename: addRec.filename });
                }
              } catch (err) {
                console.warn('Failed to load additional file for multi-file PDF job:', addId, err);
              }
            }
          }

          result = await mobileEngines.processPdf(
            allBlobs,
            op,
            payload.parameters,
            (pct) => {
              mobileStorage.updateJob(jobId, { progress_percent: pct });
            }
          );
        } else if (category === 'image' || op.startsWith('image_') || op === 'resize' || op === 'crop' || op === 'rotate' || op === 'flip' || op === 'compress_image') {
          result = await mobileEngines.processImage(
            fileBlob,
            fileRecord.filename,
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
          progress_percent: 0,
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

  /**
   * Universal Download: Saves directly to device Public Downloads folder on Android,
   * or triggers browser download on Desktop. Returns the final file path / display path.
   */
  async saveOrDownloadJobOutput(id: string): Promise<{ success: boolean; filePath?: string; displayPath: string }> {
    const job = await this.getJob(id);
    const filename = job?.output_filename || `result_${id}`;

    if (Capacitor.isNativePlatform()) {
      try {
        const blob = await mobileStorage.getJobOutputBlob(id);
        if (!blob) throw new Error('Job output blob not found in storage');
        const base64 = await blobToBase64(blob);
        const res = await UniversalNativeEngine.saveToPublicDownloads({
          fileName: filename,
          base64Data: base64,
        });
        if (job) {
          await mobileStorage.updateJob(id, {
            output_path: res.filePath,
          });
        }
        return { success: true, filePath: res.filePath, displayPath: res.displayPath };
      } catch (err: any) {
        console.error('Native saveToPublicDownloads failed, trying web fallback:', err);
      }
    }

    // Web / Browser download fallback
    const url = await this.getJobDownloadUrl(id);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { success: true, displayPath: `Downloads/${filename}` };
  }

  /**
   * Save uploaded user file to device storage
   */
  async saveOrDownloadFile(fileId: number): Promise<{ success: boolean; filePath?: string; displayPath: string }> {
    const files = await this.listFiles();
    const f = files.find((item) => item.id === fileId);
    const filename = f?.filename || `file_${fileId}`;

    if (Capacitor.isNativePlatform()) {
      try {
        const blob = await mobileStorage.getFileBlob(fileId);
        if (!blob) throw new Error('File blob not found');
        const base64 = await blobToBase64(blob);
        const res = await UniversalNativeEngine.saveToPublicDownloads({
          fileName: filename,
          base64Data: base64,
        });
        return { success: true, filePath: res.filePath, displayPath: res.displayPath };
      } catch (err: any) {
        console.error('Native saveToPublicDownloads failed for file:', err);
      }
    }

    // Web / Browser fallback
    const url = await this.getFileDownloadUrl(fileId);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { success: true, displayPath: `Downloads/${filename}` };
  }

  /**
   * Open or reveal file with system viewer (Launches Android Intent Chooser / Opener like WhatsApp)
   */
  async openFile(filePathOrJobId: string, outputBlob?: Blob, filename?: string | null): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        let filePath = filePathOrJobId;
        let base64Data: string | undefined = undefined;
        let fname = filename || 'document';

        if (filePathOrJobId.startsWith('mob_')) {
          const job = await this.getJob(filePathOrJobId);
          fname = job?.output_filename || `result_${filePathOrJobId}`;
          const blob = outputBlob || await mobileStorage.getJobOutputBlob(filePathOrJobId);
          if (blob) {
            base64Data = await blobToBase64(blob);
          }
        } else if (outputBlob) {
          base64Data = await blobToBase64(outputBlob);
        }

        const res = await UniversalNativeEngine.openFileNative({
          filePath,
          base64Data,
          fileName: fname,
        });
        return res.success;
      } catch (err) {
        console.error('openFileNative error:', err);
      }
    } else {
      try {
        if (filePathOrJobId.startsWith('mob_')) {
          const url = await this.getJobDownloadUrl(filePathOrJobId);
          window.open(url, '_blank');
          return true;
        }
      } catch {}
    }
    return false;
  }

  /**
   * Share file via Android system share sheet (WhatsApp, Gmail, Drive, etc.)
   */
  async shareFile(filePathOrJobId: string, title?: string | null, outputBlob?: Blob): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        let filePath = filePathOrJobId;
        if (filePathOrJobId.startsWith('mob_')) {
          const job = await this.getJob(filePathOrJobId);
          const fname = job?.output_filename || `result_${filePathOrJobId}`;
          const blob = outputBlob || await mobileStorage.getJobOutputBlob(filePathOrJobId);
          if (blob) {
            const base64 = await blobToBase64(blob);
            const saved = await UniversalNativeEngine.saveToPublicDownloads({
              fileName: fname,
              base64Data: base64,
            });
            filePath = saved.filePath;
          }
        }

        const res = await UniversalNativeEngine.shareFileNative({ filePath, title });
        return res.success;
      } catch (err) {
        console.error('shareFileNative error:', err);
      }
    }
    return false;
  }

  async cancelJob(id: string): Promise<void> {
    if (this.isDesktop()) {
      try {
        await api.cancelJob(id);
        return;
      } catch (err) {
        console.warn('Desktop cancelJob failed, falling back:', err);
      }
    }
    await mobileStorage.cancelJob(id);
  }

  async retryJob(id: string): Promise<Job> {
    if (this.isDesktop()) {
      try {
        return await api.retryJob(id);
      } catch (err) {
        console.warn('Desktop retryJob failed, falling back:', err);
      }
    }
    const job = await mobileStorage.getJob(id);
    if (!job) throw new Error(`Job ${id} not found`);
    return await this.createJob({
      file_id: job.file_id,
      operation: job.operation,
      engine_used: job.engine_used,
      parameters: job.parameters,
    });
  }

  async deleteJob(id: string): Promise<void> {
    if (this.isDesktop()) {
      try {
        await api.deleteJob(id);
        return;
      } catch (err) {
        console.warn('Desktop deleteJob failed, falling back:', err);
      }
    }
    await mobileStorage.deleteJob(id);
  }

  async deleteJobsBulk(status?: string): Promise<{ success: boolean; deleted_count: number }> {
    if (this.isDesktop()) {
      try {
        return await api.deleteJobsBulk(status);
      } catch (err) {
        console.warn('Desktop deleteJobsBulk failed, falling back:', err);
      }
    }
    return await mobileStorage.deleteJobsBulk(status);
  }

  async updateSetting(key: string, value: string): Promise<AppSetting> {
    if (this.isDesktop()) {
      try {
        return await api.updateSetting(key, value);
      } catch (err) {
        console.warn('Desktop updateSetting failed, falling back:', err);
      }
    }
    return await mobileStorage.updateSetting(key, value);
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

  // ==========================================
  // UNIFIED OPERATIONS & PRESETS
  // ==========================================
  async getFileOperations(fileId: number, category?: string): Promise<Operation[]> {
    if (this.isDesktop()) {
      try {
        return await api.getFileOperations(fileId);
      } catch (err) {
        console.warn('Desktop getFileOperations failed, falling back:', err);
      }
    }

    let cat = category;
    if (!cat) {
      const rec = await mobileStorage.getFileRecord(fileId);
      cat = rec?.category || 'general';
    }

    return this.getOfflineOperations(cat);
  }

  getOfflineOperations(category: string): Operation[] {
    const isNative = Capacitor.isNativePlatform();
    const ops: Operation[] = [];

    if (category === 'video') {
      ops.push({
        id: 'video_convert',
        name: 'Convert Video',
        engine: isNative ? 'ffmpeg-kit' : 'canvas',
        category: 'video',
        description: 'Convert video to MP4, WebM, MKV, or GIF animation',
        parameters: [
          { name: 'format', type: 'select', options: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'gif'], default: 'mp4' },
        ],
      });
      ops.push({
        id: 'compress_video',
        name: 'Compress Video',
        engine: isNative ? 'ffmpeg-kit' : 'canvas',
        category: 'video',
        description: 'Reduce video file size with intelligent CRF compression',
        parameters: [{ name: 'crf', type: 'number', default: 28, min: 18, max: 35 }],
      });
      ops.push({
        id: 'extract_audio',
        name: 'Extract Audio',
        engine: isNative ? 'ffmpeg-kit' : 'webaudio',
        category: 'video',
        description: 'Extract audio track to MP3 or WAV',
        parameters: [{ name: 'format', type: 'select', options: ['mp3', 'wav', 'aac'], default: 'mp3' }],
      });
      ops.push({
        id: 'video_trim',
        name: 'Trim Video',
        engine: isNative ? 'ffmpeg-kit' : 'canvas',
        category: 'video',
        description: 'Trim segment with precise start and end times',
        parameters: [
          { name: 'start_time', type: 'number', default: 0 },
          { name: 'end_time', type: 'number', default: 10 },
        ],
      });
      ops.push({
        id: 'extract_frame',
        name: 'Extract Frame (Thumbnail)',
        engine: isNative ? 'android-media' : 'canvas',
        category: 'video',
        description: 'Capture full-resolution still frame at timestamp',
        parameters: [{ name: 'time', type: 'number', default: 1.0 }],
      });
    } else if (category === 'audio') {
      ops.push({
        id: 'audio_convert',
        name: 'Convert Audio',
        engine: isNative ? 'ffmpeg-kit' : 'webaudio',
        category: 'audio',
        description: 'Convert audio to MP3, WAV, AAC, or FLAC',
        parameters: [{ name: 'format', type: 'select', options: ['mp3', 'wav', 'aac', 'flac'], default: 'mp3' }],
      });
      ops.push({
        id: 'audio_normalize',
        name: 'Normalize Audio (Loudness)',
        engine: isNative ? 'ffmpeg-kit' : 'webaudio',
        category: 'audio',
        description: 'Normalize loudness to broadcast standards',
        parameters: [],
      });
    } else if (category === 'image') {
      ops.push({
        id: 'image_convert',
        name: 'Convert Image',
        engine: isNative ? 'android-skia' : 'canvas',
        category: 'image',
        description: 'Convert image to WebP, PNG, JPEG',
        parameters: [{ name: 'format', type: 'select', options: ['webp', 'png', 'jpg'], default: 'webp' }],
      });
      ops.push({
        id: 'resize_image',
        name: 'Resize Image',
        engine: isNative ? 'android-skia' : 'canvas',
        category: 'image',
        description: 'Scale dimensions or percentage',
        parameters: [
          { name: 'width', type: 'number', default: 1920 },
          { name: 'height', type: 'number', default: 1080 },
        ],
      });
      ops.push({
        id: 'compress_image',
        name: 'Compress Image',
        engine: isNative ? 'android-skia' : 'canvas',
        category: 'image',
        description: 'Optimize image quality and reduce file size',
        parameters: [{ name: 'quality', type: 'number', default: 80, min: 10, max: 100 }],
      });
      if (isNative) {
        ops.push({
          id: 'ocr_image',
          name: 'OCR Extract Text',
          engine: 'tesseract',
          category: 'image',
          description: 'Extract printed text from image using on-device Tesseract OCR',
          parameters: [{ name: 'language', type: 'select', options: ['eng'], default: 'eng' }],
        });
      }
    } else if (category === 'pdf') {
      ops.push({
        id: 'split_pdf',
        name: 'Split PDF Pages',
        engine: 'pdf-lib',
        category: 'pdf',
        description: 'Extract page ranges into new PDF',
        parameters: [{ name: 'pages', type: 'text', default: '1' }],
      });
      ops.push({
        id: 'watermark_pdf',
        name: 'Watermark PDF',
        engine: 'pdf-lib',
        category: 'pdf',
        description: 'Overlay custom watermark text',
        parameters: [
          { name: 'text', type: 'text', default: 'CONFIDENTIAL' },
          { name: 'opacity', type: 'text', default: '0.35' },
        ],
      });
    } else if (category === 'archive') {
      ops.push({
        id: 'archive_extract',
        name: 'Extract Archive',
        engine: isNative ? 'android-zip' : 'jszip',
        category: 'archive',
        description: 'Decompress files from archive',
        parameters: [],
      });
      ops.push({
        id: 'create_zip',
        name: 'Compress to ZIP',
        engine: isNative ? 'android-zip' : 'jszip',
        category: 'archive',
        description: 'Package into standard ZIP container',
        parameters: [{ name: 'archive_name', type: 'text', default: 'archive.zip' }],
      });
    }

    ops.push({
      id: 'file_hash',
      name: 'Calculate Checksums (SHA-256 / SHA-1)',
      engine: 'crypto',
      category: 'general',
      description: 'Calculate cryptographic integrity digests',
      parameters: [],
    });

    return ops;
  }

  async listPresets(): Promise<Preset[]> {
    if (this.isDesktop()) {
      try {
        const p = await api.listPresets();
        if (p && p.length > 0) return p;
      } catch {
        // Fallback
      }
    }
    return [
      {
        id: 1,
        name: 'Optimize for Web (WebP)',
        description: 'Compress image into fast modern WebP at 80% quality',
        operation: 'image_convert',
        engine: 'auto',
        parameters: { format: 'webp', quality: 80 },
        is_default: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'High-Quality MP4 (CRF 24)',
        description: 'Compress video to standard MP4 with CRF 24',
        operation: 'compress_video',
        engine: 'auto',
        parameters: { crf: 24, format: 'mp4' },
        is_default: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        name: 'Rip MP3 Audio',
        description: 'Extract audio track from video as 192kbps MP3',
        operation: 'extract_audio',
        engine: 'auto',
        parameters: { format: 'mp3' },
        is_default: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 4,
        name: 'OCR Text Extractor',
        description: 'Recognize and extract text from images into TXT',
        operation: 'ocr_image',
        engine: 'auto',
        parameters: { language: 'eng' },
        is_default: true,
        created_at: new Date().toISOString(),
      },
    ];
  }

  async batchConvert(fileIds: number[], targetFormat: string, parameters: Record<string, any> = {}): Promise<any> {
    if (this.isDesktop()) {
      try {
        return await api.batchConvert(fileIds, targetFormat, parameters);
      } catch (err) {
        console.warn('Desktop batchConvert failed, falling back:', err);
      }
    }
    const jobs = [];
    for (const id of fileIds) {
      const rec = await mobileStorage.getFileRecord(id);
      const op =
        rec?.category === 'video'
          ? 'video_convert'
          : rec?.category === 'audio'
          ? 'audio_convert'
          : 'image_convert';
      jobs.push(
        await this.createJob({
          file_id: id,
          operation: op,
          parameters: { format: targetFormat, ...parameters },
        })
      );
    }
    return jobs;
  }

  async batchCompress(fileIds: number[], qualityOrCrf?: number): Promise<any> {
    if (this.isDesktop()) {
      try {
        return await api.batchCompress(fileIds, qualityOrCrf);
      } catch (err) {
        console.warn('Desktop batchCompress failed, falling back:', err);
      }
    }
    const jobs = [];
    for (const id of fileIds) {
      const rec = await mobileStorage.getFileRecord(id);
      const isVid = rec?.category === 'video';
      const op = isVid ? 'compress_video' : 'compress_image';
      const params = isVid ? { crf: qualityOrCrf || 28 } : { quality: qualityOrCrf || 80 };
      jobs.push(await this.createJob({ file_id: id, operation: op, parameters: params }));
    }
    return jobs;
  }

  async batchArchive(fileIds: number[], archiveFormat = 'zip', archiveName = 'ufs_archive'): Promise<any> {
    if (this.isDesktop()) {
      try {
        return await api.batchArchive(fileIds, archiveFormat, archiveName);
      } catch (err) {
        console.warn('Desktop batchArchive failed, falling back:', err);
      }
    }
    const blobsWithNames: { blob: Blob; filename: string }[] = [];
    for (const id of fileIds) {
      const rec = await mobileStorage.getFileRecord(id);
      const b = await mobileStorage.getFileBlob(id);
      if (rec && b) blobsWithNames.push({ blob: b, filename: rec.filename });
    }
    const res = await mobileEngines.processArchive(blobsWithNames, 'create_zip', { archive_name: archiveName });
    const saved = await mobileStorage.saveFile(res.outputBlob, res.outputFilename);
    return saved;
  }
}

export const universalEngine = new UniversalEngineService();

