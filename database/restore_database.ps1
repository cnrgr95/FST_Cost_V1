# Restore PostgreSQL database from SQL dump file
# Defaults are taken from config.php: host=localhost, port=5432, db=fst_cost_db, user=postgres

$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "fst_cost_db"
$DB_USER = "postgres"
$PGPASSWORD = "123456789"

# Resolve script directory (database folder)
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $SCRIPT_DIR

# SQL dump file to restore
$DUMP_FILE = "fst_cost_db_backup_20251101_010400.sql"

# Check if dump file exists
if (-not (Test-Path $DUMP_FILE)) {
    Write-Host ""
    Write-Host "ERROR: Dump file not found: $DUMP_FILE" -ForegroundColor Red
    Write-Host "Please ensure the file exists in the database folder."
    Write-Host ""
    exit 1
}

# Try to locate PostgreSQL bin if not on PATH
$PGBIN = $null

# Check Laragon first (common development environment)
if (Test-Path "C:\laragon\bin\postgresql\postgresql\bin\psql.exe") {
    $PGBIN = "C:\laragon\bin\postgresql\postgresql\bin"
}

# Check standard PostgreSQL installations
if (-not $PGBIN) {
    foreach ($version in 16, 15, 14, 13, 12, 11, 10) {
        $path1 = "C:\Program Files\PostgreSQL\$version\bin\psql.exe"
        $path2 = "C:\Program Files (x86)\PostgreSQL\$version\bin\psql.exe"
        if (Test-Path $path1) {
            $PGBIN = "C:\Program Files\PostgreSQL\$version\bin"
            break
        }
        if (Test-Path $path2) {
            $PGBIN = "C:\Program Files (x86)\PostgreSQL\$version\bin"
            break
        }
    }
}

# Add PostgreSQL bin to PATH if found
if ($PGBIN) {
    $env:PATH = "$PGBIN;$env:PATH"
}

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "FST Cost Management - Database Restore" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Restoring database from: $DUMP_FILE" -ForegroundColor Yellow
Write-Host "Database: $DB_NAME" -ForegroundColor Yellow
Write-Host "Host: ${DB_HOST}:${DB_PORT}" -ForegroundColor Yellow
Write-Host "User: $DB_USER" -ForegroundColor Yellow
Write-Host ""

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $PGPASSWORD

# Restore the database using psql
# The dump file already contains CREATE DATABASE commands, so we connect to postgres first
$result = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -f $DUMP_FILE 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host "✗ Database restore failed!" -ForegroundColor Red
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL server is running" -ForegroundColor Yellow
    Write-Host "  2. Database credentials are correct" -ForegroundColor Yellow
    Write-Host "  3. You have permission to create/restore databases" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $result
    exit 1
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "✓ Database restored successfully!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

