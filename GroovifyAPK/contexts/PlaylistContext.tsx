import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';

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
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPlaylists = async () => {
    setLoading(true);
    // Implementación simplificada - solo para evitar errores
    setPlaylists([]);
    setLoading(false);
  };

  const createPlaylist = async (name: string, description?: string): Promise<Playlist | null> => {
    try {
      const newPlaylist: Playlist = {
        id: Date.now().toString(),
        user_id: 'temp-user',
        name,
        description,
        songs: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setPlaylists(prev => [...prev, newPlaylist]);
      Alert.alert('Éxito', `Playlist "${name}" creada.`);
      return newPlaylist;
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la playlist.');
      return null;
    }
  };

  const deletePlaylist = async (playlistId: string): Promise<boolean> => {
    try {
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      Alert.alert('Éxito', 'Playlist eliminada.');
      return true;
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la playlist.');
      return false;
    }
  };

  const addSongToPlaylist = async (playlistId: string, song: any): Promise<boolean> => {
    try {
      const playlistSong: PlaylistSong = {
        id: song.id || Date.now().toString(),
        title: song.title || 'Canción sin título',
        artist: song.artist || 'Artista desconocido',
        filename: song.filename || '',
        file_path: song.file_path || '',
        thumbnail: song.thumbnail,
        duration: song.duration,
        added_at: new Date().toISOString(),
      };

      setPlaylists(prev => 
        prev.map(p => 
          p.id === playlistId 
            ? { ...p, songs: [...p.songs, playlistSong], updated_at: new Date().toISOString() }
            : p
        )
      );
      
      Alert.alert('Éxito', 'Canción agregada a la playlist.');
      return true;
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar la canción.');
      return false;
    }
  };

  const removeSongFromPlaylist = async (playlistId: string, songId: string): Promise<boolean> => {
    try {
      setPlaylists(prev => 
        prev.map(p => 
          p.id === playlistId 
            ? { 
                ...p, 
                songs: p.songs.filter(s => s.id !== songId),
                updated_at: new Date().toISOString()
              }
            : p
        )
      );
      
      Alert.alert('Éxito', 'Canción quitada de la playlist.');
      return true;
    } catch (error) {
      Alert.alert('Error', 'No se pudo quitar la canción.');
      return false;
    }
  };

  const updatePlaylist = async (playlistId: string, updates: { name?: string; description?: string }): Promise<boolean> => {
    try {
      setPlaylists(prev => 
        prev.map(p => 
          p.id === playlistId 
            ? { ...p, ...updates, updated_at: new Date().toISOString() }
            : p
        )
      );
      
      Alert.alert('Éxito', 'Playlist actualizada.');
      return true;
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la playlist.');
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
