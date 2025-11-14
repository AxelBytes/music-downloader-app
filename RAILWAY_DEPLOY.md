# 🚀 Guía de Deploy en Railway

## Paso 1: Preparar el Repositorio

1. **Asegúrate de tener los archivos necesarios:**
   - ✅ `backend/requirements.txt`
   - ✅ `backend/main.py`
   - ✅ `backend/.env.example`
   - ✅ `Procfile` o `railway.json`

2. **Haz commit y push a GitHub:**
   ```bash
   cd c:\Users\Lionel.Dev\Desktop\Repro-Musica
   git add .
   git commit -m "feat: prepare backend for Railway deployment"
   git push origin main
   ```

## Paso 2: Crear Proyecto en Railway

1. **Ve a [railway.app](https://railway.app)**

2. **Haz login con GitHub** (recomendado)

3. **Click en "New Project"**

4. **Selecciona "Deploy from GitHub repo"**

5. **Autoriza Railway con GitHub** y selecciona tu repositorio `Repro-Musica`

## Paso 3: Crear PostgreSQL en Railway

1. **En el dashboard de Railway, click "New"**

2. **Selecciona "Database"** → **"PostgreSQL"**

3. **Railway lo crea automáticamente** con:
   - Variable: `DATABASE_URL`
   - Esta se copia automáticamente a tu backend

## Paso 4: Configurar Backend en Railway

1. **Railway detecta automáticamente que es Python**

2. **Agrega variables de entorno:**
   - Railway automáticamente inyecta `DATABASE_URL` de PostgreSQL
   - Agrega otras variables si es necesario en "Variables"

3. **Deploy automático:**
   - Cuando hagas push a `main`, Railway automáticamente:
     - Descarga el código
     - Instala `requirements.txt`
     - Ejecuta el `Procfile` o comando personalizado
     - Deploy en vivo

## Paso 5: Obtener URL del Backend

1. **En el dashboard, ve a tu servicio "Backend"**

2. **En la pestaña "Deployments"**, busca la URL pública

3. **Será algo como:** `https://groovify-api-production.railway.app`

## Paso 6: Actualizar Frontend con Nueva URL

1. **Actualiza `contexts/DownloaderMusicPlayerContext.tsx`:**
   ```typescript
   const API_URL = 'https://groovify-api-production.railway.app'; // Tu URL de Railway
   ```

2. **Actualiza también en:**
   - `contexts/AuthContext.tsx`
   - `contexts/DownloadsContext.tsx`

3. **Haz commit y rebuild del APK**

## Verificar que Funciona

```bash
# Prueba la API
curl https://groovify-api-production.railway.app/health

# Respuesta esperada:
# {"status":"ok"}
```

## Beneficios Railway

✅ Gratis con $5 USD/mes en créditos (suficiente para pequeño uso)
✅ **No se pausa** (a diferencia de Heroku)
✅ PostgreSQL incluido
✅ Deploy automático desde GitHub
✅ HTTPS automático
✅ Logs en tiempo real
✅ Fácil escalado

## Solución de Problemas

**Si ves error de conexión a BD:**
- Verifica que `DATABASE_URL` esté inyectado
- Ve a Railway → Variables → Busca `DATABASE_URL`

**Si el deploy falla:**
- Ve a Deployments → Ver logs
- Generalmente es porque falta instalar algo en `requirements.txt`

**Si la app es lenta:**
- Railway puede requerir upgrade de plan
- Por ahora debería funcionar gratis
