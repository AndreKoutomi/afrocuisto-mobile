@echo off
title AfroCuisto - Serveur Mobile (port 3000)
color 0A

echo ============================================
echo    AFROCUISTO - APPLICATION MOBILE
echo    Demarrage du serveur de developpement...
echo    Port : http://localhost:3000
echo ============================================
echo.

cd /d "%~dp0"

echo Verification des dependances...
if not exist "node_modules" (
    echo Installation des dependances npm...
    npm install
    echo.
)

echo Lancement du serveur Vite...
echo.
npm run dev

pause
