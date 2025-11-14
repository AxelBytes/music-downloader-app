#!/bin/bash
set -e

echo "🚀 Starting Groovify Backend..."
echo "📦 Installing Python dependencies..."

cd backend
pip install -r requirements.txt --upgrade yt-dlp

echo "✅ Dependencies installed"
echo "🗄️  Setting up database..."

# Initialize database if needed
python -c "from db import init_schema_if_needed; init_schema_if_needed(); print('✅ Database schema ready')" 2>/dev/null || true

echo "🎵 Starting FastAPI server..."
echo "Server will be available at http://0.0.0.0:8000"

# Run the backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
