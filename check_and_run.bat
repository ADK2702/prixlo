@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Check et Import - Epicerie Promo

echo === Diagnostic PostgreSQL ===
echo.

:: Ajouter les PATH possibles
set "PATH=%USERPROFILE%\scoop\shims;%USERPROFILE%\scoop\apps\postgresql\current\bin;C:\Program Files\PostgreSQL\16\bin;C:\Program Files\PostgreSQL\15\bin;C:\Program Files\PostgreSQL\14\bin;%PATH%"

:: Chercher psql
where psql >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] psql trouve:
    where psql
    echo.
    goto :test_connection
)

:: Chercher dans scoop
if exist "%USERPROFILE%\scoop\apps\postgresql\current\bin\psql.exe" (
    echo [OK] psql trouve via Scoop
    set "PATH=%USERPROFILE%\scoop\apps\postgresql\current\bin;%PATH%"
    goto :test_connection
)

echo [ERREUR] psql introuvable.
echo Scoop installe?
if exist "%USERPROFILE%\scoop\shims\scoop.cmd" (
    echo   Scoop: OUI
    echo   PostgreSQL via Scoop:
    "%USERPROFILE%\scoop\shims\scoop.cmd" list postgresql 2>&1
) else (
    echo   Scoop: NON
)
echo.
echo Relancez setup_scoop_postgres.bat
pause
exit /b 1

:test_connection
:: Tester la connexion
echo [TEST] Connexion au serveur...
psql -U postgres -c "SELECT version();" 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [INFO] Serveur non demarrage. Demarrage...
    set "PGDATA=%USERPROFILE%\scoop\apps\postgresql\current\data"
    set "PGLOG=%USERPROFILE%\scoop\apps\postgresql\current\postgresql.log"

    :: Initialiser si necessaire
    if not exist "!PGDATA!\PG_VERSION" (
        echo [INFO] Initialisation du cluster...
        initdb -D "!PGDATA!" -U postgres -A trust --encoding=UTF8 --locale=C
    )

    :: Demarrer
    pg_ctl -D "!PGDATA!" -l "!PGLOG!" start
    timeout /t 3 /nobreak >nul

    psql -U postgres -c "SELECT version();" >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERREUR] Impossible de demarrer le serveur.
        echo Log: !PGLOG!
        pause & exit /b 1
    )
)
echo [OK] Connexion reussie.

:: Creer la base si besoin
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='epicerie'" 2>&1 | findstr "1" >nul
if %errorlevel% neq 0 (
    echo [INFO] Creation de la base 'epicerie'...
    psql -U postgres -c "CREATE DATABASE epicerie ENCODING 'UTF8';"
)

:: .env
if not exist ".env" copy ".env.example" ".env" >nul

:: Schema
echo.
echo [SCHEMA] Application du schema...
psql -U postgres -d epicerie -f schema.sql
if %errorlevel% neq 0 ( echo [ERREUR] Schema & pause & exit /b 1 )

:: Deps Python
echo.
echo [PYTHON] Installation des dependances...
pip install psycopg2-binary python-dotenv -q

:: Import
echo.
echo [IMPORT] Import du CSV ^(29465 items^)...
set "DATABASE_URL=postgresql://postgres@localhost:5432/epicerie"
python import_db.py

echo.
echo ============================================================
echo   TERMINE! Verifications:
psql -U postgres -d epicerie -c "SELECT COUNT(*) AS items FROM prices; SELECT COUNT(*) AS marchands FROM merchants;"
echo ============================================================
pause
