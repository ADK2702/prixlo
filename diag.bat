@echo off
cd /d "%~dp0"

set "OUT=%~dp0diag_result.txt"
echo === DIAGNOSTIC PostgreSQL === > "%OUT%"
echo Date: %date% %time% >> "%OUT%"
echo. >> "%OUT%"

:: PATH
set "PATH=%USERPROFILE%\scoop\shims;%USERPROFILE%\scoop\apps\postgresql\current\bin;C:\Program Files\PostgreSQL\16\bin;C:\Program Files\PostgreSQL\15\bin;C:\Program Files\PostgreSQL\14\bin;%PATH%"

:: psql
echo --- psql --- >> "%OUT%"
where psql >> "%OUT%" 2>&1
echo. >> "%OUT%"

:: scoop
echo --- scoop --- >> "%OUT%"
if exist "%USERPROFILE%\scoop\shims\scoop.cmd" (
    echo Scoop: PRESENT >> "%OUT%"
    "%USERPROFILE%\scoop\shims\scoop.cmd" list 2>&1 | findstr /i "postgres" >> "%OUT%"
) else (
    echo Scoop: ABSENT >> "%OUT%"
)
echo. >> "%OUT%"

:: Connection test
echo --- connexion psql --- >> "%OUT%"
psql -U postgres -c "SELECT version();" >> "%OUT%" 2>&1
echo. >> "%OUT%"

:: DB check
echo --- base epicerie --- >> "%OUT%"
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='epicerie'" >> "%OUT%" 2>&1
echo. >> "%OUT%"

:: Row counts if DB exists
echo --- comptages --- >> "%OUT%"
psql -U postgres -d epicerie -c "SELECT COUNT(*) AS items FROM prices; SELECT COUNT(*) AS marchands FROM merchants;" >> "%OUT%" 2>&1

echo. >> "%OUT%"
echo === FIN === >> "%OUT%"

echo Diagnostic termine. Voir diag_result.txt
