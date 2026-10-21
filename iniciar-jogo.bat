@echo off
REM ============================================================
REM  Naruto Card - inicia o servidor local e abre o navegador
REM  Windows: duplo clique neste arquivo
REM ============================================================
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo   Node.js nao encontrado!
    echo   Instale em https://nodejs.org (versao 18 ou maior) e tente de novo.
    echo.
    pause
    exit /b 1
)

start "" http://localhost:4173
node tools/serve.js

pause
