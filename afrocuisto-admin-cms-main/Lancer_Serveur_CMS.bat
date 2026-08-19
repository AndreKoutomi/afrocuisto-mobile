@echo off
setlocal enableextensions enabledelayedexpansion
chcp 65001 > nul
cd /d "%~dp0"
title AfroCuisto - Back-Office Admin CMS (Port 5174)

echo ========================================
echo  Démarrage du serveur Admin CMS
echo ========================================
echo.
echo Port: 5174
echo URL: http://localhost:5174
echo.

if not exist "node_modules\" (
    echo [INFO] Installation des dépendances npm requises...
    call npm install
)

call npm run dev
echo.
echo [INFO] Serveur arrêté.
pause
