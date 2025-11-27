<#
.SYNOPSIS
    Installs BackupMatrix as a Windows Service using PM2
.DESCRIPTION
    Configures PM2 to run BackupMatrix at system startup as a Windows Service
.NOTES
    Requires Administrator privileges
#>

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "BackupMatrix Windows Service Installation" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "[✓] Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Check if PM2 is installed
try {
    $pm2Version = pm2 --version
    Write-Host "[✓] PM2 detected: $pm2Version" -ForegroundColor Green
} catch {
    Write-Host "[!] PM2 not found. Installing PM2 globally..." -ForegroundColor Yellow
    npm install -g pm2
    npm install -g pm2-windows-service
    Write-Host "[✓] PM2 installed" -ForegroundColor Green
}

# Ensure pm2-windows-service is available (in case PM2 was installed earlier without it)
try {
    Get-Command pm2-service-install -ErrorAction Stop | Out-Null
} catch {
    Write-Host "[!] pm2-windows-service not found. Installing..." -ForegroundColor Yellow
    npm install -g pm2-windows-service
    Write-Host "[✓] pm2-windows-service installed" -ForegroundColor Green
}

# Navigate to project directory
$scriptPath = Split-Path -Parent $PSCommandPath
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host ""
Write-Host "Project Root: $projectRoot" -ForegroundColor Cyan
Write-Host ""

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path ".\backend\node_modules")) {
    Write-Host "[!] Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location ".\backend"
    npm install
    Set-Location $projectRoot
    Write-Host "[✓] Dependencies installed" -ForegroundColor Green
}

# Check if .env file exists
if (-not (Test-Path ".\backend\.env")) {
    Write-Host "[!] Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".\backend\.env.example" ".\backend\.env"
    Write-Host "[✓] .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Please edit backend\.env and configure:" -ForegroundColor Yellow
    Write-Host "  - Database credentials" -ForegroundColor Yellow
    Write-Host "  - JWT secret" -ForegroundColor Yellow
    Write-Host "  - Master API key" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter after editing .env file"
}

# Start application with PM2
Write-Host "[!] Starting BackupMatrix with PM2..." -ForegroundColor Yellow
pm2 delete backupmatrix -s 2>$null
pm2 start ecosystem.config.js
Write-Host "[✓] Application started" -ForegroundColor Green

# Save PM2 configuration
Write-Host "[!] Saving PM2 configuration..." -ForegroundColor Yellow
pm2 save
Write-Host "[✓] Configuration saved" -ForegroundColor Green

# Install PM2 as Windows Service
Write-Host "[!] Installing PM2 as Windows Service..." -ForegroundColor Yellow
try {
    pm2-service-install -n "PM2"
    Write-Host "[✓] Windows Service installed" -ForegroundColor Green
} catch {
    Write-Host "[!] Service may already be installed. Restarting..." -ForegroundColor Yellow
    Restart-Service -Name "PM2" -ErrorAction SilentlyContinue
}

# Configure service to start automatically
Set-Service -Name "PM2" -StartupType Automatic -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "BackupMatrix is now running as a Windows Service" -ForegroundColor Green
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  pm2 status          - View application status"
Write-Host "  pm2 logs            - View logs"
Write-Host "  pm2 restart all     - Restart application"
Write-Host "  pm2 monit           - Monitor resources"
Write-Host ""
Write-Host "Access the application at: http://localhost:3000" -ForegroundColor Green
Write-Host "Default login: Admin / admin123" -ForegroundColor Yellow
Write-Host "IMPORTANT: Change the password after first login!" -ForegroundColor Red
Write-Host ""
