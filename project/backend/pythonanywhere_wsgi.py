# WSGI configuration for PythonAnywhere
# Copy this to /var/www/lionelaxel999_pythonanywhere_com_wsgi.py on PythonAnywhere

import sys
import os

# CRITICAL: Set environment BEFORE any imports
os.environ['DATABASE_URL'] = 'postgresql://neondb_owner:npg_y5mMwhtBfO3d@ep-tiny-silence-aczw9001-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'

# Add the backend folder to the path
sys.path.insert(0, '/home/Lionelaxel999/music-downloader-app/backend')

try:
    # Import the FastAPI app
    from main import app
    
    # Use the ASGI to WSGI adapter
    from asgiref.wsgi import WsgiToAsgi
    
    # Wrap FastAPI (ASGI) with WSGI adapter
    application = WsgiToAsgi(app)
    
except ImportError as e:
    def application(environ, start_response):
        status = '500 Internal Server Error'
        response_headers = [('Content-type', 'text/plain')]
        start_response(status, response_headers)
        return [f'Import Error: {str(e)}'.encode('utf-8')]
        
except Exception as e:
    def application(environ, start_response):
        status = '500 Internal Server Error'
        response_headers = [('Content-type', 'text/plain')]
        start_response(status, response_headers)
        return [f'Error: {str(e)}\nType: {type(e).__name__}'.encode('utf-8')]
