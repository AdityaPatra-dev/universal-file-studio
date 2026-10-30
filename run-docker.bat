@echo off
setlocal enabledelayedexpansion

echo ==========================================================
echo   Universal File Studio - Docker Launcher (Windows)
echo ==========================================================
echo.

cd /d "%~dp0"

where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker Desktop is not installed or not running.
    echo Please install Docker Desktop for Windows or run start.bat for native mode.
    pause
    exit /b 1
)

if not exist "storage\uploads" mkdir "storage\uploads"
if not exist "storage\outputs" mkdir "storage\outputs"
if not exist "storage\temp" mkdir "storage\temp"
if not exist "storage\thumbnails" mkdir "storage\thumbnails"

echo [1/2] Building and launching Universal File Studio container...
docker compose up --build -d
if %ERRORLEVEL% neq 0 (
    echo Retrying with legacy docker-compose...
    docker-compose up --build -d
)

for /f "tokens=4" %%a in ('route print ^| find " 0.0.0.0"') do (
    set LOCAL_IP=%%a
    goto :ip_found
)
:ip_found
if "%LOCAL_IP%"=="" set LOCAL_IP=localhost

echo.
echo ==========================================================
echo   Universal File Studio is up and running in Docker!
echo   - Local PC Access:     http://localhost:8000
echo   - Mobile / LAN Access: http://%LOCAL_IP%:8000
echo ==========================================================
echo.
echo Opening browser...
start http://localhost:8000

echo To stop the container, run: docker compose down
pause

