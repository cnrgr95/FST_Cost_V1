# FST Cost Management - Vendor Dependency Check
# Change to project root directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host "=== Checking Vendor Dependencies ===" -ForegroundColor Cyan
Write-Host ""

$errors = 0

$checks = @(
    @{ Name = "vendor/autoload.php"; Path = "vendor\autoload.php" },
    @{ Name = "HTMLPurifier.composer.php"; Path = "vendor\ezyang\htmlpurifier\library\HTMLPurifier.composer.php" },
    @{ Name = "HTMLPurifier library"; Path = "vendor\ezyang\htmlpurifier\library"; IsDir = $true },
    @{ Name = "PhpSpreadsheet"; Path = "vendor\phpoffice\phpspreadsheet"; IsDir = $true },
    @{ Name = "Composer autoload"; Path = "vendor\composer\autoload_real.php" }
)

foreach ($check in $checks) {
    if (Test-Path $check.Path) {
        if ($check.IsDir) {
            $files = (Get-ChildItem $check.Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
            Write-Host "OK: $($check.Name) ($files files)" -ForegroundColor Green
        } else {
            Write-Host "OK: $($check.Name)" -ForegroundColor Green
        }
    } else {
        Write-Host "ERROR: $($check.Name) NOT FOUND" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
if ($errors -eq 0) {
    Write-Host "=== All Dependencies OK ===" -ForegroundColor Green
    exit 0
} else {
    Write-Host "=== $errors Error(s) Found ===" -ForegroundColor Red
    Write-Host "Run: .\scripts\install_dependencies.ps1" -ForegroundColor Yellow
    exit 1
}
