@echo off
setlocal enableextensions enabledelayedexpansion
chcp 65001 > nul
title AfroCuisto - Back-Office Admin CMS (Port 5174)

echo =======================================================
echo   🖥️ LANCEMENT DU SERVEUR ADMIN CMS AFROCUISTO
echo =======================================================
echo.
echo Dossier : %~dp0afrocuisto-admin-cms-main
echo URL     : http://localhost:5174
echo.

cd /d "%~dp0afrocuisto-admin-cms-main"
if errorlevel 1 (
    echo [ERREUR] Impossible d'acceder au dossier afrocuisto-admin-cms-main
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] Les dependances ne sont pas encore installees.
    echo [INFO] Installation des modules npm en cours... Cela peut prendre une minute.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERREUR] L'installation npm a echoue !
        echo.
        pause
        exit /b 1
    )
)

echo [DEMARRAGE] Lancement du serveur de developpement...
echo.
call npm run dev

echo.
echo [INFO] Le serveur a ete arrete.
pause
