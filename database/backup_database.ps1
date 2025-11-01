# PostgreSQL Database Backup Script
# Automatically detects PostgreSQL installation path

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $PSScriptRoot "fst_cost_db_backup_$timestamp.sql"

# Try to find pg_dump.exe automatically
$pgDump = $null
$possiblePaths = @(
    "pg_dump.exe",  # If PostgreSQL is in PATH
    "C:\laragon\bin\postgresql\postgresql\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\13\bin\pg_dump.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\pg_dump.exe",
    "C:\Program Files (x86)\PostgreSQL\14\bin\pg_dump.exe",
    "C:\Program Files (x86)\PostgreSQL\13\bin\pg_dump.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path -ErrorAction SilentlyContinue) {
        $pgDump = $path
        break
    }
}

# If not found, try to find in Program Files
if (-not $pgDump) {
    $pgInstalls = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory -ErrorAction SilentlyContinue
    foreach ($pgInstall in $pgInstalls) {
        $pgDumpPath = Join-Path $pgInstall.FullName "bin\pg_dump.exe"
        if (Test-Path $pgDumpPath) {
            $pgDump = $pgDumpPath
            break
        }
    }
}

# Database credentials - Read from .env file or use defaults
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "fst_cost_db"
$DB_USER = "postgres"

# Try to read password from .env file in project root
$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) ".env"
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

$env:PGPASSWORD = $PGPASSWORD

# Check if pg_dump exists
if (-not (Test-Path $pgDump)) {
    Write-Host "ERROR: PostgreSQL pg_dump not found at: $pgDump" -ForegroundColor Red
    exit 1
}

Write-Host "Starting database backup..." -ForegroundColor Cyan
Write-Host "Database: $DB_NAME" -ForegroundColor Gray
Write-Host "Backup file: $backupFile" -ForegroundColor Gray
Write-Host ""

# Run pg_dump
& $pgDump -h $DB_HOST -p $DB_PORT -U $DB_USER -F p --create --clean --if-exists -v -d $DB_NAME | Out-File -FilePath $backupFile -Encoding UTF8

if ($LASTEXITCODE -eq 0) {
    $fileInfo = Get-Item $backupFile
    $fileSize = [math]::Round($fileInfo.Length / 1MB, 2)
    Write-Host ""
    Write-Host "SUCCESS: Backup created successfully!" -ForegroundColor Green
    Write-Host "  File: $($fileInfo.Name)" -ForegroundColor White
    Write-Host "  Size: $fileSize MB" -ForegroundColor White
    Write-Host "  Date: $($fileInfo.LastWriteTime)" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "ERROR: Backup failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

