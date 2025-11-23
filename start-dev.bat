@echo off
echo ========================================
echo SaasV2 - Development Servers Baslatiliyor
echo ========================================
echo.
echo [1/2] .NET API baslatiliyor (http://localhost:5019)...
echo [2/2] Next.js baslatiliyor (http://localhost:3000)...
echo.
echo Her iki server da calisir durumda olacak.
echo Kapatmak icin Ctrl+C kullanin.
echo.
echo ========================================
echo.

cd saas-admin
npm run dev:all

