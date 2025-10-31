# PostgreSQL Database Backup Script
# Uses Laragon PostgreSQL path

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $PSScriptRoot "fst_cost_db_backup_$timestamp.sql"
$pgDump = "C:\laragon\bin\postgresql\postgresql\bin\pg_dump.exe"

# Database credentials
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "fst_cost_db"
$DB_USER = "postgres"
$env:PGPASSWORD = "123456789"

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

