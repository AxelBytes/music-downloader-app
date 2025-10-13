import json
import os
import sys
import subprocess
import tempfile
import shutil

# Agregar el directorio backend al path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

def handler(event, context):
    """
    Netlify Function para manejar requests del backend
    """
    try:
        # Importar el backend
        from main import app
        
        # Crear un cliente de prueba para FastAPI
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Obtener el método HTTP y path
        method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        query_params = event.get('queryStringParameters', {})
        
        # Construir la URL con query parameters
        if query_params:
            query_string = '&'.join([f"{k}={v}" for k, v in query_params.items()])
            path = f"{path}?{query_string}"
        
        # Hacer la request
        if method == 'GET':
            response = client.get(path)
        elif method == 'POST':
            body = event.get('body', '')
            headers = event.get('headers', {})
            content_type = headers.get('content-type', 'application/json')
            
            if content_type == 'application/json':
                response = client.post(path, json=json.loads(body) if body else {})
            else:
                response = client.post(path, data=body)
        else:
            response = client.get(path)
        
        return {
            'statusCode': response.status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps(response.json() if hasattr(response, 'json') else response.text)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Error interno del servidor'
            })
        }
