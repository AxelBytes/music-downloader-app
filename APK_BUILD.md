# 📱 Guía para Crear APK de Groovify

## Requisitos Previos

1. **Tener cuenta en EAS (Expo Application Services):**
   - Ve a [expo.dev](https://expo.dev)
   - Crea cuenta gratis
   - Verifica tu email

2. **Instalar Expo CLI:**
   ```bash
   npm install -g expo-cli eas-cli
   ```

3. **Estar en el directorio correcto:**
   ```bash
   cd c:\Users\Lionel.Dev\Desktop\Repro-Musica\project
   ```

## Opción A: Build en la Nube (Recomendado)

### Paso 1: Configurar Proyecto

```bash
# Loguéate con tu cuenta Expo
eas login

# Configurar el proyecto (solo la primera vez)
eas build:configure
```

### Paso 2: Crear APK

```bash
# Build para Android (APK)
eas build --platform android --type apk

# O si quieres APK universal (funciona en más dispositivos)
eas build --platform android --type universal-apk
```

**Esto tomará 10-20 minutos.** Expo compilará en la nube.

### Paso 3: Descargar APK

1. El build mostrará una URL
2. Ve a esa URL en el navegador
3. Click "Download APK"
4. Guarda el archivo `.apk`

## Opción B: Build Local (Requiere Android SDK)

Si quieres compilar localmente:

```bash
# Build local (requiere Android SDK instalado)
eas build --platform android --local
```

⚠️ Esto requiere tener Android Studio + SDK configurado.

## Paso 4: Instalar en Teléfono

### Método 1: Direct Install (Recomendado)

```bash
# Si tienes EAS instalado
adb install app.apk

# O si usaste EAS build, Expo muestra QR para descargar directo en el teléfono
```

### Método 2: Manual

1. Descarga el APK en tu PC
2. Conecta el teléfono Android por USB
3. Activa "Opciones de Desarrollador" (tap 7 veces en Build)
4. Activa "Instalación desde fuentes desconocidas"
5. Ejecuta: `adb install app.apk`

## ⚠️ IMPORTANTE: Actualizar URL del Backend

**ANTES de crear el APK**, asegúrate de actualizar las URLs:

### En `contexts/DownloaderMusicPlayerContext.tsx`:
```typescript
// ❌ VIEJO (local)
const API_URL = 'http://192.168.100.112:3000';

// ✅ NUEVO (Railway)
const API_URL = 'https://groovify-api-production.railway.app';
```

### En `contexts/AuthContext.tsx`:
```typescript
const API_URL = 'https://groovify-api-production.railway.app';
```

### En `contexts/DownloadsContext.tsx`:
```typescript
const API_URL = 'https://groovify-api-production.railway.app';
```

### Haz commit antes del build:
```bash
git add .
git commit -m "feat: update API URLs for production"
git push origin main
```

## Proceso Completo Resumido

```bash
# 1. Ir al directorio
cd c:\Users\Lionel.Dev\Desktop\Repro-Musica\project

# 2. Actualizar URLs en los archivos (ver arriba)

# 3. Commit cambios
git add .
git commit -m "feat: production URLs"
git push origin main

# 4. Login Expo
eas login

# 5. Crear APK (cloudBuild - más fácil)
eas build --platform android --type apk

# 6. Descargar APK desde el link que te da

# 7. Instalar en teléfono
adb install groovify.apk
```

## Troubleshooting

### "Error: Credenciales no válidas"
```bash
eas logout
eas login  # Vuelve a loguear
```

### "Error: Proyecto no configurado"
```bash
eas build:configure
# Selecciona "Android" cuando pregunte
```

### "Error: APK no se instala"
- Verifica que el teléfono tenga mínimo API level 21 (Android 5.0)
- En `app.json` puedes cambiar: `"sdkVersion": "21"`

### El APK es muy grande
- Normal: ~150-250 MB
- Incluye el runtime de React Native

## Verificación Final

Antes de instalar, verifica:

✅ Backend en Railway está funcionando
✅ URLs actualizadas en el código
✅ APK se descargó correctamente
✅ Teléfono tiene mínimo 500MB libres
✅ Instalación desde fuentes desconocidas activada

## Próximos Pasos (Opcional)

### Subir a Google Play Store (Requiere pago)
- Costo: $25 USD una sola vez
- Requiere: Keystore, firma APK, cuenta developer
- Te enseño después si lo necesitas

### Distribución Directa (Sin Google Play)
- Compartir APK por WhatsApp/Telegram
- Usuarios instalan manualmente
- Más fácil pero menos profesional
