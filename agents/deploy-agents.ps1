<#
.SYNOPSIS
    Mass deployment script for BackupMatrix agents
.DESCRIPTION
    Deploys backup agents to all servers in the network with customized configuration
.EXAMPLE
    .\deploy-agents.ps1
#>

param(
    [string]$ApiUrl = "http://10.216.0.44:3000/api/v1/report",
    [string]$ApiKey = "YOUR-API-KEY-HERE",
    [string[]]$ScheduleTimes = @("10:00", "22:00"),  # two backups per day
    [string]$AgentScriptPath = ".\backup-and-report.bat"
)

# Define your servers (customize this list)
$servers = @(
    @{ Name = "SERVER01"; Shop = "Shop 1"; Database = "SALES"; SQLUser = "mm"; SQLPassword = "dema12" },
    @{ Name = "SERVER02"; Shop = "Shop 2"; Database = "SALES"; SQLUser = "mm"; SQLPassword = "dema12" },
    @{ Name = "SERVER03"; Shop = "Shop 3"; Database = "SALES"; SQLUser = "mm"; SQLPassword = "dema12" }
    # Add all 40 servers here...
)

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "BackupMatrix Agent Mass Deployment" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl"
Write-Host "Schedule Times: $($ScheduleTimes -join ', ')"
Write-Host "Total Servers: $($servers.Count)"
Write-Host ""

$successCount = 0
$failureCount = 0

foreach ($server in $servers) {
    Write-Host "Deploying to $($server.Name) ($($server.Shop))..." -ForegroundColor Yellow
    
    try {
        # Test connectivity
        if (-not (Test-Connection -ComputerName $server.Name -Count 1 -Quiet)) {
            Write-Host "  ERROR: Cannot reach $($server.Name)" -ForegroundColor Red
            $failureCount++
            continue
        }

        # Read template script
        $scriptContent = Get-Content $AgentScriptPath -Raw
        
        # Customize script for this server
        $scriptContent = $scriptContent -replace 'set API_URL=.*', "set API_URL=$ApiUrl"
        $scriptContent = $scriptContent -replace 'set API_KEY=.*', "set API_KEY=$ApiKey"
        $scriptContent = $scriptContent -replace 'set SHOP_NAME=.*', "set SHOP_NAME=$($server.Shop)"
        $scriptContent = $scriptContent -replace 'set DATABASE_NAME=.*', "set DATABASE_NAME=$($server.Database)"
        $scriptContent = $scriptContent -replace 'set SQL_USER=.*', "set SQL_USER=$($server.SQLUser)"
        $scriptContent = $scriptContent -replace 'set SQL_PASSWORD=.*', "set SQL_PASSWORD=$($server.SQLPassword)"
        
        # Copy script to remote server
        $remotePath = "\\$($server.Name)\C$\BackupMatrix"
        if (-not (Test-Path $remotePath)) {
            New-Item -Path $remotePath -ItemType Directory -Force | Out-Null
        }
        
        $scriptContent | Set-Content "$remotePath\backup-and-report.bat" -Force
        Write-Host "  Script deployed" -ForegroundColor Green
        
        # Create scheduled task
        $taskName = "BackupMatrix-Backup"
        $scriptPath = "C:\\BackupMatrix\\backup-and-report.bat"
        
        Invoke-Command -ComputerName $server.Name -ScriptBlock {
            param($TaskName, $ScriptPath, $ScheduleTimes)
            
            # Remove existing task if present
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
            
            # Create triggers for each time
            $triggers = @()
            foreach ($time in $ScheduleTimes) {
                $triggers += New-ScheduledTaskTrigger -Daily -At $time
            }

            # Create new task
            $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$ScriptPath`" >> C:\\BackupMatrix\\backup.log 2>&1"
            $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
            $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
            
            Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $triggers -Principal $principal -Settings $settings
        } -ArgumentList $taskName, $scriptPath, $ScheduleTimes
        
        Write-Host "  Scheduled task created (runs at: $($ScheduleTimes -join ', '))" -ForegroundColor Green
        Write-Host "  SUCCESS" -ForegroundColor Green
        $successCount++
        
    } catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
        $failureCount++
    }
    
    Write-Host ""
}

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failureCount" -ForegroundColor Red
Write-Host ""
Write-Host "NOTE: Verify deployment by checking BackupMatrix dashboard" -ForegroundColor Yellow
Write-Host "after scheduled backup times ($($ScheduleTimes -join ', '))" -ForegroundColor Yellow
