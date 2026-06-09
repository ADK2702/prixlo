@echo off
SET PGBIN=C:\Users\asus2\scoop\apps\postgresql\18.4\pgsql\bin
SET PGDATA=C:\Users\asus2\pgdata
SET PGUSER=postgres
SET PGDB=epicerie

echo Checking postgres status...
"%PGBIN%\pg_ctl.exe" status -D "%PGDATA%" | findstr /C:"server is running" >nul
if %errorlevel% neq 0 (
    echo Server not running - starting now...
    "%PGBIN%\pg_ctl.exe" start -D "%PGDATA%" -l "%PGDATA%\pg.log" -w -t 60
    "%PGBIN%\pg_ctl.exe" status -D "%PGDATA%" | findstr /C:"server is running" >nul
    if %errorlevel% neq 0 (
        echo ERROR: Server did not start. Check %PGDATA%\pg.log
        pause
        exit /b 1
    )
    echo Server started OK.
) else (
    echo Server already running.
)
echo.

echo Applying FTS fix...
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "CREATE OR REPLACE FUNCTION unaccent_immutable(text) RETURNS text LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$ SELECT unaccent($1) $$;"
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "DROP INDEX IF EXISTS idx_prices_fts;"
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "CREATE INDEX idx_prices_fts ON prices USING GIN (to_tsvector('simple', unaccent_immutable(name)));"
echo Index created.
echo.

echo Verifying indexes on prices table...
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "SELECT indexname FROM pg_indexes WHERE tablename='prices' ORDER BY indexname;"
echo.

echo Quick search test (lait, sorted by price)...
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "SELECT name, price, merchant FROM v_active_prices WHERE name ILIKE '%%lait%%' ORDER BY price LIMIT 8;"
echo.
pause
