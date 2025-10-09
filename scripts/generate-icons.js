const fs = require('fs');
const path = require('path');

// Crear el directorio de iconos si no existe
const iconsDir = path.join(__dirname, '../assets/images/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Configuración de iconos para Android
const androidIcons = [
  { name: 'mdpi', size: 48, folder: 'mipmap-mdpi' },
  { name: 'hdpi', size: 72, folder: 'mipmap-hdpi' },
  { name: 'xhdpi', size: 96, folder: 'mipmap-xhdpi' },
  { name: 'xxhdpi', size: 144, folder: 'mipmap-xxhdpi' },
  { name: 'xxxhdpi', size: 192, folder: 'mipmap-xxxhdpi' },
];

// Configuración de iconos para iOS
const iosIcons = [
  { name: '20', size: 20 },
  { name: '29', size: 29 },
  { name: '40', size: 40 },
  { name: '58', size: 58 },
  { name: '60', size: 60 },
  { name: '76', size: 76 },
  { name: '80', size: 80 },
  { name: '87', size: 87 },
  { name: '114', size: 114 },
  { name: '120', size: 120 },
  { name: '152', size: 152 },
  { name: '167', size: 167 },
  { name: '180', size: 180 },
  { name: '1024', size: 1024 },
];

// SVG base para el icono
const generateIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
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
</svg>
`;

// Generar iconos para Android
androidIcons.forEach(icon => {
  const folderPath = path.join(iconsDir, icon.folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  
  const svgContent = generateIconSVG(icon.size);
  const filePath = path.join(folderPath, 'ic_launcher.svg');
  fs.writeFileSync(filePath, svgContent);
  
  console.log(`✅ Generado icono Android ${icon.name} (${icon.size}x${icon.size})`);
});

// Generar iconos para iOS
iosIcons.forEach(icon => {
  const svgContent = generateIconSVG(icon.size);
  const filePath = path.join(iconsDir, `icon-${icon.name}.svg`);
  fs.writeFileSync(filePath, svgContent);
  
  console.log(`✅ Generado icono iOS ${icon.name} (${icon.size}x${icon.size})`);
});

console.log('\n🎉 ¡Iconos generados exitosamente!');
console.log('\n📁 Ubicación:', iconsDir);
console.log('\n📱 Para usar en tu app, actualiza app.json con la ruta correcta del icono.');
