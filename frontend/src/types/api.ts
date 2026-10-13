export interface FileRecord {
  id: number;
  filename: string;
  original_filename: string;
  mime_type: string;
  category: 'video' | 'audio' | 'image' | 'pdf' | 'archive' | 'document' | 'spreadsheet' | 'data' | 'text' | 'unknown';
  detected_format?: string | null;
  size_bytes: number;
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
  codec_info?: Record<string, any> | null;
  metadata_json?: Record<string, any> | null;
  hash_sha256: string;
  upload_path: string;
  created_at: string;
  updated_at: string;
}

export type JobStatus = 'pending' | 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface Job {
  id: string;
  file_id: number;
  operation: string;
  status: JobStatus;
  progress_percent: number;
  engine_used: string;
  parameters: Record<string, any>;
  input_path: string;
  output_path?: string | null;
  output_filename?: string | null;
  output_size_bytes?: number | null;
  error_message?: string | null;
  error_detail?: string | null;
  command_executed?: string | null;
  stdout?: string | null;
  stderr?: string | null;
  exit_code?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  duration_seconds?: number | null;
}

export interface EngineInfo {
  name: string;
  installed: boolean;
  version?: string | null;
  path?: string | null;
  capabilities: {
    formats?: string[];
    encoders?: string[];
    decoders?: string[];
    languages?: string[];
    extras?: Record<string, any>;
  };
  detected_at: string;
}

export interface SystemDiagnostics {
  os: string;
  platform: string;
  python_version: string;
  cpu_count: number;
  cpu_percent: number;
  ram_total_gb: number;
  ram_available_gb: number;
  ram_percent: number;
  disk_total_gb: number;
  disk_free_gb: number;
  disk_percent: number;
  storage_paths: Record<string, string>;
  installed_engines: EngineInfo[];
}

export interface OperationParam {
  name: string;
  type: 'select' | 'number' | 'text' | 'boolean';
  options?: string[];
  default?: any;
  min?: number;
  max?: number;
}

export interface Operation {
  id: string;
  name: string;
  engine: string;
  category: string;
  description: string;
  parameters?: OperationParam[];
}

export interface Preset {
  id: number;
  name: string;
  description: string;
  operation: string;
  engine: string;
  parameters: Record<string, any>;
  is_default: boolean;
  created_at: string;
}

export interface AppSetting {
  key: string;
  value: string;
  type: string;
  category: string;
  description: string;
}

export interface FileHashesResponse {
  file_id: number;
  filename: string;
  size_bytes: number;
  sha256: string;
  md5: string;
  sha1: string;
  sha512: string;
  crc32: string;
}

export interface FileMetadataResponse {
  file_id: number;
  filename: string;
  mime_type: string;
  category: string;
  metadata: Record<string, any>;
}

