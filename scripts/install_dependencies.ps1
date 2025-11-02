# FST Cost Management - Dependency Installation Script
# Supports PHP 7.4+ and all PHP 8.x versions
param([switch]$Dev)

Write-Host "=== FST Cost Management - Installing Dependencies ===" -ForegroundColor Green
Write-Host ""

function Find-PHPExecutable {
    $phpPaths = @()
    $laragonBase = "C:\laragon\bin\php"
    
    # Auto-detect PHP in Laragon (all versions)
    if (Test-Path $laragonBase) {
        $phpDirs = Get-ChildItem $laragonBase -Directory -ErrorAction SilentlyContinue | 
                   Where-Object { $_.Name -match "^php-(7\.4|8\.)" } |
                   Sort-Object Name -Descending
        
        foreach ($dir in $phpDirs) {
            $phpExe = Join-Path $dir.FullName "php.exe"
            if (Test-Path $phpExe) {
                $phpPaths += $phpExe
            }
        }
    }
    
    # Common fallback paths
    @(
        "C:\Program Files\PHP\php.exe",
        "C:\xampp\php\php.exe"
    ) | ForEach-Object {
        if (Test-Path $_) { $phpPaths += $_ }
    }
    
    # Check PATH
    $phpInPath = Get-Command php -ErrorAction SilentlyContinue
    if ($phpInPath) { $phpPaths += $phpInPath.Source }
    
    return $phpPaths
}

$phpPaths = Find-PHPExecutable

if ($phpPaths.Count -eq 0) {
    Write-Host "✗ PHP not found!" -ForegroundColor Red
    Write-Host "Please install PHP 7.4+ or 8.x" -ForegroundColor Yellow
    Write-Host "Common locations: C:\laragon\bin\php\, C:\Program Files\PHP\, C:\xampp\php\" -ForegroundColor Yellow
    exit 1
}

$phpExecutable = $phpPaths[0]
Write-Host "✓ Found PHP: $phpExecutable" -ForegroundColor Green

# Verify PHP version
$phpVersion = & $phpExecutable -r "echo PHP_VERSION;"
Write-Host "✓ PHP Version: $phpVersion" -ForegroundColor Cyan

$versionParts = $phpVersion -split '\.'
if ([int]$versionParts[0] -lt 7 -or ([int]$versionParts[0] -eq 7 -and [int]$versionParts[1] -lt 4)) {
    Write-Host "✗ PHP $phpVersion not supported (requires 7.4+)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Change to project root directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Push-Location $projectRoot

# Download composer.phar if missing
if (-not (Test-Path "composer.phar")) {
    Write-Host "Downloading composer.phar..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri "https://getcomposer.org/composer.phar" -OutFile "composer.phar" -ErrorAction Stop
        Write-Host "✓ composer.phar downloaded" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to download composer.phar" -ForegroundColor Red
        Write-Host "Download from: https://getcomposer.org/download/" -ForegroundColor Yellow
        Pop-Location
        exit 1
    }
}

Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

$installFlag = if ($Dev) { "" } else { "--no-dev" }
& $phpExecutable composer.phar install $installFlag
$exitCode = $LASTEXITCODE

Pop-Location

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
    Write-Host "=== Installation Complete ===" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "✗ Installation failed (Exit code: $exitCode)" -ForegroundColor Red
    exit 1
}
