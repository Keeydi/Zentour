@echo off
title Zentour - Start Frontend + Backend
cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: package.json not found.
  pause
  exit /b 1
)
if not exist "server\package.json" (
  echo ERROR: server\package.json not found.
  pause
  exit /b 1
)

echo Opening two windows: Backend, then Frontend...
echo Each window runs npm install, then starts.
echo.

start "Zentour Backend" /D "%~dp0server" cmd /k "echo Backend - npm install... && npm install && echo. && echo Backend API && npm start"

timeout /t 2 /nobreak >nul

start "Zentour Frontend" /D "%~dp0" cmd /k "echo Frontend - npm install... && npm install && echo. && echo Expo Frontend && npm start"

echo.
echo Backend and Frontend launched in separate windows.
echo You can close this window.
timeout /t 3 >nul
