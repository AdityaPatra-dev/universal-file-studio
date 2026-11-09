@echo off
REM ==============================================================================
REM Universal File Studio - Android APK Build Script (Windows)
REM Builds the standalone mobile Android APK (.apk) with on-device engines
REM ==============================================================================

echo ======================================================================
echo   Universal File Studio - Android APK Builder (Windows)
echo ======================================================================

IF "%ANDROID_HOME%"=="" (
    IF EXIST "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    ) ELSE (
        echo Error: ANDROID_HOME is not set. Please install Android Studio or set ANDROID_HOME.
        pause
        exit /b 1
    )
)

echo Android SDK found at: %ANDROID_HOME%

cd /d "%~dp0frontend"
echo [1/3] Building frontend assets...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Error: Frontend build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/3] Syncing Capacitor Android assets...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo Error: Capacitor sync failed.
    pause
    exit /b %ERRORLEVEL%
)

echo [3/3] Compiling Android APK with Gradle...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo Error: Gradle build failed.
    pause
    exit /b %ERRORLEVEL%
)

cd /d "%~dp0"
if exist "frontend\android\app\build\outputs\apk\debug\app-universal-debug.apk" (
    copy /y "frontend\android\app\build\outputs\apk\debug\app-universal-debug.apk" "universal-file-studio.apk"
) else (
    copy /y "frontend\android\app\build\outputs\apk\debug\app-debug.apk" "universal-file-studio.apk"
)

echo ======================================================================
echo   BUILD SUCCESSFUL!
echo   Standalone APK created: universal-file-studio.apk
echo ======================================================================
echo To install on your connected phone or emulator:
echo   adb install -r universal-file-studio.apk
echo ======================================================================
pause

