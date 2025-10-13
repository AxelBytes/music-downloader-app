# Importar el main.py del backend
import sys
import os

# Agregar el path del backend
backend_path = os.path.join(os.path.dirname(__file__), '..', 'project', 'backend')
sys.path.insert(0, backend_path)

# Importar la aplicación FastAPI desde el backend
try:
    from main import app
except ImportError:
    # Si falla, intentar importar directamente
    import importlib.util
    spec = importlib.util.spec_from_file_location("main", os.path.join(backend_path, "main.py"))
    main_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(main_module)
    app = main_module.app

# Exportar la aplicación para Vercel
__all__ = ['app']
