@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Backup PostgreSQL database (schema+data+blobs) and globals under the database folder
REM Defaults are taken from config.php: host=localhost, port=5432, db=fst_cost_db, user=postgres

set "DB_HOST=localhost"
set "DB_PORT=5432"
set "DB_NAME=fst_cost_db"
set "DB_USER=postgres"

REM Try to read password from .env file
set "PGPASSWORD="
set "ENV_FILE=%~dp0..\.env"
if exist "%ENV_FILE%" (
    for /f "tokens=2 delims==" %%a in ('findstr /b "DB_PASS=" "%ENV_FILE%"') do set "PGPASSWORD=%%a"
)

REM If password not found, prompt user
if "%PGPASSWORD%"=="" (
    set /p "PGPASSWORD=Enter PostgreSQL password for user '%DB_USER%': "
)

REM Resolve script directory (database folder)
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%"

REM Try to locate PostgreSQL bin if not on PATH
REM Also checks Laragon path and Program Files
set "PGBIN="

REM Check Laragon first (common development environment)
if exist "C:\laragon\bin\postgresql\postgresql\bin\pg_dump.exe" (
    set "PGBIN=C:\laragon\bin\postgresql\postgresql\bin"
    goto :FOUND_PGBIN
)

REM Check standard PostgreSQL installations
for %%V in (16 15 14 13 12 11 10) do (
  if exist "C:\Program Files\PostgreSQL\%%V\bin\pg_dump.exe" set "PGBIN=C:\Program Files\PostgreSQL\%%V\bin" && goto :FOUND_PGBIN
  if exist "C:\Program Files (x86)\PostgreSQL\%%V\bin\pg_dump.exe" set "PGBIN=C:\Program Files (x86)\PostgreSQL\%%V\bin" && goto :FOUND_PGBIN
)

:FOUND_PGBIN
REM If PostgreSQL found, add to PATH; otherwise assume it's already in PATH
if defined PGBIN set "PATH=%PGBIN%;%PATH%"

REM Timestamp for file names (YYYYMMDD_HHMMSS format to match PowerShell script)
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "TS=%datetime:~0,4%%datetime:~4,2%%datetime:~6,2%_%datetime:~8,2%%datetime:~10,2%%datetime:~12,2%"

set "DUMP_SQL=fst_cost_db_backup_%TS%.sql"

echo.
echo Starting database backup...
echo Database: %DB_NAME%
echo Backup file: %DUMP_SQL%
echo.

REM Create plain SQL dump (same format as PowerShell script)
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -F p --create --clean --if-exists -v -d %DB_NAME% > "%DUMP_SQL%"
if errorlevel 1 goto :ERR

echo.
echo ✓ Backup created in %SCRIPT_DIR%
echo    %DUMP_SQL%
popd
endlocal
exit /b 0

:ERR
echo.
echo ✗ Backup failed. Ensure PostgreSQL client tools are installed and on PATH.
echo   You can set correct credentials at the top of this script.
popd
endlocal
exit /b 1
