@echo off
REM Script para actualizar URLs de API en Groovify
REM Uso: update-urls.bat https://tu-url.railway.app

if "%1"=="" (
    echo.
    echo Error: Debes proporcionar la URL del servidor
    echo Uso: update-urls.bat https://groovify-xxx.railway.app
    echo.
    pause
    exit /b 1
)

set API_URL=%1
echo.
echo ========================================
echo Actualizando URLs de API a: %API_URL%
echo ========================================
echo.

REM Actualizar DownloaderMusicPlayerContext.tsx
echo [1/3] Actualizando DownloaderMusicPlayerContext.tsx...
powershell -Command "(Get-Content 'project\contexts\DownloaderMusicPlayerContext.tsx') -replace 'const API_URL = .*', 'const API_URL = ''%API_URL%'',' | Set-Content 'project\contexts\DownloaderMusicPlayerContext.tsx'"

REM Actualizar AuthContext.tsx
echo [2/3] Actualizando AuthContext.tsx...
powershell -Command "(Get-Content 'project\contexts\AuthContext.tsx') -replace 'const API_URL = .*', 'const API_URL = ''%API_URL%'',' | Set-Content 'project\contexts\AuthContext.tsx'"

REM Actualizar DownloadsContext.tsx
echo [3/3] Actualizando DownloadsContext.tsx...
powershell -Command "(Get-Content 'project\contexts\DownloadsContext.tsx') -replace 'const API_URL = .*', 'const API_URL = ''%API_URL%'',' | Set-Content 'project\contexts\DownloadsContext.tsx'"

echo.
echo ✅ URLs actualizadas correctamente!
echo.
echo Próximos pasos:
echo 1. Verifica que los cambios sean correctos
echo 2. git add .
echo 3. git commit -m "feat: update API URLs for production"
echo 4. git push origin main
echo.
pause
