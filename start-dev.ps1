# PowerShell script - Her iki projeyi paralel çalıştırır

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SaasV2 - Development Servers Başlatılıyor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1/2] .NET API başlatılıyor (http://localhost:5019)..." -ForegroundColor Yellow
Write-Host "[2/2] Next.js başlatılıyor (http://localhost:3000)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Her iki server da çalışır durumda olacak." -ForegroundColor Green
Write-Host "Kapatmak için Ctrl+C kullanın." -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location saas-admin
npm run dev:all

