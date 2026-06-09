@echo off
copy /Y "C:\Users\asus2\pgdata\pg.log" "%~dp0pg_log_copy.txt"
echo Done. Log copied to pg_log_copy.txt
pause
