@echo off
REM FST Cost Management - Database Backup Script
REM Windows Batch script for creating database backups

echo === FST Cost Management - Database Backup ===
echo.

set PGPASSWORD=123456789
set BACKUP_DIR=%~dp0
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=fst_cost_db_backup_%TIMESTAMP%.sql
set BACKUP_PATH=%BACKUP_DIR%%BACKUP_FILE%

echo Creating backup...
echo Backup file: %BACKUP_FILE%
echo.

set PGDUMP_PATH=C:\laragon\bin\postgresql\postgresql\bin\pg_dump.exe

REM Check if pg_dump exists
if not exist "%PGDUMP_PATH%" (
    echo Error: pg_dump not found at %PGDUMP_PATH%
    set PGPASSWORD=
    exit /b 1
)

REM Create backup
"%PGDUMP_PATH%" --host=localhost --port=5432 --username=postgres --dbname=fst_cost_db --format=plain --encoding=UTF-8 --no-owner --no-privileges --clean --if-exists --file="%BACKUP_PATH%"

if %ERRORLEVEL% NEQ 0 (
    echo Error: Backup failed
    set PGPASSWORD=
    exit /b 1
)

if exist "%BACKUP_PATH%" (
    for %%A in ("%BACKUP_PATH%") do set SIZE=%%~zA
    set /a SIZE_MB=%SIZE% / 1048576
    
    echo Backup created successfully!
    echo   File: %BACKUP_FILE%
    echo   Size: %SIZE_MB% KB
    echo.
    
    REM Create tar.gz archive
    set TAR_FILE=%BACKUP_FILE:.sql=.tar.gz%
    set TAR_PATH=%BACKUP_DIR%%TAR_FILE%
    
    echo Creating compressed archive...
    cd /d "%BACKUP_DIR%"
    tar czf %TAR_FILE% %BACKUP_FILE%
    
    if exist "%TAR_PATH%" (
        for %%A in ("%TAR_PATH%") do set TAR_SIZE=%%~zA
        set /a TAR_SIZE_KB=%TAR_SIZE% / 1024
        
        echo Archive created successfully!
        echo   File: %TAR_FILE%
        echo   Size: %TAR_SIZE_KB% KB
        echo.
        
        REM Remove original SQL file
        del "%BACKUP_PATH%"
        echo Cleanup completed
    )
    
    echo.
    echo === Backup Complete ===
    echo Backup location: %TAR_PATH%
) else (
    echo Error: Backup file was not created
    set PGPASSWORD=
    exit /b 1
)

set PGPASSWORD=

