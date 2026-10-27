@echo off
title Frame Production - Server Launcher
echo ========================================================
echo        FRAME PRODUCTION - SYSTEM LAUNCHER
echo ========================================================
echo.
echo [1/2] Starting Central Backend Server (Port 5000)...
start "Frame Production Backend" cmd /k "cd /d %~dp0server && npm start"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Admin Web Dashboard (Port 3000)...
start "Frame Production Web Dashboard" cmd /k "cd /d %~dp0client-web && npm run preview -- --port 3000 --host"

echo.
echo ========================================================
echo Services launched successfully!
echo Backend API:     http://localhost:5000/api/health
echo Admin Dashboard: http://localhost:3000
echo Desktop App:     %~dp0client-desktop\release\Frame Production Setup 1.0.0.exe
echo ========================================================
pause
