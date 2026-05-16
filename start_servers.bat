@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo Reading .env configuration...
set "ENV_FILE=backend\.env"

if not exist "%ENV_FILE%" (
    echo .env file not found at %ENV_FILE%
    pause
    exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
    set "key=%%A"
    set "val=%%B"
    if not "!key:~0,1!"=="#" if not "!key!"=="" (
        set "!key!=!val!"
    )
)

if "%HOST%"=="" set HOST=127.0.0.1
if "%BACKEND_PORT%"=="" set BACKEND_PORT=8000
if "%FRONTEND_PORT%"=="" set FRONTEND_PORT=3000
if "%API_BASE_URL%"=="" set API_BASE_URL=http://%HOST%:%BACKEND_PORT%

echo Generating frontend config.js...
if not exist "frontend\js" mkdir "frontend\js"
echo const API_BASE_URL = '%API_BASE_URL%'; > frontend\js\config.js

echo.
echo ========================================================
echo Starting Twinsure Services...
echo Backend API : http://%HOST%:%BACKEND_PORT%
echo Frontend UI : http://%HOST%:%FRONTEND_PORT%
echo Database    : %MONGODB_DATABASE%
echo ========================================================
echo.

echo Starting Backend Server...
start "Twinsure Backend (PHP)" cmd /c "title Backend API && cd backend\api && php -S %HOST%:%BACKEND_PORT%"

echo Starting Frontend Server...
start "Twinsure Frontend (PHP)" cmd /c "title Frontend UI && cd frontend && php -S %HOST%:%FRONTEND_PORT%"

echo Servers have been launched in new command windows.
echo Close this window to keep them running, or close the new windows to stop them.
pause
