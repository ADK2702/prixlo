@echo off
echo === Check disk space ===
wmic logicaldisk get size,freespace,caption

echo.
echo === npm cache size ===
for /f "tokens=*" %%a in ('npm cache ls 2^>nul ^| find /c ""') do echo ~%%a files in cache
npm config get cache

echo.
echo === Clear npm cache ===
npm cache clean --force

echo.
echo === Remove partial node_modules ===
if exist "C:\Users\asus2\OneDrive\Documents\Claude\Projects\epicerie promo\webapp\node_modules" (
  echo Removing node_modules...
  rmdir /s /q "C:\Users\asus2\OneDrive\Documents\Claude\Projects\epicerie promo\webapp\node_modules"
  echo Done.
)

echo.
echo === Disk space after cleanup ===
wmic logicaldisk get size,freespace,caption

echo.
echo === Now retry npm install ===
cd /d "C:\Users\asus2\OneDrive\Documents\Claude\Projects\epicerie promo\webapp"
call npm install --legacy-peer-deps
if errorlevel 1 (
  echo.
  echo ERROR: npm install still failed
  pause
  exit /b 1
)

echo.
echo === npm run dev ===
echo Ouvre http://localhost:3000 dans ton navigateur
echo.
call npm run dev
echo.
echo Dev server exited
pause
