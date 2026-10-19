# ============================================================
# RetailHub Portable ZIP Builder
# ============================================================

param(
    [string]$OutputName = "RetailHub-Portable-v1.0.0"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   RetailHub - Portable ZIP Builder"                       -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Paths
$ProjectRoot    = $PSScriptRoot
$WinUnpacked    = Join-Path $ProjectRoot "client\release\win-unpacked"
$StagingDir     = Join-Path $ProjectRoot "client\release\_staging_portable"
$OutputZip      = Join-Path $ProjectRoot "client\release\$OutputName.zip"

# 1. Validate win-unpacked exists
if (-not (Test-Path $WinUnpacked)) {
    Write-Host "[ERROR] win-unpacked folder not found!" -ForegroundColor Red
    Write-Host "  $WinUnpacked" -ForegroundColor Yellow
    exit 1
}

$exePath = Join-Path $WinUnpacked "RetailHub.exe"
if (-not (Test-Path $exePath)) {
    Write-Host "[ERROR] RetailHub.exe not found in win-unpacked!" -ForegroundColor Red
    exit 1
}

# 2. Clean previous staging
if (Test-Path $StagingDir) {
    Write-Host "[*] Cleaning previous staging directory..." -ForegroundColor Gray
    Remove-Item $StagingDir -Recurse -Force
}

# 3. Create staging directory
$AppDir = Join-Path $StagingDir "RetailHub"
Write-Host "[1/5] Creating staging directory..." -ForegroundColor Green
New-Item -ItemType Directory -Path $AppDir -Force | Out-Null

# 4. Copy win-unpacked contents
Write-Host "[2/5] Copying application files..." -ForegroundColor Green
Copy-Item -Path "$WinUnpacked\*" -Destination $AppDir -Recurse -Force

# 5. Optimize: remove unnecessary files
Write-Host "[3/5] Optimizing package size..." -ForegroundColor Green

$chromiumLicense = Join-Path $AppDir "LICENSES.chromium.html"
if (Test-Path $chromiumLicense) {
    Remove-Item $chromiumLicense -Force
    Write-Host "  - Removed LICENSES.chromium.html" -ForegroundColor DarkGray
}

$apiDir = Join-Path $AppDir "resources\api"
if (Test-Path $apiDir) {
    Get-ChildItem -Path $apiDir -Filter "*.pdb" -Recurse | ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host "  - Removed $($_.Name)" -ForegroundColor DarkGray
    }

    $devSettings = Join-Path $apiDir "appsettings.Development.json"
    if (Test-Path $devSettings) {
        Remove-Item $devSettings -Force
        Write-Host "  - Removed appsettings.Development.json" -ForegroundColor DarkGray
    }
}

# 6. Create launcher batch file
Write-Host "[4/5] Creating launcher script..." -ForegroundColor Green

$launcherLines = @(
    '@echo off'
    'chcp 65001 >nul 2>&1'
    'title RetailHub POS'
    'color 0b'
    'echo.'
    'echo  RetailHub POS - Starting...'
    'echo.'
    'cd /d "%~dp0"'
    'if not exist "RetailHub.exe" ('
    '    echo  [Error] RetailHub.exe not found!'
    '    pause'
    '    exit /b 1'
    ')'
    'start "" "RetailHub.exe"'
)

$launcherPath = Join-Path $AppDir "Start-RetailHub.bat"
$launcherLines | Set-Content -Path $launcherPath -Encoding UTF8

# 7. Create README file
Write-Host "[4/5] Creating README..." -ForegroundColor Green

$readmeLines = @(
    "================================================================"
    "  RetailHub POS - Quick Start Guide"
    "================================================================"
    ""
    "  How to run:"
    "  -----------"
    "  1. Extract the entire folder"
    "  2. Open the 'RetailHub' folder"
    "  3. Run 'Start-RetailHub.bat' or 'RetailHub.exe'"
    ""
    "  Important notes:"
    "  ----------------"
    "  - Do NOT delete any files from this folder"
    "  - If Windows Defender shows a warning, click"
    "    'More info' then 'Run anyway'"
    "  - The app uses port 5150 - make sure it is free"
    "  - You can move this folder anywhere on your PC"
    ""
    "  Version: 1.0.0"
    "================================================================"
)

$readmePath = Join-Path $AppDir "README.txt"
$readmeLines | Set-Content -Path $readmePath -Encoding UTF8

# 8. Create ZIP
Write-Host "[5/5] Creating ZIP file..." -ForegroundColor Green

if (Test-Path $OutputZip) {
    Remove-Item $OutputZip -Force
}

Add-Type -Assembly "System.IO.Compression.FileSystem"
[System.IO.Compression.ZipFile]::CreateFromDirectory(
    $StagingDir,
    $OutputZip,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false
)

# 9. Cleanup
Write-Host "[*] Cleaning up staging..." -ForegroundColor Gray
Remove-Item $StagingDir -Recurse -Force

# 10. Summary
$zipSize = (Get-Item $OutputZip).Length
$zipSizeMB = [math]::Round($zipSize / 1MB, 1)

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "   Done! ZIP created successfully." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  File: $OutputZip" -ForegroundColor White
Write-Host "  Size: $zipSizeMB MB" -ForegroundColor White
Write-Host ""
Write-Host "  Send this file to the client." -ForegroundColor Yellow
Write-Host "  They extract and run RetailHub.exe" -ForegroundColor Yellow
Write-Host ""
