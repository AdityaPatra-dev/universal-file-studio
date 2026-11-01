package com.universalfilestudio.app.plugins;

import android.content.Context;
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
}

