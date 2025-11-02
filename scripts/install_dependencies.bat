@echo off
REM FST Cost Management - Dependency Installation Script
REM Supports PHP 7.4+ and all PHP 8.x versions
setlocal enabledelayedexpansion

echo === FST Cost Management - Installing Dependencies ===
echo.

set PHP_EXE=
set LARAGON_BASE=C:\laragon\bin\php

REM Auto-detect PHP in Laragon
if exist "%LARAGON_BASE%" (
    REM Try PHP 8.x first (newest to oldest)
    for /f "delims=" %%i in ('dir /b /ad /o-n "%LARAGON_BASE%\php-8.*" 2^>nul') do (
        if exist "%LARAGON_BASE%\%%i\php.exe" (
            set PHP_EXE=%LARAGON_BASE%\%%i\php.exe
            goto :found_php
        )
    )
    REM Fallback to PHP 7.4
    for /f "delims=" %%i in ('dir /b /ad /o-n "%LARAGON_BASE%\php-7.4*" 2^>nul') do (
        if exist "%LARAGON_BASE%\%%i\php.exe" (
            set PHP_EXE=%LARAGON_BASE%\%%i\php.exe
            goto :found_php
        )
    )
)

REM Fallback paths
if exist "C:\Program Files\PHP\php.exe" (
    set PHP_EXE=C:\Program Files\PHP\php.exe
    goto :found_php
)
if exist "C:\xampp\php\php.exe" (
    set PHP_EXE=C:\xampp\php\php.exe
    goto :found_php
)

REM Check PATH
where php >nul 2>&1
if %ERRORLEVEL%==0 (
    set PHP_EXE=php
    goto :found_php
)

echo Error: PHP not found!
echo Please install PHP 7.4+ or 8.x
echo Common locations: C:\laragon\bin\php\, C:\Program Files\PHP\, C:\xampp\php\
exit /b 1

:found_php
echo Found PHP: %PHP_EXE%
for /f "tokens=*" %%i in ('"%PHP_EXE%" -r "echo PHP_VERSION;"') do echo PHP Version: %%i
echo.

REM Change to project root directory (parent of scripts folder)
cd /d "%~dp0.."

if not exist "composer.phar" (
    echo composer.phar not found. Please download from https://getcomposer.org/download/
    exit /b 1
)

echo Installing dependencies...
echo.

"%PHP_EXE%" composer.phar install --no-dev

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Dependency installation completed successfully!
    echo === Installation Complete ===
    exit /b 0
) else (
    echo.
    echo Installation failed (Exit code: %ERRORLEVEL%)
    exit /b 1
)
