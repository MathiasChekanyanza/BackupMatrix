@echo off
:: ==========================================
:: BackupMatrix Agent - SQL Server Backup & Report Script
:: Based on your working Zabbix backup script (server, DB, password kept as-is)
:: ==========================================
setlocal enabledelayedexpansion

:: ==========================================
:: BACKUP CONFIGURATION - FROM YOUR WORKING SCRIPT
:: ==========================================
set SHOPNAME=AMP Shop
set SERVERNAME=ampitgt
set SERVERIP=192.168.88.41
set DATABASENAME=TestDatabase
set MyTime=%TIME: =0%
set MyDate=%DATE:~10,4%.%DATE:~7,2%.%DATE:~4,2%.%MyTime:~0,2%.%MyTime:~3,2%.%MyTime:~6,2%
set FileName=%DATABASENAME%_%MyDate%.bak
set BAK_PATH=C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\Backup\Backups\
set DEST_FILE=%BAK_PATH%%FileName%

:: SQL Server credentials (kept exactly as in your script)
set SQL_USER=sa
set SQL_PASSWORD=Pass@123
set SQL_SERVER=%SERVERNAME%

:: ==========================================
:: BACKUPMATRIX API CONFIGURATION
:: ==========================================
:: Central BackupMatrix server API endpoint
set API_URL=http://192.168.88.41:3000/api/v1/report
:: Use your real MASTER_API_KEY from backend\.env here
set API_KEY=R3KVlbIAMXdNg9Y6zghIZ2xydEQePlSY

:: ==========================================
:: DO NOT EDIT BELOW THIS LINE
:: ==========================================

:: Start timestamp
set START_TIME=%TIME%
set START_DATE=%DATE%

echo ==========================================
echo BackupMatrix Backup Agent
echo ==========================================
echo Server: %SERVERNAME%
echo Shop: %SHOPNAME%
echo Database: %DATABASENAME%
echo Time: %DATE% %TIME%
echo ==========================================

:: ==========================================
:: PERFORM BACKUP
:: ==========================================
echo.
echo Starting backup...
sqlcmd -U %SQL_USER% -P "%SQL_PASSWORD%" -S %SQL_SERVER% -d master -Q "BACKUP DATABASE [%DATABASENAME%] TO DISK = N'%DEST_FILE%' WITH INIT , NOUNLOAD , NAME = N'%DATABASENAME% backup', NOSKIP , STATS = 10, NOFORMAT"

set BACKUP_RESULT=%ERRORLEVEL%
set END_TIME=%TIME%

:: ==========================================
:: CALCULATE DURATION (simple HH:MM:SS diff)
:: ==========================================
call :CalcDuration "%START_TIME%" "%END_TIME%"

:: ==========================================
:: GET FILE SIZE
:: ==========================================
set FILE_SIZE=0
if exist "%DEST_FILE%" (
    for %%A in ("%DEST_FILE%") do set FILE_SIZE=%%~zA
)

:: ==========================================
:: DETERMINE STATUS
:: ==========================================
set STATUS=failed
set MESSAGE=Backup failed with error code %BACKUP_RESULT%

if %BACKUP_RESULT%==0 (
    set STATUS=success
    set MESSAGE=Backup completed successfully
    echo.
    echo SUCCESS: Backup completed successfully
    echo File: %DEST_FILE%
    echo Size: %FILE_SIZE% bytes
    echo Duration: %DURATION_SEC% seconds
) else (
    echo.
    echo ERROR: Backup failed with error code %BACKUP_RESULT%
)

:: ==========================================
:: BUILD ISO 8601 BACKUP TIME
:: ==========================================
for /f %%x in ('wmic path win32_utctime get /format:list ^| findstr "="') do set %%x
set BACKUP_TIME=%Year%-%Month:~-2%-%Day:~-2%T%Hour:~-2%:%Minute:~-2%:%Second:~-2%Z

:: ==========================================
:: REPORT TO BACKUPMATRIX (NO ZABBIX)
:: ==========================================
echo.
echo Reporting to BackupMatrix...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$payload = @{ ^
      server_name='%SERVERNAME%'; ^
      shop_name='%SHOPNAME%'; ^
      database_name='%DATABASENAME%'; ^
      ip='%SERVERIP%'; ^
      backup_time='%BACKUP_TIME%'; ^
      status='%STATUS%'; ^
      message='%MESSAGE%'; ^
      size_bytes=%FILE_SIZE%; ^
      duration_seconds=%DURATION_SEC% ^
    } | ConvertTo-Json; ^
    $maxRetries = 3; ^
    $retryDelay = 5; ^
    for ($i = 0; $i -lt $maxRetries; $i++) { ^
      try { ^
        $response = Invoke-RestMethod -Uri '%API_URL%' -Method Post -ContentType 'application/json' -Headers @{'X-API-KEY'='%API_KEY%'} -Body $payload -TimeoutSec 30; ^
        Write-Host 'SUCCESS: Report sent to BackupMatrix'; ^
        Write-Host ("Response: " + ($response | ConvertTo-Json -Compress)); ^
        exit 0; ^
      } catch { ^
        Write-Host ("Attempt $($i+1) failed: $_"); ^
        if ($i -lt $maxRetries - 1) { ^
          Write-Host ("Retrying in $retryDelay seconds..."); ^
          Start-Sleep -Seconds $retryDelay; ^
          $retryDelay *= 2; ^
        } else { ^
          Write-Host 'ERROR: Failed to report to BackupMatrix after all retries'; ^
          exit 1; ^
        } ^
      } ^
    }"

set REPORT_RESULT=%ERRORLEVEL%

if %REPORT_RESULT%==0 (
    echo Report sent successfully
) else (
    echo WARNING: Failed to send report to BackupMatrix
)

:: Optional: Log locally as in your original script
echo %BACKUP_TIME% - %SHOPNAME% - %SERVERNAME% - %SERVERIP% - %STATUS% >> C:\backup_log.txt

echo.
echo ==========================================
echo Backup process completed at %DATE% %TIME%
echo ==========================================

endlocal
exit /b %BACKUP_RESULT%

:: ==========================================
:: SUBROUTINE: Calculate Duration
:: ==========================================
:CalcDuration
setlocal
set start_time=%~1
set end_time=%~2

:: Convert time to seconds (handles 24-hour format)
for /f "tokens=1-3 delims=:." %%a in ("%start_time%") do (
    set /a start_sec=1%%a*3600 + 1%%b*60 + 1%%c - 109203
)
for /f "tokens=1-3 delims=:." %%a in ("%end_time%") do (
    set /a end_sec=1%%a*3600 + 1%%b*60 + 1%%c - 109203
)

set /a duration=%end_sec% - %start_sec%
if %duration% lss 0 set /a duration+=86400

endlocal & set DURATION_SEC=%duration%
exit /b
