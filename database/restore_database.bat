@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Restore PostgreSQL database from SQL dump file
REM Defaults are taken from config.php: host=localhost, port=5432, db=fst_cost_db, user=postgres

set "DB_HOST=localhost"
set "DB_PORT=5432"
set "DB_NAME=fst_cost_db"
set "DB_USER=postgres"
set "PGPASSWORD=123456789"

REM Resolve script directory (database folder)
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%"

REM SQL dump file to restore
set "DUMP_FILE=fst_cost_db_backup_20251101_010400.sql"

REM Check if dump file exists
if not exist "%DUMP_FILE%" (
    echo.
    echo ERROR: Dump file not found: %DUMP_FILE%
    echo Please ensure the file exists in the database folder.
    echo.
    popd
    pause
    exit /b 1
)

REM Try to locate PostgreSQL bin if not on PATH
REM Also checks Laragon path and Program Files
set "PGBIN="

REM Check Laragon first (common development environment)
if exist "C:\laragon\bin\postgresql\postgresql\bin\psql.exe" (
    set "PGBIN=C:\laragon\bin\postgresql\postgresql\bin"
    goto :FOUND_PGBIN
)

REM Check standard PostgreSQL installations
for %%V in (16 15 14 13 12 11 10) do (
  if exist "C:\Program Files\PostgreSQL\%%V\bin\psql.exe" set "PGBIN=C:\Program Files\PostgreSQL\%%V\bin" && goto :FOUND_PGBIN
  if exist "C:\Program Files (x86)\PostgreSQL\%%V\bin\psql.exe" set "PGBIN=C:\Program Files (x86)\PostgreSQL\%%V\bin" && goto :FOUND_PGBIN
)

:FOUND_PGBIN
REM If PostgreSQL found, add to PATH; otherwise assume it's already in PATH
if defined PGBIN set "PATH=%PGBIN%;%PATH%"

echo ===========================================
echo FST Cost Management - Database Restore
echo ===========================================
echo.
echo Restoring database from: %DUMP_FILE%
echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo User: %DB_USER%
echo.

REM Restore the database using psql
REM The dump file already contains CREATE DATABASE commands, so we connect to postgres first
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -f "%DUMP_FILE%"
if errorlevel 1 goto :ERR

echo.
echo ===========================================
echo ✓ Database restored successfully!
echo ===========================================
popd
endlocal
exit /b 0

:ERR
echo.
echo ===========================================
echo ✗ Database restore failed!
echo ===========================================
echo Please check:
echo   1. PostgreSQL server is running
echo   2. Database credentials are correct
echo   3. You have permission to create/restore databases
echo.
popd
endlocal
pause
exit /b 1

