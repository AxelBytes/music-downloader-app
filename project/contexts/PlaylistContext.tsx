import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { useDownloads } from './DownloadsContext'; // Necesitamos la URL del API

export interface PlaylistSong {
  id: string;
  title: string;
  artist: string;
  filename: string;
  file_path: string;
  thumbnail?: string;
  duration?: number;
  added_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  songs: PlaylistSong[];
  created_at: string;
  updated_at: string;
}

type PlaylistContextType = {
  playlists: Playlist[];
  loading: boolean;
  createPlaylist: (name: string, description?: string) => Promise<Playlist | null>;
  deletePlaylist: (playlistId: string) => Promise<boolean>;
  addSongToPlaylist: (playlistId: string, song: any) => Promise<boolean>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<boolean>;
  updatePlaylist: (playlistId: string, updates: { name?: string; description?: string }) => Promise<boolean>;
  loadPlaylists: () => Promise<void>;
  getPlaylistById: (playlistId: string) => Playlist | null;
};

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { API_URL } = useDownloads(); // Usar la misma URL que en DownloadsContext
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadPlaylists();
    }
  }, [user]);

  const loadPlaylists = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('📋 Cargando playlists para usuario:', user.id);

      const response = await fetch(`${API_URL}/playlists/${user.id}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error del servidor:', response.status, errorText);
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      console.log('[PlaylistContext] Raw data from server:', data);

      if (data.status !== 'success') {
        console.error('Error cargando playlists:', data.message);
        return;
      }

      // Convertir datos de Supabase al formato esperado
      const formattedPlaylists: Playlist[] = (data.playlists || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        description: item.description || '',
        songs: item.songs || [],
        created_at: item.created_at,
        updated_at: item.created_at // Supabase no tiene updated_at por ahora
      }));
      console.log('[PlaylistContext] Formatted playlists:', formattedPlaylists);

      setPlaylists(formattedPlaylists);
      console.log(`✅ ${formattedPlaylists.length} playlists cargadas para usuario ${user.id}`);
    } catch (error) {
      console.error('Error cargando playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async (name: string, description?: string): Promise<Playlist | null> => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para crear playlists');
      return null;
    }

    try {
      console.log('📋 Creando nueva playlist:', name);
      console.log('API_URL:', API_URL);
      
      const response = await fetch(`${API_URL}/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id, name, description: description || ''
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error creando playlist:', errorText);
        Alert.alert('Error', 'No se pudo crear la playlist');
        return null;
      }

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(data.message || 'Error al crear la playlist');
      }

      const formattedPlaylist: Playlist = {
        ...data.playlist,
        updated_at: data.playlist.created_at
      };

      setPlaylists(prev => [formattedPlaylist, ...prev]);
      console.log('✅ Playlist creada exitosamente:', formattedPlaylist.name);
      
      return formattedPlaylist;
    } catch (error: any) {
      console.error('Error creando playlist (raw):', error);
      console.error('Error creando playlist (stringified):', JSON.stringify(error));
      if (error.message) {
        console.error('Error message:', error.message);
      }
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      Alert.alert('Error', `No se pudo crear la playlist. Detalles: ${error.message}`);
      return null;
    }
  };

  const deletePlaylist = async (playlistId: string): Promise<boolean> => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para eliminar playlists');
      return false;
    }

    try {
      console.log('🗑️ Eliminando playlist:', playlistId);
      
      const response = await fetch(`${API_URL}/playlists/${playlistId}?user_id=${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error eliminando playlist:', errorText);
        Alert.alert('Error', 'No se pudo eliminar la playlist');
        return false;
      }

      setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
      console.log('✅ Playlist eliminada exitosamente');
      
      return true;
    } catch (error) {
      console.error('Error eliminando playlist:', error);
      Alert.alert('Error', 'No se pudo eliminar la playlist');
      return false;
    }
  };

  const addSongToPlaylist = async (playlistId: string, song: any): Promise<boolean> => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para agregar canciones');
      return false;
    }

    try {
      console.log('🎵 Agregando canción a playlist:', playlistId);
      console.log('🎵 Datos de la canción:', song);
      
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) {
        console.error('❌ Playlist no encontrada:', playlistId);
        Alert.alert('Error', 'Playlist no encontrada');
        return false;
      }

      // Verificar si la canción ya existe en la playlist
      const songExists = playlist.songs.some(s => s.filename === song.filename);
      if (songExists) {
        Alert.alert('Info', 'Esta canción ya está en la playlist');
        return false;
      }

      const newSong: PlaylistSong = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: song.title || song.filename.replace(/\.(mp3|m4a|webm)$/i, ''),
        artist: song.artist || 'Artista Desconocido',
        filename: song.filename,
        file_path: song.file_path,
        thumbnail: song.thumbnail || '',
        duration: song.duration || 0,
        added_at: new Date().toISOString()
      };

      const updatedSongs = [...playlist.songs, newSong];

      const response = await fetch(`${API_URL}/playlists/${playlistId}/songs?user_id=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSong),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error agregando canción:', errorText);
        Alert.alert('Error', 'No se pudo agregar la canción');
        return false;
      }

      setPlaylists(prev => 
        prev.map(p => 
          p.id === playlistId 
            ? { ...p, songs: updatedSongs, updated_at: new Date().toISOString() }
            : p
        )
      );

      console.log('✅ Canción agregada exitosamente a la playlist');
      return true;
    } catch (error) {
      console.error('Error agregando canción:', error);
      Alert.alert('Error', 'No se pudo agregar la canción');
      return false;
    }
  };

  const removeSongFromPlaylist = async (playlistId: string, songId: string): Promise<boolean> => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para eliminar canciones');
      return false;
    }

    try {
      console.log('🗑️ Eliminando canción de playlist:', playlistId, songId);
      
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) {
        Alert.alert('Error', 'Playlist no encontrada');
        return false;
      }

      const updatedSongs = playlist.songs.filter(song => song.id !== songId);

      // Ahora el endpoint sí existe y lo llamamos correctamente
      const response = await fetch(`${API_URL}/playlists/${playlistId}/songs/${songId}?user_id=${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Error eliminando canción del backend:', await response.text());
        Alert.alert('Error', 'No se pudo eliminar la canción');
        return false;
      }

      setPlaylists(prev => 
        prev.map(p => 
          p.id === playlistId 
            ? { ...p, songs: updatedSongs, updated_at: new Date().toISOString() }
            : p
        )
      );

      console.log('✅ Canción eliminada exitosamente de la playlist');
      return true;
    } catch (error) {
      console.error('Error eliminando canción:', error);
      Alert.alert('Error', 'No se pudo eliminar la canción');
      return false;
    }
  };

  const updatePlaylist = async (playlistId: string, updates: { name?: string; description?: string }): Promise<boolean> => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para editar playlists');
      return false;
    }

    try {
      console.log('📝 Actualizando playlist:', playlistId);
      
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name.trim();
      if (updates.description !== undefined) updateData.description = updates.description.trim();

      // Endpoint no creado, pero la lógica sería esta:
      const response = await fetch(`${API_URL}/playlists/${playlistId}?user_id=${user.id}`, {
        method: 'PUT', // o PATCH
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error actualizando playlist:', errorText);
        Alert.alert('Error', 'No se pudo actualizar la playlist');
        return false;
      }

      setPlaylists(prev => 
        prev.map(p => 
          p.id === playlistId 
            ? { ...p, ...updateData, updated_at: new Date().toISOString() }
            : p
        )
      );

      console.log('✅ Playlist actualizada exitosamente');
      return true;
    } catch (error) {
      console.error('Error actualizando playlist:', error);
      Alert.alert('Error', 'No se pudo actualizar la playlist');
      return false;
    }
  };

  const getPlaylistById = (playlistId: string): Playlist | null => {
    return playlists.find(p => p.id === playlistId) || null;
  };

  const value = {
    playlists,
    loading,
    createPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    updatePlaylist,
    loadPlaylists,
    getPlaylistById,
  };

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
}

export function usePlaylists() {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylists must be used within a PlaylistProvider');
  }
  return context;
}
