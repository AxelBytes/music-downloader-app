#!/usr/bin/env python3
"""
Script mejorado para iniciar el servidor de descarga de música
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def check_python_version():
    """Verificar versión de Python"""
    if sys.version_info < (3, 8):
        print("❌ Se requiere Python 3.8 o superior")
        print(f"   Versión actual: {sys.version}")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}")
    return True

def check_dependencies():
    """Verificar dependencias instaladas"""
    required_packages = [
        'fastapi',
        'uvicorn',
        'yt-dlp',
        'aiofiles',
        'python-multipart'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} - NO INSTALADO")
    
    if missing_packages:
        print(f"\n📦 Instalando dependencias faltantes...")
        try:
            subprocess.run([
                sys.executable, '-m', 'pip', 'install'
            ] + missing_packages, check=True)
            print("✅ Dependencias instaladas correctamente")
        except subprocess.CalledProcessError:
            print("❌ Error instalando dependencias")
            return False
    
    return True

def check_ffmpeg():
    """Verificar si FFmpeg está instalado"""
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ FFmpeg está instalado")
            return True
        else:
            print("❌ FFmpeg no está funcionando correctamente")
            return False
    except FileNotFoundError:
        print("❌ FFmpeg no encontrado")
        print("💡 Ejecuta: python install_ffmpeg.py")
        return False

def create_directories():
    """Crear directorios necesarios"""
    downloads_dir = Path(__file__).parent / "downloads"
    downloads_dir.mkdir(exist_ok=True)
    print(f"✅ Directorio de descargas: {downloads_dir}")
    return True

def get_local_ip():
    """Obtener IP local para la configuración"""
    import socket
    
    try:
        # Conectar a una dirección externa para obtener la IP local
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except:
        return "localhost"

def start_server():
    """Iniciar el servidor"""
    print("\n🚀 Iniciando servidor de descarga de música...")
    
    # Obtener IP local
    local_ip = get_local_ip()
    port = 8000
    
    print(f"📡 Servidor: http://{local_ip}:{port}")
    print(f"📁 Descargas: {Path(__file__).parent / 'downloads'}")
    print("\n💡 Para usar desde la app móvil:")
    print(f"   Actualiza la IP en DownloadsContext.tsx:")
    print(f"   const API_URL = 'http://{local_ip}:{port}';")
    
    print("\n🔄 Presiona Ctrl+C para detener el servidor\n")
    
    try:
        # Usar el servidor mejorado si existe
        improved_server = Path(__file__).parent / "improved_main.py"
        server_file = improved_server if improved_server.exists() else "main.py"
        
        subprocess.run([
            sys.executable, server_file,
            '--host', '0.0.0.0',
            '--port', str(port),
            '--reload'
        ])
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido")
    except Exception as e:
        print(f"❌ Error iniciando servidor: {e}")

def main():
    """Función principal"""
    print("🎵 Music Downloader Server - Iniciador")
    print("=" * 50)
    
    # Verificaciones
    if not check_python_version():
        return False
    
    if not check_dependencies():
        return False
    
    if not check_ffmpeg():
        print("\n⚠️ FFmpeg no está instalado")
        print("💡 Ejecuta: python install_ffmpeg.py")
        response = input("¿Continuar sin FFmpeg? (y/N): ")
        if response.lower() != 'y':
            return False
    
    if not create_directories():
        return False
    
    # Iniciar servidor
    start_server()
    return True

if __name__ == "__main__":
    main()
