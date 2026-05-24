@echo off
title JARVIS Launcher
echo ===================================================
echo             Starting JARVIS...
echo ===================================================

echo [1/3] Starting Frontend Web Interface...
start "JARVIS Frontend" cmd /k "cd frontend && npm run dev"

echo [2/3] Activating Python Virtual Environment...
call .\venv\Scripts\activate.bat

echo [3/3] Starting Backend Server...
:: Ensure faster-whisper is installed inside the venv just in case
pip install faster-whisper -q
python server.py

pause
