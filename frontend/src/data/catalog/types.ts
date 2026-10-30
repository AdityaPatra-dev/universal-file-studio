export type ToolCategory = 'document' | 'video' | 'audio' | 'image' | 'archive';

export type ToolBadge = 'popular' | 'top' | 'essential' | 'new' | 'fast';

export type ParameterType = 
  | 'select' 
  | 'text' 
  | 'number' 
  | 'slider' 
  | 'boolean' 
  | 'password' 
  | 'timerange' 
  | 'pagerange' 
  | 'alignment_grid'
  | 'compression_tier'
  | 'file_list';

export interface ParameterOption {
  label: string;
  value: any;
  description?: string;
  badge?: string;
}

export interface ToolParameter {
  name: string;
  label: string;
  type: ParameterType;
  default?: any;
  options?: ParameterOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  description?: string;
}

export interface StudioTool {
  id: string;
  name: string;
  category: ToolCategory;
  categoryLabel: string;
  subCategory: string;
  description: string;
  iconName: string;
  color: string;
  badge?: ToolBadge;
  rank: number; // Lower number = higher priority / pinned at top
  isPinnedTop?: boolean;
  operation: string;
  backendEngine: string;
  mobileEngine: string;
  inputFormats: string[];
  outputFormats: string[];
  defaultParameters: Record<string, any>;
  parameters: ToolParameter[];
  keywords: string[];
  examples?: string[];
  acceptsMultipleFiles?: boolean;
}

export interface SubCategoryFilter {
  id: string;
  label: string;
  count: number;
}

