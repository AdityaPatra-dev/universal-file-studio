package com.universalfilestudio.app.plugins;

import android.content.Context;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.provider.MediaStore;
import android.webkit.MimeTypeMap;
import androidx.core.content.FileProvider;
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

                // 1. Resize / Scale
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

                // 2. Rotate / Flip
                if (params.has("rotate") || params.optBoolean("flipH", false) || params.optBoolean("flipV", false)) {
                    Matrix matrix = new Matrix();
                    if (params.has("rotate")) {
                        matrix.postRotate((float) params.optDouble("rotate", 0));
                    }
                    float sx = params.optBoolean("flipH", false) ? -1f : 1f;
                    float sy = params.optBoolean("flipV", false) ? -1f : 1f;
                    if (sx != 1f || sy != 1f) {
                        matrix.postScale(sx, sy);
                    }
                    bitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
                }

                // 3. Color Filters (Grayscale, Invert)
                if ("grayscale".equals(operation) || params.optBoolean("grayscale", false)) {
                    Bitmap grayBitmap = Bitmap.createBitmap(bitmap.getWidth(), bitmap.getHeight(), Bitmap.Config.ARGB_8888);
                    Canvas canvas = new Canvas(grayBitmap);
                    Paint paint = new Paint();
                    ColorMatrix cm = new ColorMatrix();
                    cm.setSaturation(0);
                    paint.setColorFilter(new ColorMatrixColorFilter(cm));
                    canvas.drawBitmap(bitmap, 0, 0, paint);
                    bitmap = grayBitmap;
                }

                // 4. Output Format & Quality
                String formatStr = params.optString("format", "webp").toLowerCase();
                int quality = params.optInt("quality", 85);
                Bitmap.CompressFormat compressFormat = Bitmap.CompressFormat.JPEG;
                String ext = "jpg";

                if (formatStr.contains("png")) {
                    compressFormat = Bitmap.CompressFormat.PNG;
                    ext = "png";
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
            try {
                String inputPath = call.getString("inputPath");
                long timeSec = call.getInt("timeSeconds", 1);

                if (inputPath == null || !new File(inputPath).exists()) {
                    call.reject("Video file does not exist: " + inputPath);
                    return;
                }

                MediaMetadataRetriever retriever = new MediaMetadataRetriever();
                retriever.setDataSource(inputPath);

                long timeMicros = timeSec * 1000000L;
                Bitmap frame = retriever.getFrameAtTime(timeMicros, MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
                retriever.release();

                if (frame == null) {
                    call.reject("Failed to retrieve video frame at " + timeSec + "s");
                    return;
                }

                File outputDir = getContext().getExternalFilesDir(Environment.DIRECTORY_PICTURES);
                if (outputDir == null) outputDir = getContext().getCacheDir();

                String outName = new File(inputPath).getName().replaceFirst("[.][^.]+$", "") + "_frame_" + timeSec + "s.jpg";
                File outFile = new File(outputDir, outName);

                try (FileOutputStream fos = new FileOutputStream(outFile)) {
                    frame.compress(Bitmap.CompressFormat.JPEG, 90, fos);
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

                if (inputPath == null || !new File(inputPath).exists()) {
                    call.reject("Input video not found: " + inputPath);
                    return;
                }

                File in = new File(inputPath);
                File outputDir = getContext().getExternalFilesDir(Environment.DIRECTORY_MOVIES);
                if (outputDir == null) outputDir = getContext().getCacheDir();

                String outExt = params.optString("format", "mp4").toLowerCase();
                String outName = in.getName().replaceFirst("[.][^.]+$", "") + "_" + operation + "_" + UUID.randomUUID().toString().substring(0, 6) + "." + outExt;
                File out = new File(outputDir, outName);

                StringBuilder cmd = new StringBuilder();
                if ("video_trim".equals(operation) || "trim".equals(operation)) {
                    double start = params.optDouble("start_time", 0.0);
                    double end = params.optDouble("end_time", 10.0);
                    cmd.append("-ss ").append(start).append(" -to ").append(end).append(" -i \"").append(in.getAbsolutePath()).append("\" -c copy \"").append(out.getAbsolutePath()).append("\"");
                } else if ("extract_audio".equals(operation)) {
                    String audioFmt = params.optString("format", "mp3").toLowerCase();
                    outName = in.getName().replaceFirst("[.][^.]+$", "") + "." + audioFmt;
                    out = new File(outputDir, outName);
                    if ("wav".equals(audioFmt)) {
                        cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -vn -acodec pcm_s16le \"").append(out.getAbsolutePath()).append("\"");
                    } else if ("aac".equals(audioFmt) || "m4a".equals(audioFmt)) {
                        cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -vn -c:a aac -b:a 192k \"").append(out.getAbsolutePath()).append("\"");
                    } else {
                        cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -vn -c:a libmp3lame -q:a 2 \"").append(out.getAbsolutePath()).append("\"");
                    }
                } else if ("remove_audio".equals(operation) || "mute".equals(operation)) {
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -an -c:v copy \"").append(out.getAbsolutePath()).append("\"");
                } else if ("compress_video".equals(operation) || "video_compress".equals(operation)) {
                    int crf = params.optInt("crf", 28);
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -vcodec libx264 -crf ").append(crf).append(" -preset fast -c:a aac \"").append(out.getAbsolutePath()).append("\"");
                } else if ("gif".equals(outExt)) {
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -vf \"fps=12,scale=480:-1:flags=lanczos\" \"").append(out.getAbsolutePath()).append("\"");
                } else {
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -c:v libx264 -preset fast -c:a aac \"").append(out.getAbsolutePath()).append("\"");
                }

                FFmpegSession session = FFmpegKit.execute(cmd.toString());
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

                if (inputPath == null || !new File(inputPath).exists()) {
                    call.reject("Input audio not found: " + inputPath);
                    return;
                }

                File in = new File(inputPath);
                File outputDir = getContext().getExternalFilesDir(Environment.DIRECTORY_MUSIC);
                if (outputDir == null) outputDir = getContext().getCacheDir();

                String outExt = params.optString("format", "mp3").toLowerCase();
                String outName = in.getName().replaceFirst("[.][^.]+$", "") + "_" + operation + "_" + UUID.randomUUID().toString().substring(0, 6) + "." + outExt;
                File out = new File(outputDir, outName);

                StringBuilder cmd = new StringBuilder();
                if ("audio_normalize".equals(operation)) {
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" -af loudnorm \"").append(out.getAbsolutePath()).append("\"");
                } else {
                    cmd.append("-i \"").append(in.getAbsolutePath()).append("\" \"").append(out.getAbsolutePath()).append("\"");
                }

                FFmpegSession session = FFmpegKit.execute(cmd.toString());
                if (ReturnCode.isSuccess(session.getReturnCode())) {
                    JSObject res = new JSObject();
                    res.put("success", true);
                    res.put("outputPath", out.getAbsolutePath());
                    res.put("outputFilename", out.getName());
                    res.put("sizeBytes", out.length());
                    call.resolve(res);
                } else {
                    call.reject("Audio operation failed (" + session.getReturnCode() + "): " + session.getFailStackTrace());
                }
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
                String base64Data = call.getString("base64Data");
                if (base64Data == null) {
                    call.reject("Missing base64Data parameter");
                    return;
                }

                File cacheDir = getContext().getCacheDir();
                File tempFile = new File(cacheDir, System.currentTimeMillis() + "_" + fileName);
                byte[] decoded = Base64.decode(base64Data, Base64.DEFAULT);

                try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                    fos.write(decoded);
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

    /**
     * Open a file with the system default viewer app
     */
    @PluginMethod
    public void openFileNative(PluginCall call) {
        try {
            String filePath = call.getString("filePath");
            if (filePath == null || filePath.isEmpty()) {
                call.reject("Missing filePath");
                return;
            }

            Context context = getContext();
            Uri uri;
            String mimeType = call.getString("mimeType");

            if (filePath.startsWith("content://")) {
                uri = Uri.parse(filePath);
            } else {
                File file = new File(filePath);
                if (!file.exists()) {
                    call.reject("File does not exist: " + filePath);
                    return;
                }
                uri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    file
                );
                if (mimeType == null || mimeType.isEmpty()) {
                    String ext = MimeTypeMap.getFileExtensionFromUrl(file.getName());
                    if (ext != null && !ext.isEmpty()) {
                        mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext.toLowerCase(Locale.ROOT));
                    }
                }
            }

            if (mimeType == null || mimeType.isEmpty()) {
                mimeType = "*/*";
            }

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, mimeType);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(Intent.createChooser(intent, "Open file with..."));

            JSObject res = new JSObject();
            res.put("success", true);
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
            if (filePath == null || filePath.isEmpty()) {
                call.reject("Missing filePath");
                return;
            }

            Context context = getContext();
            File file = new File(filePath);
            if (!file.exists()) {
                call.reject("File does not exist: " + filePath);
                return;
            }

            Uri uri = FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                file
            );

            String ext = MimeTypeMap.getFileExtensionFromUrl(file.getName());
            String mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext.toLowerCase(Locale.ROOT));
            if (mimeType == null) mimeType = "*/*";

            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType(mimeType);
            intent.putExtra(Intent.EXTRA_STREAM, uri);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Intent chooser = Intent.createChooser(intent, title);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
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

