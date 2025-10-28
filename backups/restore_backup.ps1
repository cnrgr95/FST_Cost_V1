# FST Cost Management - Database Restore Script
# PowerShell script for restoring database from backup

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

# Database configuration
$env:PGPASSWORD = "123456789"

# PostgreSQL paths
$psqlPath = "C:\laragon\bin\postgresql\postgresql\bin\psql.exe"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "=== FST Cost Management - Database Restore ===" -ForegroundColor Green
Write-Output ""

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-ColorOutput Red "Error: Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

# Check if psql exists
if (-not (Test-Path $psqlPath)) {
    Write-ColorOutput Red "Error: psql not found at $psqlPath" -ForegroundColor Red
    exit 1
}

Write-Output "Backup file: $BackupFile"
Write-Output "Target database: fst_cost_db"
Write-Output ""

# Warning
Write-ColorOutput Red "WARNING: This will overwrite the current database!" -ForegroundColor Red
Write-Output "Database: fst_cost_db"
Write-Output "Host: localhost:5432"
Write-Output "User: postgres"
Write-Output ""
$confirmation = Read-Host "Are you sure you want to continue? (y/n)"

if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Output "Restore cancelled."
    Remove-Item Env:\PGPASSWORD
    exit 0
}

Write-Output ""
Write-Output "Starting restore process..."
Write-Output ""

# Extract tar.gz if needed
$sqlFile = $BackupFile
if ($BackupFile.EndsWith(".tar.gz")) {
    Write-Output "Extracting archive..."
    
    $tempDir = Join-Path $PSScriptRoot "restore_temp"
    if (-not (Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir | Out-Null
    }
    
    Push-Location $tempDir
    tar xzf $BackupFile
    Pop-Location
    
    $sqlFile = Get-ChildItem -Path $tempDir -Filter "*.sql" | Select-Object -First 1 -ExpandProperty FullName
    
    if (-not $sqlFile) {
        Write-ColorOutput Red "Error: No SQL file found in archive" -ForegroundColor Red
        Remove-Item Env:\PGPASSWORD
        exit 1
    }
    
    Write-ColorOutput Green "✓ Extraction complete" -ForegroundColor Green
    Write-Output ""
}

# Restore database
Write-Output "Restoring database..."
$psqlCommand = "$psqlPath --host=localhost --port=5432 --username=postgres --dbname=fst_cost_db -f ""$sqlFile"""
$psqlOutput = cmd /c "$psqlCommand 2>&1"

if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput Green "✓ Restore completed successfully!" -ForegroundColor Green
    Write-Output ""
    
    # Cleanup
    if ($BackupFile.EndsWith(".tar.gz") -and (Test-Path $tempDir)) {
        Write-Output "Cleaning up temporary files..."
        Remove-Item -Recurse -Force $tempDir
        Write-Output "✓ Cleanup completed"
    }
    
    Write-Output ""
    Write-ColorOutput Green "=== Restore Complete ===" -ForegroundColor Green
} else {
    Write-ColorOutput Red "✗ Error: Restore failed" -ForegroundColor Red
    Write-Output $psqlOutput
}

# Clear password from environment
Remove-Item Env:\PGPASSWORD

