from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
from pathlib import Path

# Configuración
DOWNLOADS_DIR = Path("./downloads")
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Crear app FastAPI
app = FastAPI(title="Working Backend", version="1.0.0")

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
    return {"message": "Working Backend funcionando", "status": "ok"}

@app.get("/test")
async def test():
    return {"test": "funcionando", "downloads_dir": str(DOWNLOADS_DIR)}

@app.post("/search")
async def search_music(query: str):
    """Buscar música - SIMULADO"""
    try:
        print(f"🔍 Buscando: {query}")
        
        # Resultados simulados para probar
        results = [
            {
                "id": "test1",
                "title": f"Resultado 1 para {query}",
                "artist": "Artista Test",
                "uploader": "Artista Test",
                "duration": 180,
                "thumbnail": "",
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "view_count": 1000000
            },
            {
                "id": "test2", 
                "title": f"Resultado 2 para {query}",
                "artist": "Artista Test 2",
                "uploader": "Artista Test 2",
                "duration": 240,
                "thumbnail": "",
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "view_count": 500000
            }
        ]
        
        return {"results": results}
        
    except Exception as e:
        print(f"❌ Error en búsqueda: {str(e)}")
        return {"error": str(e), "results": []}

@app.post("/download")
async def download_music(url: str):
    """Descargar música - SIMULADO"""
    try:
        print(f"🔽 Iniciando descarga: {url}")
        
        # Simular descarga exitosa
        import time
        time.sleep(2)  # Simular tiempo de descarga
        
        # Crear archivo simulado
        test_file = DOWNLOADS_DIR / "test_download.m4a"
        test_file.write_text("Test audio file content")
        
        return {
            "status": "success",
            "file_path": str(test_file),
            "title": "Test Download",
            "duration": 180,
            "uploader": "Test Artist",
            "message": "Descarga simulada exitosa"
        }
        
    except Exception as e:
        print(f"❌ Error en descarga: {str(e)}")
        return {"error": str(e)}

@app.get("/downloads")
async def list_downloads():
    """Listar archivos descargados"""
    try:
        downloads = []
        for file_path in DOWNLOADS_DIR.glob("*"):
            if file_path.is_file():
                downloads.append({
                    "name": file_path.name,
                    "path": str(file_path),
                    "size": file_path.stat().st_size,
                    "created": file_path.stat().st_ctime
                })
        
        return {"downloads": downloads}
        
    except Exception as e:
        print(f"❌ Error listando descargas: {str(e)}")
        return {"error": str(e)}

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
            "Backend operativo - modo simulado",
            "Descargas simuladas funcionando"
        ],
        "timestamp": "2025-01-13"
    }

@app.get("/file/{filename}")
async def get_file(filename: str):
    """Servir archivos descargados"""
    try:
        file_path = DOWNLOADS_DIR / filename
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        else:
            return {"error": "Archivo no encontrado"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="192.168.100.112", port=8002)
