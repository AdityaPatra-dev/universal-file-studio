#!/usr/bin/env bash
set -e

# ==============================================================================
# Universal File Studio - Android APK Build Script
# Builds the standalone mobile Android APK (.apk) with on-device engines
# ==============================================================================

echo "======================================================================"
echo "  Universal File Studio - Android APK Builder"
echo "======================================================================"

# 1. Detect Android SDK
if [ -z "$ANDROID_HOME" ]; then
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
    elif [ -d "$HOME/android-sdk" ]; then
        export ANDROID_HOME="$HOME/android-sdk"
    elif [ -d "/opt/android-sdk" ]; then
        export ANDROID_HOME="/opt/android-sdk"
    else
        echo "Error: ANDROID_HOME is not set and standard Android SDK directories were not found."
        echo "Please set ANDROID_HOME to your Android SDK directory."
        exit 1
    fi
fi

echo "✓ Android SDK: $ANDROID_HOME"

# 2. Add platform-tools to PATH if available
if [ -d "$ANDROID_HOME/platform-tools" ]; then
    export PATH="$ANDROID_HOME/platform-tools:$PATH"
fi

# 3. Build Vite Frontend Assets
echo "--> Building modern mobile frontend..."
cd "$(dirname "$0")/frontend"
npm run build

# 4. Sync Capacitor Android Platform
echo "--> Syncing assets to native Android platform..."
npx cap sync android

# 5. Build Native Android Debug APK
echo "--> Compiling standalone Android APK with Gradle..."
cd android
./gradlew assembleDebug

# 6. Copy output APK to workspace root
OUTPUT_APK="app/build/outputs/apk/debug/app-debug.apk"
ROOT_APK="../../universal-file-studio.apk"

if [ -f "$OUTPUT_APK" ]; then
    cp "$OUTPUT_APK" "$ROOT_APK"
    APK_SIZE=$(ls -lh "$ROOT_APK" | awk '{print $5}')
    echo "======================================================================"
    echo "  BUILD SUCCESSFUL!"
    echo "  Standalone APK: universal-file-studio.apk ($APK_SIZE)"
    echo "======================================================================"
    echo ""
    echo "To install on your phone or connected emulator:"
    echo "  adb install -r universal-file-studio.apk"
    echo ""
    echo "To launch the app:"
    echo "  adb shell monkey -p com.universalfilestudio.app -c android.intent.category.LAUNCHER 1"
    echo "======================================================================"
else
    echo "Error: APK compilation finished but output file not found at $OUTPUT_APK"
    exit 1
fi

