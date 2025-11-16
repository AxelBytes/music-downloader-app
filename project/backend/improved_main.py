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
from pydantic import BaseModel

# --- CARGAR VARIABLES DE ENTORNO ---
from dotenv import load_dotenv
load_dotenv() # Esto lee el archivo .env y carga la DATABASE_URL

# IMPORTS PARA LA BASE DE DATOS Y AUTH
from db import get_connection, init_schema_if_needed

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración
# Usar una ruta relativa para que funcione en cualquier sistema operativo (Windows, Linux, etc.)
# Crea la carpeta 'downloads' en el mismo directorio que el script.
DOWNLOADS_DIR = Path(__file__).parent / "downloads"
DOWNLOADS_DIR.mkdir(exist_ok=True) # Crea el directorio si no existe

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

# Inicializar esquema de la base de datos al arrancar (si es necesario)
try:
    print("🐘 Intentando inicializar esquema de base de datos (Neon)...")
    init_schema_if_needed()
    print("✅ Esquema de base de datos listo.")
except Exception as e:
    print(f"⚠️ Advertencia: No se pudo inicializar el esquema de la DB. Asumiendo que ya existe. Error: {e}")

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

            # AÑADIR USER-AGENT PARA EVITAR ERROR 403 FORBIDDEN
            ydl_opts['http_headers'] = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
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
        raise HTTPException(status_code=500, detail=f"Error en descarga: {str(e)}")

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
                        "path": f"/file/{urllib.parse.quote(file_path.name)}"
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

# ============================================
# AUTH/USUARIOS (RECONECTADO DESDE NEON)
# ============================================
@app.post("/auth/validate-key")
async def validate_key(key: str):
    """Validar una clave de activación"""
    try:
        logger.info(f"🔑 Validando clave de activación: '{key}'")

        if not key or len(key.strip()) < 6:
            raise HTTPException(400, "Key inválida")
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, key, is_used, user_id FROM activation_keys WHERE key = %s LIMIT 1",
                    (key.strip(),),
                )
                row = cur.fetchone()
                if not row:
                    logger.warning(f"🔑 Clave no encontrada: '{key}'")
                    return {"isValid": False, "error": "Key no encontrada"}
                _id, _key, is_used, user_id = row
                if is_used:
                    logger.warning(f"🔑 Clave ya utilizada: '{key}'")
                    return {"isValid": False, "error": "Key ya utilizada"}
                logger.info(f"✅ Clave válida y disponible: '{key}'")
                return {"isValid": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validando key: {e}")
        raise HTTPException(500, f"Error validando key: {str(e)}")

class SignUpData(BaseModel):
    email: str
    username: str
    activationKey: str

@app.post("/auth/sign-up")
async def sign_up(data: SignUpData):
    """Registrar un nuevo usuario"""
    try:
        logger.info(f"👤 Intentando registrar nuevo usuario: {data.username} ({data.email}) con clave: '{data.activationKey}'")

        email = data.email.strip()
        username = data.username.strip()
        activationKey = data.activationKey.strip()

        if not data.activationKey:
            raise HTTPException(400, "activationKey requerido")
        with get_connection() as conn:
            with conn.cursor() as cur:
                # Validar key disponible
                cur.execute(
                    "SELECT id, is_used FROM activation_keys WHERE key = %s LIMIT 1",
                    (activationKey,),
                )
                row = cur.fetchone()
                if not row:
                    raise HTTPException(400, "Key inválida")
                ak_id, is_used = row
                if is_used:
                    raise HTTPException(400, "Key ya utilizada")

                # Crear usuario
                cur.execute(
                    "INSERT INTO users (email, username, activation_key) VALUES (%s, %s, %s) RETURNING id",
                    (email, username, activationKey),
                )
                user_id = cur.fetchone()[0]

                # Marcar key como usada
                cur.execute(
                    "UPDATE activation_keys SET is_used = true, user_id = %s WHERE id = %s",
                    (user_id, ak_id),
                )
                conn.commit()

                logger.info(f"✅ Usuario '{data.username}' registrado exitosamente con ID: {user_id}")
                return {
                    "status": "success",
                    "user": {"id": str(user_id), "email": email, "username": username},
                }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en sign-up: {e}")
        raise HTTPException(500, f"Error en sign-up: {str(e)}")


@app.post("/auth/sign-in")


async def sign_in(activationKey: str):


    """Iniciar sesión con una clave de activación"""


    try:


        logger.info(f"🚪 Intentando iniciar sesión con clave: '{activationKey}'")





        if not activationKey:


            raise HTTPException(400, "activationKey requerido")


        with get_connection() as conn:


            with conn.cursor() as cur:


                # Buscar usuario por activation_key


                cur.execute(


                    "SELECT id, email, username FROM users WHERE activation_key = %s LIMIT 1",


                    (activationKey,),


                )


                user = cur.fetchone()


                if not user:


                    logger.warning(f"🚪 Inicio de sesión fallido. Clave no asociada a ningún usuario: '{activationKey}'")


                    raise HTTPException(400, "Key inválida o usuario no registrado")


                user_id, email, username = user


                logger.info(f"✅ Inicio de sesión exitoso para usuario: {username} (ID: {user_id})")


                return {


                    "status": "success",


                    "user": {"id": str(user_id), "email": email, "username": username},


                }


    except HTTPException:


        raise


    except Exception as e:


        logger.error(f"Error en sign-in: {e}")


        raise HTTPException(500, f"Error en sign-in: {str(e)}")





# ============================================


# PLAYLISTS (Neon)


# ============================================





class PlaylistIn(BaseModel):


    user_id: uuid.UUID


    name: str


    description: Optional[str] = None





class SongIn(BaseModel):


    id: str


    title: str


    artist: Optional[str] = None


    duration: Optional[int] = None


    thumbnail: Optional[str] = None


    file_path: Optional[str] = None





@app.get("/playlists/{user_id}")


async def get_playlists(user_id: uuid.UUID):


    try:


        logger.info(f"Fetching playlists for user {user_id}")


        with get_connection() as conn:


            with conn.cursor() as cur:


                cur.execute("SELECT id, name, description, created_at, updated_at FROM playlists WHERE user_id = %s ORDER BY updated_at DESC", (user_id,))


                playlists = []


                for row in cur.fetchall():


                    playlist_id, name, description, created_at, updated_at = row


                    cur.execute("SELECT id, song_id, title, artist, duration, thumbnail, file_path, added_at FROM playlist_songs WHERE playlist_id = %s ORDER BY added_at ASC", (playlist_id,))


                    songs = [


                        {


                            "id": song_row[0],


                            "song_id": song_row[1],


                            "title": song_row[2],


                            "artist": song_row[3],


                            "duration": song_row[4],


                            "thumbnail": song_row[5],


                            "file_path": song_row[6],


                            "added_at": song_row[7].isoformat()


                        }


                        for song_row in cur.fetchall()


                    ]


                    playlists.append({


                        "id": playlist_id,


                        "user_id": user_id,


                        "name": name,


                        "description": description,


                        "songs": songs,


                        "created_at": created_at.isoformat(),


                        "updated_at": updated_at.isoformat()


                    })


                logger.info(f"Found {len(playlists)} playlists for user {user_id}")


                return {"status": "success", "playlists": playlists}


    except Exception as e:


        logger.error(f"Error getting playlists: {e}")


        raise HTTPException(500, f"Error getting playlists: {str(e)}")





@app.post("/playlists")


async def create_playlist(playlist: PlaylistIn):


    try:


        logger.info(f"Creating playlist '{playlist.name}' for user {playlist.user_id}")


        with get_connection() as conn:


            with conn.cursor() as cur:


                cur.execute(


                    "INSERT INTO playlists (user_id, name, description) VALUES (%s, %s, %s) RETURNING id, created_at, updated_at",


                    (playlist.user_id, playlist.name, playlist.description),


                )


                new_playlist = cur.fetchone()


                conn.commit()


                playlist_id, created_at, updated_at = new_playlist


                logger.info(f"Playlist '{playlist.name}' created with id {playlist_id}")


                return {


                    "status": "success",


                    "playlist": {


                        "id": playlist_id,


                        "user_id": playlist.user_id,


                        "name": playlist.name,


                        "description": playlist.description,


                        "songs": [],


                        "created_at": created_at.isoformat(),


                        "updated_at": updated_at.isoformat()


                    },


                }


    except Exception as e:


        logger.error(f"Error creating playlist: {e}")


        raise HTTPException(500, f"Error creating playlist: {str(e)}")





@app.delete("/playlists/{playlist_id}")


async def delete_playlist(playlist_id: uuid.UUID, user_id: uuid.UUID):


    try:


        logger.info(f"Deleting playlist {playlist_id} for user {user_id}")


        with get_connection() as conn:


            with conn.cursor() as cur:


                cur.execute("DELETE FROM playlists WHERE id = %s AND user_id = %s", (playlist_id, user_id))


                conn.commit()


                if cur.rowcount == 0:


                    logger.warning(f"Playlist {playlist_id} not found or user {user_id} does not have permission")


                    raise HTTPException(404, "Playlist not found or user does not have permission")


                logger.info(f"Playlist {playlist_id} deleted")


                return {"status": "success", "message": "Playlist deleted"}


    except HTTPException:


        raise


    except Exception as e:


        logger.error(f"Error deleting playlist: {e}")


        raise HTTPException(500, f"Error deleting playlist: {str(e)}")





@app.post("/playlists/{playlist_id}/songs")


async def add_song_to_playlist(playlist_id: uuid.UUID, song: SongIn, user_id: uuid.UUID):


    try:


        logger.info(f"Adding song '{song.title}' to playlist {playlist_id}")


        with get_connection() as conn:


            with conn.cursor() as cur:


                # Verify playlist ownership


                cur.execute("SELECT id FROM playlists WHERE id = %s AND user_id = %s", (playlist_id, user_id))


                if cur.fetchone() is None:


                    logger.warning(f"Playlist {playlist_id} not found or user {user_id} does not have permission")


                    raise HTTPException(404, "Playlist not found or user does not have permission")





                cur.execute(


                    "INSERT INTO playlist_songs (playlist_id, song_id, title, artist, duration, thumbnail, file_path) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, added_at",


                    (playlist_id, song.id, song.title, song.artist, song.duration, song.thumbnail, song.file_path),


                )


                new_song = cur.fetchone()


                conn.commit()


                song_id, added_at = new_song


                logger.info(f"Song '{song.title}' added to playlist {playlist_id}")


                return {


                    "status": "success",


                    "song": {


                        "id": song_id,


                        "song_id": song.id,


                        "title": song.title,


                        "artist": song.artist,


                        "duration": song.duration,


                        "thumbnail": song.thumbnail,


                        "file_path": song.file_path,


                        "added_at": added_at.isoformat()


                    },


                }


    except HTTPException:


        raise


    except Exception as e:


        logger.error(f"Error adding song to playlist: {e}")


        raise HTTPException(500, f"Error adding song to playlist: {str(e)}")





@app.delete("/playlists/{playlist_id}/songs/{song_id}")


async def remove_song_from_playlist(playlist_id: uuid.UUID, song_id: uuid.UUID, user_id: uuid.UUID):


    try:


        logger.info(f"Removing song {song_id} from playlist {playlist_id}")


        with get_connection() as conn:


            with conn.cursor() as cur:


                # Verify playlist ownership


                cur.execute("SELECT id FROM playlists WHERE id = %s AND user_id = %s", (playlist_id, user_id))


                if cur.fetchone() is None:


                    logger.warning(f"Playlist {playlist_id} not found or user {user_id} does not have permission")


                    raise HTTPException(404, "Playlist not found or user does not have permission")





                cur.execute("DELETE FROM playlist_songs WHERE id = %s AND playlist_id = %s", (song_id, playlist_id))


                conn.commit()


                if cur.rowcount == 0:


                    logger.warning(f"Song {song_id} not found in playlist {playlist_id}")


                    raise HTTPException(404, "Song not found in playlist")


                logger.info(f"Song {song_id} removed from playlist {playlist_id}")


                return {"status": "success", "message": "Song removed from playlist"}


    except HTTPException:


        raise


    except Exception as e:


        logger.error(f"Error removing song from playlist: {e}")


        raise HTTPException(500, f"Error removing song from playlist: {str(e)}")





class PlaylistUpdate(BaseModel):


    name: Optional[str] = None


    description: Optional[str] = None





@app.put("/playlists/{playlist_id}")


async def update_playlist(playlist_id: uuid.UUID, playlist: PlaylistUpdate, user_id: uuid.UUID):


    try:


        logger.info(f"Updating playlist {playlist_id}")


        with get_connection() as conn:


            with conn.cursor() as cur:


                # Verify playlist ownership


                cur.execute("SELECT id FROM playlists WHERE id = %s AND user_id = %s", (playlist_id, user_id))


                if cur.fetchone() is None:


                    logger.warning(f"Playlist {playlist_id} not found or user {user_id} does not have permission")


                    raise HTTPException(404, "Playlist not found or user does not have permission")





                updates = []


                params = []


                if playlist.name is not None:


                    updates.append("name = %s")


                    params.append(playlist.name)


                if playlist.description is not None:


                    updates.append("description = %s")


                    params.append(playlist.description)





                if not updates:


                    raise HTTPException(400, "No update fields provided")





                params.append(playlist_id)


                query = f"UPDATE playlists SET {', '.join(updates)} WHERE id = %s RETURNING updated_at"


                cur.execute(query, tuple(params))


                updated_at = cur.fetchone()[0]


                conn.commit()


                logger.info(f"Playlist {playlist_id} updated")


                return {"status": "success", "updated_at": updated_at.isoformat()}


    except HTTPException:


        raise


    except Exception as e:


        logger.error(f"Error updating playlist: {e}")


        raise HTTPException(500, f"Error updating playlist: {str(e)}")





if __name__ == "__main__":
    import uvicorn
    import os
    
    # Crear directorio de descargas si no existe
    DOWNLOADS_DIR.mkdir(exist_ok=True)
    
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"🚀 Iniciando servidor en puerto {port}")
    logger.info(f"📁 Directorio de descargas: {DOWNLOADS_DIR}")
    
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
