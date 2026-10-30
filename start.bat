@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   Universal File Studio - Windows Native Launcher
echo   Local-First, Privacy-Focused File Processing Engine
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Check Python installation
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.10+ from https://www.python.org/ or run via Docker.
    pause
    exit /b 1
)

:: 2. Check or create virtual environment
if not exist ".venv\Scripts\activate.bat" (
    echo [1/3] Creating virtual environment (.venv)...
    python -m venv .venv
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    call .venv\Scripts\activate.bat
    echo [2/3] Installing backend dependencies...
    python -m pip install --upgrade pip
    pip install -r backend\requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

:: 3. Create storage directories if missing
if not exist "storage\uploads" mkdir "storage\uploads"
if not exist "storage\outputs" mkdir "storage\outputs"
if not exist "storage\temp" mkdir "storage\temp"
if not exist "storage\thumbnails" mkdir "storage\thumbnails"

:: 4. Find Local IP for mobile connection
for /f "tokens=4" %%a in ('route print ^| find " 0.0.0.0"') do (
    set LOCAL_IP=%%a
    goto :ip_found
)
:ip_found
if "%LOCAL_IP%"=="" set LOCAL_IP=127.0.0.1

echo.
echo ========================================================
echo   Universal File Studio is running!
echo   - Local PC Access:     http://localhost:8000
echo   - Mobile / LAN Access: http://%LOCAL_IP%:8000
echo ========================================================
echo.

set PYTHONPATH=backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause

