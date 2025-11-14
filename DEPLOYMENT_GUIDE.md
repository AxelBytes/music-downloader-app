# 🎵 Groovify - Plan Completo: Backend en Nube + APK

## 📋 Resumen del Plan

```
┌─────────────────────────┐
│   1. Railway Deploy     │  Backend en la nube ☁️
├─────────────────────────┤
│   2. Actualizar URLs    │  Frontend apunta a nube
├─────────────────────────┤
│   3. Build APK          │  Crear instalable Android
└─────────────────────────┘
```

---

## 🚀 PASO 1: Subir Backend a Railway (Gratis, Sin Pausas)

### 1.1 Crear Cuenta Railway
- Ve a: https://railway.app
- Click "Sign Up"
- Elige "Login with GitHub"
- Autoriza Railway

### 1.2 Crear Proyecto
1. Click "New Project"
2. "Deploy from GitHub repo"
3. Selecciona `Repro-Musica`
4. Click "Deploy"

### 1.3 Agregar PostgreSQL
1. Click "New"
2. Selecciona "Database" → "PostgreSQL"
3. **Railway lo crea automáticamente** ✅

### 1.4 El Backend Se Deploy Automáticamente
- Railway detecta `Procfile`
- Instala requirements.txt
- Inicia el servidor
- ¡Listo! ✅

### 1.5 Obtener URL
```
Railway Dashboard 
→ Tu Proyecto 
→ Backend Service 
→ URL pública: https://groovify-xxx.railway.app
```

---

## 📝 PASO 2: Actualizar URLs en Frontend

### 2.1 Archivos a Actualizar

**Archivo 1: `project/contexts/DownloaderMusicPlayerContext.tsx`**
```typescript
// Línea ~8
const API_URL = 'https://groovify-xxx.railway.app'; // ← Tu URL
```

**Archivo 2: `project/contexts/AuthContext.tsx`**
```typescript
// Línea ~15
const API_URL = 'https://groovify-xxx.railway.app'; // ← Tu URL
```

**Archivo 3: `project/contexts/DownloadsContext.tsx`**
```typescript
// Línea ~25
const API_URL = 'https://groovify-xxx.railway.app'; // ← Tu URL
```

### 2.2 Hacer Commit
```bash
cd c:\Users\Lionel.Dev\Desktop\Repro-Musica
git add .
git commit -m "feat: update API URLs for production (Railway)"
git push origin main
```

---

## 📱 PASO 3: Crear APK

### 3.1 Instalar Herramientas
```bash
npm install -g expo-cli eas-cli
```

### 3.2 Login en Expo
```bash
eas login
# Usa tu email y contraseña de Expo
```

### 3.3 Crear APK (Cloud Build - Recomendado)
```bash
cd c:\Users\Lionel.Dev\Desktop\Repro-Musica\project

eas build --platform android --type apk
```

⏱️ **Esto toma 15-20 minutos**

### 3.4 Descargar APK
- Expo te dará una URL
- Descarga el `.apk`
- Guarda en tu PC

### 3.5 Instalar en Teléfono
```bash
# Conecta teléfono por USB
# Activa "Instalación desde fuentes desconocidas"

adb install groovify.apk

# O simplemente abre el APK en el teléfono desde Files
```

---

## ✅ Checklist Completo

### Pre-Deploy
- [ ] Backend en proyecto
- [ ] `requirements.txt` actualizado
- [ ] `Procfile` configurado
- [ ] `.env.example` existe

### Railway Deploy
- [ ] Cuenta Railway creada
- [ ] GitHub conectado
- [ ] PostgreSQL creado
- [ ] Backend deployado
- [ ] URL obtenida

### Frontend Update
- [ ] DownloaderMusicPlayerContext.tsx actualizado
- [ ] AuthContext.tsx actualizado
- [ ] DownloadsContext.tsx actualizado
- [ ] Push a main hecho

### APK Build
- [ ] Expo CLI instalado
- [ ] EAS CLI instalado
- [ ] Login en Expo completado
- [ ] APK descargado
- [ ] APK instalado en teléfono

---

## 🔧 Comandos Rápidos

```bash
# 1. Actualizar URLs
# (Edita manualmente los 3 archivos arriba)

# 2. Commit
git add .
git commit -m "feat: production URLs"
git push origin main

# 3. Build APK
cd project
eas login
eas build --platform android --type apk

# 4. Instalar (cuando tengas el APK)
adb install groovify.apk
```

---

## 🎯 Resultado Final

Después de completar esto:

✅ **Backend en la Nube:**
- Corriendo 24/7 sin pausas
- Base de datos PostgreSQL incluida
- HTTPS automático
- Gratis (hasta $5/mes de uso)

✅ **APK Instalable:**
- App nativa Android
- Totalmente funcional
- Connectable a cualquier teléfono
- Fácil distribuir

✅ **Usuarios Pueden:**
- Descargar canciones de YouTube
- Reproducir offline
- Crear playlists
- Todo sin depender de tu PC

---

## 📞 Preguntas Frecuentes

**P: ¿Cuánto cuesta Railway?**
A: Es gratis, con $5 USD/mes de crédito. Para uso personal es más que suficiente.

**P: ¿Se pausa el servidor?**
A: No, diferente a Heroku. Corre 24/7.

**P: ¿Cuánto pesa el APK?**
A: Aproximadamente 150-200 MB. Normal para React Native.

**P: ¿Puedo subir a Google Play?**
A: Sí, pero requiere pago ($25 USD). Por ahora compartir el APK es más fácil.

**P: ¿Qué pasa si se cae Railway?**
A: Es muy raro. Pero si ocurre, puedes cambiar a otro host (Render, Fly.io, etc).

---

## 📚 Documentos de Referencia

- `RAILWAY_DEPLOY.md` - Detalles del deploy en Railway
- `APK_BUILD.md` - Detalles completos del build de APK
- `Procfile` - Configuración para Railway

---

## 🎉 ¡Listo!

Una vez completes todos los pasos, tendrás:
- Backend profesional en la nube ☁️
- App instalable en Android 📱
- Totalmente funcional y gratis 🎵

¿Necesitas ayuda con algún paso? Pregunta en cualquier momento.
