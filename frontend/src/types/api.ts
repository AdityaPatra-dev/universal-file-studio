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

export interface PipelineStep {
  name?: string;
  operation: string;
  engine?: string;
  parameters: Record<string, any>;
}

export interface Pipeline {
  id: number;
  name: string;
  description: string;
  steps: PipelineStep[];
  created_at: string;
}

export interface PipelineCreatePayload {
  name: string;
  description?: string;
  steps: PipelineStep[];
}

export interface PipelineUpdatePayload {
  name?: string;
  description?: string;
  steps?: PipelineStep[];
}

export interface DeveloperInfo {
  project: string;
  version: string;
  environment: {
    python_version: string;
    os: string;
    host: string;
    port: number;
    api_prefix: string;
  };
  docs: {
    swagger_ui: string;
    redoc: string;
    openapi_json: string;
  };
  websocket: {
    stream_endpoint: string;
    scoped_endpoint: string;
    supported_events: string[];
  };
  engines: {
    total_registered: number;
    installed_count: number;
    installed: string[];
  };
  cli: {
    binary: string;
    module: string;
    commands: string[];
  };
}

export interface WebSocketEventPacket {
  event: string;
  timestamp?: string | number;
  payload?: any;
  [key: string]: any;
}

export interface OperationSpec {
  id: string;
  name: string;
  category: string;
  engine: string;
  description: string;
  accepts: {
    categories: string[];
    formats: string[];
    directory: boolean;
  };
  produces: {
    category: string;
    format?: string;
    format_from_param?: string;
    directory: boolean;
  };
  parameters: OperationParam[];
  batch_capable: boolean;
}

export interface PipelineValidationIssue {
  step: number;
  operation: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface PipelineValidationResponse {
  valid: boolean;
  issues: PipelineValidationIssue[];
}

export interface PipelineBatchExecutePayload {
  file_ids: number[];
  parameters?: Record<string, any>;
  on_error?: 'stop' | 'skip' | 'collect';
}
