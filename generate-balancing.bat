@echo off
REM Balancing Configuration Generator - Windows Batch Script
REM Double-click this file to regenerate embedded balancing data in js/resourceData.js

echo.
echo ========================================
echo  Johnson Prototype
echo  Balancing Configuration Generator
echo ========================================
echo.

node Tools/generate-balancing-embedded.js

echo.
echo ========================================
echo.
echo Press any key to close...
pause >nul
