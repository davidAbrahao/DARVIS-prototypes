@echo off
setlocal
cd /d "%~dp0apps\web"

echo.
echo  D.A.R.V.I.S. - iniciando interface local
 echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado. Instale Node.js 20.9 ou superior.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias da interface...
  call npm install
  if errorlevel 1 (
    echo ERRO: nao foi possivel instalar as dependencias.
    pause
    exit /b 1
  )
)

call npm run dev
pause
