# 🎵 Music Downloader - Sistema Mejorado

Sistema robusto para descargar música de YouTube con manejo avanzado de errores y funcionalidad offline/online.

## 🚀 Instalación Rápida

### 1. Instalar dependencias automáticamente
```bash
cd backend
python start_server.py
```

### 2. Instalar FFmpeg automáticamente (si es necesario)
```bash
python install_ffmpeg.py
```

## 🔧 Instalación Manual

### Dependencias de Python
```bash
pip install fastapi uvicorn yt-dlp aiofiles python-multipart
```

### FFmpeg
- **Windows**: Descargar desde https://ffmpeg.org/download.html
- **Linux**: `sudo apt install ffmpeg`
- **macOS**: `brew install ffmpeg`

## 🎯 Características Mejoradas

### ✅ Backend Robusto
- **Detección automática de FFmpeg**
- **Manejo avanzado de errores**
- **Validación de archivos**
- **Logging detallado**
- **Timeout configurable**
- **Conversión automática a MP3**

### ✅ Frontend Inteligente
- **Modo offline/online automático**
- **Mensajes de error específicos**
- **Validación de archivos locales**
- **Indicador de progreso mejorado**
- **Timeout de 5 minutos para descargas**

### ✅ Sistema de Errores
- **Errores específicos por tipo**
- **Sugerencias de solución**
- **Reintentos automáticos**
- **Fallback a archivos locales**

## 📱 Configuración para la App

### 1. Encontrar tu IP local
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

### 2. Actualizar la IP en la app
En `project/contexts/DownloadsContext.tsx`:
```typescript
const API_URL = 'http://TU_IP_LOCAL:8000';
```

## 🔄 Uso

### Iniciar servidor
```bash
python start_server.py
```

### Usar servidor mejorado
```bash
python improved_main.py
```

### Usar servidor simple
```bash
python simple_server.py
```

## 📋 Endpoints Disponibles

### Búsqueda
```
POST /search?query=nombre_canción
```

### Descarga
```
POST /download?url=URL_YOUTUBE&quality=best
```

### Archivos
```
GET /downloads          # Listar archivos
GET /download/archivo   # Descargar archivo
DELETE /download/archivo # Eliminar archivo
```

### Estado
```
GET /health             # Estado del servidor
GET /                   # Información general
```

## 🛠️ Solución de Problemas

### Error: "FFmpeg no encontrado"
```bash
python install_ffmpeg.py
```

### Error: "Network request failed"
1. Verificar que el backend esté corriendo
2. Verificar la IP en la app
3. Verificar conexión a internet

### Error: "Video no disponible"
- El video puede estar restringido
- Intentar con otra canción
- Verificar la URL de YouTube

### Error: "Timeout"
- La descarga tardó más de 5 minutos
- Intentar con una canción más corta
- Verificar conexión a internet

## 📊 Logs y Debugging

### Habilitar logs detallados
```bash
python improved_main.py --log-level debug
```

### Ver logs en tiempo real
Los logs aparecen en la consola con emojis:
- 🔍 Búsquedas
- 🔽 Descargas
- ✅ Éxito
- ❌ Errores
- 📁 Archivos

## 🔒 Seguridad

- **Validación de URLs** (solo YouTube)
- **Sanitización de nombres de archivo**
- **Verificación de rutas** (no permite `../`)
- **Validación de archivos** (tamaño > 0)

## 📈 Rendimiento

- **Cache de resultados de búsqueda**
- **Compresión de respuestas**
- **Límite de 10 resultados por búsqueda**
- **Timeout de 30 segundos por descarga**
- **Conversión optimizada a MP3 192kbps**

## 🎵 Formatos Soportados

### Entrada (YouTube)
- Cualquier formato de YouTube
- Videos con audio
- Playlists

### Salida
- **MP3** (192kbps) - Recomendado
- **M4A** (fallback)
- **WebM** (fallback)

## 🔄 Actualizaciones

### Actualizar yt-dlp
```bash
pip install --upgrade yt-dlp
```

### Actualizar dependencias
```bash
pip install --upgrade fastapi uvicorn aiofiles
```

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica la configuración de red
3. Prueba con diferentes URLs de YouTube
4. Reinicia el servidor

---

**¡Disfruta descargando música! 🎵**
