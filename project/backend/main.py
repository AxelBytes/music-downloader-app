from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, HttpUrl
import yt_dlp
from urllib.parse import urlparse, parse_qs
from pathlib import Path
import json
import uuid
import logging
import os
import shutil
import subprocess


BASE_DIR = Path(__file__).resolve().parent
MEDIA_DIR = BASE_DIR / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
LIBRARY_DB = BASE_DIR / "library.json"


class DownloadBody(BaseModel):
    url: HttpUrl


class Track(BaseModel):
    id: str
    title: str
    author: str | None = None
    duration: int | None = None
    filename: str
    src: str
    thumbnail: str | None = None


class SearchItem(BaseModel):
    id: str
    title: str
    author: str | None = None
    duration: int | None = None
    url: str
    thumbnail: str | None = None


def _load_library() -> list[Track]:
    if not LIBRARY_DB.exists():
        return []
    try:
        data = json.loads(LIBRARY_DB.read_text(encoding="utf-8"))
        return [Track(**t) for t in data]
    except Exception:
        return []


def _save_library(items: list[Track]) -> None:
    LIBRARY_DB.write_text(json.dumps([t.model_dump() for t in items], ensure_ascii=False, indent=2), encoding="utf-8")


app = FastAPI(title="Music Downloader & Library v3.1")
logging.basicConfig(level=logging.INFO)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/media", StaticFiles(directory=str(MEDIA_DIR), html=False), name="media")

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


@app.get("/api/library", response_model=list[Track])
def list_library(request: Request):
    items = _load_library()
    base = str(request.base_url).rstrip("/")
    for t in items:
        if not t.src.startswith("http"):
            t.src = f"{base}{t.src}"
    return items


def _normalize_youtube_url(raw_url: str) -> str:
    """Normalize youtube short/shorts links to watch?v= style."""
    try:
        p = urlparse(raw_url)
    except Exception:
        return raw_url
    host = (p.netloc or '').lower()
    path = (p.path or '')
    canonical_host = 'www.youtube.com'
    if 'youtu.be' in host:
        vid = path.strip('/').split('/')[0]
        if vid:
            return f"https://{canonical_host}/watch?v={vid}"
    if ('youtube.com' in host or 'm.youtube.com' in host or 'music.youtube.com' in host) and path.startswith('/shorts/'):
        vid = path.split('/shorts/')[-1].split('/')[0]
        if vid:
            return f"https://{canonical_host}/watch?v={vid}"
    if host in {'m.youtube.com', 'music.youtube.com'} and path.startswith('/watch'):
        q = parse_qs(p.query or '')
        vid = q.get('v', [''])[0]
        if vid:
            return f"https://{canonical_host}/watch?v={vid}"
    if 'youtube.com' in host and path.startswith('/watch'):
        q = parse_qs(p.query or '')
        vid = q.get('v', [''])[0]
        if vid:
            return f"https://{canonical_host}/watch?v={vid}"
    return raw_url


@app.get("/api/search", response_model=list[SearchItem])
def search_youtube(q: str):
    """Search YouTube using yt-dlp without downloading. Returns top 10 results."""
    try:
        import yt_dlp
    except Exception:
        raise HTTPException(status_code=500, detail="Se requiere 'yt-dlp' para buscar.")

    query = q.strip()
    if not query:
        return []

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': 'in_playlist',
        'skip_download': True,
    }
    items: list[SearchItem] = []
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"ytsearch10:{query}", download=False)
            for e in info.get('entries', [])[:10]:
                vid = e.get('id') or ''
                title = e.get('title') or 'Sin título'
                url = f"https://www.youtube.com/watch?v={vid}" if vid else (e.get('url') or '')
                duration = e.get('duration')
                author = e.get('uploader') or e.get('artist') or e.get('channel')
                thumb = e.get('thumbnail')
                try:
                    d = int(duration) if duration is not None else None
                except Exception:
                    d = None
                items.append(SearchItem(id=vid or str(uuid.uuid4()), title=title, author=author, duration=d, url=url, thumbnail=thumb))
    except Exception as e:
        logging.warning("search error: %s", e)
        raise HTTPException(status_code=500, detail="Error buscando en YouTube")

    return items


@app.post("/api/download", response_model=Track)
def download_audio(body: DownloadBody, request: Request):
    url = _normalize_youtube_url(str(body.url))
    logging.info("/api/download url=%s", url)
    try:
        # Usar yt-dlp como método principal
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '128',
            }],
            'quiet': False,
            'no_warnings': False,
            'outtmpl': str(MEDIA_DIR / '%(title)s-%(id)s'),
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get('title', 'Unknown')
            video_id = info.get('id', str(uuid.uuid4()))
            duration = info.get('duration', 0)
            uploader = info.get('uploader', 'Unknown')
            thumbnail = info.get('thumbnail', None)
            
        # El archivo MP3 se guarda con extensión .mp3
        safe_title = "".join(c for c in title if c.isalnum() or c in (" ", "-", "_"))[:120].strip()
        base_name = f"{safe_title}-{video_id}.mp3"
        
        # Verificar que el archivo existe
        mp3_file = MEDIA_DIR / base_name
        if not mp3_file.exists():
            # Buscar el archivo que yt-dlp creó
            for f in MEDIA_DIR.glob(f"*{video_id}*"):
                if f.suffix == '.mp3':
                    mp3_file = f
                    break
        
        if not mp3_file.exists():
            raise HTTPException(status_code=400, detail="No se pudo descargar el audio")
        
        track = Track(
            id=str(uuid.uuid4()),
            title=title,
            author=uploader,
            duration=int(duration or 0),
            filename=mp3_file.name,
            src=f"/media/{mp3_file.name}",
            thumbnail=thumbnail,
        )
        
        items = _load_library()
        if not any(x.filename == track.filename for x in items):
            items.append(track)
            _save_library(items)
        
        base = str(request.base_url).rstrip("/")
        track.src = f"{base}{track.src}"
        return track
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Error downloading %s: %s", url, e)
        raise HTTPException(status_code=400, detail=f"No se pudo descargar: {str(e)}")


@app.delete("/api/library/{filename}")
def delete_from_library(filename: str):
    items = _load_library()
    remaining = [t for t in items if t.filename != filename]
    if len(remaining) == len(items):
        raise HTTPException(status_code=404, detail="Archivo no encontrado en la biblioteca")
    _save_library(remaining)
    file_path = MEDIA_DIR / filename
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception:
            pass
    return {"ok": True}


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Music Downloader API funcionando",
        "version": "3.0.0"
    }


@app.post("/auth/validate-key")
def validate_key(key: str):
    """Validate activation key"""
    try:
        if not key or len(key.strip()) < 6:
            raise HTTPException(400, "Key inválida")
        
        valid_keys = ["GROOVIFY-C2UAB9TL-2025", "GROOVIFY-DEMO-2025"]
        
        if key.strip() in valid_keys:
            return {"isValid": True}
        else:
            return {"isValid": False, "error": "Key no encontrada"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error validando key: {str(e)}")


@app.post("/auth/sign-in")
def sign_in(activationKey: str):
    """Sign in with activation key"""
    try:
        if not activationKey:
            raise HTTPException(400, "activationKey requerido")
        
        valid_keys = {
            "GROOVIFY-C2UAB9TL-2025": {
                "id": "user-c2uab9tl",
                "email": "user@groovify.app",
                "username": "groovify_user"
            },
            "GROOVIFY-DEMO-2025": {
                "id": "user-demo",
                "email": "demo@groovify.app",
                "username": "demo_user"
            }
        }
        
        if activationKey not in valid_keys:
            raise HTTPException(400, "Key inválida o usuario no registrado")
        
        user = valid_keys[activationKey]
        return {
            "status": "success",
            "user": user,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error en sign-in: {str(e)}")


@app.post("/auth/sign-up")
def sign_up(email: str, username: str, activationKey: str):
    """Sign up with activation key"""
    try:
        if not activationKey:
            raise HTTPException(400, "activationKey requerido")
        
        valid_keys = ["GROOVIFY-C2UAB9TL-2025", "GROOVIFY-DEMO-2025"]
        
        if activationKey not in valid_keys:
            raise HTTPException(400, "Key inválida")
        
        user_id = f"user-{username.lower().replace(' ', '-')}"
        return {
            "status": "success",
            "user": {"id": user_id, "email": email, "username": username},
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error en sign-up: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)

# Uncomment when database is available
# @app.get("/playlists/{user_id}")
# async def get_playlists(user_id: uuid.UUID):
#     print(f"[API] Fetching playlists for user: {user_id}")
#     try:
#         with get_connection() as conn:
#             with conn.cursor() as cur:
#                 cur.execute("SELECT id, name, description, created_at, updated_at FROM playlists WHERE user_id = %s ORDER BY updated_at DESC", (user_id,))
#                 playlists = []
#                 for row in cur.fetchall():
#                     playlist_id, name, description, created_at, updated_at = row
#                     cur.execute("SELECT id, song_id, title, artist, duration, thumbnail, file_path, added_at FROM playlist_songs WHERE playlist_id = %s ORDER BY added_at ASC", (playlist_id,))
#                     songs = [
#                         {
#                             "id": song_row[0],
#                             "song_id": song_row[1],
#                             "title": song_row[2],
#                             "artist": song_row[3],
#                             "duration": song_row[4],
#                             "thumbnail": song_row[5],
#                             "file_path": song_row[6],
#                             "added_at": song_row[7].isoformat()
#                         }
#                         for song_row in cur.fetchall()
#                     ]
#                     playlists.append({
#                         "id": playlist_id,
#                         "user_id": user_id,
#                         "name": name,
#                         "description": description,
#                         "songs": songs,
#                         "created_at": created_at.isoformat(),
#                         "updated_at": updated_at.isoformat()
#                     })
#                 print(f"[API] Found {len(playlists)} playlists for user: {user_id}")
#                 return {"status": "success", "playlists": playlists}
#     except Exception as e:
#         print(f"[API] Error getting playlists for user {user_id}: {e}")
#         raise HTTPException(500, f"Error getting playlists: {str(e)}")
#
# @app.post("/playlists")
# async def create_playlist(playlist: PlaylistIn):
#     print(f"[API] Creating playlist for user: {playlist.user_id}")
#     try:
#         with get_connection() as conn:
#             with conn.cursor() as cur:
#                 cur.execute(
#                     "INSERT INTO playlists (user_id, name, description) VALUES (%s, %s, %s) RETURNING id, created_at, updated_at",
#                     (playlist.user_id, playlist.name, playlist.description),
#                 )
#                 new_playlist = cur.fetchone()
#                 conn.commit()
#                 playlist_id, created_at, updated_at = new_playlist
#                 print(f"[API] Playlist created successfully for user: {playlist.user_id}")
#                 return {
#                     "status": "success",
#                     "playlist": {
#                         "id": playlist_id,
#                         "user_id": playlist.user_id,
#                         "name": playlist.name,
#                         "description": playlist.description,
#                         "songs": [],
#                         "created_at": created_at.isoformat(),
#                         "updated_at": updated_at.isoformat()
#                     },
#                 }
#     except Exception as e:
#         print(f"[API] Error creating playlist for user {playlist.user_id}: {e}")
#         raise HTTPException(500, f"Error creating playlist: {str(e)}")
#
# @app.delete("/playlists/{playlist_id}")
# async def delete_playlist(playlist_id: uuid.UUID, user_id: uuid.UUID):
#     print(f"[API] Deleting playlist {playlist_id} for user: {user_id}")
#     try:
#         with get_connection() as conn:
#             with conn.cursor() as cur:
#                 cur.execute("DELETE FROM playlists WHERE id = %s AND user_id = %s", (playlist_id, user_id))
#                 conn.commit()
#                 if cur.rowcount == 0:
#                     print(f"[API] Playlist not found or user does not have permission to delete playlist {playlist_id}")
#                     raise HTTPException(404, "Playlist not found or user does not have permission")
#                 print(f"[API] Playlist {playlist_id} deleted successfully for user: {user_id}")
#                 return {"status": "success", "message": "Playlist deleted"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"[API] Error deleting playlist {playlist_id} for user {user_id}: {e}")
#         raise HTTPException(500, f"Error deleting playlist: {str(e)}")
#
# @app.post("/playlists/{playlist_id}/songs")
# async def add_song_to_playlist(playlist_id: uuid.UUID, song: SongIn, user_id: uuid.UUID):
#     print(f"[API] Adding song to playlist {playlist_id} for user: {user_id}")
#     try:
#         with get_connection() as conn:
#             with conn.cursor() as cur:
#                 # Verify playlist ownership
#                 cur.execute("SELECT id FROM playlists WHERE id = %s AND user_id = %s", (playlist_id, user_id))
#                 if cur.fetchone() is None:
#                     print(f"[API] Playlist not found or user does not have permission to add song to playlist {playlist_id}")
#                     raise HTTPException(404, "Playlist not found or user does not have permission")
#
#                 cur.execute(
#                     "INSERT INTO playlist_songs (playlist_id, song_id, title, artist, duration, thumbnail, file_path) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, added_at",
#                     (playlist_id, song.id, song.title, song.artist, song.duration, song.thumbnail, song.file_path),
#                 )
#                 new_song = cur.fetchone()
#                 conn.commit()
#                 song_id, added_at = new_song
#                 print(f"[API] Song added to playlist {playlist_id} successfully for user: {user_id}")
#                 return {
#                     "status": "success",
#                     "song": {
#                         "id": song_id,
#                         "song_id": song.id,
#                         "title": song.title,
#                         "artist": song.artist,
#                         "duration": song.duration,
#                         "thumbnail": song.thumbnail,
#                         "file_path": song.file_path,
#                         "added_at": added_at.isoformat()
#                     },
#                 }
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"[API] Error adding song to playlist {playlist_id} for user {user_id}: {e}")
#         raise HTTPException(500, f"Error adding song to playlist: {str(e)}")
#
# @app.delete("/playlists/{playlist_id}/songs/{song_id}")
# async def remove_song_from_playlist(playlist_id: uuid.UUID, song_id: uuid.UUID, user_id: uuid.UUID):
#     print(f"[API] Removing song {song_id} from playlist {playlist_id} for user: {user_id}")
#     try:
#         with get_connection() as conn:
#             with conn.cursor() as cur:
#                 # Verify playlist ownership
#                 cur.execute("SELECT id FROM playlists WHERE id = %s AND user_id = %s", (playlist_id, user_id))
#                 if cur.fetchone() is None:
#                     print(f"[API] Playlist not found or user does not have permission to remove song from playlist {playlist_id}")
#                     raise HTTPException(404, "Playlist not found or user does not have permission")
#
#                 cur.execute("DELETE FROM playlist_songs WHERE id = %s AND playlist_id = %s", (song_id, playlist_id))
#                 conn.commit()
#                 if cur.rowcount == 0:
#                     print(f"[API] Song {song_id} not found in playlist {playlist_id}")
#                     raise HTTPException(404, "Song not found in playlist")
#                 print(f"[API] Song {song_id} removed from playlist {playlist_id} successfully for user: {user_id}")
#                 return {"status": "success", "message": "Song removed from playlist"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"[API] Error removing song {song_id} from playlist {playlist_id} for user {user_id}: {e}")
#         raise HTTPException(500, f"Error removing song from playlist: {str(e)}")
#
# class PlaylistUpdate(BaseModel):
#     name: Optional[str] = None
#     description: Optional[str] = None
#
# @app.put("/playlists/{playlist_id}")
# async def update_playlist(playlist_id: uuid.UUID, playlist: PlaylistUpdate, user_id: uuid.UUID):
#     print(f"[API] Updating playlist {playlist_id} for user: {user_id}")
#     try:
#         with get_connection() as conn:
#             with conn.cursor() as cur:
#                 # Verify playlist ownership
#                 cur.execute("SELECT id FROM playlists WHERE id = %s AND user_id = %s", (playlist_id, user_id))
#                 if cur.fetchone() is None:
#                     print(f"[API] Playlist not found or user does not have permission to update playlist {playlist_id}")
#                     raise HTTPException(404, "Playlist not found or user does not have permission")
#
#                 updates = []
#                 params = []
#                 if playlist.name is not None:
#                     updates.append("name = %s")
#                     params.append(playlist.name)
#                 if playlist.description is not None:
#                     updates.append("description = %s")
#                     params.append(playlist.description)
#
#                 if not updates:
#                     print(f"[API] No update fields provided for playlist {playlist_id}")
#                     raise HTTPException(400, "No update fields provided")
#
#                 params.append(playlist_id)
#                 query = f"UPDATE playlists SET {', '.join(updates)} WHERE id = %s RETURNING updated_at"
#                 cur.execute(query, tuple(params))
#                 updated_at = cur.fetchone()[0]
#                 conn.commit()
#
#                 print(f"[API] Playlist {playlist_id} updated successfully for user: {user_id}")
#                 return {"status": "success", "updated_at": updated_at.isoformat()}
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"[API] Error updating playlist {playlist_id} for user {user_id}: {e}")
#         raise HTTPException(500, f"Error updating playlist: {str(e)}")

# ============================================
# SERVIDOR
# ============================================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
