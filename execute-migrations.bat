@echo off
REM Script para ejecutar migraciones de Supabase automáticamente
REM Windows batch file

echo.
echo ====================================================================
echo  EJECUTAR MIGRACIONES - App Desarrollo Integral
echo ====================================================================
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no está instalado
    pause
    exit /b 1
)

REM Ir al directorio del proyecto
cd /d "%~dp0"

echo 1. Abriendo Supabase SQL Editor en 3 segundos...
timeout /t 3 /nobreak

REM Abrir Supabase en navegador
start https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj/sql

echo.
echo 2. Copiando SQL de migraciones al portapapeles...

REM Usar PowerShell para copiar el contenido al portapapeles
powershell -NoProfile -Command "Get-Content 'migrations.sql' | Set-Clipboard"

if %ERRORLEVEL% EQ 0 (
    echo ✓ SQL copiado al portapapeles
) else (
    echo ! No se pudo copiar automáticamente, copia manualmente el archivo migrations.sql
)

echo.
echo ====================================================================
echo  PASOS A SEGUIR:
echo ====================================================================
echo.
echo 1. El navegador debe haber abierto Supabase SQL Editor
echo.
echo 2. Si no se abrió, ve a:
echo    https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj/sql
echo.
echo 3. Click en: "Create a new query"
echo.
echo 4. El SQL ya está en tu portapapeles. PEGA con Ctrl+V
echo    (Si no está, copia manualmente el archivo migrations.sql)
echo.
echo 5. Haz click en el botón "Run" (arriba a la derecha)
echo.
echo 6. Espera a que se ejecuten todas las migraciones
echo.
echo 7. Verás mensajes tipo: "CREATE TABLE" sin errores
echo.
echo ====================================================================
echo.
echo Una vez ejecutadas las migraciones, presiona cualquier tecla...
pause

echo.
echo Continuando con el siguiente paso...
echo.

REM Ejecutar siguiente paso - deploy a Vercel
echo 8. Ahora haremos deploy a Vercel...
timeout /t 2 /nobreak

cd /d "%~dp0"

echo Verificando acceso a repositorio git...
git status >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No es un repositorio git válido
    pause
    exit /b 1
)

echo.
echo Realizando push a GitHub...
git push origin main

if %ERRORLEVEL% EQ 0 (
    echo ✓ Push exitoso - Vercel comenzará el deploy automáticamente
    echo.
    echo Abriendo dashboard de Vercel...
    start https://vercel.com/desarrollointegral1s-projects/app-desarrollo-integral
) else (
    echo ! Error en push, intenta manualmente:
    echo   git push origin main
)

echo.
echo ====================================================================
echo  PROCESO COMPLETADO
echo ====================================================================
echo.
echo Las migraciones deberían estar ejecutadas en Supabase
echo El deploy a Vercel debería estar en progreso
echo.
pause
