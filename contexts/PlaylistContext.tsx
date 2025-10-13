import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

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
      
      const { data, error } = await supabase
        .from('user_playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando playlists:', error);
        return;
      }

      // Convertir datos de Supabase al formato esperado
      const formattedPlaylists: Playlist[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        description: item.description || '',
        songs: item.songs || [],
        created_at: item.created_at,
        updated_at: item.created_at // Supabase no tiene updated_at por ahora
      }));

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
      
      const newPlaylist = {
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || '',
        songs: [],
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_playlists')
        .insert(newPlaylist)
        .select()
        .single();

      if (error) {
        console.error('Error creando playlist:', error);
        Alert.alert('Error', 'No se pudo crear la playlist');
        return null;
      }

      const formattedPlaylist: Playlist = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        description: data.description || '',
        songs: data.songs || [],
        created_at: data.created_at,
        updated_at: data.created_at
      };

      setPlaylists(prev => [formattedPlaylist, ...prev]);
      console.log('✅ Playlist creada exitosamente:', formattedPlaylist.name);
      
      return formattedPlaylist;
    } catch (error) {
      console.error('Error creando playlist:', error);
      Alert.alert('Error', 'No se pudo crear la playlist');
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
      
      const { error } = await supabase
        .from('user_playlists')
        .delete()
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error eliminando playlist:', error);
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

      const { error } = await supabase
        .from('user_playlists')
        .update({ songs: updatedSongs })
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error agregando canción:', error);
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

      const { error } = await supabase
        .from('user_playlists')
        .update({ songs: updatedSongs })
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error eliminando canción:', error);
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

      const { error } = await supabase
        .from('user_playlists')
        .update(updateData)
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error actualizando playlist:', error);
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
