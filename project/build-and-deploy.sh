#!/bin/bash

echo "🚀 INICIANDO BUILD Y DEPLOY DE GROOVIFY..."
echo "================================================"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio del proyecto."
    exit 1
fi

echo "📱 Verificando configuración de la app..."
node verify-app-config.js

echo ""
echo "🔧 Limpiando cache y reinstalando dependencias..."
npm install --legacy-peer-deps

echo ""
echo "📦 Creando build de desarrollo..."
eas build --platform android --profile development --non-interactive

echo ""
echo "📦 Creando build de preview..."
eas build --platform android --profile preview --non-interactive

echo ""
echo "📦 Creando build de producción..."
eas build --platform android --profile production --non-interactive

echo ""
echo "📋 RESUMEN DE BUILDS:"
echo "   - Development: Para testing interno"
echo "   - Preview: Para testing con usuarios"
echo "   - Production: Para distribución final"

echo ""
echo "🎉 ¡BUILDS COMPLETADOS!"
echo "   Revisa los links en la consola para descargar los APKs"
echo "   Los archivos también estarán disponibles en tu dashboard de EAS"

echo ""
echo "📱 PRÓXIMOS PASOS:"
echo "   1. Descarga el APK de producción"
echo "   2. Instálalo en tu dispositivo"
echo "   3. Verifica que aparezca como 'Groovify' con el icono correcto"
echo "   4. Prueba el ecualizador real"

echo ""
echo "✅ ¡LISTO PARA USAR!"
