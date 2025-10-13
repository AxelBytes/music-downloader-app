Write-Host "🚀 INICIANDO BUILD Y DEPLOY DE GROOVIFY..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio del proyecto." -ForegroundColor Red
    exit 1
}

Write-Host "📱 Verificando configuración de la app..." -ForegroundColor Yellow
node verify-app-config.js

Write-Host ""
Write-Host "🔧 Limpiando cache y reinstalando dependencias..." -ForegroundColor Yellow
npm install --legacy-peer-deps

Write-Host ""
Write-Host "📦 Creando build de desarrollo..." -ForegroundColor Cyan
eas build --platform android --profile development --non-interactive

Write-Host ""
Write-Host "📦 Creando build de preview..." -ForegroundColor Cyan
eas build --platform android --profile preview --non-interactive

Write-Host ""
Write-Host "📦 Creando build de producción..." -ForegroundColor Cyan
eas build --platform android --profile production --non-interactive

Write-Host ""
Write-Host "📋 RESUMEN DE BUILDS:" -ForegroundColor Green
Write-Host "   - Development: Para testing interno" -ForegroundColor White
Write-Host "   - Preview: Para testing con usuarios" -ForegroundColor White
Write-Host "   - Production: Para distribución final" -ForegroundColor White

Write-Host ""
Write-Host "🎉 ¡BUILDS COMPLETADOS!" -ForegroundColor Green
Write-Host "   Revisa los links en la consola para descargar los APKs" -ForegroundColor White
Write-Host "   Los archivos también estarán disponibles en tu dashboard de EAS" -ForegroundColor White

Write-Host ""
Write-Host "📱 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "   1. Descarga el APK de producción" -ForegroundColor White
Write-Host "   2. Instálalo en tu dispositivo" -ForegroundColor White
Write-Host "   3. Verifica que aparezca como 'Groovify' con el icono correcto" -ForegroundColor White
Write-Host "   4. Prueba el ecualizador real" -ForegroundColor White

Write-Host ""
Write-Host "✅ ¡LISTO PARA USAR!" -ForegroundColor Green
