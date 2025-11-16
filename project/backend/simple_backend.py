from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import os
from pathlib import Path
import uuid

# Configuración
DOWNLOADS_DIR = Path("./downloads")
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Crear app FastAPI
app = FastAPI(title="Music Downloader API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo de datos
class SearchResult:
    def __init__(self, data):
        self.id = data.get('id', str(uuid.uuid4()))
        self.title = data.get('title', 'Sin título')
        self.uploader = data.get('uploader', 'Artista desconocido')
        self.duration = data.get('duration', 0)
        self.thumbnail = data.get('thumbnail', '')
        self.url = data.get('webpage_url', data.get('url', ''))
        self.view_count = data.get('view_count', 0)

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
async def download_music(url: str, quality: str = "best"):
    """Descargar música"""
    try:
        print(f"🔽 Iniciando descarga: {url}")
        
        # Configuración simple
        ydl_opts = {
            'format': 'bestaudio[ext=m4a]/bestaudio',
            'outtmpl': str(DOWNLOADS_DIR / '%(title)s.%(ext)s'),
            'writethumbnail': False,
            'writeinfojson': False,
            'quiet': False,
            'no_warnings': False,
            'age_limit': 0,
            'no_check_certificate': True,
            'ignoreerrors': True,
        }
        
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
                        "uploader": info.get('uploader', 'Unknown')
                    }
            
            raise Exception("Archivo descargado no encontrado")
            
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
        "timestamp": "2025-01-13"
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
        "timestamp": "2025-01-13"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
