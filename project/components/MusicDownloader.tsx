import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Search, Download, Music, Play, Trash2, ExternalLink, Pause, SkipBack, SkipForward } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Card, Button, Icon, Avatar, Badge } from '@rneui/themed';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  FadeInDown,
  FadeInRight,
  SlideInUp
} from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system/legacy';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import { PremiumGlassCard, PremiumButton } from '@/components/PremiumComponents';
import { useDownloads } from '@/contexts/DownloadsContext'; // Importar el contexto principal

const { width } = Dimensions.get('window');

// Tipos de datos
interface SearchResult {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  url: string;
  view_count: number;
}

interface DownloadedFile {
  filename: string;
  file_path: string;
  file_size: number;
  created_at: number;
}

interface DownloadTask {
  id: string;
  url: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  file_path?: string;
  error?: string;
}

export default function PremiumMusicDownloader() {
  const [showDownloaded, setShowDownloaded] = useState(true);

  // Usar el contexto como única fuente de verdad
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    searchMusic,
    downloadedFiles,
    loadDownloadedFiles,
    downloadingItems,
    downloadMusic,
    deleteFile,
  } = useDownloads();

  const { playSong: playDownloadedSong, isPlaying: playerIsPlaying, currentSong: playerCurrentSong } = useDownloaderMusicPlayer();

  useEffect(() => {
    loadDownloadedFiles();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = async (file: DownloadedFile) => {
    if (playerCurrentSong?.filename === file.filename) {
      await playDownloadedSong(file, downloadedFiles); // Dejar que el contexto maneje play/pause
    } else {
      await playDownloadedSong(file, downloadedFiles);
    }
  };

  const renderPremiumSearchResult = ({ item }: { item: SearchResult }) => {
    console.log('🎨 Renderizando resultado:', item.title);
    return (
      <Animated.View entering={FadeInRight.delay(Math.random() * 200)} style={styles.resultContainer}>
        <PremiumGlassCard style={styles.resultCard}>
        <View style={styles.resultContent}>
          <View style={styles.resultInfo}>
            <View style={styles.resultThumbnail}>
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                style={styles.thumbnailGradient}
              >
                <Icon name="music" type="feather" color="#fff" size={24} />
              </LinearGradient>
            </View>
            
            <View style={styles.resultDetails}>
              <Text style={styles.resultTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.resultArtist} numberOfLines={1}>
                {item.artist}
              </Text>
              <Text style={styles.resultDuration}>
                {formatDuration(item.duration)} • {item.view_count.toLocaleString()} vistas
              </Text>
            </View>
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.resultActionButton}
              onPress={() => {
                console.log('🔘 Botón de descarga presionado para:', item.title);
                downloadMusic(item);
              }}
              disabled={!!downloadingItems[item.id]}
            >
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                style={styles.actionButtonGradient}
              >
                {downloadingItems[item.id] > 0 && downloadingItems[item.id] < 100 ? (
                  <View style={styles.downloadProgressContainer}>
                    <View style={styles.downloadProgressBackground}>
                      <View 
                        style={[
                          styles.downloadProgressFill, 
                          { width: `${downloadingItems[item.id]}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.downloadProgressText}>
                      {Math.round(downloadingItems[item.id])}%
                    </Text>
                  </View>
                ) : downloadingItems[item.id] === 100 ? (
                  <Icon name="check" type="feather" color="#fff" size={20} />
                ) : (
                  <Icon name="download" type="feather" color="#fff" size={20} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </PremiumGlassCard>
    </Animated.View>
    );
  };

  const renderPremiumDownloadedFile = ({ item }: { item: DownloadedFile }) => (
    <Animated.View entering={FadeInRight.delay(Math.random() * 200)} style={styles.downloadedContainer}>
      <PremiumGlassCard style={styles.downloadedCard}>
        <View style={styles.downloadedContent}>
          <View style={styles.downloadedInfo}>
            <View style={styles.downloadedThumbnail}>
              <LinearGradient
                colors={['#10b981', '#06b6d4']}
                style={styles.thumbnailGradient}
              >
                <Icon name="music" type="feather" color="#fff" size={24} />
              </LinearGradient>
            </View>
            
            <View style={styles.downloadedDetails}>
              <Text style={styles.downloadedTitle} numberOfLines={1}>
                {item.filename.replace(/\.(mp3|m4a|webm)$/i, '')}
              </Text>
              <Text style={styles.downloadedSize}>
                {formatFileSize(item.file_size)}
              </Text>
            </View>
          </View>

          <View style={styles.downloadedActions}>
            <TouchableOpacity
              style={styles.downloadedActionButton}
              onPress={() => handlePlay(item)}
            >
              <LinearGradient // El botón ahora refleja el estado del contexto
                colors={playerCurrentSong?.filename === item.filename && playerIsPlaying ? ['#ef4444', '#f59e0b'] : ['#8b5cf6', '#06b6d4']}
                style={styles.actionButtonGradient}
              >
                <Icon 
                  name={playerCurrentSong?.filename === item.filename && playerIsPlaying ? "pause" : "play"} 
                  type="feather" 
                  color="#fff" 
                  size={20} 
                />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.downloadedActionButton}
              onPress={() => deleteFile(item.filename)}
            >
              <Icon name="trash-2" type="feather" color="#ef4444" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </PremiumGlassCard>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0033', '#000000']} style={styles.gradient}>
        {/* Header Premium */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <Text style={styles.headerTitle}>Descargar Música</Text>
          <Text style={styles.headerSubtitle}>
            Busca y descarga música desde YouTube
          </Text>
        </Animated.View>

        {/* Search Bar Premium */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.searchContainer}>
          <PremiumGlassCard style={styles.searchCard}>
            <View style={styles.searchContent}>
              <View style={styles.searchInputContainer}>
                <Icon name="search" type="feather" color="#8b5cf6" size={20} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar música en YouTube..."
                  placeholderTextColor="#666"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={() => searchMusic(searchQuery)}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Icon name="x" type="feather" color="#666" size={20} />
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => searchMusic(searchQuery)}
                disabled={!searchQuery.trim() || searching}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#06b6d4']}
                  style={styles.searchButtonGradient}
                >
                  {searching ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Icon name="search" type="feather" color="#fff" size={20} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </PremiumGlassCard>
        </Animated.View>

        {/* Tabs Premium */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, showDownloaded && styles.tabActive]}
            onPress={() => {
              console.log('📂 Cambiando a vista: Descargadas');
              setShowDownloaded(true);
            }}
          >
            <LinearGradient
              colors={showDownloaded ? ['#8b5cf6', '#06b6d4'] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.tabGradient}
            >
              <Icon name="download" type="feather" color={showDownloaded ? '#fff' : '#666'} size={20} />
              <Text style={[styles.tabText, showDownloaded && styles.tabTextActive]}>
                Descargas ({downloadedFiles.length})
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, !showDownloaded && styles.tabActive]}
            onPress={() => {
              console.log('🔍 Cambiando a vista: Búsqueda');
              setShowDownloaded(false);
            }}
          >
            <LinearGradient
              colors={!showDownloaded ? ['#8b5cf6', '#06b6d4'] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.tabGradient}
            >
              <Icon name="search" type="feather" color={!showDownloaded ? '#fff' : '#666'} size={20} />
              <Text style={[styles.tabText, !showDownloaded && styles.tabTextActive]}>
                Búsqueda
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Content */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.content}>
          {showDownloaded ? (
            <FlatList
              data={downloadedFiles}
              keyExtractor={(item) => item.filename}
              renderItem={renderPremiumDownloadedFile}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <LinearGradient
                    colors={['#8b5cf6', '#06b6d4']}
                    style={styles.emptyIcon}
                  >
                    <Icon name="download" type="feather" color="#fff" size={48} />
                  </LinearGradient>
                  <Text style={styles.emptyText}>No tienes descargas</Text>
                  <Text style={styles.emptySubtext}>
                    Busca música y descárgala para escucharla offline
                  </Text>
                </View>
              }
              refreshControl={
                <RefreshControl
                  refreshing={false}
                  onRefresh={loadDownloadedFiles}
                  tintColor="#8b5cf6"
                />
              }
            />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={renderPremiumSearchResult}
              contentContainerStyle={styles.listContent}
              onLayout={() => console.log('📱 FlatList de búsqueda renderizado')}
              onContentSizeChange={() => console.log('📏 FlatList tamaño cambiado, resultados:', searchResults.length)}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <LinearGradient
                    colors={['#8b5cf6', '#06b6d4']}
                    style={styles.emptyIcon}
                  >
                    <Icon name="search" type="feather" color="#fff" size={48} />
                  </LinearGradient>
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No se encontraron resultados' : 'Busca música para descargar'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Escribe el nombre de una canción o artista'}
                  </Text>
                </View>
              }
            />
          )}
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchCard: {
    margin: 0,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  searchButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
  tasksContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tasksList: {
    gap: 12,
  },
  taskContainer: {
    width: width * 0.8,
  },
  taskCard: {
    margin: 0,
  },
  taskContent: {
    paddingVertical: 8,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  taskProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  taskProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  taskProgressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  taskProgressText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
    minWidth: 35,
  },
  taskError: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  resultContainer: {
    marginBottom: 12,
  },
  resultCard: {
    margin: 0,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultThumbnail: {
    marginRight: 12,
  },
  thumbnailGradient: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultDetails: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  resultArtist: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  resultDuration: {
    fontSize: 12,
    color: '#666',
  },
  resultActions: {
    gap: 8,
  },
  resultActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadedContainer: {
    marginBottom: 12,
  },
  downloadedCard: {
    margin: 0,
  },
  downloadedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  downloadedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  downloadedThumbnail: {
    marginRight: 12,
  },
  downloadedDetails: {
    flex: 1,
  },
  downloadedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  downloadedSize: {
    fontSize: 12,
    color: '#999',
  },
  downloadProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  downloadProgressBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  downloadProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  downloadProgressText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  downloadedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  downloadedActionButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
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
    fontSize: 18,
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
});
