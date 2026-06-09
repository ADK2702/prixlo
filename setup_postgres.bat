@echo off
setlocal
SET PGBIN=C:\Users\asus2\scoop\apps\postgresql\18.4\pgsql\bin
SET PGDATA=C:\Users\asus2\pgdata
SET PGUSER=postgres
SET PGDB=epicerie
SET PROJDIR=%~dp0

echo ============================================
echo  PostgreSQL Setup + FTS Fix + Auto-start
echo ============================================
echo.

REM ── 1. Check status ──────────────────────────────────────────────
echo [1] Checking server status...
"%PGBIN%\pg_ctl.exe" status -D "%PGDATA%" | findstr /C:"server is running" >nul
if %errorlevel% equ 0 (
    echo     Server already running.
    goto :apply_fix
)

REM ── 2. Remove stale PID if present ──────────────────────────────
echo [2] Removing stale PID file if present...
if exist "%PGDATA%\postmaster.pid" (
    del /F /Q "%PGDATA%\postmaster.pid"
    echo     Deleted stale postmaster.pid
) else (
    echo     No stale PID found.
)

REM ── 3. Start postgres ────────────────────────────────────────────
echo [3] Starting PostgreSQL...
"%PGBIN%\pg_ctl.exe" start -D "%PGDATA%" -l "%PGDATA%\pg.log" -w -t 60
if %errorlevel% neq 0 (
    echo     pg_ctl returned non-zero. Verifying status anyway...
)

REM ── 4. Verify running ────────────────────────────────────────────
echo [4] Verifying server is up...
"%PGBIN%\pg_ctl.exe" status -D "%PGDATA%" | findstr /C:"server is running" >nul
if %errorlevel% neq 0 (
    echo     ERROR: Server not running after start attempt.
    echo     Check %PGDATA%\pg.log for details.
    pause
    exit /b 1
)
echo     Server is running.

:apply_fix
echo.
REM ── 5. Apply unaccent_immutable function ─────────────────────────
echo [5] Creating unaccent_immutable function...
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "CREATE OR REPLACE FUNCTION unaccent_immutable(text) RETURNS text LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$ SELECT unaccent($1) $$;"

REM ── 6. Recreate FTS index ────────────────────────────────────────
echo [6] Rebuilding FTS index...
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "DROP INDEX IF EXISTS idx_prices_fts;"
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "CREATE INDEX idx_prices_fts ON prices USING GIN (to_tsvector('simple', unaccent_immutable(name)));"
echo     Done.

REM ── 7. Verify all indexes ────────────────────────────────────────
echo.
echo [7] Indexes on prices table:
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "SELECT indexname FROM pg_indexes WHERE tablename='prices' ORDER BY indexname;"

REM ── 8. Test search ───────────────────────────────────────────────
echo.
echo [8] Test search - lait sorted by price:
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "SELECT name, price, merchant FROM v_active_prices WHERE name ILIKE '%%lait%%' ORDER BY price LIMIT 8;"

REM ── 9. Register Task Scheduler for auto-start on login ──────────
echo.
echo [9] Registering auto-start task in Task Scheduler...
schtasks /query /tn "PostgreSQL_epicerie" >nul 2>&1
if %errorlevel% equ 0 (
    schtasks /delete /tn "PostgreSQL_epicerie" /f >nul
)
schtasks /create /tn "PostgreSQL_epicerie" /tr "\"%PGBIN%\pg_ctl.exe\" start -D \"%PGDATA%\" -l \"%PGDATA%\pg.log\"" /sc onlogon /delay 0000:15 /f
if %errorlevel% equ 0 (
    echo     Auto-start task registered. Postgres starts 15s after login.
) else (
    echo     WARNING: Task Scheduler registration failed.
)

echo.
echo ============================================
echo  ALL DONE
echo ============================================
pause
