import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Music, Play, Shuffle, Plus, Heart, MoreVertical } from 'lucide-react-native';
import { Icon } from '@rneui/themed';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import { usePlaylists } from '@/contexts/PlaylistContext';
import { PremiumGlassCard, PremiumButton } from '@/components/PremiumComponents';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

type Playlist = Database['public']['Tables']['user_playlists']['Row'];

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { playSong, isPlaying, currentSong } = useMusicPlayer();
  const { playSong: playDownloadedSong, isPlaying: isDownloadedPlaying, currentSong: currentDownloadedSong } = useDownloaderMusicPlayer();
  const { getPlaylistById, removeSongFromPlaylist } = usePlaylists();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      await loadPlaylist();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPlaylist = async () => {
    try {
      console.log('📋 [PlaylistDetail] Cargando playlist:', id);
      
      const { data, error } = await supabase
        .from('user_playlists')
        .select('*')
        .eq('id', id as string)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('❌ [PlaylistDetail] Error cargando playlist:', error);
        return;
      }

      console.log('✅ [PlaylistDetail] Playlist cargada:', data);
      setPlaylist(data);
    } catch (error) {
      console.error('❌ [PlaylistDetail] Error inesperado:', error);
    }
  };

  const handlePlaySong = async (song: any) => {
    console.log('🎵 [PlaylistDetail] Reproduciendo canción:', song.title);
    
    // Detectar si es una canción descargada (tiene file_path)
    const isDownloadedSong = song.file_path && !song.file_path.startsWith('http');
    
    if (isDownloadedSong) {
      // Usar contexto de canciones descargadas
      if (currentDownloadedSong?.filename === song.filename) {
        if (isDownloadedPlaying) {
          await playDownloadedSong(song); // Pausar/Reanudar
        } else {
          await playDownloadedSong(song);
        }
      } else {
        // Convertir a formato de archivo descargado
        const downloadedFile = {
          filename: song.filename,
          file_path: song.file_path,
          file_size: song.file_size || 0,
          created_at: song.created_at || Date.now() / 1000
        };
        await playDownloadedSong(downloadedFile, playlist?.songs || []);
      }
    } else {
      // Usar contexto normal de música (para canciones online)
      if (currentSong?.id === song.id) {
        if (isPlaying) {
          await playSong(song, playlist?.songs || []); // Pausar/Reanudar
        } else {
          await playSong(song, playlist?.songs || []);
        }
      } else {
        await playSong(song, playlist?.songs || []);
      }
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!playlist) return;

    Alert.alert(
      'Eliminar canción',
      '¿Estás seguro de que quieres eliminar esta canción de la playlist?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await removeSongFromPlaylist(playlist.id, songId);
            if (success) {
              // Recargar la playlist para actualizar la lista
              await loadPlaylist();
            }
          },
        },
      ]
    );
  };

  const handleShufflePlay = async () => {
    if (!playlist?.songs || playlist.songs.length === 0) {
      Alert.alert('Playlist vacía', 'No hay canciones en esta playlist para reproducir');
      return;
    }

    console.log('🔀 [PlaylistDetail] Iniciando reproducción aleatoria');
    
    // Obtener una canción aleatoria
    const randomIndex = Math.floor(Math.random() * playlist.songs.length);
    const randomSong = playlist.songs[randomIndex];
    
    console.log('🎵 [PlaylistDetail] Canción aleatoria seleccionada:', randomSong.title || randomSong.filename);
    
    await handlePlaySong(randomSong);
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
      <LinearGradient colors={['#1a0033', '#000000', '#0a0a0a']} style={styles.gradient}>
        {/* Header */}
        <BlurView intensity={20} style={styles.headerBlur}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {playlist.name}
            </Text>
            <TouchableOpacity style={styles.moreButton}>
              <MoreVertical size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* Playlist Info */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.playlistInfo}>
          {/* Album Art Grid */}
          <View style={styles.albumArtGrid}>
            {playlist.songs && playlist.songs.length > 0 ? (
              playlist.songs.slice(0, 4).map((song: any, index: number) => (
                <View key={index} style={styles.albumArtItem}>
                  <LinearGradient
                    colors={['#06b6d4', '#10b981', '#8b5cf6']}
                    style={styles.albumArtPlaceholder}
                  >
                    <Music size={32} color="#fff" />
                  </LinearGradient>
                </View>
              ))
            ) : (
              <>
                <View style={styles.albumArtItem}>
                  <LinearGradient colors={['#06b6d4', '#10b981']} style={styles.albumArtPlaceholder}>
                    <Music size={32} color="#fff" />
                  </LinearGradient>
                </View>
                <View style={styles.albumArtItem}>
                  <LinearGradient colors={['#10b981', '#8b5cf6']} style={styles.albumArtPlaceholder}>
                    <Music size={32} color="#fff" />
                  </LinearGradient>
                </View>
                <View style={styles.albumArtItem}>
                  <LinearGradient colors={['#8b5cf6', '#06b6d4']} style={styles.albumArtPlaceholder}>
                    <Music size={32} color="#fff" />
                  </LinearGradient>
                </View>
                <View style={styles.albumArtItem}>
                  <LinearGradient colors={['#06b6d4', '#10b981']} style={styles.albumArtPlaceholder}>
                    <Music size={32} color="#fff" />
                  </LinearGradient>
                </View>
              </>
            )}
          </View>

          <Text style={styles.playlistName}>{playlist.name}</Text>
          <Text style={styles.playlistCreator}>por {user?.email?.split('@')[0] || 'Usuario'}</Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.shuffleButton} onPress={handleShufflePlay}>
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                style={styles.shuffleButtonGradient}
              >
                <Shuffle size={20} color="#fff" />
                <Text style={styles.shuffleButtonText}>ALEATORIO</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                Alert.alert(
                  'Agregar canciones',
                  'Ve a tu biblioteca para agregar canciones a esta playlist',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Ir a Biblioteca', onPress: () => router.push('/library') }
                  ]
                );
              }}
            >
              <Plus size={16} color="#fff" style={styles.addButtonIcon} />
              <Text style={styles.addButtonText}>AÑADIR CANCIONES</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Song List */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.songListContainer}>
          <FlatList
            data={playlist?.songs || []}
            keyExtractor={(item, index) => `${item.id || index}`}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInRight.delay(index * 100)} style={styles.songItem}>
                <TouchableOpacity
                  style={styles.songContent}
                  onPress={() => handlePlaySong(item)}
                >
                  <View style={styles.songInfo}>
                    <View style={styles.albumArtSmall}>
                      <LinearGradient
                        colors={['#8b5cf6', '#06b6d4']}
                        style={styles.albumArtSmallGradient}
                      >
                        <Music size={16} color="#fff" />
                      </LinearGradient>
                    </View>
                    <View style={styles.songDetails}>
                      <Text style={styles.songTitle} numberOfLines={1}>
                        {item.title || item.filename?.replace(/\.(mp3|m4a|webm)$/i, '')}
                      </Text>
                      <Text style={styles.songArtist} numberOfLines={1}>
                        {item.artist || 'Artista Desconocido'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.songActions}
                    onPress={() => handleRemoveSong(item.id)}
                  >
                    <MoreVertical size={20} color="#666" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            )}
            contentContainerStyle={styles.songListContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Music size={64} color="#8b5cf6" />
                <Text style={styles.emptyTitle}>No hay canciones en esta playlist</Text>
                <Text style={styles.emptySubtitle}>
                  Agrega canciones desde tu biblioteca
                </Text>
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
        </Animated.View>
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
  headerBlur: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  moreButton: {
    padding: 8,
  },
  playlistInfo: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  albumArtGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    height: 240,
    marginBottom: 30,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  albumArtItem: {
    width: '50%',
    height: '50%',
    padding: 4,
  },
  albumArtPlaceholder: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  playlistCreator: {
    fontSize: 16,
    color: '#999',
    marginBottom: 30,
    textAlign: 'center',
  },
  actionButtons: {
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  shuffleButton: {
    width: '80%',
    height: 50,
  },
  addButton: {
    width: '80%',
    height: 40,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  songListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  songListContent: {
    paddingBottom: 100,
  },
  songItem: {
    marginBottom: 10,
  },
  songContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  albumArtSmall: {
    marginRight: 15,
  },
  albumArtSmallGradient: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#999',
  },
  songActions: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  shuffleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shuffleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
