package com.universalfilestudio.app.plugins;

import android.content.Context;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.provider.MediaStore;
import android.webkit.MimeTypeMap;
import androidx.core.content.FileProvider;
import java.util.List;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.ColorMatrix;
import android.graphics.ColorMatrixColorFilter;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.media.MediaMetadataRetriever;
import android.os.Build;
import android.os.Environment;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import com.arthenica.ffmpegkit.FFmpegKit;
import com.arthenica.ffmpegkit.FFmpegSession;
import com.arthenica.ffmpegkit.ReturnCode;
import com.arthenica.ffmpegkit.Statistics;
import com.arthenica.ffmpegkit.StatisticsCallback;
import com.googlecode.tesseract.android.TessBaseAPI;

@CapacitorPlugin(name = "UniversalNativeEngine")
public class UniversalNativeEnginePlugin extends Plugin {
    private static final String TAG = "UniversalNativeEngine";
    private final ExecutorService executor = Executors.newFixedThreadPool(4);

    @PluginMethod
    public void getEngineStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isNativeAndroid", true);
        ret.put("deviceModel", Build.MODEL);
        ret.put("androidVersion", Build.VERSION.RELEASE);
        ret.put("cpuArch", Build.SUPPORTED_ABIS[0]);
        ret.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        ret.put("maxMemoryMb", Runtime.getRuntime().maxMemory() / (1024 * 1024));
        ret.put("freeMemoryMb", Runtime.getRuntime().freeMemory() / (1024 * 1024));
        call.resolve(ret);
    }

    /**
     * High-speed Native Image Processing: Resize, Compress, Convert, Rotate, Invert, Grayscale
     */
    @PluginMethod
    public void processImageNative(PluginCall call) {
        executor.execute(() -> {
            try {
                String inputPath = call.getString("inputPath");
                String operation = call.getString("operation", "compress");
                JSObject params = call.getObject("parameters", new JSObject());

                if (inputPath == null || inputPath.isEmpty()) {
                    call.reject("Missing required parameter: inputPath");
                    return;
                }

                File inFile = new File(inputPath);
                if (!inFile.exists()) {
                    call.reject("Input file does not exist: " + inputPath);
                    return;
                }

                Bitmap bitmap = BitmapFactory.decodeFile(inFile.getAbsolutePath());
                if (bitmap == null) {
                    call.reject("Failed to decode image file: " + inputPath);
                    return;
                }

                int width = bitmap.getWidth();
                int height = bitmap.getHeight();

                // 1. Crop Handling
                if ("image_crop".equals(operation) || "crop".equals(operation) || params.has("ratio") || params.has("aspect_ratio")) {
                    String ratio = params.optString("ratio", params.optString("aspect_ratio", "1:1"));
                    double targetRatio = 1.0;
                    if ("16:9".equals(ratio)) targetRatio = 16.0 / 9.0;
                    else if ("4:3".equals(ratio)) targetRatio = 4.0 / 3.0;
                    else if ("9:16".equals(ratio)) targetRatio = 9.0 / 16.0;

                    int curW = bitmap.getWidth();
                    int curH = bitmap.getHeight();
                    double curRatio = (double) curW / (double) curH;
                    int cropW = curW;
                    int cropH = curH;
                    int cropX = 0;
                    int cropY = 0;

                    if (curRatio > targetRatio) {
                        cropW = (int) Math.round(curH * targetRatio);
                        cropH = curH;
                        cropX = (curW - cropW) / 2;
                    } else {
                        cropW = curW;
                        cropH = (int) Math.round(curW / targetRatio);
                        cropY = (curH - cropH) / 2;
                    }
                    if (cropW > 0 && cropH > 0 && cropX + cropW <= curW && cropY + cropH <= curH) {
                        bitmap = Bitmap.createBitmap(bitmap, cropX, cropY, cropW, cropH);
                        width = bitmap.getWidth();
                        height = bitmap.getHeight();
                    }
                }

                // 2. Resize / Scale
                if (params.has("width") || params.has("height") || params.has("scale")) {
                    int targetW = params.optInt("width", width);
                    int targetH = params.optInt("height", height);
                    if (params.has("scale")) {
                        double scale = params.optDouble("scale", 1.0);
                        targetW = (int) Math.round(width * scale);
                        targetH = (int) Math.round(height * scale);
                    }
                    if (targetW > 0 && targetH > 0 && (targetW != width || targetH != height)) {
                        bitmap = Bitmap.createScaledBitmap(bitmap, targetW, targetH, true);
                    }
                }

                // 3. Rotate / Flip
                boolean isRotateOp = "image_rotate".equals(operation) || "rotate".equals(operation);
                boolean hasRotateParam = params.has("degrees") || params.has("rotate") || params.has("rotation") || params.has("angle");
                if (isRotateOp || hasRotateParam || params.optBoolean("flipH", false) || params.optBoolean("flipV", false)) {
                    Matrix matrix = new Matrix();
                    float deg = (float) params.optDouble("degrees", params.optDouble("rotate", params.optDouble("rotation", params.optDouble("angle", 0))));
                    if (deg == 0f && isRotateOp) {
                        deg = 90f;
                    }
                    if (deg != 0f) {
                        matrix.postRotate(deg);
                    }
                    float sx = params.optBoolean("flipH", false) ? -1f : 1f;
                    float sy = params.optBoolean("flipV", false) ? -1f : 1f;
                    if (sx != 1f || sy != 1f) {
                        matrix.postScale(sx, sy);
                    }
                    bitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
                }

                // 4. Color Filters (Grayscale, Invert)
                if ("image_grayscale".equals(operation) || "grayscale".equals(operation) || params.optBoolean("grayscale", false)) {
                    Bitmap grayBitmap = Bitmap.createBitmap(bitmap.getWidth(), bitmap.getHeight(), Bitmap.Config.ARGB_8888);
                    Canvas canvas = new Canvas(grayBitmap);
                    Paint paint = new Paint();
                    ColorMatrix cm = new ColorMatrix();
                    cm.setSaturation(0);
                    paint.setColorFilter(new ColorMatrixColorFilter(cm));
                    canvas.drawBitmap(bitmap, 0, 0, paint);
                    bitmap = grayBitmap;
                } else if ("image_invert".equals(operation) || "invert".equals(operation) || params.optBoolean("invert", false)) {
                    Bitmap invertBitmap = Bitmap.createBitmap(bitmap.getWidth(), bitmap.getHeight(), Bitmap.Config.ARGB_8888);
                    Canvas canvas = new Canvas(invertBitmap);
                    Paint paint = new Paint();
                    ColorMatrix cm = new ColorMatrix(new float[] {
                        -1,  0,  0,  0, 255,
                         0, -1,  0,  0, 255,
                         0,  0, -1,  0, 255,
                         0,  0,  0,  1,   0
                    });
                    paint.setColorFilter(new ColorMatrixColorFilter(cm));
                    canvas.drawBitmap(bitmap, 0, 0, paint);
                    bitmap = invertBitmap;
                }

                // 5. Watermark
                if ("image_watermark".equals(operation) || params.has("text") || params.has("watermark_text")) {
                    String markText = params.optString("text", params.optString("watermark_text", "COPYRIGHT"));
                    Bitmap watermarked = bitmap.copy(Bitmap.Config.ARGB_8888, true);
                    Canvas canvas = new Canvas(watermarked);
                    Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
                    float textSize = Math.max(24f, watermarked.getWidth() / 25f);
                    paint.setTextSize(textSize);
                    paint.setColor(0xFFFFFFFF);
                    float textW = paint.measureText(markText);
                    float pad = 20f;
                    float boxW = textW + pad * 2;
                    float boxH = textSize + pad * 2;
                    float boxX = watermarked.getWidth() - boxW - 30f;
                    float boxY = watermarked.getHeight() - boxH - 30f;

                    Paint bgPaint = new Paint();
                    bgPaint.setColor(0x88000000);
                    canvas.drawRect(boxX, boxY, boxX + boxW, boxY + boxH, bgPaint);
                    canvas.drawText(markText, boxX + pad, boxY + pad + textSize * 0.8f, paint);
                    bitmap = watermarked;
                }

                // 6. Border
                if ("image_add_border".equals(operation)) {
                    Bitmap bordered = bitmap.copy(Bitmap.Config.ARGB_8888, true);
                    Canvas canvas = new Canvas(bordered);
                    Paint borderPaint = new Paint();
                    borderPaint.setStyle(Paint.Style.STROKE);
                    float bWidth = Math.max(12f, bordered.getWidth() / 35f);
                    borderPaint.setStrokeWidth(bWidth);
                    borderPaint.setColor(0xFFFFFFFF);
                    canvas.drawRect(bWidth / 2, bWidth / 2, bordered.getWidth() - bWidth / 2, bordered.getHeight() - bWidth / 2, borderPaint);
                    bitmap = bordered;
                }

                // 7. Output Format & Quality
                String formatStr = params.optString("format", "webp").toLowerCase();
                int quality = params.optInt("quality", 85);
                Bitmap.CompressFormat compressFormat = Bitmap.CompressFormat.JPEG;
                String ext = "jpg";

                if ("create_favicon".equals(operation)) {
                    bitmap = Bitmap.createScaledBitmap(bitmap, 48, 48, true);
                    formatStr = "png";
                    ext = "ico";
                }

                if (formatStr.contains("png") || "ico".equals(ext)) {
                    compressFormat = Bitmap.CompressFormat.PNG;
                    if (!"ico".equals(ext)) ext = "png";
                } else if (formatStr.contains("webp")) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        compressFormat = quality >= 100 ? Bitmap.CompressFormat.WEBP_LOSSLESS : Bitmap.CompressFormat.WEBP_LOSSY;
                    } else {
                        compressFormat = Bitmap.CompressFormat.WEBP;
                    }
                    ext = "webp";
                }

                File outputDir = getContext().getExternalFilesDir(Environment.DIRECTORY_PICTURES);
                if (outputDir == null) outputDir = getContext().getCacheDir();
                String outName = inFile.getName().replaceFirst("[.][^.]+$", "") + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + ext;
                File outFile = new File(outputDir, outName);

                try (FileOutputStream fos = new FileOutputStream(outFile)) {
                    bitmap.compress(compressFormat, quality, fos);
                    fos.flush();
                }

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("outputPath", outFile.getAbsolutePath());
                res.put("outputFilename", outFile.getName());
                res.put("sizeBytes", outFile.length());
                res.put("width", bitmap.getWidth());
                res.put("height", bitmap.getHeight());
                call.resolve(res);

            } catch (Exception e) {
                Log.e(TAG, "processImageNative error: " + e.getMessage(), e);
                call.reject("Image processing failed: " + e.getMessage());
            }
        });
    }

    /**
     * Native Multi-Format ZIP Archive Extraction and Creation
     */
    @PluginMethod
    public void processArchiveNative(PluginCall call) {
        executor.execute(() -> {
            try {
                String operation = call.getString("operation", "create_zip");
                JSArray filesArray = call.getArray("files");
                String inputArchive = call.getString("inputPath");
                String archiveName = call.getString("archiveName", "archive_" + System.currentTimeMillis() + ".zip");

                File outputDir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (outputDir == null) outputDir = getContext().getCacheDir();

                if ("create_zip".equals(operation) || "archive".equals(operation)) {
                    if (filesArray == null || filesArray.length() == 0) {
                        call.reject("No files specified for archive creation");
                        return;
                    }

                    if (!archiveName.endsWith(".zip")) archiveName += ".zip";
                    File zipFile = new File(outputDir, archiveName);

                    try (ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(new FileOutputStream(zipFile)))) {
                        byte[] buffer = new byte[8192];
                        for (int i = 0; i < filesArray.length(); i++) {
                            String fPath = filesArray.getString(i);
                            File src = new File(fPath);
                            if (src.exists() && src.isFile()) {
                                ZipEntry entry = new ZipEntry(src.getName());
                                zos.putNextEntry(entry);
                                try (FileInputStream fis = new FileInputStream(src)) {
                                    int len;
                                    while ((len = fis.read(buffer)) > 0) {
                                        zos.write(buffer, 0, len);
                                    }
                                }
                                zos.closeEntry();
                            }
                        }
                    }

                    JSObject res = new JSObject();
                    res.put("success", true);
                    res.put("outputPath", zipFile.getAbsolutePath());
                    res.put("outputFilename", zipFile.getName());
                    res.put("sizeBytes", zipFile.length());
                    call.resolve(res);

                } else if ("extract_zip".equals(operation) || "extract".equals(operation)) {
                    if (inputArchive == null || !new File(inputArchive).exists()) {
                        call.reject("Archive file does not exist: " + inputArchive);
                        return;
                    }

                    File extractDir = new File(outputDir, new File(inputArchive).getName().replaceFirst("[.][^.]+$", "") + "_extracted");
                    extractDir.mkdirs();

                    JSArray extractedFiles = new JSArray();
                    byte[] buffer = new byte[8192];

                    try (ZipInputStream zis = new ZipInputStream(new BufferedInputStream(new FileInputStream(inputArchive)))) {
                        ZipEntry entry;
                        while ((entry = zis.getNextEntry()) != null) {
                            File targetFile = new File(extractDir, entry.getName());
                            // Security check against ZipSlip vulnerability
                            if (!targetFile.getCanonicalPath().startsWith(extractDir.getCanonicalPath())) {
                                throw new SecurityException("ZipSlip path traversal attempt detected: " + entry.getName());
                            }

                            if (entry.isDirectory()) {
                                targetFile.mkdirs();
                            } else {
                                targetFile.getParentFile().mkdirs();
                                try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                                    int len;
                                    while ((len = zis.read(buffer)) > 0) {
                                        fos.write(buffer, 0, len);
                                    }
                                }
                                extractedFiles.put(targetFile.getAbsolutePath());
                            }
                            zis.closeEntry();
                        }
                    }

                    JSObject res = new JSObject();
                    res.put("success", true);
                    res.put("outputDirectory", extractDir.getAbsolutePath());
                    res.put("extractedCount", extractedFiles.length());
                    res.put("files", extractedFiles);
                    call.resolve(res);
                } else {
                    call.reject("Unsupported native archive operation: " + operation);
                }
            } catch (Exception e) {
                Log.e(TAG, "processArchiveNative error: " + e.getMessage(), e);
                call.reject("Archive operation failed: " + e.getMessage());
            }
        });
    }

    /**
     * Native Video Thumbnail / High-Speed Frame Extractor
     */
    @PluginMethod
    public void extractVideoFrameNative(PluginCall call) {
        executor.execute(() -> {
            MediaMetadataRetriever retriever = null;
            try {
                String inputPath = call.getString("inputPath");
                if (inputPath == null || !new File(inputPath).exists()) {
                    call.reject("Video file does not exist: " + inputPath);
                    return;
                }

                String timeStr = call.getString("time", call.getString("timeSeconds", "1"));
                long timeMicros = 1000000L;
                try {
                    if (timeStr.contains(":")) {
                        String[] parts = timeStr.split(":");
                        long s = 0;
                        for (String p : parts) {
                            s = s * 60 + Long.parseLong(p.trim());
                        }
                        timeMicros = s * 1000000L;
                    } else {
                        timeMicros = (long) (Double.parseDouble(timeStr) * 1000000L);
                    }
                } catch (Exception ignored) {}

                retriever = new MediaMetadataRetriever();
                retriever.setDataSource(inputPath);
                Bitmap frame = retriever.getFrameAtTime(timeMicros, MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
                if (frame == null) {
                    frame = retriever.getFrameAtTime(timeMicros);
                }

                if (frame == null) {
                    call.reject("Failed to retrieve video frame at timestamp " + timeStr);
                    return;
                }

                File outputDir = getContext().getExternalFilesDir(Environment.DIRECTORY_PICTURES);
                if (outputDir == null) outputDir = getContext().getCacheDir();
                if (!outputDir.exists()) outputDir.mkdirs();

                String cleanBase = new File(inputPath).getName().replaceFirst("[.][^.]+$", "").replaceAll("[^a-zA-Z0-9._-]", "_");
                String outName = cleanBase + "_frame_" + System.currentTimeMillis() % 10000 + ".jpg";
                File outFile = new File(outputDir, outName);

                try (FileOutputStream fos = new FileOutputStream(outFile)) {
                    frame.compress(Bitmap.CompressFormat.JPEG, 92, fos);
                    fos.flush();
                }

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("outputPath", outFile.getAbsolutePath());
                res.put("outputFilename", outFile.getName());
                res.put("sizeBytes", outFile.length());
                res.put("width", frame.getWidth());
                res.put("height", frame.getHeight());
                call.resolve(res);

            } catch (Exception e) {
                Log.e(TAG, "extractVideoFrameNative error: " + e.getMessage(), e);
                call.reject("Video frame extraction failed: " + e.getMessage());
            } finally {
                if (retriever != null) {
                    try { retriever.release(); } catch (Exception ignored) {}
                }
            }
        });
    }

    /**
     * Native Document and Text conversion (Markdown, HTML, Plaintext, CSV)
     */
    @PluginMethod
    public void processDocumentNative(PluginCall call) {
        executor.execute(() -> {
            try {
                String inputPath = call.getString("inputPath");
                String targetFormat = call.getString("targetFormat", "txt").toLowerCase();

                if (inputPath == null || !new File(inputPath).exists()) {
                    call.reject("Document file does not exist: " + inputPath);
                    return;
                }

                File inFile = new File(inputPath);
                StringBuilder contentBuilder = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(inFile), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        contentBuilder.append(line).append("\n");
                    }
                }
                String content = contentBuilder.toString();

                File outputDir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS);
                if (outputDir == null) outputDir = getContext().getCacheDir();

                String outName = inFile.getName().replaceFirst("[.][^.]+$", "") + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + targetFormat;
                File outFile = new File(outputDir, outName);

                String converted = content;
                if ("html".equals(targetFormat) && (inFile.getName().endsWith(".md") || inFile.getName().endsWith(".txt"))) {
                    converted = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + inFile.getName() + "</title></head><body><pre>" +
                            content.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") +
                            "</pre></body></html>";
                }

                try (FileOutputStream fos = new FileOutputStream(outFile)) {
                    fos.write(converted.getBytes(StandardCharsets.UTF_8));
                    fos.flush();
                }

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("outputPath", outFile.getAbsolutePath());
                res.put("outputFilename", outFile.getName());
                res.put("sizeBytes", outFile.length());
                call.resolve(res);

            } catch (Exception e) {
                Log.e(TAG, "processDocumentNative error: " + e.getMessage(), e);
                call.reject("Document conversion failed: " + e.getMessage());
            }
        });
    }

    /**
     * Seamless APK Update Installer (Without deleting old app or losing data)
     */
    @PluginMethod
    public void installApk(PluginCall call) {
        try {
            String filePath = call.getString("filePath");
            if (filePath == null || filePath.isEmpty()) {
                call.reject("Missing filePath parameter");
                return;
            }

            File apkFile = new File(filePath);
            if (!apkFile.exists()) {
                call.reject("APK file does not exist: " + filePath);
                return;
            }

            Context context = getContext();
            android.net.Uri apkUri = androidx.core.content.FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                apkFile
            );

            android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "installApk error: " + e.getMessage(), e);
            call.reject("Failed to trigger installer: " + e.getMessage());
        }
    }

    /**
     * Download and Seamlessly Install Update APK directly from GitHub Releases
     */
    @PluginMethod
    public void downloadAndInstallApk(PluginCall call) {
        executor.execute(() -> {
            try {
                String downloadUrl = call.getString("url");
                if (downloadUrl == null || downloadUrl.isEmpty()) {
                    call.reject("Missing download URL");
                    return;
                }

                File outputDir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (outputDir == null) outputDir = getContext().getCacheDir();
                File destFile = new File(outputDir, "ufs_update.apk");
                if (destFile.exists()) destFile.delete();

                java.net.URL url = new java.net.URL(downloadUrl);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.connect();

                int responseCode = conn.getResponseCode();
                if (responseCode == java.net.HttpURLConnection.HTTP_MOVED_PERM ||
                    responseCode == java.net.HttpURLConnection.HTTP_MOVED_TEMP ||
                    responseCode == 307 || responseCode == 308) {
                    String newUrl = conn.getHeaderField("Location");
                    conn.disconnect();
                    url = new java.net.URL(newUrl);
                    conn = (java.net.HttpURLConnection) url.openConnection();
                    conn.connect();
                }

                try (InputStream in = conn.getInputStream();
                     FileOutputStream out = new FileOutputStream(destFile)) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = in.read(buffer)) != -1) {
                        out.write(buffer, 0, bytesRead);
                    }
                    out.flush();
                }

                Context context = getContext();
                android.net.Uri apkUri = androidx.core.content.FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    destFile
                );

                android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
                intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("filePath", destFile.getAbsolutePath());
                call.resolve(res);

            } catch (Exception e) {
                Log.e(TAG, "downloadAndInstallApk error: " + e.getMessage(), e);
                call.reject("Failed to download and install update: " + e.getMessage());
            }
        });
    }

    /**
     * Raw FFmpeg Engine Execution (FFmpegKit C++ Native Engine)
     */
    @PluginMethod
    public void executeFFmpeg(PluginCall call) {
        executor.execute(() -> {
            try {
                String command = call.getString("command");
                if (command == null || command.isEmpty()) {
                    call.reject("Missing command parameter");
                    return;
                }

                FFmpegSession session = FFmpegKit.execute(command);
                if (ReturnCode.isSuccess(session.getReturnCode())) {
                    JSObject res = new JSObject();
                    res.put("success", true);
                    res.put("returnCode", session.getReturnCode().getValue());
                    res.put("output", session.getOutput());
                    res.put("durationMs", session.getDuration());
                    call.resolve(res);
                } else {
                    call.reject("FFmpeg failed: " + session.getFailStackTrace());
                }
            } catch (Exception e) {
                Log.e(TAG, "executeFFmpeg error: " + e.getMessage(), e);
                call.reject("FFmpeg execution failed: " + e.getMessage());
            }
        });
    }

    /**
     * Native Video Operations powered by FFmpegKit Full GPL
     */
    @PluginMethod
    public void processVideoNative(PluginCall call) {
        executor.execute(() -> {
            try {
                String inputPath = call.getString("inputPath");
                String operation = call.getString("operation", "compress_video");
                JSObject params = call.getObject("parameters", new JSObject());
                JSArray filesArray = call.getArray("files");

                if (inputPath == null || !new File(inputPath).exists()) {
                    call.reject("Input video not found: " + inputPath);
                    return;
                }

                File in = new File(inputPath);
                File outputDir = getContext().getExternalFilesDir(Environment.DIRECTORY_MOVIES);
                if (outputDir == null) outputDir = getContext().getCacheDir();
                if (!outputDir.exists()) outputDir.mkdirs();

                String outExt = "mp4";
                if ("extract_audio".equals(operation)) {
                    outExt = params.optString("format", "mp3").toLowerCase();
                } else if ("video_to_gif".equals(operation) || "gif".equals(operation)) {
                    outExt = "gif";
                } else if ("gif_to_video".equals(operation)) {
                    outExt = "mp4";
                } else if (params.has("format")) {
                    outExt = params.optString("format", "mp4").toLowerCase();
                }

                if (outExt.startsWith(".")) outExt = outExt.substring(1);

                String cleanBase = in.getName().replaceFirst("[.][^.]+$", "").replaceAll("[^a-zA-Z0-9._-]", "_");
                String outName = cleanBase + "_" + operation + "_" + UUID.randomUUID().toString().substring(0, 6) + "." + outExt;
                File out = new File(outputDir, outName);
                if (out.exists()) out.delete();

                // Retrieve video duration using MediaMetadataRetriever for progress tracking
                long durationMs = 0;
                MediaMetadataRetriever mmr = new MediaMetadataRetriever();
                try {
                    mmr.setDataSource(in.getAbsolutePath());
                    String durStr = mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
                    if (durStr != null) durationMs = Long.parseLong(durStr);
                } catch (Exception ignored) {
                } finally {
                    try { mmr.release(); } catch (Exception ignored) {}
                }

                StringBuilder cmd = new StringBuilder();
                cmd.append("-y -nostdin ");

                if ("video_trim".equals(operation) || "trim".equals(operation)) {
                    String start = params.has("start") ? params.optString("start", "00:00:00") : params.optString("start_time", "00:00:00");
                    String end = params.has("end") ? params.optString("end", "00:00:30") : params.optString("end_time", "00:00:30");
                    cmd.append("-ss \"").append(start).append("\" -to \"").append(end).append("\" ")
                       .append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-c:v libx264 -preset ultrafast -pix_fmt yuv420p -map 0:v:0 -map 0:a? -c:a aac -b:a 128k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("extract_audio".equals(operation)) {
                    int bitrate = params.optInt("bitrate", 192);
                    if ("wav".equals(outExt)) {
                        cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -vn -acodec pcm_s16le \"").append(out.getAbsolutePath()).append("\"");
                    } else if ("flac".equals(outExt)) {
                        cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -vn -c:a flac \"").append(out.getAbsolutePath()).append("\"");
                    } else if ("aac".equals(outExt) || "m4a".equals(outExt)) {
                        cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -vn -c:a aac -b:a ").append(bitrate).append("k \"").append(out.getAbsolutePath()).append("\"");
                    } else {
                        cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -vn -c:a libmp3lame -b:a ").append(bitrate).append("k \"").append(out.getAbsolutePath()).append("\"");
                    }
                } else if ("remove_audio".equals(operation) || "mute".equals(operation) || "video_remove_audio".equals(operation)) {
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -an -c:v copy \"").append(out.getAbsolutePath()).append("\"");
                } else if ("video_rotate".equals(operation) || "rotate".equals(operation)) {
                    int deg = params.optInt("degrees", params.optInt("rotation", params.optInt("angle", 90)));
                    String vf = "transpose=1";
                    if (deg == 180) {
                        vf = "transpose=2,transpose=2";
                    } else if (deg == 270) {
                        vf = "transpose=2";
                    }
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -vf \"").append(vf).append("\" ")
                       .append("-c:v libx264 -preset ultrafast -pix_fmt yuv420p -map 0:v:0 -map 0:a? -c:a copy \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("video_resize".equals(operation) || "scale".equals(operation)) {
                    String res = params.optString("preset", params.optString("resolution", "720p")).toLowerCase();
                    String vf = "scale=-2:720";
                    if (res.contains("1080")) {
                        vf = "scale=-2:1080";
                    } else if (res.contains("480")) {
                        vf = "scale=-2:480";
                    } else if (params.has("width") && params.has("height")) {
                        int w = params.optInt("width", 1280);
                        int h = params.optInt("height", 720);
                        vf = "scale=" + w + ":" + h + ":force_original_aspect_ratio=decrease,pad=" + w + ":" + h + ":(ow-iw)/2:(oh-ih)/2";
                    }
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -vf \"").append(vf).append("\" ")
                       .append("-c:v libx264 -preset ultrafast -pix_fmt yuv420p -map 0:v:0 -map 0:a? -c:a copy \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("video_crop".equals(operation) || "crop".equals(operation)) {
                    String aspect = params.optString("aspect_ratio", params.optString("ratio", params.optString("aspect", "9:16")));
                    String vf = "crop=min(iw\\,ih*9/16):min(ih\\,iw*16/9)";
                    if ("1:1".equals(aspect)) {
                        vf = "crop=min(iw\\,ih):min(iw\\,ih)";
                    } else if ("16:9".equals(aspect)) {
                        vf = "crop=min(iw\\,ih*16/9):min(ih\\,iw*9/16)";
                    } else if ("4:5".equals(aspect)) {
                        vf = "crop=min(iw\\,ih*4/5):min(ih\\,iw*5/4)";
                    }
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -vf \"").append(vf).append("\" ")
                       .append("-c:v libx264 -preset ultrafast -pix_fmt yuv420p -map 0:v:0 -map 0:a? -c:a copy \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("video_change_speed".equals(operation) || "video_speed".equals(operation)) {
                    double speed = params.optDouble("speed", 1.5);
                    if (speed <= 0) speed = 1.0;
                    double setpts = 1.0 / Math.max(0.25, Math.min(4.0, speed));
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-filter_complex \"[0:v]setpts=").append(String.format(Locale.US, "%.3f", setpts)).append("*PTS[v];[0:a]atempo=").append(String.format(Locale.US, "%.3f", Math.max(0.5, Math.min(2.0, speed)))).append("[a]\" ")
                       .append("-map \"[v]\" -map \"[a]?\" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 128k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("video_change_fps".equals(operation) || "change_fps".equals(operation)) {
                    int fps = params.optInt("fps", 30);
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -r ").append(fps).append(" ")
                       .append("-c:v libx264 -preset ultrafast -pix_fmt yuv420p -map 0:v:0 -map 0:a? -c:a copy \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("compress_video".equals(operation) || "video_compress".equals(operation)) {
                    String preset = params.optString("target_preset", "balanced").toLowerCase();
                    int crf = params.optInt("crf", 28);
                    String scale = "";
                    int audioBitrate = 128;
                    if ("discord".equals(preset)) {
                        crf = 28;
                        scale = "scale='min(1280,iw)':-2,";
                        audioBitrate = 96;
                    } else if ("whatsapp".equals(preset)) {
                        crf = 30;
                        scale = "scale='min(854,iw)':-2,";
                        audioBitrate = 96;
                    } else if ("email".equals(preset)) {
                        crf = 32;
                        scale = "scale='min(640,iw)':-2,";
                        audioBitrate = 64;
                    }
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ");
                    if (!scale.isEmpty()) cmd.append("-vf \"").append(scale.substring(0, scale.length() - 1)).append("\" ");
                    cmd.append("-c:v libx264 -crf ").append(crf)
                       .append(" -preset ultrafast -pix_fmt yuv420p -map 0:v:0 -map 0:a? -c:a aac -b:a ").append(audioBitrate).append("k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("video_reverse".equals(operation) || "reverse".equals(operation)) {
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-vf \"reverse\" -af \"areverse\" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 128k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("video_loop".equals(operation) || "loop".equals(operation)) {
                    int count = params.optInt("count", 3);
                    int streamLoop = Math.max(1, count - 1);
                    cmd.append("-stream_loop ").append(streamLoop).append(" -i \"").append(in.getAbsolutePath())
                       .append("\" -c copy \"").append(out.getAbsolutePath()).append("\"");
                } else if ("video_adjust_volume".equals(operation) || "adjust_volume".equals(operation)) {
                    String vol = params.optString("volume", "150%");
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-c:v copy -af \"volume=").append(vol).append("\" \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("video_to_gif".equals(operation) || "gif".equals(operation) || "gif".equals(outExt)) {
                    int fps = params.optInt("fps", 15);
                    int width = params.optInt("width", 480);
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-vf \"fps=").append(fps).append(",scale=").append(width).append(":-2:flags=lanczos\" \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("gif_to_video".equals(operation)) {
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-vf \"pad=ceil(iw/2)*2:ceil(ih/2)*2\" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -movflags +faststart \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("video_watermark".equals(operation) || "watermark".equals(operation)) {
                    String text = params.optString("text", "CONFIDENTIAL").replace("'", "").replace(":", "");
                    File font = new File("/system/fonts/Roboto-Regular.ttf");
                    String fontArg = font.exists() ? ":fontfile=/system/fonts/Roboto-Regular.ttf" : "";
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-vf \"drawtext=text='").append(text).append("'").append(fontArg)
                       .append(":fontsize=36:fontcolor=white@0.85:x=w-tw-30:y=h-th-30:box=1:boxcolor=black@0.5:boxborderw=8\" ")
                       .append("-c:v libx264 -preset ultrafast -pix_fmt yuv420p -map 0:v:0 -map 0:a? -c:a copy \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("video_stabilize".equals(operation) || "stabilize".equals(operation)) {
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-vf \"deshake\" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -map 0:v:0 -map 0:a? -c:a copy \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("video_concat".equals(operation) || "concat".equals(operation)) {
                    if (filesArray != null && filesArray.length() > 1) {
                        File listFile = new File(getContext().getCacheDir(), "concat_" + System.currentTimeMillis() + ".txt");
                        try (FileOutputStream fos = new FileOutputStream(listFile)) {
                            for (int i = 0; i < filesArray.length(); i++) {
                                String fPath = filesArray.getString(i);
                                String line = "file '" + fPath.replace("'", "'\\''") + "'\n";
                                fos.write(line.getBytes(StandardCharsets.UTF_8));
                            }
                        }
                        cmd.append("-f concat -safe 0 -i \"").append(listFile.getAbsolutePath()).append("\" ")
                           .append("-c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 128k \"")
                           .append(out.getAbsolutePath()).append("\"");
                    } else {
                        cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -map 0:v:0 -map 0:a? -c:a aac \"").append(out.getAbsolutePath()).append("\"");
                    }
                } else {
                    String res = params.optString("resolution", "original").toLowerCase();
                    String scale = "";
                    if (res.contains("1080")) scale = "scale=-2:1080,";
                    else if (res.contains("720")) scale = "scale=-2:720,";
                    else if (res.contains("480")) scale = "scale=-2:480,";

                    if ("webm".equals(outExt)) {
                        cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ");
                        if (!scale.isEmpty()) cmd.append("-vf \"").append(scale.substring(0, scale.length() - 1)).append("\" ");
                        cmd.append("-c:v libvpx -b:v 1.5M -crf 30 -map 0:v:0 -map 0:a? -c:a libvorbis \"").append(out.getAbsolutePath()).append("\"");
                    } else if ("avi".equals(outExt)) {
                        cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ");
                        if (!scale.isEmpty()) cmd.append("-vf \"").append(scale.substring(0, scale.length() - 1)).append("\" ");
                        cmd.append("-c:v mpeg4 -vtag xvid -qscale:v 3 -map 0:v:0 -map 0:a? -c:a libmp3lame \"").append(out.getAbsolutePath()).append("\"");
                    } else if ("mkv".equals(outExt)) {
                        cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ");
                        if (!scale.isEmpty()) cmd.append("-vf \"").append(scale.substring(0, scale.length() - 1)).append("\" ");
                        cmd.append("-c:v libx264 -preset ultrafast -pix_fmt yuv420p -map 0:v:0 -map 0:a? -c:a copy \"").append(out.getAbsolutePath()).append("\"");
                    } else {
                        cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ");
                        if (!scale.isEmpty()) cmd.append("-vf \"").append(scale.substring(0, scale.length() - 1)).append("\" ");
                        cmd.append("-c:v libx264 -preset ultrafast -pix_fmt yuv420p -map 0:v:0 -map 0:a? -c:a aac -b:a 128k \"").append(out.getAbsolutePath()).append("\"");
                    }
                }

                final long finalDur = durationMs;
                FFmpegKit.executeAsync(
                    cmd.toString(),
                    session -> {
                        if (ReturnCode.isSuccess(session.getReturnCode())) {
                            JSObject res = new JSObject();
                            res.put("success", true);
                            res.put("outputPath", out.getAbsolutePath());
                            res.put("outputFilename", out.getName());
                            res.put("sizeBytes", out.length());
                            call.resolve(res);
                        } else {
                            call.reject("Video operation failed (" + session.getReturnCode() + "): " + session.getFailStackTrace());
                        }
                    },
                    log -> {},
                    statistics -> {
                        if (statistics != null) {
                            double timeMs = statistics.getTime();
                            int pct;
                            if (finalDur > 0) {
                                pct = (int) Math.min(95, Math.max(5, (timeMs / finalDur) * 100));
                            } else {
                                pct = (int) Math.min(95, 10 + (timeMs / 1000) * 5);
                            }
                            JSObject prog = new JSObject();
                            prog.put("percent", pct);
                            notifyListeners("videoProgress", prog);
                        }
                    }
                );
            } catch (Exception e) {
                Log.e(TAG, "processVideoNative error: " + e.getMessage(), e);
                call.reject("Video operation failed: " + e.getMessage());
            }
        });
    }

    /**
     * Native Audio Operations powered by FFmpegKit Full GPL
     */
    @PluginMethod
    public void processAudioNative(PluginCall call) {
        executor.execute(() -> {
            try {
                String inputPath = call.getString("inputPath");
                String operation = call.getString("operation", "audio_convert");
                JSObject params = call.getObject("parameters", new JSObject());
                JSArray filesArray = call.getArray("files");

                if (inputPath == null || !new File(inputPath).exists()) {
                    call.reject("Input audio not found: " + inputPath);
                    return;
                }

                File in = new File(inputPath);
                File outputDir = getContext().getExternalFilesDir(Environment.DIRECTORY_MUSIC);
                if (outputDir == null) outputDir = getContext().getCacheDir();
                if (!outputDir.exists()) outputDir.mkdirs();

                String outExt = params.optString("format", "mp3").toLowerCase();
                if (outExt.startsWith(".")) outExt = outExt.substring(1);

                String cleanBase = in.getName().replaceFirst("[.][^.]+$", "").replaceAll("[^a-zA-Z0-9._-]", "_");
                String outName = cleanBase + "_" + operation + "_" + UUID.randomUUID().toString().substring(0, 6) + "." + outExt;
                File out = new File(outputDir, outName);
                if (out.exists()) out.delete();

                // Retrieve audio duration using MediaMetadataRetriever for progress tracking
                long durationMs = 0;
                MediaMetadataRetriever mmr = new MediaMetadataRetriever();
                try {
                    mmr.setDataSource(in.getAbsolutePath());
                    String durStr = mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
                    if (durStr != null) durationMs = Long.parseLong(durStr);
                } catch (Exception ignored) {
                } finally {
                    try { mmr.release(); } catch (Exception ignored) {}
                }

                StringBuilder cmd = new StringBuilder();
                cmd.append("-y -nostdin ");

                int bitrate = params.optInt("bitrate", 192);
                final boolean isSplit = "audio_split_equal".equals(operation) || "split_equal".equals(operation);
                final File splitDir = isSplit ? new File(outputDir, cleanBase + "_parts_" + (System.currentTimeMillis() % 100000)) : null;

                if ("audio_trim".equals(operation) || "trim".equals(operation)) {
                    String start = params.has("start") ? params.optString("start", "00:00:00") : params.optString("start_time", "00:00:00");
                    String end = params.has("end") ? params.optString("end", "00:00:30") : params.optString("end_time", "00:00:30");
                    cmd.append("-ss \"").append(start).append("\" -to \"").append(end).append("\" ")
                       .append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-c:a libmp3lame -b:a 192k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("audio_compress".equals(operation) || "compress".equals(operation)) {
                    String compBitrate = params.optString("bitrate", "96");
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-c:a libmp3lame -b:a ").append(compBitrate).append("k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("audio_normalize".equals(operation) || "normalize".equals(operation)) {
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a libmp3lame -b:a 192k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("audio_boost_volume".equals(operation) || "audio_adjust_volume".equals(operation) || "boost_volume".equals(operation)) {
                    String volume = params.optString("volume", "150%");
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-af \"volume=").append(volume).append("\" -c:a libmp3lame -b:a 192k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("audio_change_speed".equals(operation) || "audio_speed".equals(operation) || "speed".equals(operation)) {
                    double speed = params.optDouble("speed", 1.5);
                    if (speed <= 0) speed = 1.0;
                    double clampedSpeed = Math.max(0.5, Math.min(2.0, speed));
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-af \"atempo=").append(String.format(Locale.US, "%.3f", clampedSpeed)).append("\" ")
                       .append("-c:a libmp3lame -b:a 192k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("audio_merge".equals(operation) || "merge".equals(operation) || "concat".equals(operation)) {
                    if (filesArray != null && filesArray.length() > 1) {
                        File listFile = new File(getContext().getCacheDir(), "audio_concat_" + System.currentTimeMillis() + ".txt");
                        try (FileOutputStream fos = new FileOutputStream(listFile)) {
                            for (int i = 0; i < filesArray.length(); i++) {
                                String fPath = filesArray.getString(i);
                                String line = "file '" + fPath.replace("'", "'\\''") + "'\n";
                                fos.write(line.getBytes(StandardCharsets.UTF_8));
                            }
                        }
                        cmd.append("-f concat -safe 0 -i \"").append(listFile.getAbsolutePath()).append("\" ")
                           .append("-c:a libmp3lame -b:a 192k \"")
                           .append(out.getAbsolutePath()).append("\"");
                    } else {
                        cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -c:a libmp3lame -b:a 192k \"").append(out.getAbsolutePath()).append("\"");
                    }
                } else if ("audio_fade".equals(operation) || "fade".equals(operation)) {
                    int fadeIn = params.optInt("fade_in", 3);
                    int fadeOut = params.optInt("fade_out", 3);
                    double durSec = durationMs > 0 ? (durationMs / 1000.0) : 30.0;
                    double startFadeOut = Math.max(0.0, durSec - fadeOut);
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-af \"afade=t=in:ss=0:d=").append(fadeIn)
                       .append(",afade=t=out:st=").append(String.format(Locale.US, "%.2f", startFadeOut)).append(":d=").append(fadeOut).append("\" ")
                       .append("-c:a libmp3lame -b:a 192k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("audio_reverse".equals(operation) || "reverse".equals(operation)) {
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-af \"areverse\" -c:a libmp3lame -b:a 192k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("audio_channel_convert".equals(operation) || "channel_convert".equals(operation)) {
                    int channels = params.optInt("channels", 1);
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-ac ").append(channels).append(" -c:a libmp3lame -b:a 192k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("audio_resample".equals(operation) || "resample".equals(operation)) {
                    int sampleRate = params.optInt("sample_rate", 44100);
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-ar ").append(sampleRate).append(" \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("audio_remove_silence".equals(operation) || "remove_silence".equals(operation)) {
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-af \"silenceremove=stop_periods=-1:stop_duration=1:stop_threshold=-40dB\" ")
                       .append("-c:a libmp3lame -b:a 192k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if ("audio_invert".equals(operation) || "invert".equals(operation)) {
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-af \"aeval=-val(0)|-val(1):c=same\" -c:a libmp3lame -b:a 192k \"")
                       .append(out.getAbsolutePath()).append("\"");
                } else if (isSplit) {
                    int segmentTime = params.optInt("segment_time", 300);
                    if (splitDir != null) splitDir.mkdirs();
                    String segmentPattern = new File(splitDir, cleanBase + "_part_%03d." + outExt).getAbsolutePath();
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append("-f segment -segment_time ").append(segmentTime).append(" -c copy \"")
                       .append(segmentPattern).append("\"");
                } else {
                    // Universal Audio Convert (transcode)
                    String codec = "-c:a libmp3lame -b:a " + bitrate + "k";
                    if ("wav".equals(outExt)) {
                        codec = "-c:a pcm_s16le";
                    } else if ("flac".equals(outExt)) {
                        codec = "-c:a flac";
                    } else if ("m4a".equals(outExt) || "aac".equals(outExt)) {
                        codec = "-c:a aac -b:a " + bitrate + "k";
                    } else if ("ogg".equals(outExt)) {
                        codec = "-c:a libvorbis -b:a " + bitrate + "k";
                    } else if ("opus".equals(outExt)) {
                        codec = "-c:a libopus -b:a " + bitrate + "k";
                    }
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" ")
                       .append(codec).append(" \"")
                       .append(out.getAbsolutePath()).append("\"");
                }

                final long finalDur = durationMs;
                final File finalOutputDir = outputDir;
                final String finalOutExt = outExt;
                final String finalCleanBase = cleanBase;
                FFmpegKit.executeAsync(
                    cmd.toString(),
                    session -> {
                        if (ReturnCode.isSuccess(session.getReturnCode())) {
                            JSObject res = new JSObject();
                            res.put("success", true);

                            if (isSplit && splitDir != null && splitDir.exists()) {
                                File[] parts = splitDir.listFiles((dir, name) -> name.endsWith("." + finalOutExt));
                                if (parts != null && parts.length > 0) {
                                    File zipOut = new File(finalOutputDir, finalCleanBase + "_split_parts.zip");
                                    try (ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(new FileOutputStream(zipOut)))) {
                                        byte[] buf = new byte[8192];
                                        for (File p : parts) {
                                            ZipEntry entry = new ZipEntry(p.getName());
                                            zos.putNextEntry(entry);
                                            try (FileInputStream fis = new FileInputStream(p)) {
                                                int len;
                                                while ((len = fis.read(buf)) > 0) {
                                                    zos.write(buf, 0, len);
                                                }
                                            }
                                            zos.closeEntry();
                                            p.delete();
                                        }
                                    } catch (Exception ignored) {}
                                    splitDir.delete();
                                    res.put("outputPath", zipOut.getAbsolutePath());
                                    res.put("outputFilename", zipOut.getName());
                                    res.put("sizeBytes", zipOut.length());
                                } else {
                                    res.put("outputPath", out.getAbsolutePath());
                                    res.put("outputFilename", out.getName());
                                    res.put("sizeBytes", out.length());
                                }
                            } else {
                                res.put("outputPath", out.getAbsolutePath());
                                res.put("outputFilename", out.getName());
                                res.put("sizeBytes", out.length());
                            }
                            call.resolve(res);
                        } else {
                            call.reject("Audio operation failed (" + session.getReturnCode() + "): " + session.getFailStackTrace());
                        }
                    },
                    log -> {},
                    statistics -> {
                        if (statistics != null) {
                            double timeMs = statistics.getTime();
                            int pct;
                            if (finalDur > 0) {
                                pct = (int) Math.min(95, Math.max(5, (timeMs / finalDur) * 100));
                            } else {
                                pct = (int) Math.min(95, 10 + (timeMs / 1000) * 5);
                            }
                            JSObject prog = new JSObject();
                            prog.put("percent", pct);
                            notifyListeners("audioProgress", prog);
                        }
                    }
                );
            } catch (Exception e) {
                Log.e(TAG, "processAudioNative error: " + e.getMessage(), e);
                call.reject("Audio operation failed: " + e.getMessage());
            }
        });
    }

    /**
     * Offline Neural OCR powered by Tesseract 5 Native Engine (tesseract4android)
     */
    @PluginMethod
    public void processOcrNative(PluginCall call) {
        executor.execute(() -> {
            TessBaseAPI tess = null;
            try {
                String inputPath = call.getString("inputPath");
                if (inputPath == null || !new File(inputPath).exists()) {
                    call.reject("Input image not found: " + inputPath);
                    return;
                }

                // Ensure tessdata/eng.traineddata is in app files directory
                File filesDir = getContext().getFilesDir();
                File tessDir = new File(filesDir, "tessdata");
                if (!tessDir.exists()) tessDir.mkdirs();
                File trainedData = new File(tessDir, "eng.traineddata");

                if (!trainedData.exists() || trainedData.length() == 0) {
                    try (InputStream is = getContext().getAssets().open("tessdata/eng.traineddata");
                         FileOutputStream fos = new FileOutputStream(trainedData)) {
                        byte[] buffer = new byte[8192];
                        int read;
                        while ((read = is.read(buffer)) != -1) {
                            fos.write(buffer, 0, read);
                        }
                        fos.flush();
                    }
                }

                tess = new TessBaseAPI();
                boolean initialized = tess.init(filesDir.getAbsolutePath(), "eng");
                if (!initialized) {
                    call.reject("Failed to initialize Tesseract neural engine");
                    return;
                }

                Bitmap bitmap = BitmapFactory.decodeFile(inputPath);
                if (bitmap == null) {
                    call.reject("Failed to decode image for OCR");
                    return;
                }

                tess.setImage(bitmap);
                String recognizedText = tess.getUTF8Text();

                // Also save recognized text to a file for seamless workflow chaining
                File outputDir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS);
                if (outputDir == null) outputDir = getContext().getCacheDir();
                String outName = new File(inputPath).getName().replaceFirst("[.][^.]+$", "") + "_ocr.txt";
                File outFile = new File(outputDir, outName);
                try (FileOutputStream fos = new FileOutputStream(outFile)) {
                    fos.write(recognizedText != null ? recognizedText.getBytes(StandardCharsets.UTF_8) : new byte[0]);
                    fos.flush();
                }

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("text", recognizedText != null ? recognizedText : "");
                res.put("characterCount", recognizedText != null ? recognizedText.length() : 0);
                res.put("outputPath", outFile.getAbsolutePath());
                res.put("outputFilename", outFile.getName());
                res.put("sizeBytes", outFile.length());
                call.resolve(res);

            } catch (Exception e) {
                Log.e(TAG, "processOcrNative error: " + e.getMessage(), e);
                call.reject("OCR recognition failed: " + e.getMessage());
            } finally {
                if (tess != null) {
                    try { tess.recycle(); } catch (Exception ignored) {}
                }
            }
        });
    }

    /**
     * Write input file into app cache so native C++ engines (FFmpeg, Tesseract) can read it
     */
    @PluginMethod
    public void writeTempFile(PluginCall call) {
        executor.execute(() -> {
            try {
                String fileName = call.getString("fileName", "ufs_temp_" + System.currentTimeMillis());
                String base64Data = call.getString("base64Data", "");
                File cacheDir = getContext().getCacheDir();
                if (!cacheDir.exists()) cacheDir.mkdirs();

                String cleanName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
                File tempFile = new File(cacheDir, System.currentTimeMillis() + "_" + cleanName);
                if (tempFile.getParentFile() != null && !tempFile.getParentFile().exists()) {
                    tempFile.getParentFile().mkdirs();
                }

                byte[] decoded = (base64Data != null && !base64Data.isEmpty()) ? Base64.decode(base64Data, Base64.DEFAULT) : new byte[0];

                try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                    if (decoded.length > 0) {
                        fos.write(decoded);
                    }
                    fos.flush();
                }

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("path", tempFile.getAbsolutePath());
                res.put("sizeBytes", tempFile.length());
                call.resolve(res);
            } catch (Exception e) {
                Log.e(TAG, "writeTempFile error: " + e.getMessage(), e);
                call.reject("Failed to write temp file: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void appendTempFileChunk(PluginCall call) {
        executor.execute(() -> {
            try {
                String path = call.getString("path");
                String chunkBase64 = call.getString("chunkBase64");
                boolean isFirst = call.getBoolean("isFirst", false);

                if (path == null || chunkBase64 == null) {
                    call.reject("Missing path or chunkBase64");
                    return;
                }

                File file = new File(path);
                if (file.getParentFile() != null && !file.getParentFile().exists()) {
                    file.getParentFile().mkdirs();
                }
                if (isFirst && file.exists()) {
                    file.delete();
                }

                byte[] decoded = Base64.decode(chunkBase64, Base64.DEFAULT);
                try (FileOutputStream fos = new FileOutputStream(file, !isFirst)) {
                    fos.write(decoded);
                    fos.flush();
                }

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("path", file.getAbsolutePath());
                res.put("sizeBytes", file.length());
                call.resolve(res);
            } catch (Exception e) {
                Log.e(TAG, "appendTempFileChunk error: " + e.getMessage(), e);
                call.reject("Failed to append chunk: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void readTempFileBase64(PluginCall call) {
        executor.execute(() -> {
            try {
                String filePath = call.getString("filePath");
                if (filePath == null || !new File(filePath).exists()) {
                    call.reject("File not found: " + filePath);
                    return;
                }

                File file = new File(filePath);
                long len = file.length();
                if (len > 30 * 1024 * 1024) {
                    JSObject res = new JSObject();
                    res.put("success", true);
                    res.put("filePath", file.getAbsolutePath());
                    res.put("isTooLargeForBase64", true);
                    res.put("sizeBytes", len);
                    call.resolve(res);
                    return;
                }

                byte[] bytes = new byte[(int) len];
                try (FileInputStream fis = new FileInputStream(file)) {
                    int offset = 0;
                    int read;
                    while (offset < bytes.length && (read = fis.read(bytes, offset, bytes.length - offset)) >= 0) {
                        offset += read;
                    }
                }

                String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
                JSObject res = new JSObject();
                res.put("success", true);
                res.put("base64Data", base64);
                res.put("sizeBytes", len);
                call.resolve(res);
            } catch (Exception e) {
                Log.e(TAG, "readTempFileBase64 error: " + e.getMessage(), e);
                call.reject("Failed to read file: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void deleteTempFile(PluginCall call) {
        executor.execute(() -> {
            try {
                String filePath = call.getString("filePath");
                if (filePath != null) {
                    File f = new File(filePath);
                    if (f.exists()) f.delete();
                }
                JSObject res = new JSObject();
                res.put("success", true);
                call.resolve(res);
            } catch (Exception e) {
                call.reject("Delete error: " + e.getMessage());
            }
        });
    }

    /**
     * Save processed output or user file to Android Public Downloads directory (/Download/UniversalFileStudio/)
     */
    @PluginMethod
    public void saveToPublicDownloads(PluginCall call) {
        executor.execute(() -> {
            try {
                String fileName = call.getString("fileName");
                String base64Data = call.getString("base64Data");
                String tempFilePath = call.getString("tempFilePath");

                if (fileName == null || fileName.trim().isEmpty()) {
                    fileName = "file_" + System.currentTimeMillis();
                }

                fileName = fileName.replaceAll("[\\\\/:*?\"<>|]", "_");

                Context context = getContext();
                byte[] data = null;

                if (tempFilePath != null && !tempFilePath.isEmpty()) {
                    File tempFile = new File(tempFilePath);
                    if (tempFile.exists()) {
                        long len = tempFile.length();
                        data = new byte[(int) len];
                        try (FileInputStream fis = new FileInputStream(tempFile)) {
                            int offset = 0;
                            int read;
                            while (offset < data.length && (read = fis.read(data, offset, data.length - offset)) >= 0) {
                                offset += read;
                            }
                        }
                    }
                }

                if (data == null && base64Data != null && !base64Data.isEmpty()) {
                    int commaIdx = base64Data.indexOf(',');
                    if (commaIdx >= 0) {
                        base64Data = base64Data.substring(commaIdx + 1);
                    }
                    data = Base64.decode(base64Data, Base64.DEFAULT);
                }

                if (data == null || data.length == 0) {
                    call.reject("No valid data provided to save file");
                    return;
                }

                String ext = "";
                int dotIdx = fileName.lastIndexOf('.');
                if (dotIdx >= 0) {
                    ext = fileName.substring(dotIdx + 1).toLowerCase(Locale.ROOT);
                }
                String mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
                if (mimeType == null) {
                    mimeType = "application/octet-stream";
                }

                String savedFilePath = "";
                String displayPath = "Downloads/" + fileName;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentResolver resolver = context.getContentResolver();
                    ContentValues contentValues = new ContentValues();
                    contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                    contentValues.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                    contentValues.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/UniversalFileStudio");
                    contentValues.put(MediaStore.MediaColumns.IS_PENDING, 1);

                    Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues);
                    if (uri != null) {
                        try (OutputStream os = resolver.openOutputStream(uri)) {
                            if (os != null) {
                                os.write(data);
                                os.flush();
                            }
                        }
                        contentValues.clear();
                        contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0);
                        resolver.update(uri, contentValues, null, null);
                        displayPath = "Downloads/UniversalFileStudio/" + fileName;
                        savedFilePath = uri.toString();
                    }
                }

                File pubDownloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File ufsFolder = new File(pubDownloads, "UniversalFileStudio");
                if (!ufsFolder.exists()) ufsFolder.mkdirs();
                File targetFile = new File(ufsFolder, fileName);
                try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                    fos.write(data);
                    fos.flush();
                }
                savedFilePath = targetFile.getAbsolutePath();
                displayPath = "Downloads/UniversalFileStudio/" + fileName;

                try {
                    android.media.MediaScannerConnection.scanFile(
                        context,
                        new String[]{targetFile.getAbsolutePath()},
                        new String[]{mimeType},
                        null
                    );
                } catch (Exception ignored) {}

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("filePath", savedFilePath);
                res.put("displayPath", displayPath);
                res.put("sizeBytes", data.length);
                call.resolve(res);
            } catch (Exception e) {
                Log.e(TAG, "saveToPublicDownloads error: " + e.getMessage(), e);
                call.reject("Failed to save to downloads: " + e.getMessage());
            }
        });
    }

    private File resolveFile(Context context, String path) {
        if (path == null || path.isEmpty()) return null;

        if (path.startsWith("mobile://")) path = path.substring(9);
        if (path.startsWith("file://")) path = path.substring(7);

        File f = new File(path);
        if (f.exists() && f.isFile()) return f;

        File pubDownloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        File f1 = new File(pubDownloads, path);
        if (f1.exists() && f1.isFile()) return f1;

        File ufs = new File(pubDownloads, "UniversalFileStudio");
        File f2 = new File(ufs, path);
        if (f2.exists() && f2.isFile()) return f2;
        File f2b = new File(ufs, new File(path).getName());
        if (f2b.exists() && f2b.isFile()) return f2b;

        File extDownloads = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (extDownloads != null) {
            File f3 = new File(extDownloads, path);
            if (f3.exists() && f3.isFile()) return f3;
            File f3b = new File(extDownloads, new File(path).getName());
            if (f3b.exists() && f3b.isFile()) return f3b;
        }

        File cacheDir = context.getExternalCacheDir() != null ? context.getExternalCacheDir() : context.getCacheDir();
        File f4 = new File(cacheDir, path);
        if (f4.exists() && f4.isFile()) return f4;
        File f4b = new File(cacheDir, new File(path).getName());
        if (f4b.exists() && f4b.isFile()) return f4b;

        File f5 = new File(context.getFilesDir(), path);
        if (f5.exists() && f5.isFile()) return f5;
        File f5b = new File(context.getFilesDir(), new File(path).getName());
        if (f5b.exists() && f5b.isFile()) return f5b;

        return null;
    }

    private String resolveMimeType(File file, String overrideMime) {
        if (overrideMime != null && !overrideMime.isEmpty() && !"*/*".equals(overrideMime)) {
            return overrideMime;
        }
        String name = file.getName().toLowerCase(Locale.ROOT);
        int dot = name.lastIndexOf('.');
        if (dot >= 0) {
            String ext = name.substring(dot + 1);
            String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
            if (mime != null) return mime;
            if ("pdf".equals(ext)) return "application/pdf";
            if ("webp".equals(ext)) return "image/webp";
            if ("png".equals(ext)) return "image/png";
            if ("jpg".equals(ext) || "jpeg".equals(ext)) return "image/jpeg";
            if ("gif".equals(ext)) return "image/gif";
            if ("svg".equals(ext)) return "image/svg+xml";
            if ("mp4".equals(ext)) return "video/mp4";
            if ("webm".equals(ext)) return "video/webm";
            if ("mkv".equals(ext)) return "video/x-matroska";
            if ("mp3".equals(ext)) return "audio/mpeg";
            if ("wav".equals(ext)) return "audio/wav";
            if ("aac".equals(ext)) return "audio/aac";
            if ("flac".equals(ext)) return "audio/flac";
            if ("zip".equals(ext)) return "application/zip";
            if ("txt".equals(ext)) return "text/plain";
            if ("html".equals(ext)) return "text/html";
            if ("csv".equals(ext)) return "text/csv";
            if ("json".equals(ext)) return "application/json";
        }
        return "*/*";
    }

    /**
     * Open a file with the system default viewer app
     */
    @PluginMethod
    public void openFileNative(PluginCall call) {
        try {
            String filePath = call.getString("filePath");
            String base64Data = call.getString("base64Data");
            String fileName = call.getString("fileName", "document");

            Context context = getContext();
            File file = resolveFile(context, filePath);

            if (file == null && base64Data != null && !base64Data.isEmpty()) {
                int commaIdx = base64Data.indexOf(',');
                if (commaIdx >= 0) base64Data = base64Data.substring(commaIdx + 1);
                byte[] data = Base64.decode(base64Data, Base64.DEFAULT);
                File cacheDir = context.getExternalCacheDir() != null ? context.getExternalCacheDir() : context.getCacheDir();
                file = new File(cacheDir, fileName);
                try (FileOutputStream fos = new FileOutputStream(file)) {
                    fos.write(data);
                    fos.flush();
                }
            }

            if (file == null || !file.exists()) {
                call.reject("File does not exist: " + filePath);
                return;
            }

            String mimeType = resolveMimeType(file, call.getString("mimeType"));

            Uri uri = FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                file
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, mimeType);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Intent chooser = Intent.createChooser(intent, "Open file with...");
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            PackageManager pm = context.getPackageManager();
            List<ResolveInfo> resInfoList = pm.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
            for (ResolveInfo resolveInfo : resInfoList) {
                String packageName = resolveInfo.activityInfo.packageName;
                context.grantUriPermission(packageName, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }

            context.startActivity(chooser);

            JSObject res = new JSObject();
            res.put("success", true);
            res.put("resolvedPath", file.getAbsolutePath());
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "openFileNative error: " + e.getMessage(), e);
            call.reject("Unable to open file: " + e.getMessage());
        }
    }

    /**
     * Share file via Android system share sheet (WhatsApp, Gmail, Drive, etc.)
     */
    @PluginMethod
    public void shareFileNative(PluginCall call) {
        try {
            String filePath = call.getString("filePath");
            String title = call.getString("title", "Share File");
            Context context = getContext();
            File file = resolveFile(context, filePath);

            if (file == null || !file.exists()) {
                call.reject("File does not exist: " + filePath);
                return;
            }

            String mimeType = resolveMimeType(file, null);

            Uri uri = FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                file
            );

            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType(mimeType);
            intent.putExtra(Intent.EXTRA_STREAM, uri);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Intent chooser = Intent.createChooser(intent, title);
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            PackageManager pm = context.getPackageManager();
            List<ResolveInfo> resInfoList = pm.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
            for (ResolveInfo resolveInfo : resInfoList) {
                String packageName = resolveInfo.activityInfo.packageName;
                context.grantUriPermission(packageName, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }

            context.startActivity(chooser);

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "shareFileNative error: " + e.getMessage(), e);
            call.reject("Unable to share file: " + e.getMessage());
        }
    }
}

