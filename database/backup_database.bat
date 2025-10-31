@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Backup PostgreSQL database (schema+data+blobs) and globals under the database folder
REM Defaults are taken from config.php: host=localhost, port=5432, db=fst_cost_db, user=postgres

set "DB_HOST=localhost"
set "DB_PORT=5432"
set "DB_NAME=fst_cost_db"
set "DB_USER=postgres"
set "PGPASSWORD=123456789"

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

REM Timestamp for file names
for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set D=%%c%%a%%b
for /f "tokens=1-2 delims=:" %%a in ("%time%") do set T=%%a%%b
set "TS=%D%_%T%"
set "TS=%TS: =0%"
set "TS=%TS:.=%"

set "DUMP_CUSTOM=fst_cost_db_full_%TS%.dump"
set "DUMP_SQL=fst_cost_db_full_%TS%.sql"
set "GLOBALS_SQL=globals_%TS%.sql"

REM Create custom-format dump (compressed, with schema+data+blobs) including CREATE/CLEAN
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -F c -b --create --clean --if-exists -v -d %DB_NAME% -f "%DUMP_CUSTOM%"
if errorlevel 1 goto :ERR

REM Create plain SQL dump (with INSERTs) including CREATE/CLEAN
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -F p --inserts --column-inserts --create --clean --if-exists -v -d %DB_NAME% > "%DUMP_SQL%"
if errorlevel 1 goto :ERR

REM Dump global objects (roles, privileges)
pg_dumpall -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -g -v > "%GLOBALS_SQL%"
if errorlevel 1 goto :ERR

echo.
echo ✓ Backups created in %SCRIPT_DIR%
echo    %DUMP_CUSTOM%
echo    %DUMP_SQL%
echo    %GLOBALS_SQL%
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
