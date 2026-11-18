@echo off
setlocal
cd /d "%~dp0apps\api"

where python >nul 2>nul
if errorlevel 1 (
  echo ERRO: Python nao encontrado. Instale Python 3.11 ou superior.
  pause
  exit /b 1
)

if not exist .venv\Scripts\python.exe (
  echo Criando ambiente virtual...
  python -m venv .venv
)

.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 (
  echo ERRO: falha ao instalar dependencias da API.
  pause
  exit /b 1
)

.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
pause
