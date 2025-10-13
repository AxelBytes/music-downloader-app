# Importar el main.py del backend
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'project', 'backend'))

from main import app

# Exportar la aplicación para Vercel
__all__ = ['app']
