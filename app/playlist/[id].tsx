import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Music } from 'lucide-react-native';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import SongCard from '@/components/SongCard';
import MiniPlayer from '@/components/MiniPlayer';

type Playlist = Database['public']['Tables']['playlists']['Row'];
type Song = Database['public']['Tables']['songs']['Row'];

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { playSong, pauseSong, resumeSong, isPlaying, currentSong } = useMusicPlayer();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      await Promise.all([loadPlaylist(), loadPlaylistSongs(), loadFavorites()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPlaylist = async () => {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', id as string)
      .maybeSingle();

    if (!error && data) {
      setPlaylist(data);
    }
  };

  const loadPlaylistSongs = async () => {
    const { data, error } = await supabase
      .from('playlist_songs')
      .select(`
        song_id,
        songs (*)
      `)
      .eq('playlist_id', id as string)
      .order('position', { ascending: true });

    if (!error && data) {
      const songsData = data.map((item: any) => item.songs).filter(Boolean);
      setSongs(songsData);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_favorites')
      .select('song_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setFavorites(new Set(data.map(f => f.song_id)));
    }
  };

  const toggleFavorite = async (songId: string) => {
    if (!user) return;

    const isFavorite = favorites.has(songId);

    if (isFavorite) {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('song_id', songId);

      if (!error) {
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(songId);
          return newSet;
        });
      }
    } else {
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, song_id: songId });

      if (!error) {
        setFavorites(prev => new Set(prev).add(songId));
      }
    }
  };

  const handlePlaySong = async (song: Song) => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        await pauseSong();
      } else {
        await resumeSong();
      }
    } else {
      await playSong(song, songs);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!playlist) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Playlist no encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0033', '#000000']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {playlist.name}
          </Text>
        </View>

        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName}>{playlist.name}</Text>
          {playlist.description && (
            <Text style={styles.playlistDescription}>{playlist.description}</Text>
          )}
          <Text style={styles.songCount}>
            {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
          </Text>
        </View>

        <FlatList
          data={songs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SongCard
              song={item}
              isFavorite={favorites.has(item.id)}
              onToggleFavorite={toggleFavorite}
              onPlay={() => handlePlaySong(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Music size={64} color="#333" />
              <Text style={styles.emptyText}>No hay canciones en esta playlist</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
              tintColor="#8b5cf6"
            />
          }
        />

        <MiniPlayer />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  playlistInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  playlistName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  playlistDescription: {
    fontSize: 16,
    color: '#999',
    marginBottom: 12,
  },
  songCount: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
});
