#!/usr/bin/env python3
"""
Script para instalar FFmpeg automáticamente en Windows
"""

import os
import sys
import platform
import subprocess
import urllib.request
import zipfile
import shutil
from pathlib import Path

def download_file(url: str, filename: str) -> bool:
    """Descargar archivo desde URL"""
    try:
        print(f"📥 Descargando {filename}...")
        urllib.request.urlretrieve(url, filename)
        print(f"✅ Descarga completada: {filename}")
        return True
    except Exception as e:
        print(f"❌ Error descargando {filename}: {e}")
        return False

def install_ffmpeg_windows():
    """Instalar FFmpeg en Windows"""
    print("🪟 Detectado Windows, instalando FFmpeg...")
    
    # URLs de FFmpeg para Windows
    ffmpeg_url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    ffmpeg_zip = "ffmpeg.zip"
    ffmpeg_dir = "C:\\ffmpeg"
    
    try:
        # Crear directorio C:\ffmpeg
        if not os.path.exists(ffmpeg_dir):
            os.makedirs(ffmpeg_dir)
            print(f"📁 Creado directorio: {ffmpeg_dir}")
        
        # Descargar FFmpeg
        if not download_file(ffmpeg_url, ffmpeg_zip):
            return False
        
        # Extraer FFmpeg
        print("📦 Extrayendo FFmpeg...")
        with zipfile.ZipFile(ffmpeg_zip, 'r') as zip_ref:
            zip_ref.extractall("temp_ffmpeg")
        
        # Mover archivos a C:\ffmpeg\bin
        bin_dir = os.path.join(ffmpeg_dir, "bin")
        if not os.path.exists(bin_dir):
            os.makedirs(bin_dir)
        
        # Buscar el directorio extraído
        extracted_dir = None
        for item in os.listdir("temp_ffmpeg"):
            item_path = os.path.join("temp_ffmpeg", item)
            if os.path.isdir(item_path):
                extracted_dir = item_path
                break
        
        if extracted_dir:
            # Copiar archivos binarios
            bin_source = os.path.join(extracted_dir, "bin")
            if os.path.exists(bin_source):
                for file in os.listdir(bin_source):
                    if file.endswith('.exe'):
                        shutil.copy2(os.path.join(bin_source, file), bin_dir)
                        print(f"📋 Copiado: {file}")
        
        # Limpiar archivos temporales
        os.remove(ffmpeg_zip)
        shutil.rmtree("temp_ffmpeg")
        
        print(f"✅ FFmpeg instalado correctamente en {bin_dir}")
        print("🔧 Agregando al PATH del sistema...")
        
        # Agregar al PATH del sistema (requiere permisos de administrador)
        try:
            # Esto requiere permisos de administrador
            subprocess.run([
                'setx', 'PATH', 
                f'%PATH%;{bin_dir}',
                '/M'
            ], check=True, shell=True)
            print("✅ FFmpeg agregado al PATH del sistema")
        except subprocess.CalledProcessError:
            print("⚠️ No se pudo agregar al PATH del sistema (requiere permisos de administrador)")
            print(f"💡 Agrega manualmente esta ruta al PATH: {bin_dir}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error instalando FFmpeg: {e}")
        return False

def install_ffmpeg_linux():
    """Instalar FFmpeg en Linux"""
    print("🐧 Detectado Linux, instalando FFmpeg...")
    
    try:
        # Actualizar repositorios
        subprocess.run(['sudo', 'apt', 'update'], check=True)
        
        # Instalar FFmpeg
        subprocess.run(['sudo', 'apt', 'install', '-y', 'ffmpeg'], check=True)
        
        print("✅ FFmpeg instalado correctamente")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error instalando FFmpeg: {e}")
        return False

def install_ffmpeg_macos():
    """Instalar FFmpeg en macOS"""
    print("🍎 Detectado macOS, instalando FFmpeg...")
    
    try:
        # Verificar si Homebrew está instalado
        try:
            subprocess.run(['brew', '--version'], check=True, capture_output=True)
        except subprocess.CalledProcessError:
            print("📦 Instalando Homebrew...")
            subprocess.run([
                '/bin/bash', '-c', 
                '$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)'
            ], check=True)
        
        # Instalar FFmpeg con Homebrew
        subprocess.run(['brew', 'install', 'ffmpeg'], check=True)
        
        print("✅ FFmpeg instalado correctamente")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error instalando FFmpeg: {e}")
        return False

def verify_ffmpeg():
    """Verificar que FFmpeg esté instalado correctamente"""
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, text=True, check=True)
        print("✅ FFmpeg verificado correctamente")
        print(f"📋 Versión: {result.stdout.split('ffmpeg version')[1].split()[0]}")
        return True
    except subprocess.CalledProcessError:
        print("❌ FFmpeg no encontrado en el PATH")
        return False
    except FileNotFoundError:
        print("❌ FFmpeg no está instalado")
        return False

def main():
    """Función principal"""
    print("🎵 Instalador de FFmpeg para Music Downloader")
    print("=" * 50)
    
    # Verificar si FFmpeg ya está instalado
    if verify_ffmpeg():
        print("✅ FFmpeg ya está instalado y funcionando")
        return True
    
    # Detectar sistema operativo
    system = platform.system().lower()
    
    success = False
    
    if system == 'windows':
        success = install_ffmpeg_windows()
    elif system == 'linux':
        success = install_ffmpeg_linux()
    elif system == 'darwin':  # macOS
        success = install_ffmpeg_macos()
    else:
        print(f"❌ Sistema operativo no soportado: {system}")
        return False
    
    if success:
        print("\n🎉 ¡FFmpeg instalado correctamente!")
        print("🔄 Reinicia tu terminal y ejecuta 'ffmpeg -version' para verificar")
        return True
    else:
        print("\n❌ Error instalando FFmpeg")
        print("💡 Instalación manual:")
        print("   Windows: https://ffmpeg.org/download.html")
        print("   Linux: sudo apt install ffmpeg")
        print("   macOS: brew install ffmpeg")
        return False

if __name__ == "__main__":
    main()
