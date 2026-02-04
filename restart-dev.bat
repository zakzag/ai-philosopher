@echo off
echo Stopping all Node processes...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak >nul

echo Starting development servers...
cd /d "%~dp0"
start "Philosopher Dev" cmd /k "npm run dev"

echo.
echo Development servers are starting...
echo Web: http://localhost:3000
echo API: http://localhost:3001
echo.
pause
