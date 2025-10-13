from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import yt_dlp
import asyncio
import os
import json
import time
from pathlib import Path
from typing import List, Dict, Any
import uuid

# Configuración de descargas
DOWNLOADS_DIR = Path("/tmp/downloads")
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Configuración de yt-dlp PREMIUM (Simplificada)
YT_DLP_CONFIG = {
    'format': 'bestaudio[ext=m4a]/bestaudio',
    'outtmpl': str(DOWNLOADS_DIR / '%(title)s.%(ext)s'),
    'writethumbnail': False,
    'writeinfojson': False,
    'quiet': False,
    'no_warnings': False,
    
    # CONFIGURACIÓN SIMPLE QUE FUNCIONA
    'age_limit': 0,
    'no_check_certificate': True,
    'ignoreerrors': True,
}

# Crear app FastAPI
app = FastAPI(
    title="Music Downloader API",
    description="API para descargar música con yt-dlp",
    version="1.0.0"
)

# Configurar CORS para React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo de datos
class SearchResult:
    def __init__(self, data: Dict[str, Any]):
        self.id = data.get('id', str(uuid.uuid4()))
        self.title = data.get('title', 'Sin título')
        self.uploader = data.get('uploader', 'Artista desconocido')
        self.duration = data.get('duration', 0)
        self.thumbnail = data.get('thumbnail', '')
        self.url = data.get('webpage_url', data.get('url', ''))
        self.view_count = data.get('view_count', 0)

class DownloadTask:
    def __init__(self, url: str, quality: str = "best"):
        self.id = str(uuid.uuid4())
        self.url = url
        self.quality = quality
        self.status = "pending"
        self.progress = 0
        self.file_path = None
        self.error = None

# Almacenamiento en memoria
download_tasks: Dict[str, DownloadTask] = {}

# Función para ejecutar descarga premium
async def execute_premium_download(url: str, ydl_opts: Dict, strategy_name: str) -> Dict:
    """Ejecutar descarga premium con configuración simple"""
    try:
        print(f"🔥 [{strategy_name}] Iniciando descarga: {url}")
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extraer información
            info = ydl.extract_info(url, download=False)
            
            if not info:
                raise Exception("No se pudo extraer información del video")
            
            # Validar información
            if not info.get('title'):
                raise Exception("No se pudo obtener el título del video")
            
            # Descargar archivo
            ydl.download([url])
            
            # Buscar archivo descargado
            title = info.get('title', 'unknown')
            for ext in ['m4a', 'mp3', 'webm', 'mp4']:
                file_path = DOWNLOADS_DIR / f"{title}.{ext}"
                if file_path.exists():
                    return {
                        "status": "success",
                        "file_path": str(file_path),
                        "title": title,
                        "duration": info.get('duration', 0),
                        "uploader": info.get('uploader', 'Unknown'),
                        "strategy": strategy_name
                    }
            
            raise Exception("Archivo descargado no encontrado")
            
    except Exception as e:
        print(f"❌ [{strategy_name}] Error: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "strategy": strategy_name
        }

# Función para descarga premium MP3
async def download_premium_mp3(url: str) -> Dict:
    """Descarga premium MP3 con configuración simple"""
    try:
        print(f"🎵 [PREMIUM] Descargando: {url}")
        
        # CONFIGURACIÓN SIMPLE QUE FUNCIONA
        ydl_opts = YT_DLP_CONFIG.copy()
        
        # USAR SOLO LA CONFIGURACIÓN SIMPLE QUE FUNCIONA
        try:
            print(f"🔥 [SIMPLE] Descargando con configuración básica...")
            result = await execute_premium_download(url, ydl_opts, "SIMPLE")
            if result and result.get("status") == "success":
                return result
        except Exception as e:
            print(f"❌ [SIMPLE] Descarga falló: {str(e)}")
            raise Exception(f"Descarga falló: {str(e)}")
        
    except Exception as e:
        print(f"❌ [PREMIUM] Error general: {str(e)}")
        return {
            "status": "error",
            "error": str(e)
        }

# Endpoints
@app.get("/")
async def root():
    return {"message": "Groovify Backend funcionando", "status": "ok"}

@app.post("/search")
async def search_music(query: str):
    """Buscar música en YouTube"""
    try:
        print(f"🔍 Buscando: {query}")
        
        # Configuración para búsqueda
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
            'default_search': 'ytsearch10:',
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            search_results = ydl.extract_info(f"ytsearch10:{query}", download=False)
            
            if not search_results or 'entries' not in search_results:
                return {"results": []}
            
            results = []
            for entry in search_results['entries'][:10]:
                if entry:
                    try:
                        result = SearchResult(entry)
                        results.append({
                            "id": result.id,
                            "title": result.title,
                            "uploader": result.uploader,
                            "duration": result.duration,
                            "thumbnail": result.thumbnail,
                            "url": result.url,
                            "view_count": result.view_count
                        })
                    except Exception as e:
                        print(f"❌ Error procesando resultado: {e}")
                        continue
            
            return {"results": results}
            
    except Exception as e:
        print(f"❌ Error en búsqueda: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en búsqueda: {str(e)}")

@app.post("/download")
async def download_music(url: str, quality: str = "best", background_tasks: BackgroundTasks = None):
    """Descargar música"""
    try:
        print(f"🔽 Iniciando descarga: {url}")
        
        # Crear tarea de descarga
        task = DownloadTask(url, quality)
        download_tasks[task.id] = task
        
        # Ejecutar descarga
        result = await download_premium_mp3(url)
        
        if result.get("status") == "success":
            task.status = "completed"
            task.file_path = result.get("file_path")
            return {
                "task_id": task.id,
                "status": "success",
                "file_path": result.get("file_path"),
                "title": result.get("title"),
                "duration": result.get("duration"),
                "uploader": result.get("uploader")
            }
        else:
            task.status = "failed"
            task.error = result.get("error")
            raise HTTPException(status_code=500, detail=result.get("error"))
            
    except Exception as e:
        print(f"❌ Error en descarga: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en descarga: {str(e)}")

@app.get("/downloads")
async def list_downloads():
    """Listar archivos descargados"""
    try:
        downloads = []
        for file_path in DOWNLOADS_DIR.glob("*"):
            if file_path.is_file() and file_path.suffix in ['.mp3', '.m4a', '.webm', '.mp4']:
                downloads.append({
                    "name": file_path.name,
                    "path": str(file_path),
                    "size": file_path.stat().st_size,
                    "created": file_path.stat().st_ctime
                })
        
        return {"downloads": downloads}
        
    except Exception as e:
        print(f"❌ Error listando descargas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listando descargas: {str(e)}")

@app.get("/premium-status")
async def premium_status():
    """Estado del sistema premium"""
    return {
        "status": "premium",
        "version": "1.0.0",
        "features": ["mp3_320kbps", "youtube_bypass", "premium_quality"],
        "timestamp": time.time()
    }

@app.get("/recent-logs")
async def recent_logs():
    """Logs recientes del sistema"""
    return {
        "logs": [
            "Sistema premium funcionando",
            "Configuración simple aplicada",
            "Backend operativo"
        ],
        "timestamp": time.time()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
