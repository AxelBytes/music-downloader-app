import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Card, Button, Icon, Avatar, Badge, Input } from '@rneui/themed';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  FadeInDown,
  FadeInRight,
  SlideInUp
} from 'react-native-reanimated';
import { Plus, Music, X, Play, Trash2, Download, ListPlus } from 'lucide-react-native';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDownloads } from '@/contexts/DownloadsContext';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { PremiumGlassCard, PremiumButton } from '@/components/PremiumComponents';

type Playlist = Database['public']['Tables']['playlists']['Row'];

export default function PremiumLibraryScreen() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [showDownloads, setShowDownloads] = useState(true);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [playlistSelectorVisible, setPlaylistSelectorVisible] = useState(false);

  const { user } = useAuth();
  const { downloadedFiles, loadDownloadedFiles, deleteFile } = useDownloads();
  const { playSong: playDownloadedSong, isPlaying: isDownloadedPlaying, currentSong: currentDownloadedSong } = useDownloaderMusicPlayer();
  const { playSong: playOnlineSong, isPlaying: isOnlinePlaying, currentSong: currentOnlineSong } = useMusicPlayer();

  useEffect(() => {
    console.log('📚 Biblioteca cargando...');
    loadPlaylists();
    loadDownloadedFiles();
    
    // Verificar si hay archivos descargados
    console.log('📁 Archivos descargados en biblioteca:', downloadedFiles.length);
  }, []);

  // Agregar efecto para ver cuando cambian los archivos
  useEffect(() => {
    console.log('📁 Archivos descargados actualizados:', downloadedFiles.length, downloadedFiles);
  }, [downloadedFiles]);

  const loadPlaylists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPlaylists(data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createPlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;

    const { error } = await supabase.from('playlists').insert({
      user_id: user.id,
      name: newPlaylistName.trim(),
      description: newPlaylistDescription.trim() || null,
    });

    if (!error) {
      setModalVisible(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      loadPlaylists();
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);

    if (!error) {
      loadPlaylists();
    }
  };

  const handlePlaySong = async (file: any) => {
    console.log('🎵 Reproduciendo desde biblioteca:', file.filename);
    
    // Para archivos descargados, siempre usar el contexto de descargas
    if (currentDownloadedSong?.filename === file.filename) {
      if (isDownloadedPlaying) {
        await playDownloadedSong(file); // Pausar/Reanudar
      } else {
        await playDownloadedSong(file);
      }
    } else {
      await playDownloadedSong(file, downloadedFiles);
    }
  };

  const handleDeleteFile = (filename: string) => {
    Alert.alert(
      'Eliminar',
      '¿Estás seguro de que quieres eliminar esta canción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteFile(filename);
            await loadDownloadedFiles();
          },
        },
      ]
    );
  };

  const openPlaylistSelector = (file: any) => {
    setSelectedSong(file);
    setPlaylistSelectorVisible(true);
  };

  const addToPlaylist = async (playlistId: string) => {
    if (!selectedSong || !user) return;

    try {
      // Crear objeto de canción compatible con Supabase
      const songData = {
        title: selectedSong.filename.replace(/\.(mp3|m4a|webm)$/i, ''),
        artist: 'Descargada',
        duration: 0, // No tenemos duración, usar 0
        image_url: null,
        preview_url: selectedSong.file_path, // Usar la ruta real del archivo
        external_url: selectedSong.file_path, // Usar la ruta real del archivo
      };

      // Primero, insertar la canción si no existe
      const { data: existingSong, error: searchError } = await supabase
        .from('songs')
        .select('id')
        .eq('external_url', songData.external_url)
        .single();

      let songId: string;

      if (existingSong) {
        songId = existingSong.id;
      } else {
        const { data: newSong, error: insertError } = await supabase
          .from('songs')
          .insert(songData)
          .select('id')
          .single();

        if (insertError) throw insertError;
        songId = newSong.id;
      }

      // Agregar a playlist
      const { error: playlistError } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: playlistId,
          song_id: songId,
        });

      if (playlistError) {
        if (playlistError.code === '23505') {
          Alert.alert('Información', 'Esta canción ya está en la playlist');
        } else {
          throw playlistError;
        }
      } else {
        Alert.alert('¡Éxito!', 'Canción agregada a la playlist');
      }

      setPlaylistSelectorVisible(false);
      setSelectedSong(null);
    } catch (error: any) {
      console.error('Error agregando a playlist:', error);
      Alert.alert('Error', 'No se pudo agregar la canción a la playlist');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPremiumPlaylistCard = ({ item }: { item: Playlist }) => (
    <Animated.View entering={FadeInRight.delay(Math.random() * 200)} style={styles.playlistCardContainer}>
      <PremiumGlassCard
        style={styles.playlistCard}
        onPress={() => {/* Navigate to playlist */}}
      >
        <View style={styles.playlistContent}>
          <View style={styles.playlistIcon}>
            <LinearGradient
              colors={item.is_favorite_playlist ? ['#ef4444', '#f59e0b'] : ['#8b5cf6', '#06b6d4']}
              style={styles.playlistIconGradient}
            >
              <Icon 
                name={item.is_favorite_playlist ? "heart" : "music"} 
                type="feather" 
                color="#fff" 
                size={24} 
              />
            </LinearGradient>
          </View>

          <View style={styles.playlistInfo}>
            <Text style={styles.playlistName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.description && (
              <Text style={styles.playlistDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>

          {!item.is_favorite_playlist && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deletePlaylist(item.id)}
            >
              <Icon name="trash-2" type="feather" color="#ef4444" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </PremiumGlassCard>
    </Animated.View>
  );

  const renderPremiumDownloadCard = ({ item }: { item: any }) => (
    <Animated.View entering={FadeInRight.delay(Math.random() * 200)} style={styles.downloadCardContainer}>
      <PremiumGlassCard style={styles.downloadCard}>
        <View style={styles.downloadContent}>
          <View style={styles.downloadInfo}>
            <View style={styles.downloadIcon}>
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                style={styles.downloadIconGradient}
              >
                <Icon name="music" type="feather" color="#fff" size={24} />
              </LinearGradient>
            </View>
            
            <View style={styles.downloadDetails}>
              <Text style={styles.downloadTitle} numberOfLines={1}>
                {item.filename.replace(/\.(mp3|m4a|webm)$/i, '')}
              </Text>
              <Text style={styles.downloadSize}>{formatFileSize(item.file_size)}</Text>
            </View>
          </View>
          
          <View style={styles.downloadActions}>
            <TouchableOpacity
              style={styles.downloadActionButton}
              onPress={() => handlePlaySong(item)}
            >
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                style={styles.actionButtonGradient}
              >
                <Icon name="play" type="feather" color="#fff" size={16} />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.downloadActionButton}
              onPress={() => openPlaylistSelector(item)}
            >
              <LinearGradient
                colors={['#10b981', '#06b6d4']}
                style={styles.actionButtonGradient}
              >
                <Icon name="plus-circle" type="feather" color="#fff" size={16} />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.downloadActionButton}
              onPress={() => handleDeleteFile(item.filename)}
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={styles.actionButtonGradient}
              >
                <Icon name="trash-2" type="feather" color="#fff" size={16} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </PremiumGlassCard>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#1a0033', '#000000']} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Cargando biblioteca...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0033', '#000000']} style={styles.gradient}>
        {/* Header Premium */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <Text style={styles.headerTitle}>Mi Biblioteca</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <LinearGradient
              colors={['#8b5cf6', '#06b6d4']}
              style={styles.addButtonGradient}
            >
              <Icon name="plus" type="feather" color="#fff" size={24} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Tabs Premium */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, showDownloads && styles.tabActive]}
            onPress={() => setShowDownloads(true)}
          >
            <LinearGradient
              colors={showDownloads ? ['#8b5cf6', '#06b6d4'] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.tabGradient}
            >
              <Icon name="download" type="feather" color={showDownloads ? '#fff' : '#666'} size={20} />
              <Text style={[styles.tabText, showDownloads && styles.tabTextActive]}>
                Descargas ({downloadedFiles.length})
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, !showDownloads && styles.tabActive]}
            onPress={() => setShowDownloads(false)}
          >
            <LinearGradient
              colors={!showDownloads ? ['#8b5cf6', '#06b6d4'] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.tabGradient}
            >
              <Icon name="music" type="feather" color={!showDownloads ? '#fff' : '#666'} size={20} />
              <Text style={[styles.tabText, !showDownloads && styles.tabTextActive]}>
                Playlists ({playlists.length})
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Content */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.content}>
          {showDownloads ? (
            <FlatList
              data={downloadedFiles}
              keyExtractor={item => item.filename}
              renderItem={renderPremiumDownloadCard}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <LinearGradient
                    colors={['#8b5cf6', '#06b6d4']}
                    style={styles.emptyIcon}
                  >
                    <Icon name="download" type="feather" color="#fff" size={48} />
                  </LinearGradient>
                  <Text style={styles.emptyText}>No tienes canciones descargadas</Text>
                  <Text style={styles.emptySubtext}>
                    Ve a la sección de descargas para agregar música
                  </Text>
                </View>
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    loadDownloadedFiles();
                    setRefreshing(false);
                  }}
                  tintColor="#8b5cf6"
                />
              }
            />
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={item => item.id}
              renderItem={renderPremiumPlaylistCard}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <LinearGradient
                    colors={['#8b5cf6', '#06b6d4']}
                    style={styles.emptyIcon}
                  >
                    <Icon name="music" type="feather" color="#fff" size={48} />
                  </LinearGradient>
                  <Text style={styles.emptyText}>No tienes playlists</Text>
                  <Text style={styles.emptySubtext}>
                    Crea tu primera playlist para organizar tu música
                  </Text>
                </View>
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    loadPlaylists();
                  }}
                  tintColor="#8b5cf6"
                />
              }
            />
          )}
        </Animated.View>

        {/* Modal Premium para crear playlist */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <BlurView intensity={20} style={styles.modalOverlay}>
            <Animated.View entering={SlideInUp} style={styles.modalContent}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(6, 182, 212, 0.1)']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Nueva Playlist</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Icon name="x" type="feather" color="#fff" size={24} />
                  </TouchableOpacity>
                </View>

                <Input
                  placeholder="Nombre de la playlist"
                  placeholderTextColor="#666"
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  autoFocus
                />

                <Input
                  placeholder="Descripción (opcional)"
                  placeholderTextColor="#666"
                  value={newPlaylistDescription}
                  onChangeText={setNewPlaylistDescription}
                  multiline
                  numberOfLines={3}
                />

                <PremiumButton
                  title="Crear Playlist"
                  onPress={createPlaylist}
                  disabled={!newPlaylistName.trim()}
                />
              </LinearGradient>
            </Animated.View>
          </BlurView>
        </Modal>

        {/* Modal Premium para seleccionar playlist */}
        <Modal
          visible={playlistSelectorVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPlaylistSelectorVisible(false)}
        >
          <BlurView intensity={20} style={styles.modalOverlay}>
            <Animated.View entering={SlideInUp} style={styles.modalContent}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(6, 182, 212, 0.1)']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Agregar a Playlist</Text>
                  <TouchableOpacity onPress={() => setPlaylistSelectorVisible(false)}>
                    <Icon name="x" type="feather" color="#fff" size={24} />
                  </TouchableOpacity>
                </View>

                {selectedSong && (
                  <Text style={styles.selectedSongText}>
                    {selectedSong.filename.replace(/\.(mp3|m4a|webm)$/i, '')}
                  </Text>
                )}

                {playlists.length === 0 ? (
                  <View style={styles.noPlaylistsContainer}>
                    <Icon name="music" type="feather" size={48} color="#666" />
                    <Text style={styles.noPlaylistsText}>No tienes playlists</Text>
                    <Text style={styles.noPlaylistsSubtext}>
                      Crea una playlist primero
                    </Text>
                    <PremiumButton
                      title="Crear Playlist"
                      onPress={() => {
                        setPlaylistSelectorVisible(false);
                        setModalVisible(true);
                      }}
                    />
                  </View>
                ) : (
                  <FlatList
                    data={playlists}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.playlistOption}
                        onPress={() => addToPlaylist(item.id)}
                      >
                        <View style={styles.playlistOptionInfo}>
                          <LinearGradient
                            colors={['#8b5cf6', '#06b6d4']}
                            style={styles.playlistOptionIcon}
                          >
                            <Icon name="music" type="feather" color="#fff" size={24} />
                          </LinearGradient>
                          <View style={styles.playlistOptionDetails}>
                            <Text style={styles.playlistOptionTitle}>{item.name}</Text>
                            {item.description && (
                              <Text style={styles.playlistOptionDescription} numberOfLines={1}>
                                {item.description}
                              </Text>
                            )}
                          </View>
                        </View>
                        <LinearGradient
                          colors={['#10b981', '#06b6d4']}
                          style={styles.addIconGradient}
                        >
                          <Icon name="plus" type="feather" color="#fff" size={20} />
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                    style={styles.playlistList}
                  />
                )}
              </LinearGradient>
            </Animated.View>
          </BlurView>
        </Modal>
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
    backgroundColor: '#000',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabActive: {
    // Active styling handled by gradient
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  playlistCardContainer: {
    marginBottom: 12,
  },
  playlistCard: {
    margin: 0,
  },
  playlistContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistIcon: {
    marginRight: 16,
  },
  playlistIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistInfo: {
    flex: 1,
    marginRight: 12,
  },
  playlistName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  playlistDescription: {
    fontSize: 14,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  downloadCardContainer: {
    marginBottom: 12,
  },
  downloadCard: {
    margin: 0,
  },
  downloadContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  downloadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  downloadIcon: {
    marginRight: 12,
  },
  downloadIconGradient: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadDetails: {
    flex: 1,
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  downloadSize: {
    fontSize: 12,
    color: '#999',
  },
  downloadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  downloadActionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedSongText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    textAlign: 'center',
  },
  noPlaylistsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noPlaylistsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  noPlaylistsSubtext: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  playlistList: {
    maxHeight: 400,
  },
  playlistOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  playlistOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playlistOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playlistOptionDetails: {
    flex: 1,
  },
  playlistOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  playlistOptionDescription: {
    fontSize: 12,
    color: '#999',
  },
});
