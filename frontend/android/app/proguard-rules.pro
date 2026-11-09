# Project specific ProGuard rules

-keep class com.arthenica.ffmpegkit.** { *; }
-dontwarn com.arthenica.ffmpegkit.**

-keep class com.googlecode.tesseract.android.** { *; }
-dontwarn com.googlecode.tesseract.android.**

-keep public class com.universalfilestudio.app.plugins.** { *; }
-keepclassmembers class com.universalfilestudio.app.plugins.** {
    @com.getcapacitor.PluginMethod public *;
}

-keep class com.tom_roush.pdfbox.** { *; }
-dontwarn com.tom_roush.pdfbox.**

-keep class org.apache.commons.compress.** { *; }
-dontwarn org.apache.commons.compress.**

-keep class org.tukaani.xz.** { *; }
-dontwarn org.tukaani.xz.**

