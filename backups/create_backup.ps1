# FST Cost Management - Database Backup Script
# PowerShell script for creating database backups

# Set execution policy
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# Database configuration
$env:PGPASSWORD = "123456789"
$backupDir = "$PSScriptRoot"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFileName = "fst_cost_db_backup_$timestamp.sql"
$backupFilePath = Join-Path $backupDir $backupFileName

# PostgreSQL paths
$pgDumpPath = "C:\laragon\bin\postgresql\postgresql\bin\pg_dump.exe"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "=== FST Cost Management - Database Backup ===" -ForegroundColor Green
Write-Output ""

# Check if pg_dump exists
if (-not (Test-Path $pgDumpPath)) {
    Write-ColorOutput Red "Error: pg_dump not found at $pgDumpPath" -ForegroundColor Red
    Remove-Item Env:\PGPASSWORD
    exit 1
}

Write-Output "Creating backup..."
Write-Output "Backup file: $backupFilePath"
Write-Output ""

# Create backup using pg_dump
$arguments = @(
    '--host=localhost',
    '--port=5432',
    '--username=postgres',
    '--dbname=fst_cost_db',
    '--format=plain',
    '--encoding=UTF-8',
    '--no-owner',
    '--no-privileges',
    '--clean',
    '--if-exists',
    "--file=$backupFilePath"
)

# Execute pg_dump and check result
& $pgDumpPath $arguments
$pgDumpExitCode = $LASTEXITCODE

if ($pgDumpExitCode -eq 0 -and (Test-Path $backupFilePath)) {
    $fileSize = (Get-Item $backupFilePath).Length
    $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
    
    Write-ColorOutput Green "✓ Backup created successfully!" -ForegroundColor Green
    Write-Output "  File: $backupFileName"
    Write-Output "  Size: $fileSizeMB MB"
    Write-Output ""
    
    # Create tar.gz archive
    $tarFileName = $backupFileName.Replace(".sql", ".tar.gz")
    $tarFilePath = Join-Path $backupDir $tarFileName
    
    Write-Output "Creating compressed archive..."
    Push-Location $backupDir
    tar czf $tarFileName $backupFileName
    Pop-Location
    
    if (Test-Path $tarFilePath) {
        $tarSize = (Get-Item $tarFilePath).Length
        $tarSizeKB = [math]::Round($tarSize / 1KB, 2)
        
        Write-ColorOutput Green "✓ Archive created successfully!" -ForegroundColor Green
        Write-Output "  File: $tarFileName"
        Write-Output "  Size: $tarSizeKB KB"
        Write-Output ""
        
        # Remove original SQL file
        Remove-Item $backupFilePath
        Write-Output "✓ Cleanup completed"
    }
    
    # Keep only last 5 backups
    Write-Output "Cleaning old backups..."
    $oldBackups = Get-ChildItem -Path $backupDir -Filter "fst_cost_db_backup_*.tar.gz" | Sort-Object LastWriteTime -Descending
    if ($oldBackups.Count -gt 5) {
        $oldBackups | Select-Object -Skip 5 | Remove-Item
        Write-Output "✓ Old backups cleaned"
    }
    
    Write-Output ""
    Write-ColorOutput Green "=== Backup Complete ===" -ForegroundColor Green
    Write-Output "Backup location: $tarFilePath"
} else {
    Write-ColorOutput Red "✗ Error: Backup failed" -ForegroundColor Red
    Write-Output "Exit code: $pgDumpExitCode"
    Remove-Item Env:\PGPASSWORD
    exit 1
}

# Clear password from environment
Remove-Item Env:\PGPASSWORD
