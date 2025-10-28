@echo off
REM FST Cost Management - Database Restore Script
REM Windows Batch script for restoring database from backup

set PGPASSWORD=123456789

if "%~1"=="" (
    echo Usage: restore_db.bat [backup_file.tar.gz]
    echo Example: restore_db.bat backups\fst_cost_db_backup_2025-10-29.tar.gz
    set PGPASSWORD=
    exit /b 1
)

set BACKUP_FILE=%~1

echo === FST Cost Management - Database Restore ===
echo.

REM Check if backup file exists
if not exist "%BACKUP_FILE%" (
    echo Error: Backup file not found: %BACKUP_FILE%
    set PGPASSWORD=
    exit /b 1
)

set PSQL_PATH=C:\laragon\bin\postgresql\postgresql\bin\psql.exe

REM Check if psql exists
if not exist "%PSQL_PATH%" (
    echo Error: psql not found at %PSQL_PATH%
    set PGPASSWORD=
    exit /b 1
)

echo Backup file: %BACKUP_FILE%
echo Target database: fst_cost_db
echo.
echo WARNING: This will overwrite the current database!
echo Database: fst_cost_db
echo Host: localhost:5432
echo User: postgres
echo.
set /p CONFIRM="Are you sure you want to continue? (y/n): "

if /i not "%CONFIRM%"=="y" (
    echo Restore cancelled.
    set PGPASSWORD=
    exit /b 0
)

echo.
echo Starting restore process...
echo.

set BACKUP_DIR=%~dp1
set TEMP_DIR=%BACKUP_DIR%restore_temp
set SQL_FILE=%BACKUP_FILE%

REM Extract tar.gz if needed
echo %BACKUP_FILE% | findstr /C:".tar.gz" >nul
if %ERRORLEVEL%==0 (
    echo Extracting archive...
    
    if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"
    
    cd /d "%TEMP_DIR%"
    tar xzf "%BACKUP_FILE%"
    
    for %%F in (*.sql) do set SQL_FILE=%%F
    if not exist "%TEMP_DIR%\%SQL_FILE%" (
        echo Error: No SQL file found in archive
        rd /s /q "%TEMP_DIR%"
        set PGPASSWORD=
        exit /b 1
    )
    set SQL_FILE=%TEMP_DIR%\%SQL_FILE%
    
    echo Extraction complete
    echo.
)

REM Restore database
echo Restoring database...
"%PSQL_PATH%" --host=localhost --port=5432 --username=postgres --dbname=fst_cost_db -f "%SQL_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo Restore completed successfully!
    echo.
    
    REM Cleanup
    if exist "%TEMP_DIR%" (
        echo Cleaning up temporary files...
        rd /s /q "%TEMP_DIR%"
        echo Cleanup completed
    )
    
    echo.
    echo === Restore Complete ===
) else (
    echo Error: Restore failed
)

REM Cleanup temp directory if it exists
if exist "%TEMP_DIR%" rd /s /q "%TEMP_DIR%"

set PGPASSWORD=

