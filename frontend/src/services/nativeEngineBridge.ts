import { registerPlugin } from '@capacitor/core';

export interface NativeEngineStatus {
  isNativeAndroid: boolean;
  deviceModel: string;
  androidVersion: string;
  cpuArch: string;
  availableProcessors: number;
  maxMemoryMb: number;
  freeMemoryMb: number;
}

export interface NativeProcessResult {
  success: boolean;
  outputPath?: string;
  outputFilename?: string;
  outputDirectory?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  extractedCount?: number;
  files?: string[];
}

export interface UniversalNativeEnginePlugin {
  getEngineStatus(): Promise<NativeEngineStatus>;
  processImageNative(options: {
    inputPath: string;
    operation: string;
    parameters?: Record<string, any>;
  }): Promise<NativeProcessResult>;
  processArchiveNative(options: {
    operation: 'create_zip' | 'extract_zip' | string;
    files?: string[];
    inputPath?: string;
    archiveName?: string;
  }): Promise<NativeProcessResult>;
  extractVideoFrameNative(options: {
    inputPath: string;
    time?: string;
    timeSeconds?: number;
  }): Promise<NativeProcessResult>;
  processDocumentNative(options: {
    inputPath: string;
    targetFormat: string;
  }): Promise<NativeProcessResult>;
  installApk(options: {
    filePath: string;
  }): Promise<{ success: boolean }>;
  downloadAndInstallApk(options: {
    url: string;
  }): Promise<{ success: boolean; filePath: string }>;
  executeFFmpeg(options: {
    command: string;
  }): Promise<{ success: boolean; returnCode: number; output: string; durationMs: number }>;
  processVideoNative(options: {
    inputPath: string;
    operation: string;
    parameters?: Record<string, any>;
    files?: string[];
  }): Promise<NativeProcessResult>;
  processAudioNative(options: {
    inputPath: string;
    operation: string;
    parameters?: Record<string, any>;
    files?: string[];
  }): Promise<NativeProcessResult>;
  processOcrNative(options: {
    inputPath: string;
  }): Promise<{ success: boolean; text: string; characterCount: number; outputPath?: string; outputFilename?: string; sizeBytes?: number }>;
  renderPdfPagesNative(options: {
    inputPath: string;
    scale?: number;
    format?: 'png' | 'jpg' | 'jpeg';
  }): Promise<NativeProcessResult & { pageCount?: number }>;
  writeTempFile(options: {
    fileName: string;
    base64Data: string;
  }): Promise<{ success: boolean; path: string; sizeBytes: number }>;
  appendTempFileChunk(options: {
    path: string;
    chunkBase64: string;
    isFirst?: boolean;
  }): Promise<{ success: boolean; path: string; sizeBytes: number }>;
  readTempFileBase64(options: {
    filePath: string;
  }): Promise<{ success: boolean; base64Data?: string; filePath?: string; isTooLargeForBase64?: boolean; sizeBytes: number }>;
  deleteTempFile(options: {
    filePath: string;
  }): Promise<{ success: boolean }>;
  saveToPublicDownloads(options: {
    fileName: string;
    base64Data?: string;
    tempFilePath?: string;
  }): Promise<{ success: boolean; filePath: string; displayPath: string; sizeBytes: number }>;
  openFileNative(options: {
    filePath?: string;
    base64Data?: string;
    fileName?: string;
    mimeType?: string;
  }): Promise<{ success: boolean; resolvedPath?: string }>;
  shareFileNative(options: {
    filePath: string;
    title?: string | null;
  }): Promise<{ success: boolean }>;
  addListener(
    eventName: 'videoProgress' | 'audioProgress',
    listenerFunc: (info: { percent: number }) => void
  ): Promise<{ remove: () => void }>;
}

export const UniversalNativeEngine = registerPlugin<UniversalNativeEnginePlugin>('UniversalNativeEngine');

/**
 * Write a JS Blob to a local temp file in the app sandbox for C++ engines
 */
export async function writeBlobToNativeTempFile(blob: Blob, filename: string): Promise<string> {
  const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks
  if (blob.size <= CHUNK_SIZE) {
    const base64 = await blobToBase64(blob);
    const res = await UniversalNativeEngine.writeTempFile({ fileName: filename, base64Data: base64 });
    return res.path;
  }

  // Stream in chunks: initialize file on native disk via writeTempFile with first chunk,
  // then append subsequent chunks directly to the returned native path.
  const firstSlice = blob.slice(0, CHUNK_SIZE);
  const firstBase64 = await blobToBase64(firstSlice);
  const initRes = await UniversalNativeEngine.writeTempFile({ fileName: filename, base64Data: firstBase64 });
  const realNativePath = initRes.path;

  let offset = CHUNK_SIZE;
  while (offset < blob.size) {
    const slice = blob.slice(offset, Math.min(offset + CHUNK_SIZE, blob.size));
    const chunkBase64 = await blobToBase64(slice);
    await UniversalNativeEngine.appendTempFileChunk({
      path: realNativePath,
      chunkBase64,
      isFirst: false,
    });
    offset += CHUNK_SIZE;
  }

  return realNativePath;
}

/**
 * Read output file from native filesystem back into a JS Blob
 */
export async function readNativeFileAsBlob(filePath: string, mimeType = 'application/octet-stream'): Promise<Blob> {
  // 1. Try streaming directly via Capacitor convertFileSrc HTTP server (Zero base64 memory spike!)
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const webSrc = Capacitor.convertFileSrc(filePath);
      const response = await fetch(webSrc);
      if (response.ok) {
        return await response.blob();
      }
    }
  } catch (err) {
    console.warn('convertFileSrc fetch failed, trying readTempFileBase64:', err);
  }

  // 2. Fallback to base64 reader if convertFileSrc is unavailable
  try {
    const readRes = await UniversalNativeEngine.readTempFileBase64({ filePath });
    if (readRes.base64Data) {
      return base64ToBlob(readRes.base64Data, mimeType);
    }
  } catch (err) {
    console.warn('readTempFileBase64 failed, falling back:', err);
  }

  // 3. Fallback to standard fetch
  const { Capacitor } = await import('@capacitor/core');
  const webSrc = Capacitor.convertFileSrc(filePath);
  const response = await fetch(webSrc);
  return await response.blob();
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteArrays: Uint8Array[] = [];
  const sliceSize = 512;

  for (let offset = 0; offset < byteChars.length; offset += sliceSize) {
    const slice = byteChars.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays as any, { type: mimeType });
}

