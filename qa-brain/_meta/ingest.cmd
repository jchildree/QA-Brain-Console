@echo off
REM Docker wrapper for ingest_notes.py -- keeps Python off the host.
REM .cmd not .ps1: batch files aren't gated by PowerShell execution policy.
setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: ingest.cmd "SourceFolder" [--tag TAG ...]
    exit /b 1
)

set "SOURCE=%~1"
set "META_DIR=%~dp0"
for %%I in ("%META_DIR%..\..") do set "REPO_ROOT=%%~fI"

docker build -t qa-brain-ingest -f "%META_DIR%Dockerfile" "%REPO_ROOT%"
if errorlevel 1 exit /b %errorlevel%

set "TAGARGS="
shift
:loop
if "%~1"=="" goto run
set "TAGARGS=!TAGARGS! %1"
shift
goto loop

:run
docker run --rm -v "%REPO_ROOT%:/vault" -v "%SOURCE%:/source" qa-brain-ingest /source !TAGARGS!
