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
from config import DOWNLOADS_DIR, YT_DLP_CONFIG, API_CONFIG

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

# Almacenamiento en memoria (para desarrollo)
download_tasks: Dict[str, DownloadTask] = {}

@app.get("/")
async def root():
    return {"message": "Music Downloader API funcionando", "status": "ok"}

@app.get("/download/{filename}")
async def download_file(filename: str):
    """
    Servir archivos descargados
    """
    try:
        file_path = DOWNLOADS_DIR / filename
        if file_path.exists() and file_path.is_file():
            return FileResponse(
                path=str(file_path),
                filename=filename,
                media_type='audio/mpeg'
            )
        else:
            raise HTTPException(404, "Archivo no encontrado")
    except Exception as e:
        raise HTTPException(500, f"Error sirviendo archivo: {str(e)}")

@app.get("/files")
async def get_files():
    """
    Endpoint simple para obtener archivos
    """
    files = [
        {
            "filename": "Bad Bunny - Diles Original (Audio Oficial).mp3",
            "title": "Bad Bunny - Diles Original",
            "size": 1234567,
            "modified": 1696896000,
            "path": "/download/Bad Bunny - Diles Original (Audio Oficial).mp3"
        },
        {
            "filename": "Diles - Bad Bunny, Ozuna, Farruko, Arcangel, Ñengo Flow.mp3",
            "title": "Diles - Bad Bunny, Ozuna, Farruko",
            "size": 2345678,
            "modified": 1696896000,
            "path": "/download/Diles - Bad Bunny, Ozuna, Farruko, Arcangel, Ñengo Flow.mp3"
        }
    ]
    return {"status": "success", "downloads": files, "total": len(files)}

@app.post("/test-download")
async def test_download(url: str):
    """
    Endpoint de prueba para descargas
    """
    try:
        print(f"🧪 Test descarga: {url}")
        
        # Simular descarga exitosa
        title = "Test Song"
        filename = f"{title}.mp3"
        
        # Crear archivo de prueba
        test_file = DOWNLOADS_DIR / filename
        test_file.write_text("Test audio content")
        
        return {
            "status": "success",
            "message": f"Descarga de prueba completada: {title}",
            "file": {
                "title": title,
                "filename": filename,
                "size": test_file.stat().st_size
            }
        }
    except Exception as e:
        return {"status": "error", "message": f"Error en test: {str(e)}"}

@app.post("/simple-download")
async def simple_download(url: str):
    """
    Descarga simple sin yt-dlp (para pruebas)
    """
    try:
        print(f"🔽 Descarga simple desde: {url}")
        
        # Simular descarga exitosa con datos reales
        title = "Khea - Screenshot (Video Oficial)"
        filename = "Khea - Screenshot.mp3"
        
        # Crear archivo de prueba más realista
        test_file = DOWNLOADS_DIR / filename
        test_content = b"ID3\x03\x00\x00\x00\x00\x00\x00\x00" + b"0" * 1000  # Simular MP3
        test_file.write_bytes(test_content)
        
        print(f"✅ Archivo creado: {filename}")
        
        return {
            "status": "success",
            "task_id": "test-123",
            "file": {
                "title": title,
                "artist": "KHEA",
                "duration": 209,
                "thumbnail": "",
                "file_path": str(test_file),
                "file_size": test_file.stat().st_size,
                "filename": filename
            }
        }
    except Exception as e:
        print(f"❌ Error en descarga simple: {str(e)}")
        return {"status": "error", "message": f"Error en descarga simple: {str(e)}"}

@app.get("/health")
async def health_check():
    try:
        # Intentar leer archivos reales
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
                        "path": f"/download/{file_path.name}"
                    })
        
        return {
            "status": "success", 
            "message": "API funcionando correctamente",
            "downloads": files,
            "total": len(files)
        }
    except Exception as e:
        # Si hay error, devolver lista vacía
        return {
            "status": "success", 
            "message": "API funcionando correctamente",
            "downloads": [],
            "total": 0
        }

@app.get("/test-downloads")
async def test_downloads():
    files = [
        {
            "filename": "Bad Bunny - Diles Original (Audio Oficial).mp3",
            "title": "Bad Bunny - Diles Original",
            "size": 1234567,
            "modified": 1696896000,
            "path": "/download/Bad Bunny - Diles Original (Audio Oficial).mp3"
        },
        {
            "filename": "Diles - Bad Bunny, Ozuna, Farruko, Arcangel, Ñengo Flow.mp3",
            "title": "Diles - Bad Bunny, Ozuna, Farruko",
            "size": 2345678,
            "modified": 1696896000,
            "path": "/download/Diles - Bad Bunny, Ozuna, Farruko, Arcangel, Ñengo Flow.mp3"
        }
    ]
    return {"status": "success", "downloads": files, "total": len(files)}

@app.get("/my-downloads")
async def my_downloads():
    """
    Endpoint alternativo para listar descargas
    """
    try:
        # Leer archivos reales del directorio
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
                        "path": f"/download/{file_path.name}"
                    })
        
        return {"status": "success", "downloads": files, "total": len(files)}
    except Exception as e:
        return {"status": "success", "downloads": [], "total": 0}

@app.post("/search")
async def search_music(query: str):
    """
    Buscar música en YouTube
    """
    try:
        if not query or len(query.strip()) < 2:
            raise HTTPException(400, "Query debe tener al menos 2 caracteres")
        
        # Configurar yt-dlp para búsqueda
        ydl_opts = {
            'format': 'bestaudio/best',
            'extract_flat': True,
            'quiet': True,
            'no_warnings': True,
        }
        
        search_query = f"ytsearch10:{query.strip()}"
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            search_results = ydl.extract_info(search_query, download=False)
            
        if not search_results or 'entries' not in search_results:
            return {"status": "success", "results": []}
        
        # Procesar resultados
        results = []
        for entry in search_results['entries']:
            if entry:  # Verificar que entry no sea None
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
        
        return {
            "status": "success",
            "results": results,
            "total": len(results)
        }
        
    except Exception as e:
        print(f"Error en búsqueda: {str(e)}")
        raise HTTPException(500, f"Error en búsqueda: {str(e)}")

@app.post("/download")
async def download_audio(url: str, quality: str = "best", background_tasks: BackgroundTasks = None):
    """
    Descargar audio de una URL
    """
    try:
        if not url:
            raise HTTPException(400, "URL es requerida")
        
        # Verificar que la URL sea válida
        if not url.startswith(('http://', 'https://')):
            raise HTTPException(400, "URL inválida")
        
        # Configurar calidad
        quality_map = {
            'low': 'worstaudio/worst',
            'medium': 'bestaudio[height<=480]',
            'high': 'bestaudio[height<=720]',
            'best': 'bestaudio/best'
        }
        
        selected_quality = quality_map.get(quality, 'bestaudio/best')
        
        # Configurar yt-dlp para Windows con mejor compatibilidad
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': str(DOWNLOADS_DIR / '%(title)s.%(ext)s'),
            'writethumbnail': False,
            'writeinfojson': False,
            'quiet': False,  # Mostrar logs para debug
            'no_warnings': False,
            'ignoreerrors': True,  # Ignorar errores menores
            'extract_flat': False,
            'noplaylist': True,
            'extractaudio': True,
            'audioformat': 'mp3',
            'audioquality': '192K',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'ffmpeg_location': None,  # Usar ffmpeg del sistema
        }
        
        # Crear tarea de descarga
        task = DownloadTask(url, quality)
        download_tasks[task.id] = task
        
        try:
            print(f"🔽 Iniciando descarga real desde: {url}")
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Extraer información primero
                info = ydl.extract_info(url, download=False)
                title = info.get('title', 'unknown')
                print(f"📀 Título: {title}")
                
                # Descargar el archivo
                ydl.download([url])
                print(f"✅ Descarga completada: {title}")
                
                # Buscar el archivo descargado
                time.sleep(1)  # Esperar un momento para que se complete la escritura
                
                # Buscar archivos que contengan el título
                safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
                downloaded_files = list(DOWNLOADS_DIR.glob(f"*{safe_title[:30]}*"))
                
                if not downloaded_files:
                    # Buscar el archivo más reciente
                    all_files = [f for f in DOWNLOADS_DIR.glob("*") if f.is_file()]
                    if all_files:
                        downloaded_files = [max(all_files, key=os.path.getctime)]
                        print(f"📁 Archivo encontrado: {downloaded_files[0].name}")
                
                if downloaded_files and downloaded_files[0].exists():
                    file_path = downloaded_files[0]
                    
                    # Actualizar tarea
                    task.status = "completed"
                    task.progress = 100
                    task.file_path = str(file_path)
                    
                    print(f"🎵 Archivo listo: {file_path.name} ({file_path.stat().st_size} bytes)")
                    
                    return {
                        "status": "success",
                        "task_id": task.id,
                        "file": {
                            "title": title,
                            "artist": info.get('uploader', 'Artista desconocido'),
                            "duration": info.get('duration', 0),
                            "thumbnail": info.get('thumbnail', ''),
                            "file_path": str(file_path),
                            "file_size": file_path.stat().st_size,
                            "filename": file_path.name
                        }
                    }
                else:
                    print("❌ No se encontró archivo descargado")
                    return {"status": "error", "message": "Archivo descargado pero no encontrado"}
                
        except Exception as e:
            task.status = "failed"
            task.error = str(e)
            print(f"❌ Error en descarga: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"status": "error", "message": f"Error en descarga: {str(e)}"}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error inesperado en descarga: {str(e)}")
        raise HTTPException(500, f"Error inesperado: {str(e)}")

@app.get("/downloads")
async def list_downloads():
    """
    Listar archivos descargados
    """
    # Lista hardcodeada temporalmente para probar
    files = [
        {
            "filename": "Bad Bunny - Diles Original (Audio Oficial).mp3",
            "title": "Bad Bunny - Diles Original",
            "size": 1234567,
            "modified": 1696896000,
            "path": "/download/Bad Bunny - Diles Original (Audio Oficial).mp3"
        },
        {
            "filename": "Diles - Bad Bunny, Ozuna, Farruko, Arcangel, Ñengo Flow.mp3",
            "title": "Diles - Bad Bunny, Ozuna, Farruko",
            "size": 2345678,
            "modified": 1696896000,
            "path": "/download/Diles - Bad Bunny, Ozuna, Farruko, Arcangel, Ñengo Flow.mp3"
        }
    ]
    
    return {"status": "success", "downloads": files, "total": len(files)}

@app.get("/download/{filename}")
async def get_downloaded_file(filename: str):
    """
    Obtener archivo descargado
    """
    try:
        file_path = DOWNLOADS_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(404, "Archivo no encontrado")
        
        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type='audio/mpeg'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error obteniendo archivo: {str(e)}")

@app.delete("/download/{filename}")
async def delete_downloaded_file(filename: str):
    """
    Eliminar archivo descargado
    """
    try:
        file_path = DOWNLOADS_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(404, "Archivo no encontrado")
        
        file_path.unlink()
        
        return {"status": "success", "message": "Archivo eliminado correctamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error eliminando archivo: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
