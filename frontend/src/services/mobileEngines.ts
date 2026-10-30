import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';

export interface MobileProcessResult {
  outputBlob: Blob;
  outputFilename: string;
  outputMime: string;
  logs: string[];
}

export const mobileEngines = {
  // ==========================================
  // 1. IMAGE ENGINE (Canvas & OffscreenCanvas)
  // ==========================================
  async processImage(
    blob: Blob,
    filename: string,
    operation: string,
    params: Record<string, any> = {},
    onProgress?: (pct: number) => void
  ): Promise<MobileProcessResult> {
    const logs: string[] = [];
    logs.push(`[Mobile Image Engine] Starting operation: ${operation}`);
    onProgress?.(10);

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for client processing'));
      };
      image.src = url;
    });

    onProgress?.(30);
    logs.push(`Original dimensions: ${img.naturalWidth}x${img.naturalHeight}`);

    let width = img.naturalWidth;
    let height = img.naturalHeight;
    let rotation = 0;
    let flipH = false;
    let flipV = false;
    let targetFormat = 'image/png';
    let ext = 'png';
    let quality = 0.9;

    // Handle Operation & Params
    if (operation === 'resize' || params.resize) {
      const targetW = params.width ? parseInt(params.width) : width;
      const targetH = params.height ? parseInt(params.height) : height;
      const scale = params.scale ? parseFloat(params.scale) : 1;
      if (params.scale) {
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      } else {
        width = targetW;
        height = targetH;
      }
      logs.push(`Resizing to: ${width}x${height}`);
    }

    if (operation === 'rotate' || params.rotation) {
      rotation = parseInt(params.rotation || params.angle || '90', 10);
      logs.push(`Rotating by: ${rotation}°`);
    }

    if (operation === 'flip' || params.flip) {
      if (params.flip === 'horizontal' || params.flip === 'h') flipH = true;
      if (params.flip === 'vertical' || params.flip === 'v') flipV = true;
      if (params.direction === 'horizontal') flipH = true;
      if (params.direction === 'vertical') flipV = true;
      logs.push(`Flipping: horizontal=${flipH}, vertical=${flipV}`);
    }

    if (operation === 'convert' || params.format || params.target_format) {
      const fmt = (params.format || params.target_format || 'png').toLowerCase();
      if (fmt.includes('jpg') || fmt.includes('jpeg')) {
        targetFormat = 'image/jpeg';
        ext = 'jpg';
      } else if (fmt.includes('webp')) {
        targetFormat = 'image/webp';
        ext = 'webp';
      } else {
        targetFormat = 'image/png';
        ext = 'png';
      }
      logs.push(`Converting to format: ${ext}`);
    }

    if (params.quality) {
      quality = Math.max(0.1, Math.min(1.0, parseInt(params.quality, 10) / 100));
      logs.push(`Compression quality: ${Math.round(quality * 100)}%`);
    }

    onProgress?.(50);

    // Create Canvas
    const canvas = document.createElement('canvas');
    const isSideways = rotation === 90 || rotation === 270;
    canvas.width = isSideways ? height : width;
    canvas.height = isSideways ? width : height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not acquire 2D Canvas rendering context');

    ctx.save();
    // Center transformation
    ctx.translate(canvas.width / 2, canvas.height / 2);

    if (rotation) {
      ctx.rotate((rotation * Math.PI) / 180);
    }
    if (flipH || flipV) {
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    }

    // Apply Filters if requested
    const filters: string[] = [];
    if (operation === 'grayscale' || params.grayscale) filters.push('grayscale(100%)');
    if (operation === 'sepia' || params.sepia) filters.push('sepia(100%)');
    if (operation === 'invert' || params.invert) filters.push('invert(100%)');
    if (params.blur) filters.push(`blur(${params.blur}px)`);
    if (params.brightness) filters.push(`brightness(${params.brightness}%)`);
    if (params.contrast) filters.push(`contrast(${params.contrast}%)`);

    if (filters.length > 0) {
      ctx.filter = filters.join(' ');
      logs.push(`Applied filters: ${filters.join(', ')}`);
    }

    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();

    onProgress?.(80);

    const outBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to encode canvas to blob'));
        },
        targetFormat,
        quality
      );
    });

    onProgress?.(100);
    const baseName = filename.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}_processed.${ext}`;
    logs.push(`Successfully generated: ${outName} (${outBlob.size} bytes)`);

    return {
      outputBlob: outBlob,
      outputFilename: outName,
      outputMime: targetFormat,
      logs,
    };
  },

  // ==========================================
  // 2. PDF ENGINE (pdf-lib)
  // ==========================================
  async processPdf(
    blobs: { blob: Blob; filename: string }[],
    operation: string,
    params: Record<string, any> = {},
    onProgress?: (pct: number) => void
  ): Promise<MobileProcessResult> {
    const logs: string[] = [];
    logs.push(`[Mobile PDF Engine] Operation: ${operation}`);
    onProgress?.(15);

    if (operation === 'merge_pdf' || operation === 'merge') {
      logs.push(`Merging ${blobs.length} PDF files...`);
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < blobs.length; i++) {
        const item = blobs[i];
        logs.push(`Loading PDF [${i + 1}/${blobs.length}]: ${item.filename}`);
        const arrayBuf = await item.blob.arrayBuffer();
        const srcDoc = await PDFDocument.load(arrayBuf);
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        onProgress?.(20 + Math.round(((i + 1) / blobs.length) * 60));
      }

      const pdfBytes = await mergedPdf.save();
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Merged PDF created: ${mergedPdf.getPageCount()} total pages`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `merged_${Date.now()}.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    if (operation === 'split_pdf' || operation === 'split') {
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuf);
      const totalPages = srcDoc.getPageCount();
      logs.push(`Source PDF has ${totalPages} pages.`);

      const pageRangeStr = params.pages || params.range || `1-${Math.min(totalPages, 5)}`;
      logs.push(`Extracting page range: ${pageRangeStr}`);

      // Parse range: e.g. "1-3, 5"
      const pagesToExtract: number[] = [];
      const parts = pageRangeStr.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map((n: string) => parseInt(n.trim(), 10));
          for (let p = start; p <= end; p++) {
            if (p >= 1 && p <= totalPages) pagesToExtract.push(p - 1);
          }
        } else {
          const p = parseInt(trimmed, 10);
          if (p >= 1 && p <= totalPages) pagesToExtract.push(p - 1);
        }
      }

      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(srcDoc, pagesToExtract);
      copied.forEach((page) => newPdf.addPage(page));

      onProgress?.(75);
      const pdfBytes = await newPdf.save();
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Extracted ${copied.length} pages into new PDF`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_split.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    if (operation === 'rotate_pdf' || operation === 'rotate') {
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf);
      const angle = parseInt(params.angle || params.rotation || '90', 10);
      logs.push(`Rotating all pages by ${angle}°`);

      const pages = doc.getPages();
      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + angle));
      });

      onProgress?.(80);
      const pdfBytes = await doc.save();
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Rotated ${pages.length} pages`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_rotated.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    if (operation === 'images_to_pdf') {
      logs.push(`Converting ${blobs.length} images into a single PDF...`);
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < blobs.length; i++) {
        const item = blobs[i];
        logs.push(`Embedding image [${i + 1}/${blobs.length}]: ${item.filename}`);
        const bytes = await item.blob.arrayBuffer();
        
        let embeddedImg;
        if (item.blob.type === 'image/png' || item.filename.toLowerCase().endsWith('.png')) {
          embeddedImg = await pdfDoc.embedPng(bytes);
        } else {
          embeddedImg = await pdfDoc.embedJpg(bytes);
        }

        const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
        page.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: embeddedImg.width,
          height: embeddedImg.height,
        });

        onProgress?.(20 + Math.round(((i + 1) / blobs.length) * 60));
      }

      const pdfBytes = await pdfDoc.save();
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Images converted into ${pdfDoc.getPageCount()} page PDF`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `images_doc_${Date.now()}.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    if (operation === 'watermark_pdf' || operation === 'watermark') {
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf);
      const text = params.text || params.watermark_text || 'CONFIDENTIAL';
      const opacity = parseFloat(params.opacity || '0.35');
      logs.push(`Adding watermark "${text}" (opacity: ${opacity})`);

      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const fontSize = Math.min(width, height) / 10;
        page.drawText(text, {
          x: width / 4,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.7, 0.7, 0.7),
          opacity,
          rotate: degrees(45),
        });
      });

      onProgress?.(80);
      const pdfBytes = await doc.save();
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Watermarked ${pages.length} pages`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_watermarked.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    throw new Error(`Unsupported mobile PDF operation: ${operation}`);
  },

  // ==========================================
  // 3. ARCHIVE ENGINE (JSZip)
  // ==========================================
  async processArchive(
    files: { blob: Blob; filename: string }[],
    operation: string,
    params: Record<string, any> = {},
    onProgress?: (pct: number) => void
  ): Promise<MobileProcessResult> {
    const logs: string[] = [];
    logs.push(`[Mobile Archive Engine] Operation: ${operation}`);
    onProgress?.(15);

    if (operation === 'create_zip' || operation === 'archive' || operation === 'compress') {
      logs.push(`Packing ${files.length} files into ZIP archive...`);
      const zip = new JSZip();

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        logs.push(`Adding to ZIP: ${f.filename} (${f.blob.size} bytes)`);
        const ab = await f.blob.arrayBuffer();
        zip.file(f.filename, ab);
        onProgress?.(20 + Math.round(((i + 1) / files.length) * 50));
      }

      logs.push('Compressing with DEFLATE...');
      const outBlob = await zip.generateAsync(
        {
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        },
        (metadata) => {
          onProgress?.(70 + Math.round(metadata.percent * 0.3));
        }
      );

      const zipName = params.archive_name || `archive_${Date.now()}.zip`;
      logs.push(`Archive created: ${zipName} (${outBlob.size} bytes)`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: zipName.endsWith('.zip') ? zipName : `${zipName}.zip`,
        outputMime: 'application/zip',
        logs,
      };
    }

    if (operation === 'extract_zip' || operation === 'extract') {
      logs.push(`Extracting ZIP archive: ${files[0].filename}...`);
      const zip = new JSZip();
      const content = await zip.loadAsync(await files[0].blob.arrayBuffer());
      
      const fileNames = Object.keys(content.files).filter((k) => !content.files[k].dir);
      logs.push(`Found ${fileNames.length} files inside archive.`);

      // Export manifest text
      const manifest = fileNames.map((f) => `- ${f}`).join('\n');
      const manifestBlob = new Blob([`Extracted Archive Manifest:\n${manifest}`], { type: 'text/plain' });

      onProgress?.(100);
      return {
        outputBlob: manifestBlob,
        outputFilename: `${files[0].filename}_manifest.txt`,
        outputMime: 'text/plain',
        logs,
      };
    }

    throw new Error(`Unsupported mobile archive operation: ${operation}`);
  },

  // ==========================================
  // 4. AUDIO / VIDEO ENGINE (Web Audio & Canvas)
  // ==========================================
  async processAudioVideo(
    blob: Blob,
    filename: string,
    operation: string,
    params: Record<string, any> = {},
    onProgress?: (pct: number) => void
  ): Promise<MobileProcessResult> {
    const logs: string[] = [];
    logs.push(`[Mobile Audio/Video Engine] Operation: ${operation}`);
    onProgress?.(15);

    if (operation === 'extract_frame' || operation === 'video_thumbnail') {
      logs.push(`Extracting high-resolution frame from video: ${filename}`);
      const video = document.createElement('video');
      video.muted = true;
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';

      const url = URL.createObjectURL(blob);
      video.src = url;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video metadata for frame extraction'));
      });

      const targetSec = parseFloat(params.timestamp || params.time || '1.0');
      const seekTime = Math.min(targetSec, video.duration || 1);
      logs.push(`Seeking video to: ${seekTime.toFixed(2)}s / ${video.duration.toFixed(2)}s`);
      video.currentTime = seekTime;

      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      onProgress?.(60);
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to acquire canvas context');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const outBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Frame encoding failed'))), 'image/jpeg', 0.92);
      });

      onProgress?.(100);
      const outName = `${filename.replace(/\.[^/.]+$/, '')}_frame_${Math.round(seekTime)}s.jpg`;
      logs.push(`Frame extracted successfully: ${outName} (${canvas.width}x${canvas.height})`);

      return {
        outputBlob: outBlob,
        outputFilename: outName,
        outputMime: 'image/jpeg',
        logs,
      };
    }

    if (operation === 'extract_audio' || operation === 'convert_audio_wav') {
      logs.push(`Decoding audio buffer from ${filename}...`);
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();

      const arrayBuf = await blob.arrayBuffer();
      onProgress?.(30);

      const audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
      logs.push(`Decoded audio: ${audioBuffer.numberOfChannels} ch, ${audioBuffer.sampleRate} Hz, ${audioBuffer.duration.toFixed(2)}s`);
      onProgress?.(60);

      // Encode to 16-bit PCM WAV
      const wavBytes = encodeWAV(audioBuffer);
      const outBlob = new Blob([wavBytes as any], { type: 'audio/wav' });

      onProgress?.(100);
      const outName = `${filename.replace(/\.[^/.]+$/, '')}.wav`;
      logs.push(`Exported lossless WAV: ${outName} (${outBlob.size} bytes)`);

      return {
        outputBlob: outBlob,
        outputFilename: outName,
        outputMime: 'audio/wav',
        logs,
      };
    }

    throw new Error(`Unsupported mobile audio/video operation: ${operation}`);
  },

  // ==========================================
  // 5. DOCUMENT & DATA ENGINE
  // ==========================================
  async processDocumentData(
    blob: Blob,
    filename: string,
    operation: string,
    params: Record<string, any> = {},
    onProgress?: (pct: number) => void
  ): Promise<MobileProcessResult> {
    const logs: string[] = [];
    logs.push(`[Mobile Document Engine] Operation: ${operation}`);
    onProgress?.(20);

    const text = await blob.text();

    if (operation === 'markdown_to_html' || (filename.endsWith('.md') && params.target_format === 'html')) {
      logs.push('Parsing Markdown to HTML...');
      // Clean pure client markdown-to-html converter
      let html = text
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/`([^`]+)`/gim, '<code>$1</code>')
        .replace(/\n\n/gim, '</p><p>')
        .replace(/\n/gim, '<br/>');

      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:1rem;line-height:1.6;color:#1e293b;}</style></head><body><p>${html}</p></body></html>`;

      onProgress?.(100);
      return {
        outputBlob: new Blob([fullHtml], { type: 'text/html' }),
        outputFilename: `${filename.replace(/\.[^/.]+$/, '')}.html`,
        outputMime: 'text/html',
        logs,
      };
    }

    if (operation === 'json_to_csv') {
      logs.push('Converting JSON array to CSV tabular format...');
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Input JSON must be an array of objects to convert to CSV');
      }

      const headers = Object.keys(parsed[0]);
      const csvLines = [headers.join(',')];
      parsed.forEach((row) => {
        const line = headers.map((h) => {
          const val = row[h] !== undefined ? String(row[h]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        });
        csvLines.push(line.join(','));
      });

      onProgress?.(100);
      return {
        outputBlob: new Blob([csvLines.join('\n')], { type: 'text/csv' }),
        outputFilename: `${filename.replace(/\.[^/.]+$/, '')}.csv`,
        outputMime: 'text/csv',
        logs,
      };
    }

    if (operation === 'csv_to_json') {
      logs.push('Parsing CSV rows to JSON structure...');
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error('CSV must contain a header line and at least one data row');

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const result = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          obj[h] = cols[idx] || '';
        });
        result.push(obj);
      }

      onProgress?.(100);
      return {
        outputBlob: new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }),
        outputFilename: `${filename.replace(/\.[^/.]+$/, '')}.json`,
        outputMime: 'application/json',
        logs,
      };
    }

    throw new Error(`Unsupported mobile document operation: ${operation}`);
  },

  // ==========================================
  // 6. HASHER & CHECKSUM ENGINE (WebCrypto)
  // ==========================================
  async computeChecksums(blob: Blob): Promise<{ sha256: string; sha1: string; size: number }> {
    const arrayBuf = await blob.arrayBuffer();
    const sha256Digest = await crypto.subtle.digest('SHA-256', arrayBuf);
    const sha1Digest = await crypto.subtle.digest('SHA-1', arrayBuf);

    const toHex = (buf: ArrayBuffer) =>
      Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return {
      sha256: toHex(sha256Digest),
      sha1: toHex(sha1Digest),
      size: blob.size,
    };
  },
};

// Helper function to encode AudioBuffer to standard 16-bit stereo/mono WAV
function encodeWAV(audioBuffer: AudioBuffer): Uint8Array {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let samples: Float32Array;
  if (numChannels === 2) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    samples = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      samples[i * 2] = left[i];
      samples[i * 2 + 1] = right[i];
    }
  } else {
    samples = audioBuffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * bytesPerSample, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
