import { StudioTool, ALL_STUDIO_TOOLS } from '../data/catalog';

export interface SearchResult {
  tool: StudioTool;
  score: number;
  matchedReason?: string;
  suggestedParameters?: Record<string, any>;
}

export interface SearchIntentMatch {
  matchedTool: StudioTool;
  sourceFormat?: string;
  targetFormat?: string;
  actionType?: string;
  inferredParameters?: Record<string, any>;
}

// Regex to capture "X to Y" conversion queries: e.g. "mp4 to mkv", "pdf to word", "epub to pdf"
const CONVERSION_REGEX = /^([a-z0-9]+)\s+to\s+([a-z0-9]+)$/i;

// Action keywords: e.g. "cut video", "trim audio", "compress pdf", "merge pdf", "unzip"
const ACTION_PATTERNS: Array<{ pattern: RegExp; toolId: string; actionName: string }> = [
  { pattern: /^(cut|trim)\s+(video|clip|movie)/i, toolId: 'video_trim', actionName: 'Trim / Cut Video' },
  { pattern: /^(cut|trim)\s+(audio|song|music|ringtone)/i, toolId: 'audio_trim', actionName: 'Cut / Trim Audio' },
  { pattern: /^(compress|shrink|reduce)\s+(pdf|document)/i, toolId: 'pdf_compress', actionName: 'Compress PDF' },
  { pattern: /^(merge|combine|join)\s+(pdf|documents)/i, toolId: 'pdf_merge', actionName: 'Merge PDFs' },
  { pattern: /^(split|extract\s+pages)\s+(pdf)/i, toolId: 'pdf_split', actionName: 'Split PDF' },
  { pattern: /^(unzip|extract|unpack)\s*(archive|zip|tar|rar|7z)?/i, toolId: 'archive_extract', actionName: 'Extract Archive' },
  { pattern: /^(create\s+zip|zip\s+files|compress\s+folder)/i, toolId: 'archive_create', actionName: 'Create ZIP Archive' },
  { pattern: /^(extract|rip)\s+(audio|mp3|sound)\s*(from\s+video)?/i, toolId: 'video_extract_audio', actionName: 'Extract Audio from Video' },
  { pattern: /^(photo|photos|image|images|jpg)\s+to\s+pdf/i, toolId: 'pdf_images_to_pdf', actionName: 'Photos to PDF' },
  { pattern: /^pdf\s+to\s+(photo|photos|image|images|jpg|png)/i, toolId: 'pdf_to_images', actionName: 'PDF to Images' },
  { pattern: /^(protect|lock|encrypt)\s+pdf/i, toolId: 'pdf_protect', actionName: 'Protect PDF' },
  { pattern: /^(unlock|decrypt|remove\s+password)\s+pdf/i, toolId: 'pdf_unlock', actionName: 'Unlock PDF' },
  { pattern: /^(watermark|stamp)\s+pdf/i, toolId: 'pdf_watermark', actionName: 'Watermark PDF' },
  { pattern: /^(compress|tinypng)\s+(image|photo|jpg|png)/i, toolId: 'image_compress', actionName: 'Compress Image' },
  { pattern: /^(heic|heif)\s+to\s+(jpg|jpeg|png)/i, toolId: 'image_heic_to_jpg', actionName: 'HEIC to JPG' },
  { pattern: /^(mute|remove\s+audio)\s*(from\s+video)?/i, toolId: 'video_remove_audio', actionName: 'Mute Video' },
];

export function parseSearchQuery(query: string, tools: StudioTool[] = ALL_STUDIO_TOOLS): SearchIntentMatch | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  // 1. Direct Action Pattern Matching (e.g. "cut video", "unzip", "compress pdf")
  for (const item of ACTION_PATTERNS) {
    if (item.pattern.test(q)) {
      const tool = tools.find((t) => t.id === item.toolId);
      if (tool) {
        return {
          matchedTool: tool,
          actionType: item.actionName,
        };
      }
    }
  }

  // 2. Conversion Pattern (e.g. "mp4 to mkv", "pdf to word", "epub to pdf")
  const convMatch = q.match(CONVERSION_REGEX);
  if (convMatch) {
    let fromExt = convMatch[1].toLowerCase();
    let toExt = convMatch[2].toLowerCase();

    // Normalizations
    if (toExt === 'word') toExt = 'docx';
    if (fromExt === 'word') fromExt = 'docx';
    if (toExt === 'excel') toExt = 'xlsx';
    if (toExt === 'powerpoint' || toExt === 'ppt') toExt = 'pptx';
    if (toExt === 'photo' || toExt === 'photos') toExt = 'pdf';
    if (fromExt === 'photo' || fromExt === 'photos') fromExt = 'jpg';

    // Find best tool matching fromExt and toExt
    for (const tool of tools) {
      const toolHasFrom =
        tool.inputFormats.some((fmt) => fmt.toLowerCase().replace('.', '') === fromExt) ||
        tool.keywords.some((k) => k.toLowerCase() === fromExt);
      const toolHasTo =
        tool.outputFormats.some((fmt) => fmt.toLowerCase().replace('.', '') === toExt) ||
        tool.keywords.some((k) => k.toLowerCase() === toExt);

      const hasExactExample =
        tool.examples?.some((ex) => ex.toLowerCase().includes(q)) ||
        tool.keywords.some((k) => k.toLowerCase() === q);

      if (hasExactExample || (toolHasFrom && toolHasTo)) {
        return {
          matchedTool: tool,
          sourceFormat: fromExt,
          targetFormat: toExt,
          inferredParameters: {
            format: toExt,
            target_format: toExt,
          },
        };
      }
    }
  }

  return null;
}

export function searchTools(query: string, tools: StudioTool[] = ALL_STUDIO_TOOLS): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return tools.map((tool) => ({
      tool,
      score: tool.isPinnedTop ? 100 - tool.rank : 50 - tool.rank,
    }));
  }

  const results: SearchResult[] = [];

  // Check for "X to Y" intent pattern
  const convMatch = q.match(CONVERSION_REGEX);
  let fromExt = '';
  let toExt = '';
  if (convMatch) {
    fromExt = convMatch[1].toLowerCase();
    toExt = convMatch[2].toLowerCase();
    // Normalize aliases
    if (toExt === 'word') toExt = 'docx';
    if (fromExt === 'word') fromExt = 'docx';
    if (toExt === 'excel') toExt = 'xlsx';
    if (toExt === 'powerpoint') toExt = 'pptx';
    if (toExt === 'photo' || toExt === 'photos') toExt = 'pdf';
    if (fromExt === 'photo' || fromExt === 'photos') fromExt = 'jpg';
  }

  for (const tool of tools) {
    let score = 0;
    let matchedReason = '';
    const suggestedParams: Record<string, any> = {};

    // 1. Direct "from to to" conversion query matching
    if (convMatch) {
      const toolHasFrom =
        tool.inputFormats.some((fmt) => fmt.toLowerCase().includes(fromExt)) ||
        tool.keywords.some((k) => k.toLowerCase()!.includes(fromExt));
      const toolHasTo =
        tool.outputFormats.some((fmt) => fmt.toLowerCase().includes(toExt)) ||
        tool.keywords.some((k) => k.toLowerCase().includes(toExt));

      const hasExactExample =
        tool.examples?.some((ex) => ex.toLowerCase().includes(q)) ||
        tool.keywords.some((k) => k.toLowerCase() === q);

      if (hasExactExample) {
        score += 150;
        matchedReason = `Exact match for "${fromExt.toUpperCase()} to ${toExt.toUpperCase()}"`;
        suggestedParams.format = toExt;
      } else if (toolHasFrom && toolHasTo) {
        score += 120;
        matchedReason = `Converts ${fromExt.toUpperCase()} into ${toExt.toUpperCase()}`;
        suggestedParams.format = toExt;
      } else if (toolHasTo) {
        score += 50;
      }
    }

    // 2. Exact keyword / name matching
    const toolNameLower = tool.name.toLowerCase();
    if (toolNameLower === q) {
      score += 100;
      matchedReason = 'Exact tool title match';
    } else if (toolNameLower.includes(q)) {
      score += 70;
      matchedReason = 'Title match';
    }

    // 3. Keyword list matching
    const matchedKeyword = tool.keywords.find(
      (k) => k.toLowerCase() === q || k.toLowerCase().includes(q)
    );
    if (matchedKeyword) {
      score += 60;
      if (!matchedReason) matchedReason = `Matched keyword "${matchedKeyword}"`;
    }

    // 4. Format match (e.g. user typed "mkv" or "epub" or "heic")
    const matchedInputFmt = tool.inputFormats.find(
      (f) => f.replace('.', '').toLowerCase() === q
    );
    const matchedOutputFmt = tool.outputFormats.find(
      (f) => f.replace('.', '').toLowerCase() === q
    );
    if (matchedInputFmt || matchedOutputFmt) {
      score += 50;
      if (!matchedReason) matchedReason = `Supports .${q.toUpperCase()}`;
    }

    // 5. Description partial match
    if (tool.description.toLowerCase().includes(q)) {
      score += 30;
      if (!matchedReason) matchedReason = 'Matched description';
    }

    // 6. Bonus for pinned top / essential tools
    if (score > 0) {
      if (tool.isPinnedTop) score += 15;
      score += Math.max(0, 30 - tool.rank);

      results.push({
        tool,
        score,
        matchedReason,
        suggestedParameters: Object.keys(suggestedParams).length > 0 ? suggestedParams : undefined,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
