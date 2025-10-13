# Importar la aplicación FastAPI desde el mismo directorio
from main import app

# Exportar la aplicación para Vercel
__all__ = ['app']
