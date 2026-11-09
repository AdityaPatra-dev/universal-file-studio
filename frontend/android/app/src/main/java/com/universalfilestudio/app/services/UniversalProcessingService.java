package com.universalfilestudio.app.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.universalfilestudio.app.MainActivity;

/**
 * UniversalProcessingService
 *
 * Android Foreground Service with Partial WakeLock to prevent Doze Mode
 * and Low Memory Killer (LMK) from killing heavy native jobs (FFmpeg, OCR, etc.)
 * when the app goes into the background or the screen locks.
 */
public class UniversalProcessingService extends Service {
    private static final String TAG = "UFS_ProcessingService";
    private static final String CHANNEL_ID = "ufs_processing_channel";
    private static final int NOTIFICATION_ID = 90210;

    public static final String ACTION_START = "com.universalfilestudio.app.action.START_PROCESSING";
    public static final String ACTION_UPDATE = "com.universalfilestudio.app.action.UPDATE_PROCESSING";
    public static final String ACTION_STOP = "com.universalfilestudio.app.action.STOP_PROCESSING";

    public static final String EXTRA_TITLE = "extra_title";
    public static final String EXTRA_PROGRESS = "extra_progress";

    private PowerManager.WakeLock wakeLock;
    private NotificationManager notificationManager;
    private String currentTitle = "Processing media...";
    private int currentProgress = 0;

    public static void start(Context context, String title) {
        if (context == null) return;
        try {
            Intent intent = new Intent(context, UniversalProcessingService.class);
            intent.setAction(ACTION_START);
            intent.putExtra(EXTRA_TITLE, title);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
        } catch (Throwable e) {
            Log.w(TAG, "Failed to start foreground service: " + e.getMessage());
        }
    }

    public static void updateProgress(Context context, String title, int percent) {
        if (context == null) return;
        try {
            Intent intent = new Intent(context, UniversalProcessingService.class);
            intent.setAction(ACTION_UPDATE);
            intent.putExtra(EXTRA_TITLE, title);
            intent.putExtra(EXTRA_PROGRESS, percent);
            context.startService(intent);
        } catch (Throwable ignored) {}
    }

    public static void stop(Context context) {
        if (context == null) return;
        try {
            Intent intent = new Intent(context, UniversalProcessingService.class);
            intent.setAction(ACTION_STOP);
            context.startService(intent);
        } catch (Throwable ignored) {}
    }

    @Override
    public void onCreate() {
        super.onCreate();
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
        acquireWakeLock();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_STOP.equals(action)) {
            releaseWakeLock();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        if (intent.hasExtra(EXTRA_TITLE)) {
            currentTitle = intent.getStringExtra(EXTRA_TITLE);
        }
        if (intent.hasExtra(EXTRA_PROGRESS)) {
            currentProgress = intent.getIntExtra(EXTRA_PROGRESS, currentProgress);
        }

        Notification notification = buildNotification(currentTitle, currentProgress);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                int serviceType = 0;
                if (Build.VERSION.SDK_INT >= 34 /* UPSIDE_DOWN_CAKE */) {
                    serviceType = 0x00000400 /* FOREGROUND_SERVICE_TYPE_MEDIA_PROCESSING */ | 0x00000001 /* FOREGROUND_SERVICE_TYPE_DATA_SYNC */;
                } else {
                    serviceType = 0x00000001 /* FOREGROUND_SERVICE_TYPE_DATA_SYNC */;
                }
                startForeground(NOTIFICATION_ID, notification, serviceType);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Throwable e) {
            Log.w(TAG, "startForeground error: " + e.getMessage());
            try {
                startForeground(NOTIFICATION_ID, notification);
            } catch (Throwable ignored) {}
        }

        return START_NOT_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        releaseWakeLock();
        super.onDestroy();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && notificationManager != null) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Media Processing Engine",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Background media processing and encoding progress");
            channel.enableVibration(false);
            channel.setSound(null, null);
            channel.setShowBadge(false);
            notificationManager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification(String title, int progress) {
        Intent notifyIntent = new Intent(this, MainActivity.class);
        notifyIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notifyIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title != null ? title : "Universal File Studio")
                .setContentText(progress > 0 ? "Processing: " + progress + "%" : "Processing media...")
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setContentIntent(pendingIntent);

        if (progress > 0 && progress < 100) {
            builder.setProgress(100, progress, false);
        } else {
            builder.setProgress(100, 0, true);
        }

        return builder.build();
    }

    private void acquireWakeLock() {
        try {
            if (wakeLock == null) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "UniversalFileStudio:ProcessingWakeLock");
                    wakeLock.acquire(45 * 60 * 1000L /* 45 minutes max timeout */);
                }
            }
        } catch (Throwable e) {
            Log.w(TAG, "Failed to acquire WakeLock: " + e.getMessage());
        }
    }

    private void releaseWakeLock() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Throwable ignored) {}
        wakeLock = null;
    }
}

