@echo off
setlocal

SET PGBIN=C:\Users\asus2\scoop\apps\postgresql\18.4\pgsql\bin
SET PGDATA=C:\Users\asus2\pgdata
SET PGUSER=postgres
SET PGDB=epicerie
SET PROJDIR=%~dp0

echo ==========================================
echo  EPICERIE DB SETUP - CMD ONLY (no PS)
echo ==========================================
echo.

echo [1] Checking server status...
"%PGBIN%\pg_ctl.exe" status -D "%PGDATA%"
echo.

echo [1b] Starting server if not running...
"%PGBIN%\pg_ctl.exe" status -D "%PGDATA%" | findstr /C:"server is running" >nul
if %errorlevel% neq 0 (
    echo   Server not running - starting now...
    "%PGBIN%\pg_ctl.exe" start -D "%PGDATA%" -l "%PGDATA%\pg.log" -w -t 60
    echo   pg_ctl start done, exit code: %errorlevel%
) else (
    echo   Server already running.
)
echo.

echo [2] Creating database (ok if already exists)...
"%PGBIN%\createdb.exe" -U %PGUSER% %PGDB%
echo.

echo [3] Applying schema.sql ...
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -f "%PROJDIR%schema.sql"
echo.

echo [4] Verifying tables...
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
echo.

echo [5] Installing Python deps...
python -m pip install psycopg2-binary python-dotenv --break-system-packages -q
echo pip done.
echo.

echo [6] Importing data (29465 rows, may take 1-2 min)...
set DATABASE_URL=postgresql://postgres@localhost:5432/epicerie
python "%PROJDIR%import_db.py"
echo.

echo ==========================================
echo  DONE
echo ==========================================
pause
