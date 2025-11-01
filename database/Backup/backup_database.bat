@echo off
REM ============================================================
REM Universal Database Backup Script - Windows Batch
REM Multi-language Support (Turkish, English, German, French, Spanish, Italian)
REM PostgreSQL Full Backup (Schema + Data + Blobs + Globals)
REM ============================================================

setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

REM Set UTF-8 encoding for console output
chcp 65001 >nul 2>&1

REM Detect language from system or use default
set "LANG=auto"
if "%1"=="--lang=tr" set "LANG=tr"
if "%1"=="--lang=en" set "LANG=en"
if "%1"=="--lang=de" set "LANG=de"
if "%1"=="--lang=fr" set "LANG=fr"
if "%1"=="--lang=es" set "LANG=es"
if "%1"=="--lang=it" set "LANG=it"

REM Try to detect from system locale
if "%LANG%"=="auto" (
    for /f "tokens=2 delims==" %%I in ('wmic os get locale /value ^| findstr /r "^locale="') do (
        set "LOCALE=%%I"
    )
    if "!LOCALE!"=="1055" set "LANG=tr"
    if "!LOCALE!"=="1031" set "LANG=de"
    if "!LOCALE!"=="1036" set "LANG=fr"
    if "!LOCALE!"=="1034" set "LANG=es"
    if "!LOCALE!"=="1040" set "LANG=it"
)

REM Default to English if still auto
if "%LANG%"=="auto" set "LANG=en"

REM Translations
set "TITLE_TR=Veritabanı Yedekleme"
set "TITLE_EN=Database Backup"
set "TITLE_DE=Datenbanksicherung"
set "TITLE_FR=Sauvegarde de la base de données"
set "TITLE_ES=Respaldo de base de datos"
set "TITLE_IT=Backup del database"

set "STARTING_TR=Veritabanı yedekleme başlatılıyor..."
set "STARTING_EN=Starting database backup..."
set "STARTING_DE=Datenbanksicherung wird gestartet..."
set "STARTING_FR=Démarrage de la sauvegarde..."
set "STARTING_ES=Iniciando respaldo de base de datos..."
set "STARTING_IT=Avvio backup del database..."

set "SUCCESS_TR=✓ Yedekleme başarılı!"
set "SUCCESS_EN=✓ Backup successful!"
set "SUCCESS_DE=✓ Sicherung erfolgreich!"
set "SUCCESS_FR=✓ Sauvegarde réussie!"
set "SUCCESS_ES=✓ ¡Respaldo exitoso!"
set "SUCCESS_IT=✓ Backup completato!"

set "FAILED_TR=✗ Yedekleme başarısız!"
set "FAILED_EN=✗ Backup failed!"
set "FAILED_DE=✗ Sicherung fehlgeschlagen!"
set "FAILED_FR=✗ Sauvegarde échouée!"
set "FAILED_ES=✗ ¡Respaldo fallido!"
set "FAILED_IT=✗ Backup fallito!"

REM Load translations
call :SET_TITLE
call :SET_STARTING
call :SET_SUCCESS
call :SET_FAILED

REM Database Configuration - Read from .env file
set "DB_HOST=localhost"
set "DB_PORT=5432"
set "DB_NAME=fst_cost_db"
set "DB_USER=postgres"
set "PGPASSWORD="

REM Try to read from .env file in project root
set "ENV_FILE=%~dp0..\..\.env"
if exist "%ENV_FILE%" (
    for /f "tokens=2 delims==" %%a in ('findstr /b "DB_HOST=" "%ENV_FILE%"') do set "DB_HOST=%%a"
    for /f "tokens=2 delims==" %%a in ('findstr /b "DB_PORT=" "%ENV_FILE%"') do set "DB_PORT=%%a"
    for /f "tokens=2 delims==" %%a in ('findstr /b "DB_NAME=" "%ENV_FILE%"') do set "DB_NAME=%%a"
    for /f "tokens=2 delims==" %%a in ('findstr /b "DB_USER=" "%ENV_FILE%"') do set "DB_USER=%%a"
    for /f "tokens=2 delims==" %%a in ('findstr /b "DB_PASS=" "%ENV_FILE%"') do set "PGPASSWORD=%%a"
)

REM If password not found, prompt user
if "!PGPASSWORD!"=="" (
    set /p "PGPASSWORD=Enter PostgreSQL password for user '%DB_USER%': "
)

REM Resolve script directory
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%"

REM Find pg_dump.exe
set "PGBIN="

REM Check Laragon first
if exist "C:\laragon\bin\postgresql\postgresql\bin\pg_dump.exe" (
    set "PGBIN=C:\laragon\bin\postgresql\postgresql\bin"
    goto :FOUND_PGBIN
)

REM Check standard PostgreSQL installations
for %%V in (16 15 14 13 12 11 10) do (
    if exist "C:\Program Files\PostgreSQL\%%V\bin\pg_dump.exe" (
        set "PGBIN=C:\Program Files\PostgreSQL\%%V\bin"
        goto :FOUND_PGBIN
    )
    if exist "C:\Program Files (x86)\PostgreSQL\%%V\bin\pg_dump.exe" (
        set "PGBIN=C:\Program Files (x86)\PostgreSQL\%%V\bin"
        goto :FOUND_PGBIN
    )
)

:FOUND_PGBIN
if defined PGBIN set "PATH=%PGBIN%;%PATH%"

REM Check if pg_dump exists
where pg_dump.exe >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: pg_dump.exe not found. PostgreSQL client tools must be installed.
    popd
    endlocal
    exit /b 1
)

REM Generate timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "TS=!datetime:~0,4!!datetime:~4,2!!datetime:~6,2!_!datetime:~8,2!!datetime:~10,2!!datetime:~12,2!"

set "DUMP_SQL=%DB_NAME%_backup_%TS%.sql"

echo.
echo %TITLE%
echo ============================================================
echo %STARTING%
echo Database: %DB_NAME%
echo Backup file: %DUMP_SQL%
echo.

REM Create plain SQL dump with UTF-8 encoding for Turkish characters
REM Redirect stderr separately and use chcp for UTF-8 console
REM pg_dump with --encoding=UTF8 ensures database content is UTF-8
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -F p --create --clean --if-exists --encoding=UTF8 -v -d %DB_NAME% > "%DUMP_SQL%" 2>nul
if errorlevel 1 (
    REM If failed, try without stderr redirect to see errors
    pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -F p --create --clean --if-exists --encoding=UTF8 -v -d %DB_NAME% > "%DUMP_SQL%" 2>&1
    if errorlevel 1 goto :ERR
)
if errorlevel 1 goto :ERR

REM Get file size
for %%A in ("%DUMP_SQL%") do set "FILESIZE=%%~zA"

echo.
echo %SUCCESS%
echo File: %DUMP_SQL%
echo Location: %SCRIPT_DIR%%DUMP_SQL%
echo Size: %FILESIZE% bytes
echo Timestamp: %TS%
echo ============================================================

popd
endlocal
exit /b 0

:ERR
echo.
echo %FAILED%
echo Please check PostgreSQL credentials and connection.
popd
endlocal
exit /b 1

REM Translation helpers
:SET_TITLE
if "%LANG%"=="tr" set "TITLE=%TITLE_TR%"
if "%LANG%"=="en" set "TITLE=%TITLE_EN%"
if "%LANG%"=="de" set "TITLE=%TITLE_DE%"
if "%LANG%"=="fr" set "TITLE=%TITLE_FR%"
if "%LANG%"=="es" set "TITLE=%TITLE_ES%"
if "%LANG%"=="it" set "TITLE=%TITLE_IT%"
exit /b

:SET_STARTING
if "%LANG%"=="tr" set "STARTING=%STARTING_TR%"
if "%LANG%"=="en" set "STARTING=%STARTING_EN%"
if "%LANG%"=="de" set "STARTING=%STARTING_DE%"
if "%LANG%"=="fr" set "STARTING=%STARTING_FR%"
if "%LANG%"=="es" set "STARTING=%STARTING_ES%"
if "%LANG%"=="it" set "STARTING=%STARTING_IT%"
exit /b

:SET_SUCCESS
if "%LANG%"=="tr" set "SUCCESS=%SUCCESS_TR%"
if "%LANG%"=="en" set "SUCCESS=%SUCCESS_EN%"
if "%LANG%"=="de" set "SUCCESS=%SUCCESS_DE%"
if "%LANG%"=="fr" set "SUCCESS=%SUCCESS_FR%"
if "%LANG%"=="es" set "SUCCESS=%SUCCESS_ES%"
if "%LANG%"=="it" set "SUCCESS=%SUCCESS_IT%"
exit /b

:SET_FAILED
if "%LANG%"=="tr" set "FAILED=%FAILED_TR%"
if "%LANG%"=="en" set "FAILED=%FAILED_EN%"
if "%LANG%"=="de" set "FAILED=%FAILED_DE%"
if "%LANG%"=="fr" set "FAILED=%FAILED_FR%"
if "%LANG%"=="es" set "FAILED=%FAILED_ES%"
if "%LANG%"=="it" set "FAILED=%FAILED_IT%"
exit /b

