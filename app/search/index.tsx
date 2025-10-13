import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Music, User, Disc, Heart, Clock, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSearch } from '@/hooks/useSearch';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { useAuth } from '@/contexts/AuthContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { supabase } from '@/lib/supabase';
import SearchBar from '@/components/SearchBar';
import SearchFilters, { FilterType, SortType } from '@/components/SearchFilters';
import SongCard from '@/components/SongCard';
import PlaylistCard from '@/components/PlaylistCard';
import MiniPlayer from '@/components/MiniPlayer';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { playSong, pauseSong, resumeSong, isPlaying, currentSong } = useMusicPlayer();
  const { isListening, transcript, startListening, stopListening } = useVoiceSearch();
  const {
    query,
    results,
    loading,
    filters,
    suggestions,
    recentSearches,
    setFilters,
    performSearch,
    clearSearch,
    generateSuggestions,
  } = useSearch();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('song_id')
        .eq('user_id', user.id);

      if (!error && data) {
        setFavorites(new Set(data.map(f => f.song_id)));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const handleSearch = (searchQuery: string) => {
    performSearch(searchQuery, filters);
  };

  const handleVoiceSearch = async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  // Efecto para procesar el transcript de voz
  useEffect(() => {
    if (transcript) {
      performSearch(transcript, filters);
    }
  }, [transcript]);

  const handleFilterPress = () => {
    setShowFilters(true);
  };

  const handleApplyFilters = (newFilters: {
    type: FilterType;
    sort: SortType;
    duration?: { min: number; max: number };
    year?: { min: number; max: number };
  }) => {
    setFilters(newFilters);
    if (query) {
      performSearch(query, newFilters);
    }
  };

  const handlePlaySong = async (song: any) => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        await pauseSong();
      } else {
        await resumeSong();
      }
    } else {
      await playSong(song, results.songs);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    if (query) {
      await performSearch(query, filters);
    }
    await loadFavorites();
    setRefreshing(false);
  };

  const renderSuggestionItem = ({ item }: { item: string }) => (
    <Animated.View entering={FadeInDown.delay(100)}>
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => {
          performSearch(item, filters);
        }}
      >
        <Music size={16} color="#8b5cf6" />
        <Text style={styles.suggestionText}>{item}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderRecentSearchItem = ({ item }: { item: string }) => (
    <Animated.View entering={FadeInDown.delay(100)}>
      <TouchableOpacity
        style={styles.recentItem}
        onPress={() => {
          performSearch(item, filters);
        }}
      >
        <Clock size={16} color="#666" />
        <Text style={styles.recentText}>{item}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSongItem = ({ item }: { item: any }) => (
    <Animated.View entering={SlideInRight.delay(100)}>
      <SongCard
        song={item}
        isFavorite={favorites.has(item.id)}
        onToggleFavorite={toggleFavorite}
        onPlay={() => handlePlaySong(item)}
      />
    </Animated.View>
  );

  const renderPlaylistItem = ({ item }: { item: any }) => (
    <Animated.View entering={SlideInRight.delay(100)}>
      <PlaylistCard
        playlist={item}
        onPress={() => {}}
        onDelete={() => {}}
      />
    </Animated.View>
  );

  const renderArtistItem = ({ item }: { item: string }) => (
    <Animated.View entering={FadeIn.delay(100)}>
      <TouchableOpacity style={styles.artistItem}>
        <View style={styles.artistIcon}>
          <User size={24} color="#8b5cf6" />
        </View>
        <View style={styles.artistInfo}>
          <Text style={styles.artistName}>{item}</Text>
          <Text style={styles.artistSubtext}>Artista</Text>
        </View>
        <TouchableOpacity style={styles.artistPlayButton}>
          <Music size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderAlbumItem = ({ item }: { item: string }) => (
    <Animated.View entering={FadeIn.delay(100)}>
      <TouchableOpacity style={styles.albumItem}>
        <View style={styles.albumIcon}>
          <Disc size={24} color="#06b6d4" />
        </View>
        <View style={styles.albumInfo}>
          <Text style={styles.albumName}>{item}</Text>
          <Text style={styles.albumSubtext}>Álbum</Text>
        </View>
        <TouchableOpacity style={styles.albumPlayButton}>
          <Music size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.emptyText}>Buscando...</Text>
        </View>
      );
    }

    if (query && !loading) {
      return (
        <View style={styles.emptyContainer}>
          <Music size={64} color="#333" />
          <Text style={styles.emptyText}>No se encontraron resultados</Text>
          <Text style={styles.emptySubtext}>
            Intenta con otros términos de búsqueda
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <TrendingUp size={64} color="#8b5cf6" />
        <Text style={styles.emptyText}>Busca tu música favorita</Text>
        <Text style={styles.emptySubtext}>
          Encuentra canciones, artistas, álbumes y playlists
        </Text>
      </View>
    );
  };

  const hasResults = results.songs.length > 0 || results.playlists.length > 0 || 
                     results.artists.length > 0 || results.albums.length > 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0033', '#000000']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Búsqueda</Text>
        </View>

        <SearchBar
          onSearch={handleSearch}
          onVoiceSearch={handleVoiceSearch}
          onFilterPress={handleFilterPress}
          placeholder="Buscar canciones, artistas, álbumes..."
          showFilters={true}
          showVoiceSearch={true}
          suggestions={suggestions}
          recentSearches={recentSearches}
          onSuggestionPress={(suggestion) => performSearch(suggestion, filters)}
          onRecentPress={(recent) => performSearch(recent, filters)}
        />

        {!query && !hasResults && (
          <View style={styles.suggestionsContainer}>
            {suggestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sugerencias</Text>
                <FlatList
                  data={suggestions}
                  keyExtractor={(item, index) => `suggestion-${index}`}
                  renderItem={renderSuggestionItem}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
                <FlatList
                  data={recentSearches}
                  keyExtractor={(item, index) => `recent-${index}`}
                  renderItem={renderRecentSearchItem}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </View>
        )}

        {query && (
          <View style={styles.resultsContainer}>
            {results.songs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Canciones ({results.songs.length})
                </Text>
                <FlatList
                  data={results.songs}
                  keyExtractor={item => item.id}
                  renderItem={renderSongItem}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              </View>
            )}

            {results.playlists.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Playlists ({results.playlists.length})
                </Text>
                <FlatList
                  data={results.playlists}
                  keyExtractor={item => item.id}
                  renderItem={renderPlaylistItem}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              </View>
            )}

            {results.artists.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Artistas ({results.artists.length})
                </Text>
                <FlatList
                  data={results.artists}
                  keyExtractor={(item, index) => `artist-${index}`}
                  renderItem={renderArtistItem}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              </View>
            )}

            {results.albums.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Álbumes ({results.albums.length})
                </Text>
                <FlatList
                  data={results.albums}
                  keyExtractor={(item, index) => `album-${index}`}
                  renderItem={renderAlbumItem}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              </View>
            )}

            {!hasResults && !loading && renderEmptyState()}
          </View>
        )}

        {!query && !hasResults && renderEmptyState()}

        <SearchFilters
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          onApplyFilters={handleApplyFilters}
          currentFilters={filters}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  suggestionsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: '#fff',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  recentText: {
    fontSize: 16,
    color: '#999',
  },
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  artistIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  artistSubtext: {
    fontSize: 14,
    color: '#999',
  },
  artistPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  albumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  albumInfo: {
    flex: 1,
  },
  albumName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  albumSubtext: {
    fontSize: 14,
    color: '#999',
  },
  albumPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
