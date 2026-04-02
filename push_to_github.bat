@echo off
cls
echo ==========================================
echo    DEPLOIEMENT AFROCUISTO VERS GITHUB
echo ==========================================
echo.

:: Verification des changements
echo Verification des fichiers...
git add .
git status -s

echo.
set /p msg="Entrez le message de mise a jour (ex: Maj animations images) : "

if "%msg%"=="" (
    set msg="Mise a jour automatique du site"
)

echo.
echo Envoi en cours vers GitHub (branche main)...
git commit -m "%msg%"
git push origin main

echo.
echo ==========================================
echo SUCCESS : Code envoye !
echo Cloudflare Pages va deployer le site dans 1-2 minutes.
echo Verifiez ici : https://dash.cloudflare.com/
echo ==========================================
pause
