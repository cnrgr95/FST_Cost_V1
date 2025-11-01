@echo off
REM Database Creation Batch Script for Windows (Laragon)
REM This script uses Laragon's PHP installation

echo ===========================================
echo FST Cost Management - Database Setup
echo ===========================================
echo.

REM Try to find PHP in Laragon
if exist "C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" (
    set PHP_PATH=C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe
) else if exist "C:\laragon\bin\php\php-8.2.0-Win32-vs16-x64\php.exe" (
    set PHP_PATH=C:\laragon\bin\php\php-8.2.0-Win32-vs16-x64\php.exe
) else if exist "C:\laragon\bin\php\php-8.3.0-Win32-vs16-x64\php.exe" (
    set PHP_PATH=C:\laragon\bin\php\php-8.3.0-Win32-vs16-x64\php.exe
) else (
    echo ERROR: PHP not found in common Laragon paths.
    echo Please run manually: psql -U postgres -f database/create_database.sql
    echo.
    pause
    exit /b 1
)

echo Using PHP: %PHP_PATH%
echo.

"%PHP_PATH%" database\create_database.php

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Database setup failed!
    echo Please check your PostgreSQL connection settings in config.php
    echo.
    pause
    exit /b 1
)

echo.
echo Database setup completed!
pause

