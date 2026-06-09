@echo off
setlocal
set ROOT=C:\Users\asus2\OneDrive\Documents\Claude\Projects\epicerie promo

echo === Reset git repository ===
cd /d "%ROOT%"

REM Remove any partial/corrupt .git directory
if exist ".git" (
  echo Removing old .git...
  rmdir /s /q ".git"
)

echo Initializing fresh git repo...
git init -b main
git config user.email "andyayden2009@gmail.com"
git config user.name "Andy"

echo.
echo === Staging all files ===
git add .
git status --short | head

echo.
echo === Initial commit ===
git commit -m "Initial commit — Epicerie Promo"

echo.
echo ================================================
echo  NEXT STEPS (manual):
echo.
echo  1. Create repo on GitHub:
echo     https://github.com/new
echo     Name: epicerie-promo
echo     Visibility: Public (for Vercel free tier)
echo     Do NOT initialize with README
echo.
echo  2. Then run this command in a new terminal:
echo     cd "%ROOT%"
echo     git remote add origin https://github.com/TON_USERNAME/epicerie-promo.git
echo     git push -u origin main
echo.
echo  (Replace TON_USERNAME with your GitHub username)
echo ================================================
echo.
pause
