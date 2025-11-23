@echo off
echo Cleaning up...

REM Remove Next.js lock file
if exist ".next\dev\lock" (
    del /f /q ".next\dev\lock"
    echo Removed .next lock file
)

REM Stop dotnet processes (requires taskkill)
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq dotnet.exe" /FO LIST ^| findstr /I "PID"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Cleanup complete!
pause

