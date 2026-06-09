@echo off
cd /d "C:\Users\asus2\OneDrive\Documents\Claude\Projects\epicerie promo\webapp"

echo === npm install ===
call npm install --legacy-peer-deps
if errorlevel 1 (
  echo.
  echo ERROR: npm install failed
  pause
  exit /b 1
)

echo.
echo === npm run dev ===
echo Ouvre http://localhost:3000 dans ton navigateur
echo.
call npm run dev
echo.
echo Dev server exited with code %errorlevel%
pause
