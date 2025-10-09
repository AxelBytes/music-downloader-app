import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import SongCard from '@/components/SongCard';
import MiniPlayer from '@/components/MiniPlayer';
import SearchBar from '@/components/SearchBar';
import { router } from 'expo-router';
import { Download } from 'lucide-react-native';

type Song = Database['public']['Tables']['songs']['Row'];

export default function HomeScreen() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { playSong, pauseSong, resumeSong, isPlaying, currentSong } = useMusicPlayer();

  const handleSearchPress = () => {
    router.push('/search');
  };

  const handleVoiceSearch = () => {
    // Redirigir a la pantalla de búsqueda para usar la funcionalidad de voz
    router.push('/search');
  };

  const handleDownloadPress = () => {
    router.push('/download');
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([loadSongs(), loadFavorites()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSongs = async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSongs(data);
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0033', '#000000']} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Descubre</Text>
              <Text style={styles.headerSubtitle}>Tu música favorita</Text>
            </View>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownloadPress}
            >
              <LinearGradient
                colors={['#06b6d4', '#8b5cf6']}
                style={styles.downloadButtonGradient}
              >
                <Download size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <SearchBar
          onSearch={handleSearchPress}
          onVoiceSearch={handleVoiceSearch}
          placeholder="Buscar canciones, artistas, álbumes..."
          showFilters={false}
          showVoiceSearch={true}
        />

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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  downloadButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  downloadButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
});
