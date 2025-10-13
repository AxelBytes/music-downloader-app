# Importar el main.py del backend
import sys
import os

# Agregar el path del backend
backend_path = os.path.join(os.path.dirname(__file__), '..', 'project', 'backend')
sys.path.insert(0, backend_path)

# Importar la aplicación FastAPI
from main import app

# Exportar la aplicación para Vercel
__all__ = ['app']
