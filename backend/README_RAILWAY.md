# 🚀 Deploy en Railway.app (GRATIS)

## 📋 Pasos para deployar:

### 1. **Crear cuenta en Railway**
- Ve a [railway.app](https://railway.app)
- Regístrate con GitHub
- Es **GRATIS** hasta cierto límite

### 2. **Subir código a GitHub**
```bash
# En la carpeta del proyecto
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### 3. **Conectar Railway con GitHub**
- En Railway, haz clic en "New Project"
- Selecciona "Deploy from GitHub repo"
- Elige tu repositorio
- Railway detectará automáticamente que es Python

### 4. **Configuración automática**
Railway detectará:
- ✅ `requirements.txt` (dependencias)
- ✅ `Procfile` (comando de inicio)
- ✅ `improved_main.py` (aplicación principal)

### 5. **Variables de entorno (opcional)**
En Railway Dashboard > Variables:
```
PORT=8000
PYTHON_VERSION=3.11.0
```

### 6. **Deploy automático**
- Railway hará deploy automáticamente
- Te dará una URL como: `https://tu-app.railway.app`
- ¡Listo! Tu backend correrá 24/7

## 🔧 **Actualizar la app**

Para cambiar la URL en tu app React Native:
```typescript
// En DownloadsContext.tsx
const API_URL = 'https://tu-app.railway.app'; // Nueva URL de Railway
```

## 📱 **Ventajas de Railway:**
- ✅ **GRATIS** hasta cierto límite
- ✅ **Deploy automático** desde GitHub
- ✅ **24/7** sin necesidad de tu computadora
- ✅ **HTTPS** incluido
- ✅ **Logs** en tiempo real
- ✅ **Escalado automático**

## 🆘 **Soporte:**
- Railway tiene excelente documentación
- Discord comunitario activo
- Deploy en ~5 minutos
