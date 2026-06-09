@echo off
setlocal
SET PGBIN=C:\Users\asus2\scoop\apps\postgresql\18.4\pgsql\bin
SET PGDATA=C:\Users\asus2\pgdata
SET PGUSER=postgres
SET PGDB=epicerie
SET ROOT=C:\Users\asus2\OneDrive\Documents\Claude\Projects\epicerie promo

echo [1] Check postgres status
"%PGBIN%\pg_ctl.exe" status -D "%PGDATA%"
if errorlevel 1 (
  echo Postgres not running - starting...
  "%PGBIN%\pg_ctl.exe" start -D "%PGDATA%" -l "%PGDATA%\pg.log" -w -t 90
  timeout /t 5 /nobreak >nul
)

echo.
echo [2] Apply DB migration (add_clusters.sql)
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -f "%ROOT%\add_clusters.sql"

echo.
echo [3] Install Python deps (rapidfuzz, psycopg2-binary, python-dotenv)
pip install rapidfuzz psycopg2-binary python-dotenv --quiet

echo.
echo [4] Run normalization / clustering
cd /d "%ROOT%"
python normalize_products.py

echo.
echo [5] Fix DB views (prices -> flyers -> merchants)
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -f "%ROOT%\fix_views.sql"

echo.
echo === Done. Clusters assigned. Views updated. ===
pause
