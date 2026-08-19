@echo off
setlocal enableextensions enabledelayedexpansion
chcp 65001 > nul
title AfroCuisto - Application Mobile React Native

echo =======================================================
echo   📱 LANCEMENT DE L'APPLICATION AFROCUISTO (REACT NATIVE)
echo =======================================================
echo.
echo Dossier : %~dp0afrocuisto-mobile
echo.

cd /d "%~dp0afrocuisto-mobile"
if errorlevel 1 (
    echo [ERREUR] Impossible d'acceder au dossier afrocuisto-mobile
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] Installation des modules npm en cours...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo.
        echo [ERREUR] L'installation npm a echoue !
        echo.
        pause
        exit /b 1
    )
)

echo [VERIFICATION] Verification des appareils Android connectes...
adb devices
echo.

echo Choisissez le mode de lancement :
echo   [1] Lancer directement sur le telephone Android (USB)
echo   [2] Lancer sur le Navigateur Web
echo   [3] Lancer le menu interactif Expo
echo.
set /p mode="Votre choix (1, 2 ou 3) [defaut: 1] : "

if "%mode%"=="2" (
    echo.
    echo [DEMARRAGE] Lancement sur Web...
    call npx expo start --web
) else if "%mode%"=="3" (
    echo.
    echo [DEMARRAGE] Lancement d'Expo interactif...
    call npx expo start
) else (
    echo.
    echo [DEMARRAGE] Lancement sur votre telephone Android physique...
    call npx expo start --android
)

echo.
echo [INFO] Le serveur a ete arrete.
pause
