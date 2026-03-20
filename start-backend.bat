@echo off
title Zentour - API Server (Backend)
cd /d "%~dp0server"

if not exist "package.json" (
  echo ERROR: server\package.json not found. Run this script from the Zentour project root.
  pause
  exit /b 1
)

echo Installing / updating dependencies...
call npm install
if errorlevel 1 (
  echo.
  echo npm install failed.
  pause
  exit /b 1
)

echo.
echo Starting backend server...
echo Ensure MySQL is running and server\.env is configured.
echo.
call npm start
pause
