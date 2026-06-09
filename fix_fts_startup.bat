@echo off
setlocal
SET PGBIN=C:\Users\asus2\scoop\apps\postgresql\18.4\pgsql\bin
SET PGDATA=C:\Users\asus2\pgdata
SET PGUSER=postgres
SET PGDB=epicerie

echo ============================================
echo  Fix FTS index + Register auto-start
echo ============================================
echo.

REM ── Ensure server is running ─────────────────────────────────────────
echo [1] Verifying server is up...
"%PGBIN%\pg_ctl.exe" status -D "%PGDATA%" | findstr /C:"server is running" >nul
if %errorlevel% neq 0 (
    echo     Server not running - starting...
    if exist "%PGDATA%\postmaster.pid" del /F /Q "%PGDATA%\postmaster.pid"
    "%PGBIN%\pg_ctl.exe" start -D "%PGDATA%" -l "%PGDATA%\pg.log" -w -t 60
    "%PGBIN%\pg_ctl.exe" status -D "%PGDATA%" | findstr /C:"server is running" >nul
    if %errorlevel% neq 0 (
        echo     ERROR: Server did not start. Check %PGDATA%\pg.log
        pause & exit /b 1
    )
)
echo     Server is running.
echo.

REM ── Ensure unaccent extension is installed ──────────────────────────
echo [2] Ensuring unaccent extension exists...
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "CREATE EXTENSION IF NOT EXISTS unaccent;"

REM ── Recreate function with schema-qualified public.unaccent ─────────
echo [3] Recreating unaccent_immutable with public.unaccent...
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "CREATE OR REPLACE FUNCTION public.unaccent_immutable(text) RETURNS text LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$ SELECT public.unaccent($1) $$;"

REM ── Rebuild FTS index ───────────────────────────────────────────────
echo [4] Rebuilding FTS index...
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "DROP INDEX IF EXISTS idx_prices_fts;"
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "CREATE INDEX idx_prices_fts ON prices USING GIN (to_tsvector('simple', public.unaccent_immutable(name)));"

REM ── Verify all 5 indexes present ───────────────────────────────────
echo.
echo [5] Indexes on prices table (expect 5):
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "SELECT indexname FROM pg_indexes WHERE tablename='prices' ORDER BY indexname;"

REM ── FTS search test ─────────────────────────────────────────────────
echo.
echo [6] FTS test - lait:
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "SELECT name, price, merchant FROM v_active_prices WHERE to_tsvector('simple', public.unaccent_immutable(name)) @@ to_tsquery('simple', 'lait') ORDER BY price LIMIT 8;"

REM ── Register auto-start via HKCU registry Run key (no admin needed) ─
echo.
echo [7] Registering auto-start via registry Run key (no admin)...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "PostgreSQL_epicerie" /t REG_SZ /d "\"%PGBIN%\pg_ctl.exe\" start -D \"%PGDATA%\" -l \"%PGDATA%\pg.log\"" /f
if %errorlevel% equ 0 (
    echo     Auto-start registered. Postgres will start on next login.
) else (
    echo     WARNING: Registry write failed.
)

echo.
echo ============================================
echo  ALL DONE
echo ============================================
pause
