from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import yt_dlp
import asyncio
import os
import json
import time
import uuid
import re
import urllib.parse
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración
DOWNLOADS_DIR = Path("/tmp/downloads")  # Railway usa /tmp para archivos temporales
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Crear app FastAPI
app = FastAPI(
    title="Music Downloader API - Mejorada",
    description="API robusta para descargar música con yt-dlp",
    version="2.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de datos
class SearchResult:
    def __init__(self, data: Dict[str, Any]):
        self.id = data.get('id', str(uuid.uuid4()))
        self.title = self._clean_title(data.get('title', 'Sin título'))
        self.uploader = data.get('uploader', 'Artista desconocido')
        self.duration = data.get('duration', 0)
        self.thumbnail = data.get('thumbnail', '')
        self.url = data.get('webpage_url', data.get('url', ''))
        self.view_count = data.get('view_count', 0)

    def _clean_title(self, title: str) -> str:
        """Limpiar título para usar como nombre de archivo"""
        # Remover caracteres especiales
        title = re.sub(r'[<>:"/\\|?*]', '', title)
        # Limitar longitud
        if len(title) > 100:
            title = title[:100]
        return title.strip()

class DownloadTask:
    def __init__(self, url: str, quality: str = "best"):
        self.id = str(uuid.uuid4())
        self.url = url
        self.quality = quality
        self.status = "pending"
        self.progress = 0
        self.file_path = None
        self.error = None
        self.title = None
        self.artist = None
        self.duration = 0
        self.created_at = time.time()

# Almacenamiento en memoria
download_tasks: Dict[str, DownloadTask] = {}

def get_ffmpeg_path():
    """Detectar automáticamente la ruta de FFmpeg"""
    possible_paths = [
        'C:\\ffmpeg\\bin',
        'C:\\ffmpeg',
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
        'ffmpeg'  # En PATH
    ]
    
    for path in possible_paths:
        if path == 'ffmpeg':
            # Verificar si está en PATH
            import shutil
            if shutil.which('ffmpeg'):
                return path
        elif os.path.exists(path):
            return path
    
    logger.warning("FFmpeg no encontrado, las descargas pueden fallar")
    return None

@app.get("/")
async def root():
    return {
        "message": "Music Downloader API v2.0 - Mejorada", 
        "status": "ok",
        "version": "2.0.0",
        "features": [
            "Búsqueda robusta en YouTube",
            "Descarga con múltiples formatos",
            "Manejo de errores mejorado",
            "Conversión automática a MP3",
            "Validación de archivos"
        ]
    }

@app.get("/health")
async def health_check():
    """Verificar estado del servidor y dependencias"""
    try:
        # Verificar directorio de descargas
        downloads_ok = DOWNLOADS_DIR.exists() and DOWNLOADS_DIR.is_dir()
        
        # Verificar FFmpeg
        ffmpeg_ok = get_ffmpeg_path() is not None
        
        # Contar archivos descargados
        files = []
        if DOWNLOADS_DIR.exists():
            for file_path in DOWNLOADS_DIR.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in ['.mp3', '.wav', '.m4a', '.webm']:
                    stat = file_path.stat()
                    files.append({
                        "filename": file_path.name,
                        "title": file_path.stem,
                        "size": stat.st_size,
                        "modified": stat.st_mtime,
                        "path": str(file_path.absolute())  # Ruta completa real del archivo
                    })
        
        return {
            "status": "success",
            "message": "API funcionando correctamente",
            "system": {
                "downloads_directory": str(DOWNLOADS_DIR),
                "downloads_ok": downloads_ok,
                "ffmpeg_available": ffmpeg_ok,
                "ffmpeg_path": get_ffmpeg_path(),
                "total_files": len(files)
            },
            "downloads": files,
            "total": len(files)
        }
    except Exception as e:
        logger.error(f"Error en health check: {e}")
        return {
            "status": "error",
            "message": f"Error: {str(e)}",
            "downloads": [],
            "total": 0
        }

@app.post("/search")
async def search_music(query: str):
    """Búsqueda mejorada en YouTube"""
    try:
        if not query or len(query.strip()) < 2:
            raise HTTPException(400, "Query debe tener al menos 2 caracteres")
        
        logger.info(f"🔍 Buscando: {query}")
        
        # Configuración mejorada para búsqueda
        ydl_opts = {
            'format': 'bestaudio/best',
            'extract_flat': True,
            'quiet': False,  # Mostrar más información para debug
            'no_warnings': False,  # Mostrar warnings para debug
            'default_search': 'ytsearch',
            'max_downloads': 20,  # Más resultados
            'socket_timeout': 30,  # Timeout más largo
            'retries': 3,  # Reintentos
        }
        
        # Intentar diferentes variaciones de búsqueda
        search_queries = [
            f"ytsearch20:{query.strip()}",  # Búsqueda original
            f"ytsearch20:{query.strip()} música",  # Con palabra música
            f"ytsearch20:{query.strip()} audio",  # Con palabra audio
            f"ytsearch20:{query.strip()} song",  # Con palabra song
        ]
        
        all_results = []
        
        for search_query in search_queries:
            try:
                logger.info(f"🔍 Intentando búsqueda: {search_query}")
                
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    search_results = ydl.extract_info(search_query, download=False)
                
                if search_results and 'entries' in search_results:
                    all_results.extend(search_results['entries'])
                    logger.info(f"✅ Encontrados {len(search_results['entries'])} resultados")
                    break  # Si encontramos resultados, no probar más
                    
            except Exception as e:
                logger.warning(f"⚠️ Error en búsqueda '{search_query}': {e}")
                continue
        
        # Si no encontramos nada, intentar búsqueda más amplia
        if not all_results:
            logger.info("🔍 Intentando búsqueda más amplia...")
            try:
                # Dividir la query en palabras y buscar cada una
                words = query.strip().split()
                if len(words) > 1:
                    for word in words:
                        if len(word) > 2:  # Solo palabras de más de 2 caracteres
                            broad_query = f"ytsearch20:{word} música"
                            logger.info(f"🔍 Búsqueda amplia: {broad_query}")
                            
                            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                                search_results = ydl.extract_info(broad_query, download=False)
                            
                            if search_results and 'entries' in search_results:
                                all_results.extend(search_results['entries'])
                                break
            except Exception as e:
                logger.warning(f"⚠️ Error en búsqueda amplia: {e}")
        
        search_results = {'entries': all_results} if all_results else None
            
        if not search_results or 'entries' not in search_results:
            return {"status": "success", "results": []}
        
        # Procesar y validar resultados
        results = []
        logger.info(f"🔍 Procesando {len(search_results['entries'])} entradas...")
        
        for i, entry in enumerate(search_results['entries']):
            if entry:  # Verificar que la entrada no sea None
                try:
                    # Debug: mostrar información de la entrada
                    logger.info(f"📋 Entrada {i+1}: {entry.get('title', 'Sin título')}")
                    logger.info(f"🔗 URL: {entry.get('webpage_url', entry.get('url', 'Sin URL'))}")
                    
                    result = SearchResult(entry)
                    results.append({
                        'id': result.id,
                        'title': result.title,
                        'artist': result.uploader,
                        'duration': result.duration,
                        'thumbnail': result.thumbnail,
                        'url': result.url,
                        'view_count': result.view_count
                    })
                    logger.info(f"✅ Procesado: {result.title}")
                except Exception as e:
                    logger.warning(f"⚠️ Error procesando resultado {i+1}: {e}")
                    logger.warning(f"📋 Datos de entrada: {entry}")
                    continue
            else:
                logger.warning(f"⚠️ Entrada {i+1} es None")
        
        logger.info(f"✅ Encontrados {len(results)} resultados")
        return {
            "status": "success",
            "results": results,
            "total": len(results),
            "query": query
        }
        
    except Exception as e:
        logger.error(f"Error en búsqueda: {e}")
        raise HTTPException(500, f"Error en búsqueda: {str(e)}")

@app.post("/download")
async def download_audio(url: str, quality: str = "best"):
    """Descarga mejorada con manejo robusto de errores"""
    try:
        logger.info(f"🔽 Iniciando descarga: {url}")
        
        if not url:
            raise HTTPException(400, "URL es requerida")
        
        # Validar URL de YouTube
        if 'youtube.com' not in url and 'youtu.be' not in url:
            raise HTTPException(400, "Solo se permiten URLs de YouTube")
        
        # Crear tarea de descarga
        task = DownloadTask(url, quality)
        download_tasks[task.id] = task
        
        try:
            # Configuración mejorada para yt-dlp
            ffmpeg_path = get_ffmpeg_path()
            
            ydl_opts = {
                'format': 'bestaudio[ext=m4a]/bestaudio/best',
                'outtmpl': str(DOWNLOADS_DIR / '%(title)s.%(ext)s'),
                'writethumbnail': False,
                'writeinfojson': False,
                'quiet': False,
                'no_warnings': False,
                'extract_flat': False,
                'writedescription': False,
                'writecomments': False,
                'writeautomaticsub': False,
                'writesubtitles': False,
                
                # Configuración de postprocesamiento
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                
                # Configuración de FFmpeg
                'ffmpeg_location': ffmpeg_path if ffmpeg_path else None,
                
                # Bypass restricciones
                'age_limit': 0,
                'no_check_certificate': True,
                'ignoreerrors': True,
                
                # Callbacks para progreso
                'progress_hooks': [lambda d: update_progress(task.id, d)],
                
                # Configuración de red
                'socket_timeout': 30,
                'retries': 3,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Extraer información primero
                task.status = "extracting"
                info = ydl.extract_info(url, download=False)
                
                task.title = info.get('title', 'Canción Descargada')
                task.artist = info.get('uploader', 'Artista desconocido')
                task.duration = info.get('duration', 0)
                
                logger.info(f"📀 Descargando: {task.title} - {task.artist}")
                
                # Descargar el archivo
                task.status = "downloading"
                ydl.download([url])
                
                # Buscar el archivo descargado
                downloaded_file = find_downloaded_file(task.title)
                
                if downloaded_file:
                    task.file_path = str(downloaded_file)
                    task.status = "completed"
                    
                    logger.info(f"✅ Descarga completada: {downloaded_file.name}")
                    
                    return {
                        "status": "success",
                        "task_id": task.id,
                        "file": {
                            "title": task.title,
                            "artist": task.artist,
                            "duration": task.duration,
                            "thumbnail": info.get('thumbnail', ''),
                            "file_path": f"/download/{downloaded_file.name}",
                            "file_size": downloaded_file.stat().st_size,
                            "filename": downloaded_file.name
                        }
                    }
                else:
                    raise Exception("Archivo descargado pero no encontrado")
                    
        except Exception as e:
            task.status = "error"
            task.error = str(e)
            logger.error(f"❌ Error en descarga: {e}")
            raise Exception(f"Error en descarga: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error general en descarga: {e}")
        return {"status": "error", "message": f"Error en descarga: {str(e)}"}

def update_progress(task_id: str, d: dict):
    """Actualizar progreso de descarga"""
    if task_id in download_tasks:
        if d['status'] == 'downloading':
            if 'total_bytes' in d and d['total_bytes']:
                progress = (d['downloaded_bytes'] / d['total_bytes']) * 100
                download_tasks[task_id].progress = progress

def find_downloaded_file(title: str) -> Optional[Path]:
    """Encontrar archivo descargado por título"""
    try:
        # Limpiar título para búsqueda
        clean_title = re.sub(r'[<>:"/\\|?*]', '', title)
        clean_title = clean_title.strip()
        
        # Buscar archivos recientes (últimos 60 segundos)
        current_time = time.time()
        recent_files = []
        
        for file_path in DOWNLOADS_DIR.glob("*"):
            if file_path.is_file() and (current_time - file_path.stat().st_mtime) < 60:
                # Buscar por similitud en el nombre
                if clean_title.lower() in file_path.name.lower():
                    recent_files.append(file_path)
        
        if recent_files:
            # Tomar el archivo más reciente
            return max(recent_files, key=os.path.getctime)
        
        # Si no se encuentra por título, tomar el más reciente
        all_recent = []
        for file_path in DOWNLOADS_DIR.glob("*"):
            if file_path.is_file() and (current_time - file_path.stat().st_mtime) < 60:
                all_recent.append(file_path)
        
        if all_recent:
            return max(all_recent, key=os.path.getctime)
        
        return None
        
    except Exception as e:
        logger.error(f"Error buscando archivo: {e}")
        return None

@app.get("/download/{filename:path}")
async def download_file(filename: str):
    """Servir archivos descargados con validación mejorada"""
    try:
        logger.info(f"📁 Sirviendo archivo: {filename}")
        
        # Decodificar y validar nombre de archivo
        import urllib.parse
        decoded_filename = urllib.parse.unquote(filename)
        
        # Validar que no contenga rutas peligrosas
        if '..' in decoded_filename or '/' in decoded_filename:
            raise HTTPException(400, "Nombre de archivo inválido")
        
        file_path = DOWNLOADS_DIR / decoded_filename
        
        if not file_path.exists() or not file_path.is_file():
            logger.warning(f"Archivo no encontrado: {file_path}")
            raise HTTPException(404, f"Archivo no encontrado: {decoded_filename}")
        
        # Obtener información del archivo
        file_size = file_path.stat().st_size
        if file_size == 0:
            logger.warning(f"Archivo vacío: {file_path}")
            raise HTTPException(400, "Archivo corrupto")
        
        # Determinar tipo de media
        media_type = 'audio/mpeg'  # Por defecto
        if decoded_filename.lower().endswith('.m4a'):
            media_type = 'audio/mp4'
        elif decoded_filename.lower().endswith('.webm'):
            media_type = 'audio/webm'
        elif decoded_filename.lower().endswith('.wav'):
            media_type = 'audio/wav'
        
        logger.info(f"✅ Sirviendo archivo: {decoded_filename} ({file_size} bytes)")
        
        return FileResponse(
            path=str(file_path),
            filename=decoded_filename,
            media_type=media_type,
            headers={
                'Accept-Ranges': 'bytes',
                'Content-Length': str(file_size),
                'Cache-Control': 'public, max-age=31536000'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sirviendo archivo: {e}")
        raise HTTPException(500, f"Error sirviendo archivo: {str(e)}")

@app.get("/file/{filename}")
async def serve_file(filename: str):
    """Servir archivo de audio para reproducción en Expo Go"""
    try:
        # Decodificar el nombre del archivo
        decoded_filename = urllib.parse.unquote(filename)
        file_path = DOWNLOADS_DIR / decoded_filename
        
        if not file_path.exists() or not file_path.is_file():
            raise HTTPException(404, f"Archivo no encontrado: {decoded_filename}")
        
        # Verificar que es un archivo de audio
        if file_path.suffix.lower() not in ['.mp3', '.wav', '.m4a', '.webm']:
            raise HTTPException(400, f"Tipo de archivo no soportado: {file_path.suffix}")
        
        logger.info(f"🎵 Sirviendo archivo para reproducción: {decoded_filename}")
        
        return FileResponse(
            str(file_path),
            media_type='audio/mpeg',
            filename=decoded_filename,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Cache-Control': 'no-cache'  # No cachear para reproducción
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sirviendo archivo para reproducción: {e}")
        raise HTTPException(500, f"Error sirviendo archivo: {str(e)}")

@app.get("/downloads")
async def list_downloads():
    """Listar archivos descargados con información detallada"""
    try:
        files = []
        if DOWNLOADS_DIR.exists():
            for file_path in DOWNLOADS_DIR.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in ['.mp3', '.wav', '.m4a', '.webm']:
                    stat = file_path.stat()
                    files.append({
                        "filename": file_path.name,
                        "title": file_path.stem,
                        "size": stat.st_size,
                        "modified": stat.st_mtime,
                        "path": str(file_path.absolute())  # Ruta completa real del archivo
                    })
        
        # Ordenar por fecha de modificación (más recientes primero)
        files.sort(key=lambda x: x['modified'], reverse=True)
        
        return {
            "status": "success", 
            "downloads": files, 
            "total": len(files)
        }
    except Exception as e:
        logger.error(f"Error listando descargas: {e}")
        return {
            "status": "error", 
            "message": str(e),
            "downloads": [], 
            "total": 0
        }

@app.delete("/download/{filename}")
async def delete_downloaded_file(filename: str):
    """Eliminar archivo descargado con validación"""
    try:
        import urllib.parse
        decoded_filename = urllib.parse.unquote(filename)
        
        # Validar nombre de archivo
        if '..' in decoded_filename or '/' in decoded_filename:
            raise HTTPException(400, "Nombre de archivo inválido")
        
        file_path = DOWNLOADS_DIR / decoded_filename
        
        if not file_path.exists():
            raise HTTPException(404, "Archivo no encontrado")
        
        file_path.unlink()
        logger.info(f"🗑️ Archivo eliminado: {decoded_filename}")
        
        return {"status": "success", "message": "Archivo eliminado correctamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando archivo: {e}")
        raise HTTPException(500, f"Error eliminando archivo: {str(e)}")

@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """Obtener estado de una tarea de descarga"""
    if task_id not in download_tasks:
        raise HTTPException(404, "Tarea no encontrada")
    
    task = download_tasks[task_id]
    return {
        "task_id": task_id,
        "status": task.status,
        "progress": task.progress,
        "title": task.title,
        "artist": task.artist,
        "error": task.error,
        "created_at": task.created_at
    }

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Crear directorio de descargas si no existe
    DOWNLOADS_DIR.mkdir(exist_ok=True)
    
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"🚀 Iniciando servidor en puerto {port}")
    logger.info(f"📁 Directorio de descargas: {DOWNLOADS_DIR}")
    
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
