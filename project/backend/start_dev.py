#!/usr/bin/env python
"""Script para lanzar el servidor en desarrollo con variables de entorno cargadas"""
import os
import uvicorn
from dotenv import load_dotenv

# Cargar variables de .env
load_dotenv()

# Verificar que DATABASE_URL esté configurado
if not os.getenv('DATABASE_URL'):
    raise RuntimeError("DATABASE_URL no configurado. Revisa el archivo .env")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"🚀 Iniciando servidor en {host}:{port}")
    print(f"📦 DATABASE_URL: {os.getenv('DATABASE_URL')[:50]}...")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True
    )
