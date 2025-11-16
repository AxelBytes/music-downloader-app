import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Configuración de la base de datos
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/music_downloader")

# Crear engine
engine = create_engine(DATABASE_URL, echo=True)

# Crear sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# Modelo para las canciones descargadas
class DownloadedSong(Base):
    __tablename__ = "downloaded_songs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    artist = Column(String(255))
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500))
    file_size = Column(Integer)
    duration = Column(Integer)
    thumbnail_url = Column(String(500))
    download_date = Column(DateTime, default=datetime.utcnow)
    url = Column(String(500))
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "artist": self.artist,
            "filename": self.filename,
            "file_path": self.file_path,
            "file_size": self.file_size,
            "duration": self.duration,
            "thumbnail_url": self.thumbnail_url,
            "download_date": self.download_date.isoformat() if self.download_date else None,
            "url": self.url
        }

# Crear tablas
def create_tables():
    Base.metadata.create_all(bind=engine)

# Obtener sesión de BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


