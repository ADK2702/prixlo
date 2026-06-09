@echo off
REM =========================================================
REM  Migrate local PostgreSQL database to Supabase
REM  Usage: set SUPABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
REM         then run this script
REM =========================================================

SET PGBIN=C:\Users\asus2\scoop\apps\postgresql\18.4\pgsql\bin
SET LOCAL_DB=postgresql://postgres@localhost:5432/epicerie
SET DUMP_FILE=%TEMP%\epicerie_dump.sql

IF "%SUPABASE_URL%"=="" (
  echo.
  echo ERROR: Set SUPABASE_URL first, e.g.:
  echo   set SUPABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
  echo   migrate_to_supabase.bat
  pause
  exit /b 1
)

echo.
echo Step 1: Dumping local database...
"%PGBIN%\pg_dump" --no-owner --no-acl --schema=public "%LOCAL_DB%" -f "%DUMP_FILE%"
IF ERRORLEVEL 1 (
  echo ERROR: pg_dump failed. Is PostgreSQL running?
  pause
  exit /b 1
)
echo   Dump written to %DUMP_FILE%

echo.
echo Step 2: Restoring to Supabase...
echo   (This may take a few minutes for 29,000+ rows)
"%PGBIN%\psql" "%SUPABASE_URL%" -f "%DUMP_FILE%"
IF ERRORLEVEL 1 (
  echo ERROR: psql restore failed. Check your SUPABASE_URL.
  pause
  exit /b 1
)

echo.
echo Step 3: Verifying row counts...
"%PGBIN%\psql" "%SUPABASE_URL%" -c "SELECT COUNT(*) AS prices, (SELECT COUNT(*) FROM merchants) AS merchants, (SELECT COUNT(*) FROM product_clusters) AS clusters FROM prices;"

echo.
echo Step 4: Creating unaccent extension if needed...
"%PGBIN%\psql" "%SUPABASE_URL%" -c "CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public;"

echo.
echo =========================================================
echo Migration complete!
echo.
echo Next step: add DATABASE_URL to Vercel environment variables.
echo Use the Supabase Transaction Pooler URL (port 6543) for Vercel.
echo =========================================================
pause
