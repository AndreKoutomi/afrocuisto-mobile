@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo  Démarrage du serveur AfroCuisto Mobile
echo ========================================
echo.
echo Port: 3000
echo URL: http://localhost:3000
echo.
timeout /t 2 /nobreak
npm run dev
pause
