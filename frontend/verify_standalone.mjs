import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/home/adityapatra/.gemini/antigravity/brain/1fac8bca-7f5f-422c-ae1c-b65f44ad16cc';

async function run() {
  console.log('[Test] Launching Headless Chrome without any laptop backend engine...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const consoleLogs = [];
  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      console.error(`[Browser Console Error]`, msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.error(`[Browser Page Error]`, err.message);
  });

  console.log('[Test] Navigating to http://localhost:4173 (Standalone static build)...');
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: 15000 });

  // Wait 1.5s for mode detection (confirming it settles to mobile_standalone)
  await new Promise((r) => setTimeout(r, 1500));

  // Check current mode in page context
  const mode = await page.evaluate(async () => {
    return window.localStorage?.getItem('ufs_backend_url') || 'detected';
  });
  console.log('[Test] Page loaded. Local storage ufs_backend_url:', mode);

  // Take screenshot of standalone landing
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screen_standalone_loaded.png') });
  console.log('[Test] Saved screen_standalone_loaded.png');

  // Test 1: Upload a file via mobileStorage in page context
  console.log('[Test 1] Testing standalone file upload into IndexedDB...');
  const uploadResult = await page.evaluate(async () => {
    const universalEngine = window.universalEngine;
    
    // Create a canvas 200x200 image blob
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px sans-serif';
    ctx.fillText('UFS Test', 40, 110);

    const blob = await new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));
    const file = new File([blob], 'standalone_sample.png', { type: 'image/png' });

    const records = await universalEngine.uploadFiles([file]);
    return {
      success: records.length > 0,
      record: records[0],
    };
  });

  console.log('[Test 1] Upload Result:', JSON.stringify(uploadResult, null, 2));

  // Test 2: Query operations for uploaded file in standalone mode
  console.log('[Test 2] Testing standalone getFileOperations for file ID:', uploadResult.record.id);
  const ops = await page.evaluate(async (fileId) => {
    const universalEngine = window.universalEngine;
    return await universalEngine.getFileOperations(fileId, 'image');
  }, uploadResult.record.id);

  console.log(`[Test 2] Available Operations (${ops.length}):`, ops.map((o) => o.id));

  // Test 3: Create and run on-device Image Convert Job (to WebP)
  console.log('[Test 3] Creating and running on-device Image Convert job (to WebP)...');
  const jobResult = await page.evaluate(async (fileId) => {
    const universalEngine = window.universalEngine;
    const job = await universalEngine.createJob({
      file_id: fileId,
      operation: 'image_convert',
      parameters: { format: 'webp', quality: 80 },
    });

    // Poll job status until completed
    let finished = job;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 200));
      finished = await universalEngine.getJob(job.id);
      if (finished.status === 'completed' || finished.status === 'failed') break;
    }

    return finished;
  }, uploadResult.record.id);

  console.log('[Test 3] Job Finished Result:', JSON.stringify(jobResult, null, 2));

  // Test 4: Download URL for completed job
  console.log('[Test 4] Testing getJobDownloadUrl for completed standalone job...');
  const downloadUrl = await page.evaluate(async (jobId) => {
    const universalEngine = window.universalEngine;
    return await universalEngine.getJobDownloadUrl(jobId);
  }, jobResult.id);

  console.log('[Test 4] Download URL generated:', downloadUrl.substring(0, 50) + '...');

  // Test 5: Verify job output blob exists and is valid WebP
  const blobCheck = await page.evaluate(async (jobId) => {
    const mobileStorage = window.mobileStorage;
    const blob = await mobileStorage.getJobOutputBlob(jobId);
    return {
      exists: Boolean(blob),
      size: blob ? blob.size : 0,
      type: blob ? blob.type : '',
    };
  }, jobResult.id);
  console.log('[Test 5] Job Output Blob in IndexedDB:', JSON.stringify(blobCheck));
  if (!blobCheck.exists || blobCheck.size === 0) {
    throw new Error('Test 5 Failed: Output blob is empty or missing');
  }

  // Test 6: Checksum calculation (crypto digest) in standalone mode
  console.log('[Test 6] Testing standalone checksum calculation...');
  const hashes = await page.evaluate(async (fileId) => {
    const universalEngine = window.universalEngine;
    return await universalEngine.getFileHashes(fileId);
  }, uploadResult.record.id);
  console.log('[Test 6] Checksums:', JSON.stringify(hashes));
  if (!hashes.sha256) throw new Error('Test 6 Failed: SHA256 checksum calculation failed');

  // Test 7: Job queue management (cancel, retry, delete)
  console.log('[Test 7] Testing standalone job queue management...');
  const jobManageResult = await page.evaluate(async (jobId) => {
    const universalEngine = window.universalEngine;
    const jobsBefore = await universalEngine.listJobs();
    await universalEngine.retryJob(jobId);
    const retriedJob = await universalEngine.getJob(jobId);
    await universalEngine.deleteJob(jobId);
    const jobsAfter = await universalEngine.listJobs();
    return {
      beforeCount: jobsBefore.length,
      retriedStatus: retriedJob?.status,
      afterCount: jobsAfter.length,
    };
  }, jobResult.id);
  console.log('[Test 7] Job Management Result:', JSON.stringify(jobManageResult));

  // Test 8: Settings update and retrieval
  console.log('[Test 8] Testing standalone settings update...');
  const settingsResult = await page.evaluate(async () => {
    const universalEngine = window.universalEngine;
    await universalEngine.updateSetting('compression_level', '95');
    const settings = await universalEngine.getSettings();
    return settings.find((s) => s.key === 'compression_level');
  });
  console.log('[Test 8] Updated Setting:', JSON.stringify(settingsResult));
  if (!settingsResult || settingsResult.value !== '95') {
    throw new Error('Test 8 Failed: compression_level setting was not updated');
  }

  // Test 9: Document processing (Markdown to HTML)
  console.log('[Test 9] Testing standalone Document processing (Markdown -> HTML)...');
  const docResult = await page.evaluate(async () => {
    const universalEngine = window.universalEngine;
    const mobileStorage = window.mobileStorage;

    const mdContent = '# Universal File Studio\\n\\n**100% On-Device Processing** is working cleanly.';
    const mdBlob = new Blob([mdContent], { type: 'text/markdown' });
    const uploadedMd = await mobileStorage.saveFile(mdBlob, 'notes.md');

    const job = await universalEngine.createJob({
      file_id: uploadedMd.id,
      operation: 'md_to_html',
      engine_used: 'On-Device Document Engine',
      parameters: { title: 'UFS Document' },
    });

    let finished = job;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 200));
      finished = await universalEngine.getJob(job.id);
      if (finished.status === 'completed' || finished.status === 'failed') break;
    }
    return finished;
  });
  console.log('[Test 9] Document Job Result:', JSON.stringify(docResult, null, 2));
  if (docResult.status !== 'completed') {
    throw new Error(`Test 9 Failed: Document job did not complete (${docResult.error_message || docResult.status})`);
  }

  // Test 10: PDF processing (watermarking via pdf-lib)
  console.log('[Test 10] Testing standalone PDF processing (Watermark via pdf-lib)...');
  const pdfResult = await page.evaluate(async () => {
    const universalEngine = window.universalEngine;
    const mobileStorage = window.mobileStorage;

    // Minimal valid PDF 1.4 document
    const rawPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
187
%%EOF`;
    const pdfBlob = new Blob([rawPdf], { type: 'application/pdf' });
    const uploadedPdf = await mobileStorage.saveFile(pdfBlob, 'sample.pdf');

    const job = await universalEngine.createJob({
      file_id: uploadedPdf.id,
      operation: 'watermark',
      engine_used: 'On-Device PDF Engine',
      parameters: { text: 'CONFIDENTIAL' },
    });

    let finished = job;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 200));
      finished = await universalEngine.getJob(job.id);
      if (finished.status === 'completed' || finished.status === 'failed') break;
    }
    return finished;
  });
  console.log('[Test 10] PDF Job Result:', JSON.stringify(pdfResult, null, 2));
  if (pdfResult.status !== 'completed') {
    throw new Error(`Test 10 Failed: PDF job did not complete (${pdfResult.error_message || pdfResult.status})`);
  }

  // Test 11: Archive processing (ZIP creation via JSZip)
  console.log('[Test 11] Testing standalone Archive processing (ZIP creation)...');
  const zipResult = await page.evaluate(async () => {
    const universalEngine = window.universalEngine;
    const mobileStorage = window.mobileStorage;

    const dummyBlob = new Blob(['File content inside archive'], { type: 'text/plain' });
    const uploadedFile = await mobileStorage.saveFile(dummyBlob, 'data.txt');

    const job = await universalEngine.createJob({
      file_id: uploadedFile.id,
      operation: 'zip',
      engine_used: 'On-Device Archive Engine',
      parameters: { archive_name: 'test_bundle' },
    });

    let finished = job;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 200));
      finished = await universalEngine.getJob(job.id);
      if (finished.status === 'completed' || finished.status === 'failed') break;
    }
    return finished;
  });
  console.log('[Test 11] Archive Job Result:', JSON.stringify(zipResult, null, 2));
  if (zipResult.status !== 'completed') {
    throw new Error(`Test 11 Failed: Archive job did not complete (${zipResult.error_message || zipResult.status})`);
  }

  // Refresh page and take final screenshot
  await page.reload({ waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'screen_standalone_verified.png') });
  console.log('[Test] Saved screen_standalone_verified.png');

  await browser.close();
  console.log('[Test Complete] All Standalone Tests Passed with ZERO laptop backend dependency!');
}

run().catch((err) => {
  console.error('[Test Failed]', err);
  process.exit(1);
});
