@echo off
REM Miroir Standalone App Electron - Development Startup Script for Windows

echo Starting Miroir Standalone App Electron in Development Mode...
echo ==================================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: This script must be run from the miroir-standalone-app-electron package directory
    pause
    exit /b 1
)

REM Check if miroir-standalone-app dev server is running
REM echo Checking if miroir-standalone-app dev server is running...
REM powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 2 | Out-Null; Write-Host '✓ Dev server is running on http://localhost:5173' } catch { Write-Host '✗ Dev server is not running!'; Write-Host 'Please start the miroir-standalone-app dev server first:'; Write-Host '  cd ..\miroir-standalone-app'; Write-Host '  npm run dev'; Write-Host ''; Write-Host 'Then run this script again.'; exit 1 }"
REM 
REM if %ERRORLEVEL% neq 0 (
REM     pause
REM     exit /b 1
REM )

REM Build and run Electron
echo Building Electron application...
call npm run build-electron

if %ERRORLEVEL% equ 0 (
    echo ✓ Build successful, starting Electron...
    call npm run electron-dev
) else (
    echo ✗ Build failed
    pause
    exit /b 1
)
