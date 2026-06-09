@echo off
REM Register a weekly Task Scheduler job — no admin needed (current user)
REM Runs every Monday at 06:00

SET TASKNAME=EpiceriePromoRefresh
SET SCRIPT=C:\Users\asus2\OneDrive\Documents\Claude\Projects\epicerie promo\refresh_weekly.bat

echo Registering weekly task: %TASKNAME%

schtasks /create ^
  /tn "%TASKNAME%" ^
  /tr "\"%SCRIPT%\"" ^
  /sc WEEKLY ^
  /d MON ^
  /st 06:00 ^
  /f

if %errorlevel%==0 (
  echo.
  echo Task registered. Runs every Monday at 06:00.
  echo To run manually now:  schtasks /run /tn "%TASKNAME%"
  echo To delete:            schtasks /delete /tn "%TASKNAME%" /f
) else (
  echo ERROR: task registration failed. Try running as administrator.
)
pause
