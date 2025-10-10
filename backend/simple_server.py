from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
from pathlib import Path

# Directorio de descargas
DOWNLOADS_DIR = Path(__file__).parent / "downloads"
DOWNLOADS_DIR.mkdir(exist_ok=True)

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                "message": "Music Downloader API funcionando (versión simple)",
                "status": "ok",
                "version": "1.0.0-simple"
            }
            self.wfile.write(json.dumps(response).encode())
        
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Listar archivos
            files = []
            if DOWNLOADS_DIR.exists():
                for file_path in DOWNLOADS_DIR.iterdir():
                    if file_path.is_file() and file_path.suffix.lower() in ['.mp3', '.wav', '.m4a', '.webm']:
                        stat = file_path.stat()
                        files.append({
                            "filename": file_path.name,
                            "title": file_path.stem,
                            "size": stat.st_size,
                            "path": f"/download/{file_path.name}"
                        })
            
            response = {
                "status": "success",
                "message": "API funcionando correctamente",
                "downloads": files,
                "total": len(files)
            }
            self.wfile.write(json.dumps(response).encode())
        
        elif self.path.startswith('/download/'):
            filename = self.path[10:]  # Remover '/download/'
            file_path = DOWNLOADS_DIR / filename
            
            if file_path.exists():
                self.send_response(200)
                self.send_header('Content-type', 'audio/mpeg')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                with open(file_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {"error": "Archivo no encontrado"}
                self.wfile.write(json.dumps(response).encode())
        
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"error": "Endpoint no encontrado"}
            self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    server = HTTPServer(('localhost', 8000), SimpleHandler)
    print("🚀 Servidor simple iniciado en http://localhost:8000")
    print("📁 Directorio de descargas:", DOWNLOADS_DIR)
    print("🔧 Presiona Ctrl+C para detener")
    server.serve_forever()
