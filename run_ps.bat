@echo off
cd /d "%~dp0"
title Run PowerShell Script
echo Lancement install_pg.ps1...
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0install_pg.ps1"
echo.
echo Script termine. Voir ps_install.log
pause
