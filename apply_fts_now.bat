@echo off
setlocal
SET PGBIN=C:\Users\asus2\scoop\apps\postgresql\18.4\pgsql\bin
SET PGDATA=C:\Users\asus2\pgdata
SET PGUSER=postgres
SET PGDB=epicerie

echo ============================================
echo  Apply FTS fix + Register auto-start
echo ============================================
echo.

REM Check if server is running
echo [1] Server status:
"%PGBIN%\pg_ctl.exe" status -D "%PGDATA%"
echo.

REM Ensure unaccent extension
echo [2] Ensuring unaccent extension...
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "CREATE EXTENSION IF NOT EXISTS unaccent;"
echo.

REM Recreate function with schema-qualified public.unaccent
echo [3] Recreating unaccent_immutable (public.unaccent)...
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "CREATE OR REPLACE FUNCTION public.unaccent_immutable(text) RETURNS text LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$ SELECT public.unaccent($1) $$;"
echo.

REM Rebuild FTS index
echo [4] Rebuilding FTS index...
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "DROP INDEX IF EXISTS idx_prices_fts;"
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "CREATE INDEX idx_prices_fts ON prices USING GIN (to_tsvector('simple', public.unaccent_immutable(name)));"
echo.

REM Verify all indexes
echo [5] Indexes on prices table:
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "SELECT indexname FROM pg_indexes WHERE tablename='prices' ORDER BY indexname;"
echo.

REM FTS search test
echo [6] FTS test - searching 'lait':
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "SELECT name, price, merchant FROM v_active_prices WHERE to_tsvector('simple', public.unaccent_immutable(name)) @@ to_tsquery('simple', 'lait') ORDER BY price LIMIT 8;"
echo.

REM Register auto-start via HKCU registry (no admin needed)
echo [7] Registering auto-start via registry Run key...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "PostgreSQL_epicerie" /t REG_SZ /d "\"%PGBIN%\pg_ctl.exe\" start -D \"%PGDATA%\" -l \"%PGDATA%\pg.log\"" /f
if %errorlevel% equ 0 (
    echo     Auto-start registered. Postgres will start on next login.
) else (
    echo     WARNING: Registry write failed.
)

echo.
echo ============================================
echo  DONE
echo ============================================
pause
