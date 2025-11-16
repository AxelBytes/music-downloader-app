import os
from pathlib import Path

# ============================================
# GROOVIFY MUSIC DOWNLOADER - BACKEND CONFIG
# Version: 3.0.0 - Invidious backend (reliable alternative to YouTube)
# ============================================

# CONFIGURACIÓN DE VARIABLES DE ENTORNO
PYTHON_VERSION = os.getenv('PYTHON_VERSION', '3.10')
FFMPEG_PATH = os.getenv('FFMPEG_PATH', '/usr/local/bin/ffmpeg')
DOWNLOADS_DIR_ENV = os.getenv('DOWNLOADS_DIR', '/tmp/downloads')
MAX_FILE_SIZE = os.getenv('MAX_FILE_SIZE', '100MB')
REQUEST_TIMEOUT = int(os.getenv('REQUEST_TIMEOUT', '1800'))
DEBUG_MODE = os.getenv('DEBUG_MODE', 'true').lower() == 'true'

# Configuración base
BASE_DIR = Path(__file__).parent
DOWNLOADS_DIR = BASE_DIR / "downloads"
DOWNLOADS_DIR.mkdir(exist_ok=True)

# ============================================
# INVIDIOUS SERVERS (Reliable YouTube Alternative)
# ============================================
INVIDIOUS_SERVERS = [
    "https://iv.ggtyler.dev",
    "https://invidious.io",
    "https://invidious.projectsegfau.lt",
    "https://y.com.sb",
    "https://inv.bp.projectsegfau.lt",
]

# ============================================
# YT-DLP CONFIG (Fallback, optimized for Invidious)
# ============================================
YT_DLP_CONFIG = {
    'format': 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
    'outtmpl': str(DOWNLOADS_DIR / '%(title)s.%(ext)s'),
    'writethumbnail': False,
    'writeinfojson': False,
    'quiet': True,
    'no_warnings': True,
    
    # CONVERSIÓN A MP3
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '320',
    }],
    
    # CONFIGURACIÓN MINIMIZADA
    'socket_timeout': REQUEST_TIMEOUT,
    'retries': 2,
    'fragment_retries': 2,
    'http_chunk_size': 1048576,
    'skip_unavailable_fragments': True,
    'geo_bypass': True,
    'geo_bypass_country': 'US',
    'no_check_certificate': True,
}

# Configuración de FastAPI
API_CONFIG = {
    'host': '0.0.0.0',
    'port': 8000,
    'reload': False,
}
