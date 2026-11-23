@echo off
title Employee Payroll System Launcher
echo ===================================================
echo   Employee Payroll Management System Launcher
echo ===================================================
echo.

echo [1/2] Launching Flask Backend on http://127.0.0.1:5000 ...
start "Payroll Backend (Flask)" cmd /k "cd backend && python app.py"

echo [2/2] Launching React Frontend on http://127.0.0.1:3000 ...
start "Payroll Frontend (React)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Both servers are starting in separate windows!
echo Open your browser at: http://localhost:3000
echo ===================================================
echo.
pause