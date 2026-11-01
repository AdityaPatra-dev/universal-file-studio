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
  }): Promise<NativeProcessResult>;
  processAudioNative(options: {
    inputPath: string;
    operation: string;
    parameters?: Record<string, any>;
  }): Promise<NativeProcessResult>;
  processOcrNative(options: {
    inputPath: string;
  }): Promise<{ success: boolean; text: string; characterCount: number }>;
}

export const UniversalNativeEngine = registerPlugin<UniversalNativeEnginePlugin>('UniversalNativeEngine');

