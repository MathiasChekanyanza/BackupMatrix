<#
.SYNOPSIS
    Complete installation script for BackupMatrix on Windows
.DESCRIPTION
    Installs all dependencies and sets up BackupMatrix on Windows Server
.NOTES
    Requires Administrator privileges
#>

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "BackupMatrix Complete Installation" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Helper: check if a command exists on PATH
function Test-CommandExists {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Command
    )

    try {
        return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
    } catch {
        return $false
    }
}

# 1/5: Check Node.js
Write-Host "[1/5] Checking Node.js..." -ForegroundColor Yellow
if (Test-CommandExists "node") {
    $nodeVersion = node --version
    Write-Host "  [✓] Node.js $nodeVersion installed" -ForegroundColor Green
} else {
    Write-Host "  [✗] Node.js not found!" -ForegroundColor Red
    Write-Host "" 
    Write-Host "Please install Node.js 18.x or higher from:" -ForegroundColor Yellow
    Write-Host "  https://nodejs.org/en/download/" -ForegroundColor Cyan
    Write-Host "" 
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

# 2/5: Check PostgreSQL
Write-Host "" 
Write-Host "[2/5] Checking PostgreSQL..." -ForegroundColor Yellow
if (Test-CommandExists "psql") {
    $pgVersion = psql --version
    Write-Host "  [✓] PostgreSQL installed: $pgVersion" -ForegroundColor Green
} else {
    Write-Host "  [✗] PostgreSQL not found!" -ForegroundColor Red
    Write-Host "" 
    Write-Host "Please install PostgreSQL 14 or higher from:" -ForegroundColor Yellow
    Write-Host "  https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host "" 
    Write-Host "After installation:" -ForegroundColor Yellow
    Write-Host "  1. Run scripts\setup-database.sql to create the database" -ForegroundColor Yellow
    Write-Host "  2. Update backend\.env with your database credentials" -ForegroundColor Yellow
    Write-Host "  3. Restart this script" -ForegroundColor Yellow
    exit 1
}

# 3/5: Install PM2
Write-Host "" 
Write-Host "[3/5] Installing PM2..." -ForegroundColor Yellow
if (-not (Test-CommandExists "pm2")) {
    npm install -g pm2 pm2-windows-service
    Write-Host "  [✓] PM2 installed" -ForegroundColor Green
} else {
    Write-Host "  [✓] PM2 already installed" -ForegroundColor Green
}

# 4/5: Install backend dependencies
Write-Host "" 
Write-Host "[4/5] Installing backend dependencies..." -ForegroundColor Yellow
$scriptPath  = Split-Path -Parent $PSCommandPath
$projectRoot = Split-Path -Parent $scriptPath
Set-Location "$projectRoot\backend"
npm install
Write-Host "  [✓] Backend dependencies installed" -ForegroundColor Green

# 5/5: Setup environment file
Write-Host "" 
Write-Host "[5/5] Configuring environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  [✓] .env file created" -ForegroundColor Green

    # Generate random secrets
    $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
    $apiKey    = [guid]::NewGuid().ToString()

    # Update .env with generated secrets
    (Get-Content ".env") -replace 'your_jwt_secret_key_here_change_in_production', $jwtSecret | Set-Content ".env"
    (Get-Content ".env") -replace 'your_master_api_key_here_change_in_production', $apiKey    | Set-Content ".env"

    Write-Host "" 
    Write-Host "  Generated Master API Key: $apiKey" -ForegroundColor Cyan
    Write-Host "  (Save this key - you'll need it for agent deployment)" -ForegroundColor Yellow
    Write-Host "" 
} else {
    Write-Host "  [✓] .env file already exists" -ForegroundColor Green
}

# Run database migrations
Write-Host "" 
Write-Host "Running database migrations..." -ForegroundColor Yellow
npm run migrate
Write-Host "  [✓] Migrations complete" -ForegroundColor Green

# Seed initial data
Write-Host "" 
Write-Host "Seeding initial data..." -ForegroundColor Yellow
npm run seed
Write-Host "  [✓] Initial data seeded" -ForegroundColor Green

# Return to project root for the final instructions
Set-Location $projectRoot

Write-Host "" 
Write-Host "===========================================" -ForegroundColor Green
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host "" 
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review and update backend\.env if needed" -ForegroundColor White
Write-Host "  2. Run: .\scripts\install-service.ps1 to install as Windows Service" -ForegroundColor White
Write-Host "  3. Access the dashboard at: http://localhost:3000" -ForegroundColor White
Write-Host "" 
Write-Host "Default Login Credentials:" -ForegroundColor Cyan
Write-Host "  Username: Admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host "  IMPORTANT: Change password after first login!" -ForegroundColor Red
Write-Host "" 
Write-Host "To deploy agents to all servers:" -ForegroundColor Cyan
Write-Host "  1. Edit agents\deploy-agents.ps1 with your server list" -ForegroundColor White
Write-Host "  2. Run the deployment script" -ForegroundColor White
Write-Host "" 
