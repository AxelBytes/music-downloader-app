from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import os
from pathlib import Path

# Configuración
DOWNLOADS_DIR = Path("./downloads")
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Crear app FastAPI
app = FastAPI(title="Test Backend", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Test Backend funcionando", "status": "ok"}

@app.get("/test")
async def test():
    return {"test": "funcionando"}

@app.post("/search")
async def search_music(query: str):
    """Buscar música en YouTube"""
    try:
        print(f"🔍 Buscando: {query}")
        
        # Configuración simple para búsqueda
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
            'default_search': 'ytsearch5:',
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            search_results = ydl.extract_info(f"ytsearch5:{query}", download=False)
            
            if not search_results or 'entries' not in search_results:
                return {"results": []}
            
            results = []
            for entry in search_results['entries'][:5]:
                if entry:
                    results.append({
                        "id": entry.get('id', ''),
                        "title": entry.get('title', 'Sin título'),
                        "uploader": entry.get('uploader', 'Artista desconocido'),
                        "duration": entry.get('duration', 0),
                        "thumbnail": entry.get('thumbnail', ''),
                        "url": entry.get('webpage_url', entry.get('url', '')),
                        "view_count": entry.get('view_count', 0)
                    })
            
            return {"results": results}
            
    except Exception as e:
        print(f"❌ Error en búsqueda: {str(e)}")
        return {"error": str(e), "results": []}

@app.post("/download")
async def download_music(url: str):
    """Descargar música"""
    try:
        print(f"🔽 Iniciando descarga: {url}")
        
        # Configuración simple
        ydl_opts = {
            'format': 'bestaudio[ext=m4a]/bestaudio',
            'outtmpl': str(DOWNLOADS_DIR / '%(title)s.%(ext)s'),
            'quiet': False,
            'no_warnings': False,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extraer información
            info = ydl.extract_info(url, download=False)
            
            if not info:
                return {"error": "No se pudo extraer información del video"}
            
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
            
            return {"error": "Archivo descargado no encontrado"}
            
    except Exception as e:
        print(f"❌ Error en descarga: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
