# Restore PostgreSQL database from SQL dump file
# Defaults are taken from config.php: host=localhost, port=5432, db=fst_cost_db, user=postgres

# SQL dump file to restore - accept as parameter or use latest
param(
    [string]$DUMP_FILE = ""
)

$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "fst_cost_db"
$DB_USER = "postgres"

# Resolve script directory (database folder)
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $SCRIPT_DIR

# Try to read password from .env file in project root
$envFile = Join-Path (Split-Path $SCRIPT_DIR -Parent) ".env"
$PGPASSWORD = ""

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    foreach ($line in $envContent) {
        if ($line -match "^\s*DB_PASS\s*=\s*(.+)$") {
            $PGPASSWORD = $matches[1].Trim()
            break
        }
    }
}

# If not found in .env, prompt user
if ([string]::IsNullOrEmpty($PGPASSWORD)) {
    $securePassword = Read-Host "Enter PostgreSQL password for user '$DB_USER'" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $PGPASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

if ([string]::IsNullOrEmpty($DUMP_FILE)) {
    # Find latest backup file
    $backupFiles = Get-ChildItem -Path $SCRIPT_DIR -Filter "fst_cost_db_backup_*.sql" | Sort-Object LastWriteTime -Descending
    if ($backupFiles.Count -gt 0) {
        $DUMP_FILE = $backupFiles[0].Name
        Write-Host "Using latest backup: $DUMP_FILE" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: No backup files found matching pattern 'fst_cost_db_backup_*.sql'" -ForegroundColor Red
        Write-Host "Usage: .\restore_database.ps1 [-DUMP_FILE 'filename.sql']" -ForegroundColor Yellow
        exit 1
    }
}

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

