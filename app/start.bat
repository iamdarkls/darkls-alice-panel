@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title DARKLS Alice Panel
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-darkls.ps1" %*
if errorlevel 1 pause
