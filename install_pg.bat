@echo off
cd /d "%~dp0"
title Installation PostgreSQL via Scoop

set "LOG=%~dp0install_pg.log"
set "PATH=%USERPROFILE%\scoop\shims;%PATH%"

echo Installation PostgreSQL via Scoop... > "%LOG%"
echo Date: %date% %time% >> "%LOG%"
echo. >> "%LOG%"

echo [1/3] Ajout du bucket main...
echo [1/3] Ajout du bucket main... >> "%LOG%"
"%USERPROFILE%\scoop\shims\scoop.cmd" bucket add main 2>&1 >> "%LOG%"

echo [2/3] Installation de postgresql...
echo [2/3] Installation de postgresql... >> "%LOG%"
"%USERPROFILE%\scoop\shims\scoop.cmd" install postgresql 2>&1 >> "%LOG%"

echo. >> "%LOG%"
echo [3/3] Verification... >> "%LOG%"
if exist "%USERPROFILE%\scoop\apps\postgresql\current\bin\psql.exe" (
    echo SUCCES: psql trouve >> "%LOG%"
    echo SUCCES: psql trouve
) else (
    echo ECHEC: psql introuvable apres install >> "%LOG%"
    echo ECHEC: psql introuvable. Voir install_pg.log

    echo. >> "%LOG%"
    echo --- Contenu de scoop\apps --- >> "%LOG%"
    dir "%USERPROFILE%\scoop\apps" /b 2>&1 >> "%LOG%"
)

echo. >> "%LOG%"
echo === FIN %time% === >> "%LOG%"
echo Termine. Voir install_pg.log
pause
