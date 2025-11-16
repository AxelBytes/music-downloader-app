# 🎵 Music Downloader Backend

Backend para descargar música usando yt-dlp y FastAPI.

## 🚀 Instalación

### 1. Instalar dependencias de Python

```bash
cd backend
pip install -r requirements.txt
```

### 2. Ejecutar el servidor

```bash
python main.py
```

El servidor se ejecutará en: `http://localhost:8000`

## 📱 Configuración para Android

### 1. Encontrar tu IP local

**Windows:**
```cmd
ipconfig
```

**Mac/Linux:**
```bash
ifconfig
```

Busca la IP de tu red local (ejemplo: `192.168.1.100`)

### 2. Actualizar la IP en la app

En `project/components/MusicDownloader.tsx`, línea 60:

```typescript
const API_URL = 'http://45.227.198.203:8000';
```

✅ **Ya está configurado con tu IP: `45.227.198.203`**

### 3. Instalar dependencias adicionales en React Native

```bash
npx expo install expo-file-system expo-av
```

## 🔧 Funcionalidades

- ✅ Búsqueda de música en YouTube
- ✅ Descarga de audio en formato MP3
- ✅ Reproducción offline
- ✅ Gestión de archivos descargados
- ✅ Interfaz premium con gradientes

## 📋 Endpoints de la API

- `GET /` - Estado del servidor
- `GET /health` - Verificación de salud
- `POST /search` - Buscar música
- `POST /download` - Descargar audio
- `GET /downloads` - Listar archivos descargados
- `GET /download/{filename}` - Obtener archivo
- `DELETE /download/{filename}` - Eliminar archivo

## ⚠️ Consideraciones

- **Uso personal únicamente**
- **No redistribuir contenido**
- **Respetar derechos de autor**
- **Verificar legislación local**

## 🛠️ Solución de problemas

### Error de conexión
1. Verificar que el backend esté ejecutándose
2. Comprobar la IP en la app
3. Asegurarse de que el dispositivo esté en la misma red

### Error de descarga
1. Verificar conexión a internet
2. Comprobar que yt-dlp esté actualizado
3. Revisar logs del servidor

## 📞 Soporte

Si tienes problemas, revisa los logs del servidor o contacta al desarrollador.
