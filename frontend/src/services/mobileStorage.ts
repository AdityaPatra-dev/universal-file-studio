import { FileRecord, Job, EngineInfo, SystemDiagnostics, AppSetting } from '../types/api';

const DB_NAME = 'ufs_mobile_db';
const DB_VERSION = 2;

interface StoredFile {
  record: FileRecord;
  blob: Blob;
}

interface StoredJob {
  job: Job;
  outputBlob?: Blob;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('jobs')) {
        db.createObjectStore('jobs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const mobileStorage = {
  async saveFile(file: File | Blob, filename: string): Promise<FileRecord> {
    const db = await openDB();
    const id = Date.now() + Math.floor(Math.random() * 100000);
    const mime = file.type || 'application/octet-stream';
    
    // Categorize
    let category: FileRecord['category'] = 'unknown';
    if (mime.startsWith('image/')) category = 'image';
    else if (mime.startsWith('video/')) category = 'video';
    else if (mime.startsWith('audio/')) category = 'audio';
    else if (mime.includes('pdf')) category = 'pdf';
    else if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('7z')) category = 'archive';
    else if (mime.includes('json') || mime.includes('csv') || mime.includes('xml')) category = 'data';
    else if (mime.startsWith('text/')) category = 'text';
    else if (mime.includes('spreadsheet') || filename.endsWith('.xlsx') || filename.endsWith('.csv')) category = 'spreadsheet';
    else if (filename.endsWith('.docx') || filename.endsWith('.odt') || filename.endsWith('.md')) category = 'document';

    // Compute SHA-256 hash
    let hash = '';
    try {
      const buffer = await file.slice(0, 1024 * 1024).arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      hash = 'hash-' + Math.random().toString(36).substring(2);
    }

    const relativePath = (file as any).webkitRelativePath || '';
    const folderName = relativePath ? relativePath.split('/')[0] : undefined;
    const metadata: Record<string, any> = {};
    if (folderName) metadata.folder = folderName;
    if (relativePath) metadata.relative_path = relativePath;

    const record: FileRecord = {
      id,
      filename,
      original_filename: relativePath || filename,
      mime_type: mime,
      category,
      size_bytes: file.size,
      hash_sha256: hash,
      upload_path: `mobile://${filename}`,
      metadata_json: Object.keys(metadata).length > 0 ? metadata : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      const item: StoredFile = { record, blob: file };
      const req = store.put({ id, ...item });
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  },

  async getFiles(category?: string): Promise<FileRecord[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.getAll();
      req.onsuccess = () => {
        const items: StoredFile[] = req.result || [];
        const records = items.map(i => i.record);
        if (category) {
          resolve(records.filter(r => r.category === category));
        } else {
          resolve(records.reverse());
        }
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getFileRecord(id: number): Promise<FileRecord | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result ? req.result.record : null);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getFileBlob(id: number): Promise<Blob | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result ? req.result.blob : null);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async deleteFile(id: number): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // Jobs
  async saveJob(job: Job, outputBlob?: Blob): Promise<Job> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('jobs', 'readwrite');
      const store = tx.objectStore('jobs');
      const item: StoredJob = { job, outputBlob };
      const req = store.put({ id: job.id, ...item });
      req.onsuccess = () => resolve(job);
      req.onerror = () => reject(req.error);
    });
  },

  async getJobs(): Promise<Job[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('jobs', 'readonly');
      const store = tx.objectStore('jobs');
      const req = store.getAll();
      req.onsuccess = () => {
        const items: StoredJob[] = req.result || [];
        resolve(items.map(i => i.job).reverse());
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getJob(id: string): Promise<Job | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('jobs', 'readonly');
      const store = tx.objectStore('jobs');
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result ? req.result.job : null);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getJobOutputBlob(id: string): Promise<Blob | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('jobs', 'readonly');
      const store = tx.objectStore('jobs');
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result?.outputBlob || null);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async updateJob(id: string, updates: Partial<Job>, outputBlob?: Blob): Promise<Job> {
    const db = await openDB();
    const existing = await this.getJob(id);
    if (!existing) throw new Error(`Job ${id} not found`);

    const updated: Job = { ...existing, ...updates };
    const existingBlob = await this.getJobOutputBlob(id);

    return new Promise((resolve, reject) => {
      const tx = db.transaction('jobs', 'readwrite');
      const store = tx.objectStore('jobs');
      const item: StoredJob = { job: updated, outputBlob: outputBlob || existingBlob || undefined };
      const req = store.put({ id, ...item });
      req.onsuccess = () => resolve(updated);
      req.onerror = () => reject(req.error);
    });
  },

  async deleteJob(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('jobs', 'readwrite');
      const store = tx.objectStore('jobs');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async cancelJob(id: string): Promise<Job> {
    return this.updateJob(id, {
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    });
  },

  async retryJob(id: string): Promise<Job> {
    return this.updateJob(id, {
      status: 'running',
      progress_percent: 10,
      error_message: undefined,
      started_at: new Date().toISOString(),
    });
  },

  async deleteJobsBulk(status?: string): Promise<{ success: boolean; deleted_count: number }> {
    const all = await this.getJobs();
    const toDelete = status ? all.filter(j => j.status === status) : all;
    for (const job of toDelete) {
      await this.deleteJob(job.id);
    }
    return { success: true, deleted_count: toDelete.length };
  },

  async updateSetting(key: string, value: string): Promise<AppSetting> {
    const db = await openDB();
    const setting: AppSetting = {
      key,
      value,
      type: 'string',
      category: 'general',
      description: 'Local on-device configuration',
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put(setting);
      req.onsuccess = () => resolve(setting);
      req.onerror = () => reject(req.error);
    });
  },

  // Mock Engine Info for Mobile Standalone Mode
  getMobileEngines(): EngineInfo[] {
    const now = new Date().toISOString();
    return [
      {
        name: 'Mobile Canvas & Image Engine',
        installed: true,
        version: '1.0.0 (Native Mobile Canvas)',
        path: 'client://canvas',
        capabilities: {
          formats: ['png', 'jpeg', 'webp', 'bmp'],
          encoders: ['canvas', 'offscreen-canvas', 'image-data'],
          decoders: ['browser-native', 'web-codecs'],
        },
        detected_at: now,
      },
      {
        name: 'Mobile PDF-Lib Engine',
        installed: true,
        version: '1.17.1 (Pure Mobile WebAssembly/JS)',
        path: 'client://pdf-lib',
        capabilities: {
          formats: ['pdf'],
          encoders: ['pdf-writer', 'pdf-merger', 'pdf-watermark'],
          decoders: ['pdf-reader', 'pdf-splitter'],
        },
        detected_at: now,
      },
      {
        name: 'Mobile JSZip Archive Engine',
        installed: true,
        version: '3.10.1 (Pure Mobile Compression)',
        path: 'client://jszip',
        capabilities: {
          formats: ['zip'],
          encoders: ['deflate', 'store'],
          decoders: ['inflate'],
        },
        detected_at: now,
      },
      {
        name: 'Mobile Web Audio & Media Engine',
        installed: true,
        version: '1.0.0 (Web Audio & MediaRecorder)',
        path: 'client://webaudio',
        capabilities: {
          formats: ['wav', 'webm', 'ogg', 'mp3'],
          encoders: ['wav-pcm', 'media-recorder'],
          decoders: ['audio-context', 'video-frame-extractor'],
        },
        detected_at: now,
      },
      {
        name: 'Mobile Document & Data Engine',
        installed: true,
        version: '1.0.0 (Pure Mobile Parsers)',
        path: 'client://parsers',
        capabilities: {
          formats: ['md', 'html', 'txt', 'json', 'csv'],
          encoders: ['json-to-csv', 'csv-to-json', 'md-to-html'],
          decoders: ['html-to-text', 'csv-parser'],
        },
        detected_at: now,
      },
      {
        name: 'Mobile WebCrypto Security Engine',
        installed: true,
        version: '1.0.0 (Hardware-Accelerated WebCrypto)',
        path: 'client://webcrypto',
        capabilities: {
          formats: ['sha256', 'sha1', 'sha512', 'md5'],
        },
        detected_at: now,
      },
    ];
  },

  getMobileDiagnostics(): SystemDiagnostics {
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
    return {
      os: isAndroid ? 'Android OS (Mobile Native)' : 'Client Device (Standalone Engine)',
      platform: navigator.platform || 'Mobile',
      python_version: 'Client-Side Runtime (Dual-Engine Mode)',
      cpu_count: navigator.hardwareConcurrency || 4,
      cpu_percent: 18,
      ram_total_gb: 6.0,
      ram_available_gb: 4.2,
      ram_percent: 30,
      disk_total_gb: 64.0,
      disk_free_gb: 38.5,
      disk_percent: 40,
      storage_paths: {
        mode: 'On-Device IndexedDB Storage',
        type: 'Local Private Sandbox',
      },
      installed_engines: this.getMobileEngines(),
    };
  },

  async getMobileSettings(): Promise<AppSetting[]> {
    const defaults: AppSetting[] = [
      { key: 'engine_mode', value: 'auto', type: 'string', category: 'general', description: 'Engine fallback mode (Auto / Server / On-Device)' },
      { key: 'compression_level', value: '80', type: 'number', category: 'image', description: 'Default image compression quality (1-100)' },
      { key: 'pdf_page_orientation', value: 'auto', type: 'string', category: 'pdf', description: 'Default PDF page orientation' },
      { key: 'theme', value: 'dark', type: 'string', category: 'ui', description: 'Application UI Theme' },
    ];
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const req = store.getAll();
        req.onsuccess = () => {
          const stored: AppSetting[] = req.result || [];
          const map = new Map<string, AppSetting>();
          defaults.forEach((d) => map.set(d.key, d));
          stored.forEach((s) => map.set(s.key, s));
          resolve(Array.from(map.values()));
        };
        req.onerror = () => resolve(defaults);
      });
    } catch {
      return defaults;
    }
  }
};
