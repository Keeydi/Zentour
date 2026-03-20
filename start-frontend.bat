@echo off
title Zentour - Expo (Frontend)
cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found. Run this script from the Zentour project root.
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
echo Starting Expo frontend...
echo.
call npm start
pause
