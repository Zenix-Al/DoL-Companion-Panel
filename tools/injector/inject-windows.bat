@echo off
setlocal

set "BASE_DIR=%~dp0"
set "APP_DIR=%BASE_DIR%Companion-Panel"
set "INJECTOR_UI=%APP_DIR%\companion-panel-injector.ps1"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on this machine.
  echo Please install Node.js LTS first: https://nodejs.org/
  pause
  exit /b 1
)

if not exist "%INJECTOR_UI%" (
  echo Companion Panel Injector was not found:
  echo %INJECTOR_UI%
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -STA -File "%INJECTOR_UI%"

if errorlevel 1 (
  echo.
  echo Companion Panel Injector ended with an error.
  pause
  exit /b 1
)

endlocal

