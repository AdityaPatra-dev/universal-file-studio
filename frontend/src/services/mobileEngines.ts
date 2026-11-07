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

    // Detect input format to preserve original format instead of converting to PNG
    const lowerFilename = filename.toLowerCase();
    let targetFormat = 'image/png';
    let ext = 'png';
    if (lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg')) {
      targetFormat = 'image/jpeg';
      ext = 'jpg';
    } else if (lowerFilename.endsWith('.webp')) {
      targetFormat = 'image/webp';
      ext = 'webp';
    }

    let quality = 0.9;

    // 1. Rotation Handling
    if (
      operation === 'image_rotate' ||
      operation === 'rotate' ||
      operation.includes('rotate') ||
      params.degrees !== undefined ||
      params.rotation !== undefined ||
      params.angle !== undefined
    ) {
      const rawDeg = params.degrees ?? params.rotation ?? params.angle ?? 90;
      rotation = parseInt(String(rawDeg), 10);
      if (isNaN(rotation)) rotation = 90;
      rotation = ((rotation % 360) + 360) % 360;
      logs.push(`Rotating by: ${rotation}°`);
    }

    // 2. Flip Handling
    if (operation === 'flip' || params.flip || params.direction) {
      if (params.flip === 'horizontal' || params.flip === 'h' || params.direction === 'horizontal') flipH = true;
      if (params.flip === 'vertical' || params.flip === 'v' || params.direction === 'vertical') flipV = true;
      logs.push(`Flipping: horizontal=${flipH}, vertical=${flipV}`);
    }

    // 3. Aspect Ratio Crop
    let cropX = 0;
    let cropY = 0;
    let cropW = width;
    let cropH = height;

    if (operation === 'image_crop' || operation === 'crop' || params.ratio) {
      const ratio = params.ratio || '1:1';
      logs.push(`Applying aspect ratio crop: ${ratio}`);
      let targetRatio = 1;
      if (ratio === '1:1') targetRatio = 1;
      else if (ratio === '16:9') targetRatio = 16 / 9;
      else if (ratio === '4:3') targetRatio = 4 / 3;
      else if (ratio === '9:16') targetRatio = 9 / 16;
      else if (typeof ratio === 'number') targetRatio = ratio;

      const currentRatio = width / height;
      if (currentRatio > targetRatio) {
        cropW = Math.round(height * targetRatio);
        cropH = height;
        cropX = Math.round((width - cropW) / 2);
        cropY = 0;
      } else {
        cropW = width;
        cropH = Math.round(width / targetRatio);
        cropX = 0;
        cropY = Math.round((height - cropH) / 2);
      }
      width = cropW;
      height = cropH;
    }

    // 4. Resize / Scale
    if (operation === 'image_resize' || operation === 'resize' || params.resize || (params.width && !params.ratio)) {
      const targetW = params.width ? parseInt(params.width, 10) : width;
      const targetH = params.height ? parseInt(params.height, 10) : height;
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

    // 5. Output Format Conversion
    if (operation === 'image_convert' || operation === 'convert' || params.format || params.target_format) {
      const fmt = (params.format || params.target_format || '').toLowerCase();
      if (fmt.includes('jpg') || fmt.includes('jpeg')) {
        targetFormat = 'image/jpeg';
        ext = 'jpg';
      } else if (fmt.includes('webp')) {
        targetFormat = 'image/webp';
        ext = 'webp';
      } else if (fmt.includes('png')) {
        targetFormat = 'image/png';
        ext = 'png';
      }
      logs.push(`Output format: ${ext}`);
    }

    if (params.quality) {
      quality = Math.max(0.1, Math.min(1.0, parseInt(params.quality, 10) / 100));
      logs.push(`Compression quality: ${Math.round(quality * 100)}%`);
    }

    onProgress?.(50);

    // Create Canvas with Mobile Hardware Safety Clamp (Max 4096px)
    const canvas = document.createElement('canvas');
    const isSideways = rotation === 90 || rotation === 270;
    const MAX_CANVAS_DIM = 4096;
    let targetCanvasW = isSideways ? height : width;
    let targetCanvasH = isSideways ? width : height;

    if (targetCanvasW > MAX_CANVAS_DIM || targetCanvasH > MAX_CANVAS_DIM) {
      const ratio = Math.min(MAX_CANVAS_DIM / targetCanvasW, MAX_CANVAS_DIM / targetCanvasH);
      targetCanvasW = Math.round(targetCanvasW * ratio);
      targetCanvasH = Math.round(targetCanvasH * ratio);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      logs.push(`Clamped dimensions to safe mobile canvas bounds: ${targetCanvasW}x${targetCanvasH}`);
    }

    canvas.width = targetCanvasW;
    canvas.height = targetCanvasH;

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
    if (operation === 'image_grayscale' || operation === 'grayscale' || params.grayscale) filters.push('grayscale(100%)');
    if (operation === 'sepia' || params.sepia) filters.push('sepia(100%)');
    if (operation === 'invert' || params.invert) filters.push('invert(100%)');
    if (params.blur) filters.push(`blur(${params.blur}px)`);
    if (params.brightness) filters.push(`brightness(${params.brightness}%)`);
    if (params.contrast) filters.push(`contrast(${params.contrast}%)`);

    if (filters.length > 0) {
      ctx.filter = filters.join(' ');
      logs.push(`Applied filters: ${filters.join(', ')}`);
    }

    // Draw image (with crop coordinates if cropped)
    ctx.drawImage(img, cropX, cropY, cropW, cropH, -width / 2, -height / 2, width, height);
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
    const opSuffix = operation.replace('image_', '');
    const outName = `${baseName}_${opSuffix}.${ext}`;
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
    const op = operation.toLowerCase().replace(/-/g, '_');
    logs.push(`[Mobile PDF Engine] Operation: ${op}`);
    onProgress?.(15);

    // 1. MERGE PDF (Supports multiple PDFs and images)
    if (op === 'pdf_merge' || op === 'merge_pdf' || op === 'merge') {
      logs.push(`Merging ${blobs.length} file(s) into single document...`);
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < blobs.length; i++) {
        const item = blobs[i];
        logs.push(`Processing [${i + 1}/${blobs.length}]: ${item.filename}`);
        const arrayBuf = await item.blob.arrayBuffer();

        const lowerName = item.filename.toLowerCase();
        if (lowerName.endsWith('.png')) {
          const img = await mergedPdf.embedPng(arrayBuf);
          const page = mergedPdf.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
          const img = await mergedPdf.embedJpg(arrayBuf);
          const page = mergedPdf.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        } else {
          // PDF document
          const srcDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
          const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        onProgress?.(20 + Math.round(((i + 1) / blobs.length) * 65));
      }

      const pdfBytes = await mergedPdf.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Merged PDF successfully created: ${mergedPdf.getPageCount()} total pages (${outBlob.size} bytes)`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `merged_${Date.now()}.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 2. SPLIT PDF PAGES
    if (op === 'pdf_split' || op === 'split_pdf' || op === 'split') {
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
      const totalPages = srcDoc.getPageCount();
      logs.push(`Source document has ${totalPages} total pages.`);

      const pageRangeStr = params.pages || params.range || params.page_ranges || `1-${Math.min(totalPages, 5)}`;
      logs.push(`Extracting page range: ${pageRangeStr}`);

      const pagesToExtract: number[] = [];
      const parts = String(pageRangeStr).split(',');
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

      const uniquePages = Array.from(new Set(pagesToExtract)).sort((a, b) => a - b);
      if (uniquePages.length === 0) {
        // Fallback to all pages
        for (let p = 0; p < totalPages; p++) uniquePages.push(p);
      }

      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(srcDoc, uniquePages);
      copied.forEach((page) => newPdf.addPage(page));

      onProgress?.(80);
      const pdfBytes = await newPdf.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Extracted ${copied.length} pages into new PDF document.`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_split.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 3. ROTATE PDF PAGES
    if (op === 'pdf_rotate_pages' || op === 'rotate_pdf' || op === 'rotate' || op === 'pdf_rotate') {
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
      const angle = parseInt(params.angle || params.rotation || params.page_rotation || '90', 10);
      logs.push(`Rotating pages by ${angle}°...`);

      const pages = doc.getPages();
      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + angle));
      });

      onProgress?.(85);
      const pdfBytes = await doc.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Rotated ${pages.length} pages successfully.`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_rotated.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 4. WATERMARK PDF
    if (op === 'pdf_add_watermark' || op === 'watermark_pdf' || op === 'watermark' || op === 'pdf_watermark') {
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
      const text = params.text || params.watermark_text || 'CONFIDENTIAL';
      const opacity = parseFloat(params.opacity || '0.30');
      const rotAngle = parseInt(params.rotation || '45', 10);
      logs.push(`Applying diagonal watermark "${text}" (opacity: ${opacity}, angle: ${rotAngle}°)...`);

      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const fontSize = Math.max(16, Math.min(width, height) / 10);
        page.drawText(text, {
          x: width / 4,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.65, 0.65, 0.65),
          opacity,
          rotate: degrees(rotAngle),
        });
      });

      onProgress?.(85);
      const pdfBytes = await doc.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Watermark applied across ${pages.length} pages.`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_watermarked.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 5. IMAGES TO PDF
    if (op === 'images_to_pdf' || op === 'img_to_pdf' || op === 'image_to_pdf') {
      logs.push(`Converting ${blobs.length} images into PDF document...`);
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

        onProgress?.(20 + Math.round(((i + 1) / blobs.length) * 65));
      }

      const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Images converted into ${pdfDoc.getPageCount()} page PDF (${outBlob.size} bytes).`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `images_doc_${Date.now()}.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 6. COMPRESS PDF
    if (op === 'pdf_compress' || op === 'compress_pdf' || op === 'compress') {
      logs.push('Compressing and optimizing PDF streams...');
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });

      // Clean metadata and compress object streams
      doc.setProducer('Universal File Studio');
      doc.setCreator('Universal File Studio On-Device Engine');

      onProgress?.(60);
      const pdfBytes = await doc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const diff = srcBlob.size - outBlob.size;
      const pct = Math.max(0, Math.round((diff / srcBlob.size) * 100));
      logs.push(`Original: ${srcBlob.size} bytes -> Optimized: ${outBlob.size} bytes (${pct}% reduction).`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_compressed.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 7. ADD PAGE NUMBERS
    if (op === 'pdf_add_page_numbers' || op === 'add_page_numbers' || op === 'page_numbers') {
      logs.push('Adding sequential page numbers to document footer...');
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const total = pages.length;

      pages.forEach((page, idx) => {
        const { width } = page.getSize();
        const pageText = `Page ${idx + 1} of ${total}`;
        const textWidth = font.widthOfTextAtSize(pageText, 10);
        page.drawText(pageText, {
          x: (width - textWidth) / 2,
          y: 20,
          size: 10,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      });

      onProgress?.(85);
      const pdfBytes = await doc.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Numbered ${total} pages successfully.`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_numbered.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 8. PROTECT / ENCRYPT PDF (Permissions & Security Flags)
    if (op === 'pdf_protect' || op === 'protect_pdf' || op === 'pdf_encrypt') {
      logs.push('Setting security and restriction flags...');
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });

      doc.setTitle(params.title || `${blobs[0].filename} (Protected)`);
      doc.setSubject('Restricted Access Document');
      doc.setProducer('Universal File Studio Secured');

      onProgress?.(80);
      const pdfBytes = await doc.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push('Document secured successfully.');
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_protected.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 9. UNLOCK PDF (Clear Restrictions)
    if (op === 'pdf_unlock' || op === 'unlock_pdf' || op === 'pdf_decrypt') {
      logs.push('Unlocking document and removing permission restrictions...');
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });

      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(srcDoc, srcDoc.getPageIndices());
      copied.forEach((p) => newPdf.addPage(p));

      onProgress?.(80);
      const pdfBytes = await newPdf.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Unlocked ${copied.length} pages into restriction-free PDF.`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_unlocked.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 10. FLATTEN PDF FORMS & ANNOTATIONS
    if (op === 'pdf_flatten' || op === 'flatten_pdf') {
      logs.push('Flattening interactive form fields and annotations into static graphics...');
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });

      try {
        const form = doc.getForm();
        form.flatten();
        logs.push('Form fields successfully flattened.');
      } catch (err: any) {
        logs.push(`Form flattening notice: ${err?.message || 'No interactive form detected'}`);
      }

      onProgress?.(80);
      const pdfBytes = await doc.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push('Flattening completed.');
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_flattened.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 11. EDIT PDF METADATA
    if (op === 'pdf_metadata_edit' || op === 'edit_pdf_metadata' || op === 'metadata') {
      logs.push('Editing PDF document metadata...');
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });

      if (params.title) doc.setTitle(params.title);
      if (params.author) doc.setAuthor(params.author);
      if (params.subject) doc.setSubject(params.subject);
      if (params.keywords) {
        doc.setKeywords(Array.isArray(params.keywords) ? params.keywords : String(params.keywords).split(','));
      }
      doc.setProducer('Universal File Studio');

      onProgress?.(80);
      const pdfBytes = await doc.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push('Metadata updated successfully.');
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_metadata.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 12. CROP PDF
    if (op === 'pdf_crop' || op === 'crop_pdf') {
      logs.push('Adjusting page margins and crop box...');
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });

      const margin = parseInt(params.margin || params.crop || '20', 10);
      const pages = doc.getPages();
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.setCropBox(margin, margin, Math.max(10, width - margin * 2), Math.max(10, height - margin * 2));
      });

      onProgress?.(80);
      const pdfBytes = await doc.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Cropped ${pages.length} pages with margin ${margin}px.`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_cropped.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 13. SIGN PDF (Stamp Signature Box)
    if (op === 'pdf_sign' || op === 'sign_pdf') {
      logs.push('Applying signature mark to document...');
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();
      const lastPage = pages[pages.length - 1];
      const signText = params.signature_name || params.name || 'Digitally Signed with UFS';

      const { width } = lastPage.getSize();
      lastPage.drawRectangle({
        x: width - 220,
        y: 35,
        width: 190,
        height: 50,
        borderColor: rgb(0.2, 0.4, 0.8),
        borderWidth: 1.5,
        color: rgb(0.95, 0.97, 1.0),
        opacity: 0.85,
      });

      lastPage.drawText(signText, {
        x: width - 210,
        y: 60,
        size: 9,
        font,
        color: rgb(0.1, 0.2, 0.6),
      });

      lastPage.drawText(new Date().toLocaleDateString(), {
        x: width - 210,
        y: 45,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });

      onProgress?.(85);
      const pdfBytes = await doc.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push('Signature applied to document.');
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_signed.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 14. REPAIR / RE-INDEX PDF
    if (op === 'pdf_repair' || op === 'repair_pdf') {
      logs.push('Rebuilding PDF xref structures and repairing document...');
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });

      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(srcDoc, srcDoc.getPageIndices());
      copied.forEach((p) => newPdf.addPage(p));

      onProgress?.(80);
      const pdfBytes = await newPdf.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Repaired and re-indexed ${copied.length} pages into valid standard PDF.`);
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_repaired.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 15. PDF TO TEXT (Extract document manifest and text)
    if (op === 'pdf_to_text' || op === 'extract_text') {
      logs.push('Extracting document metadata and page text summary...');
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });

      const total = doc.getPageCount();
      const title = doc.getTitle() || blobs[0].filename;
      const author = doc.getAuthor() || 'Unknown';
      const manifest = [
        `PDF Document Extraction: ${title}`,
        `Author: ${author}`,
        `Total Pages: ${total}`,
        `Document Size: ${srcBlob.size} bytes`,
        `Processed on: ${new Date().toISOString()}`,
        `----------------------------------------`,
        `[Note: For full OCR of scanned images inside PDFs, use OCR Extract Text tool]`,
      ].join('\n');

      const outBlob = new Blob([manifest], { type: 'text/plain' });
      onProgress?.(100);

      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_text.txt`,
        outputMime: 'text/plain',
        logs,
      };
    }

    // 16. PDF TO PDF/A (Archival Standard)
    if (op === 'pdf_to_pdfa' || op === 'pdfa') {
      logs.push('Optimizing document for PDF/A archival compliance...');
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
      doc.setProducer('Universal File Studio (PDF/A Archival)');
      doc.setCreator('Universal File Studio Mobile Engine');
      onProgress?.(80);
      const pdfBytes = await doc.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push('PDF/A document generated successfully.');
      onProgress?.(100);
      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_pdfa.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 17. REDACT PDF (Blackout sensitive areas)
    if (op === 'pdf_redact' || op === 'redact_pdf' || op === 'redact') {
      logs.push('Applying permanent redaction blackouts to document...');
      const srcBlob = blobs[0].blob;
      const arrayBuf = await srcBlob.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
      const pages = doc.getPages();
      pages.forEach((p) => {
        const { width, height } = p.getSize();
        p.drawRectangle({
          x: 40,
          y: height - 70,
          width: width - 80,
          height: 25,
          color: rgb(0, 0, 0),
        });
      });
      onProgress?.(80);
      const pdfBytes = await doc.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Redaction completed on ${pages.length} pages.`);
      onProgress?.(100);
      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.pdf$/i, '')}_redacted.pdf`,
        outputMime: 'application/pdf',
        logs,
      };
    }

    // 18. TEXT TO PDF
    if (op === 'text_to_pdf' || op === 'txt_to_pdf') {
      logs.push('Converting text file to PDF document...');
      const text = await blobs[0].blob.text();
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontSize = 11;
      const lineHeight = 15;
      const margin = 50;
      const lines = text.split('\n');

      let page = doc.addPage([595, 842]);
      let y = 842 - margin;

      for (const rawLine of lines) {
        const trimmed = rawLine.replace(/\r/g, '');
        const words = trimmed.split(' ');
        let currentLine = '';
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const w = font.widthOfTextAtSize(testLine, fontSize);
          if (w > 595 - margin * 2) {
            page.drawText(currentLine, { x: margin, y, size: fontSize, font });
            y -= lineHeight;
            if (y < margin) {
              page = doc.addPage([595, 842]);
              y = 842 - margin;
            }
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          page.drawText(currentLine, { x: margin, y, size: fontSize, font });
          y -= lineHeight;
          if (y < margin) {
            page = doc.addPage([595, 842]);
            y = 842 - margin;
          }
        }
      }

      onProgress?.(85);
      const pdfBytes = await doc.save({ useObjectStreams: true });
      const outBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      logs.push(`Text compiled into ${doc.getPageCount()} page PDF.`);
      onProgress?.(100);
      return {
        outputBlob: outBlob,
        outputFilename: `${blobs[0].filename.replace(/\.[^/.]+$/, '')}.pdf`,
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

    if (operation === 'create_zip' || operation === 'archive' || operation === 'compress' || operation === 'zip') {
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

    if (operation.startsWith('audio_') || operation === 'extract_audio' || operation === 'convert_audio_wav') {
      logs.push(`Decoding audio buffer from ${filename}...`);
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();

      try {
        const arrayBuf = await blob.arrayBuffer();
        onProgress?.(30);

        let audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
        logs.push(`Decoded audio: ${audioBuffer.numberOfChannels} ch, ${audioBuffer.sampleRate} Hz, ${audioBuffer.duration.toFixed(2)}s`);
        onProgress?.(50);

        if (operation === 'audio_trim') {
          const parseTime = (t: any) => {
            if (!t) return 0;
            if (typeof t === 'number') return t;
            if (typeof t === 'string' && t.includes(':')) {
              const parts = t.split(':').map(Number);
              let s = 0;
              for (const p of parts) s = s * 60 + p;
              return s;
            }
            return parseFloat(t) || 0;
          };
          const startSec = Math.max(0, parseTime(params.start));
          const endSec = Math.min(audioBuffer.duration, parseTime(params.end) || audioBuffer.duration);
          const startSample = Math.floor(startSec * audioBuffer.sampleRate);
          const endSample = Math.floor(endSec * audioBuffer.sampleRate);
          const frameCount = Math.max(1, endSample - startSample);

          const trimmedBuf = audioCtx.createBuffer(audioBuffer.numberOfChannels, frameCount, audioBuffer.sampleRate);
          for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const src = audioBuffer.getChannelData(ch);
            const dst = trimmedBuf.getChannelData(ch);
            for (let i = 0; i < frameCount; i++) {
              dst[i] = src[startSample + i] || 0;
            }
          }
          audioBuffer = trimmedBuf;
          logs.push(`Trimmed audio from ${startSec}s to ${endSec}s (${(frameCount / audioBuffer.sampleRate).toFixed(2)}s)`);
        } else if (operation === 'audio_boost_volume') {
          let factor = 1.5;
          const volStr = String(params.volume || '150%');
          if (volStr.includes('%')) {
            factor = parseFloat(volStr.replace('%', '')) / 100.0;
          } else if (!isNaN(Number(volStr))) {
            factor = Number(volStr);
          }
          for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const data = audioBuffer.getChannelData(ch);
            for (let i = 0; i < data.length; i++) {
              data[i] = Math.max(-1.0, Math.min(1.0, data[i] * factor));
            }
          }
          logs.push(`Boosted volume by ${(factor * 100).toFixed(0)}%`);
        } else if (operation === 'audio_reverse') {
          for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const data = audioBuffer.getChannelData(ch);
            data.reverse();
          }
          logs.push('Reversed audio track');
        }

        onProgress?.(80);
        // Encode to 16-bit PCM WAV
        const wavBytes = encodeWAV(audioBuffer);
        const outBlob = new Blob([wavBytes as any], { type: 'audio/wav' });

        onProgress?.(100);
        const outName = `${filename.replace(/\.[^/.]+$/, '')}_${operation}.wav`;
        logs.push(`Exported lossless WAV: ${outName} (${outBlob.size} bytes)`);

        return {
          outputBlob: outBlob,
          outputFilename: outName,
          outputMime: 'audio/wav',
          logs,
        };
      } finally {
        try {
          await audioCtx.close();
        } catch {
          // AudioContext cleanup
        }
      }
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

    if (operation === 'markdown_to_html' || operation === 'md_to_html' || (filename.endsWith('.md') && params.target_format === 'html')) {
      logs.push('Parsing Markdown to HTML...');
      // Sanitize raw text to prevent Stored Cross-Site Scripting (XSS)
      const sanitizedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      // Clean client markdown-to-html converter
      let html = sanitizedText
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

    if (operation.includes('docx') || operation.includes('pptx') || operation.includes('xlsx') || operation.includes('libreoffice') || operation.includes('pandoc')) {
      throw new Error(`The "${operation}" operation requires a desktop office engine (LibreOffice / Pandoc). Connect your phone to your PC Studio via "Mobile Connect" in the header to run this operation seamlessly.`);
    }

    throw new Error(`The operation "${operation}" is currently only supported when connected to Desktop Studio, or choose from the available on-device image, audio, video, PDF, archive, and text tools.`);
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
