@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Setup PostgreSQL via Scoop - Epicerie Promo

echo ============================================================
echo   Setup PostgreSQL (via Scoop, sans droits admin)
echo ============================================================
echo.

:: ─── 1. Vérifier si scoop est déjà installé ──────────────────────────────────
where scoop >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Scoop deja installe.
    goto :install_pg
)

echo [1/5] Installation de Scoop ^(sans admin^)...
powershell -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression"
if %errorlevel% neq 0 (
    echo [ERREUR] Echec installation Scoop.
    pause & exit /b 1
)

:: Recharger l'environnement pour que scoop soit dans PATH
call "%USERPROFILE%\scoop\shims\scoop.cmd" --version >nul 2>&1
if %errorlevel% neq 0 (
    :: Forcer le PATH
    set "PATH=%USERPROFILE%\scoop\shims;%PATH%"
)
echo [OK] Scoop installe.

:install_pg
:: ─── 2. Installer PostgreSQL via Scoop ───────────────────────────────────────
echo.
echo [2/5] Installation de PostgreSQL via Scoop...

:: S'assurer que scoop est dans le PATH
set "PATH=%USERPROFILE%\scoop\shims;%PATH%"

scoop bucket add versions >nul 2>&1
scoop install postgresql
if %errorlevel% neq 0 (
    echo [ERREUR] Echec installation PostgreSQL via Scoop.
    pause & exit /b 1
)

:: Trouver le binaire pg installé par scoop
set "PG_BIN=%USERPROFILE%\scoop\apps\postgresql\current\bin"
if exist "%PG_BIN%\psql.exe" (
    set "PATH=%PG_BIN%;%PATH%"
    echo [OK] PostgreSQL installe dans %PG_BIN%
) else (
    echo [ERREUR] psql.exe introuvable apres installation Scoop.
    pause & exit /b 1
)

:: ─── 3. Initialiser le cluster PostgreSQL ────────────────────────────────────
echo.
echo [3/5] Initialisation du cluster PostgreSQL...
set "PGDATA=%USERPROFILE%\scoop\apps\postgresql\current\data"
set "PGLOG=%USERPROFILE%\scoop\apps\postgresql\current\postgresql.log"

if not exist "%PGDATA%\PG_VERSION" (
    initdb -D "%PGDATA%" -U postgres -A trust --encoding=UTF8 --locale=C
    if %errorlevel% neq 0 (
        echo [ERREUR] initdb a echoue.
        pause & exit /b 1
    )
    echo [OK] Cluster initialise.
) else (
    echo [OK] Cluster deja initialise.
)

:: ─── 4. Démarrer PostgreSQL ───────────────────────────────────────────────────
echo.
echo [4/5] Demarrage du serveur PostgreSQL...

:: Vérifier si déjà en cours d'exécution
pg_ctl -D "%PGDATA%" status >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL deja en cours d'execution.
) else (
    pg_ctl -D "%PGDATA%" -l "%PGLOG%" start
    timeout /t 3 /nobreak >nul
    pg_ctl -D "%PGDATA%" status >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERREUR] Le serveur n'a pas demarre. Voir log: %PGLOG%
        pause & exit /b 1
    )
    echo [OK] Serveur demarre.
)

:: ─── 5. Créer la base de données ─────────────────────────────────────────────
echo.
echo [5/5] Preparation de la base de donnees 'epicerie'...

psql -U postgres -c "SELECT 1" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Impossible de se connecter a PostgreSQL.
    echo Verifiez le log: %PGLOG%
    pause & exit /b 1
)

psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='epicerie'" | findstr "1" >nul 2>&1
if %errorlevel% neq 0 (
    psql -U postgres -c "CREATE DATABASE epicerie ENCODING 'UTF8';"
    echo [OK] Base 'epicerie' creee.
) else (
    echo [OK] Base 'epicerie' existe deja.
)

:: ─── 6. Créer .env ───────────────────────────────────────────────────────────
if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo [OK] .env cree.
)

:: ─── 7. Appliquer le schema ───────────────────────────────────────────────────
echo.
echo Application du schema SQL...
psql -U postgres -d epicerie -f schema.sql
if %errorlevel% neq 0 (
    echo [ERREUR] Echec du schema.
    pause & exit /b 1
)
echo [OK] Schema applique.

:: ─── 8. Installer deps Python et importer ────────────────────────────────────
echo.
echo Installation des dependances Python...
pip install psycopg2-binary python-dotenv --quiet

echo.
echo Import du CSV...
set "DATABASE_URL=postgresql://postgres@localhost:5432/epicerie"
python import_db.py

echo.
echo ============================================================
echo   Termine! Base de donnees prete.
echo ============================================================
echo.
echo Pour interroger: psql -U postgres -d epicerie
echo   SELECT COUNT(*) FROM prices;
echo.
pause
