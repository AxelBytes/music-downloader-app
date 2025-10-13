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
import { Audio } from 'expo-av';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import { useLocalSearchParams } from 'expo-router';
import { PremiumGlassCard, PremiumButton } from '@/components/PremiumComponents';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [downloadedFiles, setDownloadedFiles] = useState<DownloadedFile[]>([]);
  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [songProgress, setSongProgress] = useState<Record<string, number>>({});
  const [currentSong, setCurrentSong] = useState<DownloadedFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDownloaded, setShowDownloaded] = useState(true);

  const { playSong, pauseSong, resumeSong, isPlaying: playerIsPlaying, currentSong: playerCurrentSong } = useDownloaderMusicPlayer();
  const { id } = useLocalSearchParams();

  const API_URL = 'https://music-downloader-app-kappa.vercel.app';

  useEffect(() => {
    loadDownloadedFiles();
  }, []);

  const loadDownloadedFiles = async () => {
    try {
      console.log('📥 Cargando archivos descargados...');

      // Primero intentar cargar desde el backend
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_URL}/downloads`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.downloads) {
            // Convertir formato del backend al formato esperado por la app
            const backendFiles = data.downloads.map((file: any) => ({
              filename: file.filename,
              file_path: file.path, // Ruta del backend
              file_size: file.size,
              created_at: file.modified,
            }));

            setDownloadedFiles(backendFiles);
            console.log(`✅ ${backendFiles.length} archivos cargados desde el backend`);
            return;
          }
        }
      } catch (error) {
        console.log('⚠️ No se pudo cargar desde el backend, usando archivos locales...');
      }

      // Fallback: cargar archivos locales del dispositivo
      const docDir = FileSystem.documentDirectory || '';
      const files = await FileSystem.readDirectoryAsync(docDir);

      const audioFiles = files.filter(file => 
        file.endsWith('.mp3') || 
        file.endsWith('.m4a') || 
        file.endsWith('.webm')
      );

      const filesWithInfo = await Promise.all(
        audioFiles.map(async (filename) => {
          const fileUri = `${docDir}${filename}`;
          const fileInfo = await FileSystem.getInfoAsync(fileUri);

          return {
            filename: filename,
            file_path: fileUri,
            file_size: fileInfo.exists && !fileInfo.isDirectory ? fileInfo.size || 0 : 0,
            created_at: fileInfo.exists && !fileInfo.isDirectory ? (fileInfo.modificationTime || Date.now() / 1000) : Date.now() / 1000,
          };
        })
      );

      setDownloadedFiles(filesWithInfo);
      console.log(`✅ ${filesWithInfo.length} archivos locales cargados (OFFLINE)`);

    } catch (error) {
      console.error('❌ Error cargando archivos:', error);
    }
  };

  const searchMusic = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setShowDownloaded(false); // Cambiar a vista de búsqueda
    console.log('🔍 [MusicDownloader] Iniciando búsqueda:', query);
    console.log('🌐 [MusicDownloader] URL del backend:', API_URL);
    console.log('📱 [MusicDownloader] Cambiando a vista de búsqueda');
    
    try {
      const searchUrl = `${API_URL}/search?query=${encodeURIComponent(query)}`;
      console.log('📡 [MusicDownloader] Enviando request a:', searchUrl);
      
      // Crear AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
      
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 [MusicDownloader] Status de respuesta:', response.status);

      if (!response.ok) {
        console.error('❌ [MusicDownloader] Error en respuesta:', response.status);
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📡 [MusicDownloader] Respuesta del servidor:', data);

      if (data.status === 'success' && data.results) {
        console.log('✅ [MusicDownloader] Resultados encontrados:', data.results.length);
        console.log('🎵 [MusicDownloader] Primer resultado:', data.results[0]);
        setSearchResults(data.results);
      } else {
        console.log('⚠️ [MusicDownloader] No hay resultados o formato incorrecto');
        console.log('📊 [MusicDownloader] Datos recibidos:', data);
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('❌ [MusicDownloader] Error en búsqueda:', error);
      console.log('🔌 Modo offline: Backend no disponible, buscando en archivos locales...');
      
      // Fallback: buscar en archivos descargados localmente
      const localResults = downloadedFiles.filter(file => 
        file.filename.toLowerCase().includes(query.toLowerCase())
      ).map(file => ({
        id: file.filename,
        title: file.filename.replace(/\.(mp3|m4a|webm)$/i, ''),
        artist: 'Archivo local',
        thumbnail: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=🎵',
        thumbnail_url: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=🎵',
        url: file.file_path,
        duration: 0,
        view_count: 0
      }));
      
      setSearchResults(localResults);
      console.log(`✅ [MusicDownloader] ${localResults.length} archivos locales encontrados`);
    } finally {
      setSearching(false);
    }
  };

  const downloadMusic = async (song: SearchResult) => {
    const taskId = Date.now().toString();
    let progressInterval: any = null;
    
    // Agregar tarea de descarga
    setDownloadTasks(prev => [...prev, {
      id: taskId,
      url: song.url,
      status: 'pending',
      progress: 0,
    }]);

    // Inicializar progreso de la canción
    setSongProgress(prev => ({ ...prev, [song.id]: 0 }));

    setDownloading(true);

    try {
      console.log(`🎵 Descargando: ${song.title}`);
      console.log(`🔗 URL: ${song.url}`);
      console.log(`👤 Artista: ${song.artist}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutos de timeout
      
      // El backend espera los parámetros como query parameters, no como JSON body
      const downloadUrl = `${API_URL}/download?url=${encodeURIComponent(song.url)}&quality=best`;
      console.log('📡 [Download] URL de descarga:', downloadUrl);
      
      // Simular progreso de descarga
      progressInterval = setInterval(() => {
        setSongProgress(prev => {
          const currentProgress = prev[song.id] || 0;
          if (currentProgress < 85) {
            // Progreso más realista y gradual
            const increment = Math.random() * 8 + 2; // Entre 2-10%
            return { ...prev, [song.id]: Math.min(85, currentProgress + increment) };
          }
          return prev;
        });
      }, 800); // Intervalo más lento para mejor UX
      
      const response = await fetch(downloadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('📡 [Download] Status de respuesta:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Download] Error del backend:', errorData);
        throw new Error(errorData.message || 'Error en la descarga');
      }

      const data = await response.json();
      console.log('📡 [Download] Respuesta del servidor:', data);

      if (data.status === 'success') {
        console.log(`✅ Descarga completada: ${data.filename}`);
        
        // Limpiar intervalo de progreso
        if (progressInterval) clearInterval(progressInterval);
        
        // Completar progreso
        setSongProgress(prev => ({ ...prev, [song.id]: 100 }));
        
        // Actualizar estado de la tarea con validación
        setDownloadTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: 'completed', 
                progress: 100, 
                file_path: data.path || data.filename || 'unknown'
              }
            : task
        ));

        // Recargar archivos descargados con manejo de errores
        try {
          await loadDownloadedFiles();
          console.log('📂 Archivos recargados correctamente');
        } catch (reloadError) {
          console.warn('⚠️ Error recargando archivos:', reloadError);
          // No es crítico, la descarga ya se completó
        }
        
        Alert.alert('✨ ¡Descarga Premium Completada!', 'Tu música ha sido descargada en la máxima calidad disponible');
      } else {
        throw new Error(data.message || 'Error en la descarga');
      }

    } catch (error: any) {
      console.error('❌ Error descargando:', error);
      
      // Limpiar intervalo de progreso en caso de error
      if (progressInterval) clearInterval(progressInterval);
      
      // Actualizar estado de la tarea con error
      setDownloadTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'failed', error: error.message }
          : task
      ));

      let errorMessage = 'Lo sentimos, ocurrió un error inesperado';
      
      if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        errorMessage = 'Sin conexión al servidor. Verifica tu conexión a internet.';
      } else if (error.message.includes('timeout') || error.name === 'AbortError') {
        errorMessage = 'La descarga está tomando más tiempo del esperado. Intenta de nuevo.';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'Este contenido está restringido y no se puede descargar.';
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        errorMessage = 'No se encontró el contenido solicitado.';
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        errorMessage = 'Servidor temporalmente no disponible. Intenta más tarde.';
      } else {
        errorMessage = 'No se pudo completar la descarga. Intenta de nuevo.';
      }

      Alert.alert('❌ Error en Descarga', errorMessage);
    } finally {
      // Limpiar estado de descarga
      setDownloading(false);
      
      // Limpiar progreso de la canción después de completar
      setTimeout(() => {
        setSongProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[song.id];
          return newProgress;
        });
      }, 2000);
      
      // Remover tarea de descarga después de 5 segundos
      setTimeout(() => {
        setDownloadTasks(prev => prev.filter(task => task.id !== taskId));
      }, 5000);
    }
  };

  const deleteFile = async (filename: string) => {
    try {
      const response = await fetch(`${API_URL}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      if (response.ok) {
        await loadDownloadedFiles();
        Alert.alert('¡Éxito!', 'Archivo eliminado correctamente');
      } else {
        throw new Error('Error eliminando archivo');
      }
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      Alert.alert('Error', 'No se pudo eliminar el archivo');
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
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = async (file: DownloadedFile) => {
    if (playerCurrentSong?.filename === file.filename && playerIsPlaying) {
      await pauseSong();
    } else {
      await playSong(file, downloadedFiles);
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
              disabled={downloading || songProgress[item.id] > 0}
            >
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                style={styles.actionButtonGradient}
              >
                {songProgress[item.id] > 0 && songProgress[item.id] < 100 ? (
                  <View style={styles.downloadProgressContainer}>
                    <View style={styles.downloadProgressBackground}>
                      <View 
                        style={[
                          styles.downloadProgressFill, 
                          { width: `${songProgress[item.id]}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.downloadProgressText}>
                      {Math.round(songProgress[item.id])}%
                    </Text>
                  </View>
                ) : songProgress[item.id] === 100 ? (
                  <Icon name="check" type="feather" color="#fff" size={20} />
                ) : downloading ? (
                  <ActivityIndicator size="small" color="#fff" />
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
              <LinearGradient
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

  const renderDownloadTask = ({ item }: { item: DownloadTask }) => (
    <Animated.View entering={SlideInUp} style={styles.taskContainer}>
      <PremiumGlassCard style={styles.taskCard}>
        <View style={styles.taskContent}>
          <View style={styles.taskInfo}>
            <Icon 
              name={item.status === 'completed' ? 'check-circle' : item.status === 'failed' ? 'x-circle' : 'download'} 
              type="feather" 
              color={item.status === 'completed' ? '#10b981' : item.status === 'failed' ? '#ef4444' : '#8b5cf6'} 
              size={24} 
            />
            <View style={styles.taskDetails}>
              <Text style={styles.taskTitle}>
                {item.status === 'completed' ? 'Descarga completada' : 
                 item.status === 'failed' ? 'Error en descarga' : 'Descargando...'}
              </Text>
              {item.status === 'downloading' && (
                <View style={styles.taskProgressContainer}>
                  <View style={styles.taskProgressBar}>
                    <View 
                      style={[
                        styles.taskProgressFill, 
                        { width: `${item.progress}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.taskProgressText}>{item.progress}%</Text>
                </View>
              )}
              {item.error && (
                <Text style={styles.taskError}>{item.error}</Text>
              )}
            </View>
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

        {/* Download Tasks */}
        {downloadTasks.length > 0 && (
          <Animated.View entering={SlideInUp.delay(600)} style={styles.tasksContainer}>
            <FlatList
              data={downloadTasks}
              keyExtractor={(item) => item.id}
              renderItem={renderDownloadTask}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tasksList}
            />
          </Animated.View>
        )}

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
