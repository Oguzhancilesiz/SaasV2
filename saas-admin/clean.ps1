# Clean script for saas-admin
Write-Host "Cleaning up..." -ForegroundColor Yellow

# Remove Next.js lock file
if (Test-Path ".next\dev\lock") {
    Remove-Item -Path ".next\dev\lock" -Force
    Write-Host "✓ Removed .next lock file" -ForegroundColor Green
}

# Remove entire .next folder if it exists (for complete cleanup)
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "✓ Removed .next folder" -ForegroundColor Green
}

# Stop dotnet processes related to SaasV2
$dotnetProcesses = Get-Process | Where-Object {
    $_.ProcessName -like "*dotnet*" -and 
    $_.Path -like "*SaasV2*"
}

if ($dotnetProcesses) {
    $dotnetProcesses | Stop-Process -Force
    Write-Host "Stopped dotnet processes" -ForegroundColor Green
} else {
    Write-Host "No dotnet processes to stop" -ForegroundColor Green
}

Write-Host "Cleanup complete!" -ForegroundColor Green
