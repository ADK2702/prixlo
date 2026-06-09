@echo off
setlocal
set ROOT=C:\Users\asus2\OneDrive\Documents\Claude\Projects\epicerie promo

cd /d "%ROOT%"

echo === Git status ===
git log --oneline -3 2>nul
if errorlevel 1 (
  echo No commits yet — committing now...
  git config user.email "andyayden2009@gmail.com"
  git config user.name "Andy"
  git add .
  git commit -m "Initial commit - Epicerie Promo"
  if errorlevel 1 (
    echo ERROR: git commit failed
    pause
    exit /b 1
  )
  echo Commit created.
) else (
  echo Already committed.
)

echo.
echo === Remote ===
git remote -v

echo.
echo ================================================
echo  ETAPES MANUELLES:
echo.
echo  1. Cree le repo GitHub (si pas deja fait):
echo     https://github.com/new
echo     Nom: epicerie-promo
echo     Visibilite: Public
echo     NE PAS initialiser avec README
echo.
echo  2. Entre ton username GitHub:
set /p GHUSER=GitHub username:
echo.
echo  3. Ajout du remote et push...
git remote remove origin 2>nul
git remote add origin https://github.com/%GHUSER%/epicerie-promo.git
git push -u origin main
if errorlevel 1 (
  echo.
  echo ERREUR push. Verifie:
  echo  - Le repo existe sur GitHub
  echo  - Tu es connecte ^(git credential manager^)
  echo  - git config credential.helper manager
)
echo.
echo === Done ===
pause
