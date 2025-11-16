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
import { router } from 'expo-router';
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
import { Music } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useDownloads } from '@/contexts/DownloadsContext';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { usePlaylists, Playlist } from '@/contexts/PlaylistContext';
import { PremiumGlassCard, PremiumButton } from '@/components/PremiumComponents';

export default function PremiumLibraryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showDownloads, setShowDownloads] = useState(true);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [playlistSelectorVisible, setPlaylistSelectorVisible] = useState(false);

  const { downloadedFiles, loadDownloadedFiles, deleteFile } = useDownloads();
  const { playSong: playDownloadedSong, isPlaying: isDownloadedPlaying, currentSong: currentDownloadedSong } = useDownloaderMusicPlayer();
  const { playlists, loading, loadPlaylists: refreshPlaylists, createPlaylist, deletePlaylist: deletePlaylistFromContext, addSongToPlaylist } = usePlaylists();

  useEffect(() => {
    console.log('📚 Biblioteca cargando...');
    loadDownloadedFiles();
    refreshPlaylists();
  }, []);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    const newPlaylist = await createPlaylist(newPlaylistName.trim());
    if (newPlaylist) {
      setModalVisible(false);
      setNewPlaylistName('');
      Alert.alert('Éxito', 'Playlist creada correctamente');
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

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!selectedSong) return;

    try {
      console.log('🎵 [Library] Agregando canción a playlist:', playlistId);
      
      const success = await addSongToPlaylist(playlistId, selectedSong);
      
      if (success) {
        Alert.alert('¡Éxito!', 'Canción agregada a la playlist');
        setPlaylistSelectorVisible(false);
        setSelectedSong(null);
        refreshPlaylists(); // Recargar playlists para actualizar el contador
      } else {
        Alert.alert('Error', 'No se pudo agregar la canción a la playlist');
      }
    } catch (error) {
      console.error('❌ [Library] Error agregando a playlist:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
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
        onPress={() => router.push(`/playlist/${item.id}`)}
      >
        <View style={styles.playlistContent}>
          <View style={styles.playlistIcon}>
            <LinearGradient
              colors={['#8b5cf6', '#06b6d4']}
              style={styles.playlistIconGradient}
            >
              <Icon 
                name="music" 
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
            <Text style={styles.playlistDescription} numberOfLines={2}>
              {Array.isArray(item.songs) ? `${item.songs.length} canciones` : '0 canciones'}
            </Text>
          </View>

          <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deletePlaylistFromContext(item.id)}
            >
              <Icon name="trash-2" type="feather" color="#ef4444" size={20} />
            </TouchableOpacity>
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
                  refreshPlaylists().finally(() => setRefreshing(false));
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


                <PremiumButton
                  title="Crear Playlist"
                  onPress={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim()}
                />
              </LinearGradient>
            </Animated.View>
          </BlurView>
        </Modal>

        {/* Modal Premium para agregar a playlist */}
        <Modal
          visible={playlistSelectorVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPlaylistSelectorVisible(false)}
        >
          <BlurView intensity={25} style={styles.playlistSelectorOverlay}>
            <Animated.View 
              entering={SlideInUp.springify()}
              style={styles.playlistSelectorContainer}
            >
              <LinearGradient
                colors={['rgba(20, 20, 35, 0.98)', 'rgba(15, 15, 30, 0.98)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playlistSelectorGradient}
              >
                {/* Header */}
                <View style={styles.playlistSelectorHeader}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.playlistSelectorTitle}>Agregar a Playlist</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setPlaylistSelectorVisible(false)}
                    style={styles.playlistSelectorCloseButton}
                  >
                    <Icon name="x" type="feather" color="#fff" size={26} />
                  </TouchableOpacity>
                </View>

                {/* Song Info Premium */}
                {selectedSong && (
                  <Animated.View entering={FadeInDown.delay(100)} style={styles.playlistSelectorSongInfo}>
                    <LinearGradient
                      colors={['#8b5cf6', '#06b6d4']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.playlistSelectorSongArtwork}
                    >
                      <Icon name="music" type="feather" color="#fff" size={40} />
                    </LinearGradient>
                    <View style={styles.playlistSelectorSongText}>
                      <Text style={styles.playlistSelectorSongTitle} numberOfLines={1}>
                        {selectedSong.title || selectedSong.filename?.replace(/\.(mp3|m4a|webm)$/i, '')}
                      </Text>
                      <Text style={styles.playlistSelectorSongArtist} numberOfLines={1}>
                        {selectedSong.artist || 'Artista Desconocido'}
                      </Text>
                    </View>
                  </Animated.View>
                )}

                {/* Playlists List */}
                {playlists.length === 0 ? (
                  <Animated.View entering={FadeInDown} style={styles.playlistSelectorEmptyState}>
                    <LinearGradient
                      colors={['#8b5cf6', '#06b6d4']}
                      style={styles.playlistSelectorEmptyIcon}
                    >
                      <Icon name="music" type="feather" color="#fff" size={48} />
                    </LinearGradient>
                    <Text style={styles.playlistSelectorEmptyTitle}>No tienes playlists</Text>
                    <Text style={styles.playlistSelectorEmptySubtitle}>
                      Crea una playlist primero para agregar canciones
                    </Text>
                  </Animated.View>
                ) : (
                  <FlatList
                    data={playlists}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                      <Animated.View entering={FadeInDown.delay(index * 50)}>
                        <TouchableOpacity
                          style={styles.playlistSelectorItem}
                          onPress={() => handleAddToPlaylist(item.id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.playlistSelectorItemContent}>
                            <View style={styles.playlistSelectorItemLeft}>
                              <LinearGradient
                                colors={['#8b5cf6', '#06b6d4']}
                                style={styles.playlistSelectorItemIcon}
                              >
                                <Icon name="music" type="feather" color="#fff" size={16} />
                              </LinearGradient>
                              <View style={styles.playlistSelectorItemInfo}>
                                <Text style={styles.playlistSelectorItemName} numberOfLines={1}>
                                  {item.name}
                                </Text>
                                <Text style={styles.playlistSelectorItemCount}>
                                  {item.songs?.length || 0} canción{item.songs?.length !== 1 ? 'es' : ''}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.playlistSelectorItemRight}>
                              <LinearGradient
                                colors={['#10b981', '#06b6d4']}
                                style={styles.playlistSelectorAddButton}
                              >
                                <Icon name="plus" type="feather" color="#fff" size={18} />
                              </LinearGradient>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    )}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    style={styles.playlistSelectorList}
                    contentContainerStyle={styles.playlistSelectorListContent}
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
  // Playlist Selector Premium Styles
  playlistSelectorOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  playlistSelectorContainer: {
    maxHeight: '70%',
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    width: '100%',
  },
  playlistSelectorGradient: {
    paddingTop: 0,
  },
  playlistSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flex: 1,
  },
  playlistSelectorTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  playlistSelectorCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Song Info Section
  playlistSelectorSongInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  playlistSelectorSongArtwork: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  playlistSelectorSongText: {
    flex: 1,
  },
  playlistSelectorSongTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  playlistSelectorSongArtist: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '500',
  },
  // Empty State
  playlistSelectorEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  playlistSelectorEmptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  playlistSelectorEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  playlistSelectorEmptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Playlists List
  playlistSelectorList: {
    maxHeight: 300,
    paddingHorizontal: 0,
  },
  playlistSelectorListContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  // Playlist Item
  playlistSelectorItem: {
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
  playlistSelectorItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playlistSelectorItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  playlistSelectorItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  playlistSelectorItemInfo: {
    flex: 1,
  },
  playlistSelectorItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  playlistSelectorItemCount: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '500',
  },
  playlistSelectorItemRight: {
    marginLeft: 10,
  },
  playlistSelectorAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  playlistItem: {
    marginBottom: 10,
  },
  playlistCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10,
  },
});
