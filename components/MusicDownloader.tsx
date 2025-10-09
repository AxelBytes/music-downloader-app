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
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

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

export default function MusicDownloader() {
  // Estados
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [downloadedFiles, setDownloadedFiles] = useState<DownloadedFile[]>([]);
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados del reproductor
  const [currentSong, setCurrentSong] = useState<DownloadedFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sound, setSound] = useState<any>(null);
  
  // Estados de descarga
  const [downloadingItems, setDownloadingItems] = useState<{[key: string]: number}>({});

  // Configuración de API - SERVIDOR LOCAL (temporal)
  const API_URL = 'http://192.168.100.112:8000';

  // Efectos
  useEffect(() => {
    loadDownloadedFiles();
  }, []);

  // Funciones
  const loadDownloadedFiles = async () => {
    try {
      console.log('🔄 Cargando archivos descargados...');
      const response = await fetch(`${API_URL}/health`);
      console.log('📡 Status de respuesta:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📁 Datos recibidos:', data);
      
      if (data.status === 'success' && data.downloads) {
        // Usar archivos reales del servidor
        setDownloadedFiles(data.downloads);
        console.log(`✅ ${data.downloads.length} archivos cargados`);
      } else {
        console.log('⚠️ No hay archivos descargados aún');
        setDownloadedFiles([]);
      }
    } catch (error) {
      console.error('❌ Error cargando archivos:', error);
      setDownloadedFiles([]);
    }
  };

  const searchMusic = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Ingresa un término de búsqueda');
      return;
    }

    setSearching(true);
    try {
      console.log('Buscando:', searchQuery);
      const searchUrl = `${API_URL}/search?query=${encodeURIComponent(searchQuery)}`;
      console.log('URL:', searchUrl);
      
      const response = await fetch(`${API_URL}/search?query=${encodeURIComponent(searchQuery)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Status de respuesta:', response.status);
      console.log('Headers:', response.headers);
      
      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      
      if (data.status === 'success') {
        setSearchResults(data.results);
        console.log('Resultados encontrados:', data.results.length);
        if (data.results.length === 0) {
          Alert.alert('Sin resultados', 'No se encontraron canciones para tu búsqueda');
        }
      } else {
        console.log('Error en respuesta:', data);
        Alert.alert('Error', 'No se pudieron obtener resultados');
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      Alert.alert('Error', `No se pudo conectar con el servidor: ${error.message}`);
    } finally {
      setSearching(false);
    }
  };

  const downloadMusic = async (result: SearchResult) => {
    try {
      console.log('🔽 Iniciando descarga real:', result.title);
      
      // Iniciar progreso de descarga
      setDownloadingItems(prev => ({
        ...prev,
        [result.id]: 0
      }));
      
      // Hacer la descarga real al backend
      const response = await fetch(`${API_URL}/download?url=${encodeURIComponent(result.url)}&quality=best`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Respuesta de descarga:', data);
      
      if (data.status === 'success') {
        // Completar progreso
        setDownloadingItems(prev => ({
          ...prev,
          [result.id]: 100
        }));
        
        // Esperar un momento para mostrar 100%
        setTimeout(() => {
          setDownloadingItems(prev => {
            const newState = { ...prev };
            delete newState[result.id];
            return newState;
          });
          
          // Recargar archivos para incluir el nuevo
          loadDownloadedFiles();
          
          Alert.alert('🎵 ¡Éxito!', `Música descargada correctamente:\n${data.file.title}\n\nTamaño: ${formatFileSize(data.file.file_size)}`);
        }, 500);
        
      } else {
        throw new Error(data.message || 'Error desconocido en la descarga');
      }
      
    } catch (error) {
      console.error('Error en descarga:', error);
      // Limpiar progreso en caso de error
      setDownloadingItems(prev => {
        const newState = { ...prev };
        delete newState[result.id];
        return newState;
      });
      Alert.alert('Error', `Error de conexión: ${error.message}`);
    }
  };

  const deleteFile = async (filename: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este archivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/download/${filename}`, {
                method: 'DELETE',
              });

              const data = await response.json();
              
              if (data.status === 'success') {
                Alert.alert('Éxito', 'Archivo eliminado correctamente');
                loadDownloadedFiles();
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el archivo');
            }
          },
        },
      ]
    );
  };

  const playMusic = async (file: DownloadedFile) => {
    try {
      // Detener reproducción anterior si existe
      if (sound) {
        await sound.unloadAsync();
      }

      // Configurar Audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Para archivos reales descargados, usar la URL del servidor
      const realAudioUri = `${API_URL}/download/${encodeURIComponent(file.filename)}`;
      console.log('Reproduciendo archivo real:', realAudioUri);
      
      // Crear objeto de sonido con archivo real
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: realAudioUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setDuration(status.durationMillis || 0);
            setCurrentPosition(status.positionMillis || 0);
            setIsPlaying(status.isPlaying || false);
          }
        }
      );

      setSound(newSound);
      setCurrentSong(file);
      setIsPlaying(true);
      
    } catch (error) {
      console.error('Error reproduciendo:', error);
      Alert.alert('🎵 Error', `${file.title}\n\nNo se pudo reproducir el archivo. Verifica que el servidor esté funcionando.`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Funciones del reproductor
  const togglePlayPause = async () => {
    if (!sound) return;
    
    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const seekTo = async (position: number) => {
    if (!sound) return;
    
    try {
      await sound.setPositionAsync(position);
      setCurrentPosition(position);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const playNext = () => {
    if (!currentSong || downloadedFiles.length === 0) return;
    
    const currentIndex = downloadedFiles.findIndex(file => file.filename === currentSong.filename);
    const nextIndex = (currentIndex + 1) % downloadedFiles.length;
    const nextSong = downloadedFiles[nextIndex];
    
    playMusic(nextSong);
  };

  const playPrevious = () => {
    if (!currentSong || downloadedFiles.length === 0) return;
    
    const currentIndex = downloadedFiles.findIndex(file => file.filename === currentSong.filename);
    const prevIndex = currentIndex === 0 ? downloadedFiles.length - 1 : currentIndex - 1;
    const prevSong = downloadedFiles[prevIndex];
    
    playMusic(prevSong);
  };

  // Renderizado de componentes
  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const isDownloading = downloadingItems[item.id] !== undefined;
    const progress = downloadingItems[item.id] || 0;
    
    return (
      <View style={[
        styles.searchResult,
        isDownloading && styles.searchResultDownloading
      ]}>
        <View style={styles.resultInfo}>
          <Text style={[
            styles.resultTitle,
            isDownloading && styles.resultTitleDownloading
          ]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[
            styles.resultArtist,
            isDownloading && styles.resultArtistDownloading
          ]} numberOfLines={1}>
            {item.artist}
          </Text>
          <Text style={[
            styles.resultDuration,
            isDownloading && styles.resultDurationDownloading
          ]}>
            {formatDuration(item.duration)}
          </Text>
        </View>
        <View style={styles.downloadButtonContainer}>
          {isDownloading ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressCircle}>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => downloadMusic(item)}
            >
              <LinearGradient
                colors={['#06b6d4', '#8b5cf6']}
                style={styles.downloadButtonGradient}
              >
                <Download size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderDownloadedFile = ({ item }: { item: DownloadedFile }) => (
    <View style={styles.downloadedFile}>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.filename.replace('.mp3', '')}
        </Text>
        <Text style={styles.fileSize}>
          {formatFileSize(item.file_size)}
        </Text>
      </View>
      <View style={styles.fileActions}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => playMusic(item)}
        >
          <Play size={18} color="#8b5cf6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteFile(item.filename)}
        >
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0033', '#000000']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Descargar Música</Text>
          <Text style={styles.headerSubtitle}>Busca y descarga tu música favorita</Text>
        </View>

        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <BlurView intensity={20} style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar música..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              returnKeyType="search"
              onSubmitEditing={searchMusic}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={searchMusic}
              disabled={searching}
            >
              <LinearGradient
                colors={['#06b6d4', '#8b5cf6']}
                style={styles.searchButtonGradient}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Search size={20} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Resultados de Búsqueda</Text>
            <FlatList
              data={searchResults}
              keyExtractor={item => item.id}
              renderItem={renderSearchResult}
              showsVerticalScrollIndicator={false}
              style={styles.resultsList}
            />
          </View>
        )}

        {/* Archivos descargados */}
        <View style={styles.downloadsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Descargas</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadDownloadedFiles}
            >
              <ExternalLink size={16} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
          
          {downloadedFiles.length > 0 ? (
            <FlatList
              data={downloadedFiles}
              keyExtractor={item => item.filename}
              renderItem={renderDownloadedFile}
              showsVerticalScrollIndicator={false}
              style={styles.downloadsList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={loadDownloadedFiles}
                  tintColor="#8b5cf6"
                />
              }
            />
          ) : (
            <View style={styles.emptyState}>
              <Music size={48} color="#666" />
              <Text style={styles.emptyText}>No hay archivos descargados</Text>
              <Text style={styles.emptySubtext}>
                Busca y descarga música para verla aquí
              </Text>
            </View>
          )}
        </View>

        {/* Reproductor de música */}
        {currentSong && (
          <View style={styles.musicPlayer}>
            <LinearGradient colors={['#1a0033', '#2d1b69']} style={styles.playerGradient}>
              <View style={styles.playerContent}>
                {/* Información de la canción */}
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {currentSong.title}
                  </Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    Artista
                  </Text>
                </View>

                {/* Barra de progreso */}
                <View style={styles.progressContainer}>
                  <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
                  <TouchableOpacity
                    style={styles.progressBar}
                    onPress={(event) => {
                      const { locationX } = event.nativeEvent;
                      const progress = locationX / (width - 120);
                      const newPosition = progress * duration;
                      seekTo(newPosition);
                    }}
                  >
                    <View style={styles.progressTrack}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${duration > 0 ? (currentPosition / duration) * 100 : 0}%` }
                        ]} 
                      />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>

                {/* Controles */}
                <View style={styles.controls}>
                  <TouchableOpacity style={styles.controlButton} onPress={playPrevious}>
                    <SkipBack size={24} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.playButtonLarge} onPress={togglePlayPause}>
                    <LinearGradient colors={['#8b5cf6', '#06b6d4']} style={styles.playButtonGradient}>
                      {isPlaying ? (
                        <Pause size={28} color="#fff" />
                      ) : (
                        <Play size={28} color="#fff" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.controlButton} onPress={playNext}>
                    <SkipForward size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
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
    fontSize: 28,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginRight: 12,
  },
  searchButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsSection: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  resultsList: {
    flex: 1,
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  searchResultDownloading: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    opacity: 0.7,
  },
  resultInfo: {
    flex: 1,
    marginRight: 12,
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
    marginBottom: 4,
  },
  resultDuration: {
    fontSize: 12,
    color: '#666',
  },
  resultTitleDownloading: {
    color: '#666',
  },
  resultArtistDownloading: {
    color: '#555',
  },
  resultDurationDownloading: {
    color: '#555',
  },
  downloadButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  downloadButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButtonContainer: {
    width: 40,
    height: 40,
  },
  progressContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 2,
    borderColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  downloadsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshButton: {
    padding: 8,
  },
  downloadsList: {
    flex: 1,
  },
  downloadedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  fileInfo: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Estilos del reproductor
  musicPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.3)',
  },
  playerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34, // Para el safe area
  },
  playerContent: {
    alignItems: 'center',
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 16,
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    minWidth: 40,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonLarge: {
    marginHorizontal: 20,
  },
  playButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
