@echo off
setlocal
SET PGBIN=C:\Users\asus2\scoop\apps\postgresql\18.4\pgsql\bin
SET PGDATA=C:\Users\asus2\pgdata
SET PGUSER=postgres
SET PGDB=epicerie
SET ROOT=C:\Users\asus2\OneDrive\Documents\Claude\Projects\epicerie promo

echo ============================================
echo  Epicerie Promo — Weekly Refresh
echo  %DATE% %TIME%
echo ============================================

echo.
echo [1] Check / start postgres
"%PGBIN%\pg_ctl.exe" status -D "%PGDATA%"
if errorlevel 1 (
  "%PGBIN%\pg_ctl.exe" start -D "%PGDATA%" -l "%PGDATA%\pg.log" -w -t 90
  timeout /t 5 /nobreak >nul
)

echo.
echo [2] Import new Flipp data
cd /d "%ROOT%"
python import_db.py

echo.
echo [3] Re-cluster products
python normalize_products.py

echo.
echo [4] Rebuild FTS index (in case new products were added)
"%PGBIN%\psql.exe" -U %PGUSER% -d %PGDB% -c "REINDEX INDEX CONCURRENTLY idx_prices_fts;"

echo.
echo === Weekly refresh complete — %DATE% %TIME% ===
