@echo off
REM Contract Library Generator - Windows Batch Script
REM Double-click this file to regenerate js/contractLibrary.js

echo.
echo ========================================
echo  Johnson Prototype
echo  Contract Library Generator
echo ========================================
echo.

node Tools/generate-contract-library.js

echo.
echo ========================================
echo.
echo Press any key to close...
pause >nul
