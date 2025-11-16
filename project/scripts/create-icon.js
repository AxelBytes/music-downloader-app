// Script para crear icono de la app
const fs = require('fs');
const path = require('path');

console.log('🎵 Creando icono para Music Player Pro...');

// Crear el SVG del icono
const iconSVG = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#06b6d4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a0033;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="noteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fondo con gradiente -->
  <rect width="1024" height="1024" rx="200" fill="url(#bgGradient)"/>
  
  <!-- Nota musical principal -->
  <g transform="translate(512, 512)">
    <!-- Cabeza de la nota -->
    <ellipse cx="0" cy="-200" rx="80" ry="60" fill="url(#noteGradient)"/>
    
    <!-- Tallo de la nota -->
    <rect x="-5" y="-140" width="10" height="280" fill="url(#noteGradient)"/>
    
    <!-- Corchea -->
    <ellipse cx="0" cy="-120" rx="40" ry="30" fill="url(#noteGradient)"/>
    
    <!-- Líneas del pentagrama -->
    <line x1="-300" y1="-300" x2="300" y2="-300" stroke="url(#noteGradient)" stroke-width="8" opacity="0.6"/>
    <line x1="-300" y1="-250" x2="300" y2="-250" stroke="url(#noteGradient)" stroke-width="8" opacity="0.6"/>
    <line x1="-300" y1="-200" x2="300" y2="-200" stroke="url(#noteGradient)" stroke-width="8" opacity="0.6"/>
    <line x1="-300" y1="-150" x2="300" y2="-150" stroke="url(#noteGradient)" stroke-width="8" opacity="0.6"/>
    <line x1="-300" y1="-100" x2="300" y2="-100" stroke="url(#noteGradient)" stroke-width="8" opacity="0.6"/>
    
    <!-- Notas adicionales -->
    <circle cx="-180" cy="-180" r="35" fill="url(#noteGradient)" opacity="0.8"/>
    <circle cx="180" cy="-120" r="35" fill="url(#noteGradient)" opacity="0.8"/>
    <circle cx="-120" cy="-80" r="35" fill="url(#noteGradient)" opacity="0.8"/>
    <circle cx="120" cy="-200" r="35" fill="url(#noteGradient)" opacity="0.8"/>
  </g>
  
  <!-- Borde sutil -->
  <rect x="20" y="20" width="984" height="984" rx="180" fill="none" stroke="url(#noteGradient)" stroke-width="4" opacity="0.3"/>
</svg>`;

// Guardar el icono SVG
const iconPath = path.join(__dirname, '../assets/icon.svg');
fs.writeFileSync(iconPath, iconSVG);

console.log('✅ Icono SVG creado exitosamente!');
console.log('📁 Ubicación:', iconPath);
console.log('');
console.log('🎨 El icono incluye:');
console.log('   • Gradiente con los colores de tu app (#8b5cf6, #06b6d4)');
console.log('   • Nota musical principal');
console.log('   • Pentagrama con notas adicionales');
console.log('   • Diseño premium y moderno');
console.log('');
console.log('📱 Para crear el APK:');
console.log('   npx eas build --platform android --profile preview');
