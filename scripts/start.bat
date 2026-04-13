@echo off
REM ─────────────────────────────────────────────────────────────────────────
REM Mission Control v2.0 — Start Script (Windows)
REM Uso: Doble clic en este archivo
REM ─────────────────────────────────────────────────────────────────────────

cls
echo.
echo  ╔════════════════════════════════════════════════════════════╗
echo  ║  🛸  Mission Control v2.0 - Starting...               ║
echo  ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar que Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ❌ Node.js NO se encuentra instalado
    echo.
    echo  Descargalo desde: https://nodejs.org/
    echo.
    echo  Después, vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

echo  ✅ Node.js detectado
node --version

REM Verificar que estamos en la carpeta correcta
if not exist "server.js" (
    echo.
    echo  ❌ Este script debe estar en la carpeta raíz del proyecto
    echo.
    echo  Carpeta actual: %cd%
    echo  Archivos encontrados: no server.js
    echo.
    pause
    exit /b 1
)

echo  ✅ Carpeta correcta
echo.

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo  📦 Instalando dependencias (primera vez, puede tomar 1-2 minutos)...
    call npm install
    if errorlevel 1 (
        echo.
        echo  ❌ Error instalando dependencias
        echo.
        pause
        exit /b 1
    )
    echo  ✅ Dependencias instaladas
    echo.
)

REM Instalar Playwright Chromium si no existe
if not exist "node_modules\playwright\.local-browsers\chromium*" (
    echo  📥 Descargando Chromium para tests (~130 MB)...
    call npx playwright install chromium
    if errorlevel 1 (
        echo.
        echo  ⚠️  Warning: Chromium no se instaló correctamente
        echo  Algunos tests podrían no funcionar
        echo.
    ) else (
        echo  ✅ Chromium listo
        echo.
    )
)

REM Iniciar el servidor
echo  🚀 Iniciando servidor...
echo.

REM Abrir navegador automáticamente (esperar 1 segundo)
timeout /t 1 /nobreak >nul
start http://localhost:3000 >nul 2>&1

REM Iniciar el servidor
call npm start

REM Si llegamos aquí, quiere decir que npm start falló o se cerró
echo.
if errorlevel 1 (
    echo  ❌ Error al iniciar el servidor
    echo.
)
pause
