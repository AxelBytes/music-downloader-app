import os
from pathlib import Path

# Configuración base
BASE_DIR = Path(__file__).parent
DOWNLOADS_DIR = BASE_DIR / "downloads"
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Configuración de yt-dlp
YT_DLP_CONFIG = {
    'format': 'bestaudio/best',
    'extractaudio': True,
    'audioformat': 'mp3',
    'audioquality': '192K',
    'writethumbnail': True,
    'writeinfojson': True,
    'quiet': True,
    'no_warnings': True,
}

# Configuración de FastAPI
API_CONFIG = {
    'host': '0.0.0.0',
    'port': 8000,
    'reload': True,
}
