@echo off
cd /d "%~dp0"

echo === Import CSV -> PostgreSQL ===
echo.

REM Créer la DB si elle n'existe pas encore
REM psql -U postgres -c "CREATE DATABASE epicerie;" 2>nul

REM Appliquer le schema
echo [1/2] Application du schema...
psql -d epicerie -f schema.sql
if errorlevel 1 (
    echo ERREUR: psql introuvable ou connexion impossible.
    echo Verifiez que PostgreSQL est installe et que DATABASE_URL est configure dans .env
    pause
    exit /b 1
)

REM Importer le CSV
echo.
echo [2/2] Import du CSV...
python import_db.py

pause
