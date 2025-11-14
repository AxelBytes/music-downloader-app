# 🚀 Groovify - Deploy Backend + APK Build (Guía Rápida)

## Resumen: 3 Pasos Simples

```
PASO 1: Backend en Railway (Nube) ☁️
   ↓
PASO 2: Actualizar URLs en Frontend  
   ↓
PASO 3: Crear APK Android 📱
```

---

## 📋 PASO 1: Deploy Backend en Railway

### 1. Crear Cuenta
- Ve a: **https://railway.app**
- Sign Up with GitHub
- Autoriza Railway

### 2. Crear Proyecto
1. Click "New Project"
2. "Deploy from GitHub repo"
3. Selecciona **`Repro-Musica`**
4. Espera el deploy (1-2 min)

### 3. Agregar Base de Datos
1. Click "New"
2. "Database" → "PostgreSQL"
3. **Automático** ✅

### 4. Obtener URL
```
Dashboard → Tu Proyecto → Backend Service
↓
Copiar URL pública: https://groovify-abc123.railway.app
```

---

## 🔧 PASO 2: Actualizar URLs en Frontend

### Opción A: Automático (Recomendado)
```bash
cd c:\Users\Lionel.Dev\Desktop\Repro-Musica

REM Ejecuta el script (reemplaza con tu URL)
update-urls.bat https://groovify-abc123.railway.app

REM Luego haz commit
git add .
git commit -m "feat: update API URLs"
git push origin main
```

### Opción B: Manual
Edita estos 3 archivos y reemplaza:
```
const API_URL = 'http://192.168.100.112:3000';
```

Con:
```
const API_URL = 'https://groovify-abc123.railway.app';
```

**Archivos:**
1. `project/contexts/DownloaderMusicPlayerContext.tsx` (línea ~8)
2. `project/contexts/AuthContext.tsx` (línea ~15)
3. `project/contexts/DownloadsContext.tsx` (línea ~25)

Luego commit:
```bash
git add .
git commit -m "feat: update API URLs"
git push origin main
```

---

## 📱 PASO 3: Crear APK

### Requisitos
- npm instalado ✅
- Cuenta Expo (gratis)

### Comandos
```bash
# 1. Instalar herramientas
npm install -g expo-cli eas-cli

# 2. Ir al proyecto
cd c:\Users\Lionel.Dev\Desktop\Repro-Musica\project

# 3. Login Expo
eas login
# (usa email/contraseña de Expo)

# 4. Crear APK (Cloud Build - Sin Android SDK local)
eas build --platform android --type apk

# ⏱️ Espera 15-20 minutos...

# 5. Descargar
# Expo te da una URL → Descarga el .apk
```

### Instalar en Teléfono
```bash
# Conecta por USB
# Activa "Instalación desde fuentes desconocidas" en teléfono
adb install groovify.apk

# O manualmente:
# - Descarga APK en teléfono
# - Abre con gestor de archivos
# - Click instalar
```

---

## ✨ Resultado

Después de esto tendrás:

| Componente | Estado | Ubicación |
|-----------|--------|-----------|
| Backend | ☁️ En la nube | Railway (groovify-xxx.railway.app) |
| Base de Datos | 🗄️ PostgreSQL | Railway (automático) |
| Frontend | 📱 APK | Tu teléfono Android |
| URLs | ✅ Actualizadas | Frontend apunta a Railway |

---

## 🎯 Verificación

Antes de empezar, verifica:
- [ ] Tienes cuenta GitHub
- [ ] Tienes cuenta Expo (gratis)
- [ ] El código está pusheado a GitHub
- [ ] Node.js / npm instalado

---

## 💡 Tips

**¿El backend no carga?**
```bash
# En Railway, ve a Logs y busca errores
# Generalmente es variable de entorno faltante
```

**¿El APK es muy grande?**
- Normal: 150-250 MB
- Incluye React Native runtime
- Es lo esperado ✅

**¿Quiero testing rápido?**
```bash
# Instala en tu teléfono con Expo Go
# Sin esperar 20 min de build
cd project
npx expo start
# Escanea QR con Expo Go
```

---

## 📞 Ayuda Rápida

| Problema | Solución |
|----------|----------|
| Railway no ve GitHub | Reconecta en Settings |
| Database error en backend | Copia DATABASE_URL de Railway a Variables |
| APK no se instala | API mínimo 21, activa fuentes desconocidas |
| App lenta | Railway puede necesitar upgrade |
| ¿Cómo actualizar código? | Push a main → Railway auto-deploya |

---

## 📚 Documentos Adicionales

Para más detalle, lee:
- `DEPLOYMENT_GUIDE.md` - Guía completa
- `RAILWAY_DEPLOY.md` - Railway específicamente
- `APK_BUILD.md` - Build APK en detalle

---

## 🎉 ¡Listo!

Con esto tendrás una app profesional en producción.

¿Necesitas ayuda con algún paso? Pregunta sin problemas 💪
