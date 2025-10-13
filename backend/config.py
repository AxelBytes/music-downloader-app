import os
from pathlib import Path

# CONFIGURACIÓN DE VARIABLES DE ENTORNO
PYTHON_VERSION = os.getenv('PYTHON_VERSION', '3.9')
FFMPEG_PATH = os.getenv('FFMPEG_PATH', '/usr/local/bin/ffmpeg')
YT_DLP_VERSION = os.getenv('YT_DLP_VERSION', '2025.09.26')
DOWNLOADS_DIR_ENV = os.getenv('DOWNLOADS_DIR', '/tmp/downloads')
MAX_FILE_SIZE = os.getenv('MAX_FILE_SIZE', '100MB')
REQUEST_TIMEOUT = int(os.getenv('REQUEST_TIMEOUT', '1800'))
DEBUG_MODE = os.getenv('DEBUG_MODE', 'true').lower() == 'true'
YOUTUBE_BYPASS = os.getenv('YOUTUBE_BYPASS', 'true').lower() == 'true'
SLEEP_INTERVAL = float(os.getenv('SLEEP_INTERVAL', '0.01'))
MAX_RETRIES = int(os.getenv('MAX_RETRIES', '100'))

# Configuración base
BASE_DIR = Path(__file__).parent
DOWNLOADS_DIR = Path(DOWNLOADS_DIR_ENV) if DOWNLOADS_DIR_ENV.startswith('/') else BASE_DIR / "downloads"
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Configuración de yt-dlp PREMIUM
YT_DLP_CONFIG = {
    'format': 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
    'outtmpl': str(DOWNLOADS_DIR / '%(title)s.%(ext)s'),
    'writethumbnail': False,
    'writeinfojson': False,
    'quiet': False,
    'no_warnings': False,
    
    # CONVERSIÓN A MP3 PREMIUM
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '320',  # MÁXIMA CALIDAD MP3
    }],
    
    # CONFIGURACIÓN ULTRA-ROBUSTA PREMIUM
    'socket_timeout': REQUEST_TIMEOUT,
    'retries': MAX_RETRIES,
    'fragment_retries': MAX_RETRIES,
    'http_chunk_size': 1048576,  # 1MB chunks
    'sleep_interval': SLEEP_INTERVAL,
    'max_sleep_interval': 0.1,
    
    # BYPASS AGRESIVO PARA CALIDAD PREMIUM
    'age_limit': 0,
    'no_check_certificate': True,
    'ignoreerrors': True,
    'extract_flat': False,
    'writedescription': False,
    'writecomments': False,
    'writeautomaticsub': False,
    'writesubtitles': False,
    
    # ESTRATEGIA DE FRAGMENTACIÓN ANTI-RATAS
    'concurrent_fragment_downloads': 1,
    'keep_fragments': True,
    'skip_unavailable_fragments': True,
}

# Configuración de FastAPI
API_CONFIG = {
    'host': '0.0.0.0',
    'port': 8000,
    'reload': True,
}
