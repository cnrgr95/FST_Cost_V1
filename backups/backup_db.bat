@echo off
echo Creating database backup...
echo.

set PGPASSWORD=123456789
pg_dump -h localhost -p 5432 -U postgres -F p -f "fst_cost_db_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql" fst_cost_db

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Backup created successfully!
) else (
    echo.
    echo Backup failed!
)

set PGPASSWORD=

