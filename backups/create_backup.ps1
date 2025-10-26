# Database Backup Script
$ErrorActionPreference = "Stop"

Write-Host "Creating database backup..." -ForegroundColor Green

$pgDump = "C:\laragon\bin\postgresql\postgresql\bin\pg_dump.exe"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = "fst_cost_db_backup_$timestamp.sql"

# Set password
$env:PGPASSWORD = "123456789"

try {
    & $pgDump -h localhost -p 5432 -U postgres -F p -f $outputFile fst_cost_db
    
    Write-Host "Backup created successfully: $outputFile" -ForegroundColor Green
} catch {
    Write-Host "Backup failed: $_" -ForegroundColor Red
} finally {
    # Clear password
    $env:PGPASSWORD = ""
}

