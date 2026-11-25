@echo off
setlocal enableextensions enabledelayedexpansion
chcp 65001 > nul
title AfroCuisto - Back-Office Admin CMS (Port 5174)

echo =======================================================
echo   LANCEMENT DU SERVEUR ADMIN CMS AFROCUISTO
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

where npm.cmd > nul 2> nul
if errorlevel 1 (
    echo [ERREUR] Node.js / npm.cmd est introuvable dans le PATH.
    echo Installez Node.js LTS puis relancez ce script.
    echo.
    pause
    exit /b 1
)

if not exist ".env" (
    echo [AVERTISSEMENT] Le fichier .env est manquant dans afrocuisto-admin-cms-main.
    echo Le CMS risque de ne pas pouvoir se connecter a Supabase.
    echo.
)

if not exist "node_modules\" (
    echo [INFO] Les dependances ne sont pas encore installees.
    echo [INFO] Installation des modules npm en cours...
    call npm.cmd install
    if errorlevel 1 (
        echo.
        echo [ERREUR] L'installation npm a echoue !
        echo.
        pause
        exit /b 1
    )
)

echo [DEMARRAGE] Lancement du serveur de developpement Vite...
echo.
call npm.cmd run dev
if errorlevel 1 (
    echo.
    echo [ERREUR] Le serveur Vite s'est arrete avec une erreur.
    echo Verifiez si le port 5174 est deja utilise ou si .env est valide.
)

echo.
echo [INFO] Le serveur a ete arrete.
pause
