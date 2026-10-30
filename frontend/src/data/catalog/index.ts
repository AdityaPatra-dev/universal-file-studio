import { StudioTool, ToolCategory, SubCategoryFilter } from './types';
import { DOCUMENT_TOOLS } from './documentCatalog';
import { VIDEO_TOOLS } from './videoCatalog';
import { AUDIO_TOOLS } from './audioCatalog';
import { IMAGE_TOOLS } from './imageCatalog';
import { ARCHIVE_TOOLS } from './archiveCatalog';

export * from './types';
export { DOCUMENT_TOOLS } from './documentCatalog';
export { VIDEO_TOOLS } from './videoCatalog';
export { AUDIO_TOOLS } from './audioCatalog';
export { IMAGE_TOOLS } from './imageCatalog';
export { ARCHIVE_TOOLS } from './archiveCatalog';

export const ALL_STUDIO_TOOLS: StudioTool[] = [
  ...DOCUMENT_TOOLS,
  ...VIDEO_TOOLS,
  ...AUDIO_TOOLS,
  ...IMAGE_TOOLS,
  ...ARCHIVE_TOOLS,
];

export interface StudioCategoryMeta {
  id: ToolCategory;
  name: string;
  shortName: string;
  iconName: string;
  color: string;
  badgeColor: string;
  description: string;
  toolCount: number;
}

export const STUDIO_CATEGORIES: StudioCategoryMeta[] = [
  {
    id: 'document',
    name: 'Document & PDF Studio',
    shortName: 'Document & PDF',
    iconName: 'FileText',
    color: 'from-amber-500 to-orange-600',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    description: 'Complete 27-tool iLovePDF suite. Convert, merge, split, compress, protect, watermark, and sign documents.',
    toolCount: DOCUMENT_TOOLS.length,
  },
  {
    id: 'video',
    name: 'Video Studio',
    shortName: 'Video',
    iconName: 'Film',
    color: 'from-indigo-500 to-violet-600',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    description: 'Hardware-accelerated transcoding, trimming, 9:16 social cropping, compression, audio ripping, and GIF generation.',
    toolCount: VIDEO_TOOLS.length,
  },
  {
    id: 'audio',
    name: 'Audio Studio',
    shortName: 'Audio',
    iconName: 'Music',
    color: 'from-rose-500 to-pink-600',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    description: 'Lossless audio conversion, ringtone cutter, EBU R128 loudness normalizer, speed controller, and volume booster.',
    toolCount: AUDIO_TOOLS.length,
  },
  {
    id: 'image',
    name: 'Image Studio',
    shortName: 'Image',
    iconName: 'Image',
    color: 'from-cyan-500 to-blue-600',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    description: 'TinyPNG-grade photo compression, WebP transcode, HEIC converter, combine photos to PDF, and EXIF privacy scrubber.',
    toolCount: IMAGE_TOOLS.length,
  },
  {
    id: 'archive',
    name: 'Archive & Data Studio',
    shortName: 'Archive & Data',
    iconName: 'Archive',
    color: 'from-emerald-500 to-teal-600',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    description: 'Decompress any archive (ZIP, 7Z, RAR, TAR), create AES-256 encrypted packages, and compute SHA-256 checksums.',
    toolCount: ARCHIVE_TOOLS.length,
  },
];

export function getToolsByCategory(category: ToolCategory | 'all'): StudioTool[] {
  if (category === 'all') {
    return ALL_STUDIO_TOOLS;
  }
  return ALL_STUDIO_TOOLS.filter((t) => t.category === category);
}

export function getPinnedTools(category?: ToolCategory | 'all'): StudioTool[] {
  const tools = category && category !== 'all' ? getToolsByCategory(category) : ALL_STUDIO_TOOLS;
  return tools.filter((t) => t.isPinnedTop);
}

export function getSubCategories(category: ToolCategory | 'all'): SubCategoryFilter[] {
  const tools = getToolsByCategory(category);
  const subMap = new Map<string, number>();

  tools.forEach((t) => {
    subMap.set(t.subCategory, (subMap.get(t.subCategory) || 0) + 1);
  });

  const subs: SubCategoryFilter[] = [{ id: 'all', label: 'All', count: tools.length }];
  subMap.forEach((count, sub) => {
    subs.push({ id: sub, label: sub, count });
  });

  return subs;
}

export function findToolById(toolId: string): StudioTool | undefined {
  return ALL_STUDIO_TOOLS.find((t) => t.id === toolId);
}

