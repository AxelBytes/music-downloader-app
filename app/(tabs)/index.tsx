import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Card, Button, Icon, Avatar, Badge, SearchBar } from '@rneui/themed';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolate,
  FadeInDown,
  FadeInRight,
  SlideInUp
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useDownloads } from '@/contexts/DownloadsContext';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import { PremiumGlassCard, PremiumButton, PremiumMusicCard, PremiumLoading } from '@/components/PremiumComponents';
import NetworkStatus from '@/components/NetworkStatus';
import { router } from 'expo-router';
import { Download, Search, Music, Check, Play, Headphones, Clock, Heart } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function PremiumHomeScreen() {
  const [songs, setSongs] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useAuth();
  const { playSong, pauseSong, resumeSong, isPlaying, currentSong } = useMusicPlayer();
  const {
    searchResults,
    searching,
    downloadingItems,
    downloadedFiles,
    searchMusic,
    downloadMusic,
    isDownloaded,
    setSearchQuery: setSearchQueryContext,
    loadDownloadedFiles,
    isOnline,
  } = useDownloads();
  const { playSong: playDownloadedSong } = useDownloaderMusicPlayer();

  // Animaciones
  const headerOpacity = useSharedValue(0);
  const searchOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    loadInitialData();
    
    // Animaciones de entrada
    headerOpacity.value = withTiming(1, { duration: 800 });
    searchOpacity.value = withTiming(1, { duration: 800, delay: 200 });
    contentOpacity.value = withTiming(1, { duration: 800, delay: 400 });
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    await loadDownloadedFiles();
      setLoading(false);
  };

  // Monitorear cambios en searchResults
  useEffect(() => {
    console.log('📊 searchResults cambió:', searchResults.length, 'elementos');
    if (searchResults.length > 0) {
      console.log('🎵 Primer resultado:', searchResults[0]);
    }
  }, [searchResults]);

  const handleSearch = async (query: string) => {
    console.log('🔍 handleSearch llamado con:', query);
    setSearchQuery(query);
    setSearchQueryContext(query);
    if (query.trim()) {
      await searchMusic(query);
    }
  };

  const handlePlaySong = async (song: any) => {
    if (song.isLocal) {
      // Buscar el archivo descargado correspondiente
      const downloadedFile = downloadedFiles.find(file => 
        file.filename.toLowerCase().includes(song.title.toLowerCase())
      );
      if (downloadedFile) {
        await playDownloadedSong(downloadedFile, downloadedFiles);
      }
    } else {
      await playSong(song, searchResults);
    }
  };

  const handleDownload = async (song: any) => {
    await downloadMusic(song);
  };

  const renderListHeader = () => {
    return (
      <View>
        {/* Quick Actions */}
        {renderQuickActions()}
        
        {/* Results Header */}
        {searchResults.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600)} style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {searchQuery ? 'Resultados de búsqueda' : 'Música reciente'}
            </Text>
            <Badge
              value={searchResults.length}
              status="primary"
              containerStyle={styles.resultsBadge}
            />
          </Animated.View>
        )}
      </View>
    );
  };

  const renderQuickActions = () => (
    <Animated.View entering={FadeInDown.delay(800)} style={styles.quickActions}>
      <Text style={styles.sectionTitle}>Acciones rápidas</Text>
      
      <View style={styles.actionsGrid}>
        <PremiumGlassCard style={styles.actionCard}>
          <TouchableOpacity style={styles.actionContent} onPress={() => router.push('/(tabs)/downloads')}>
            <LinearGradient
              colors={['#8b5cf6', '#06b6d4']}
              style={styles.actionIcon}
            >
              <Download size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Descargar</Text>
          </TouchableOpacity>
        </PremiumGlassCard>

        <PremiumGlassCard style={styles.actionCard}>
          <TouchableOpacity style={styles.actionContent} onPress={() => router.push('/(tabs)/library')}>
            <LinearGradient
              colors={['#06b6d4', '#8b5cf6']}
              style={styles.actionIcon}
            >
              <Music size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Biblioteca</Text>
          </TouchableOpacity>
        </PremiumGlassCard>

        <PremiumGlassCard style={styles.actionCard}>
          <TouchableOpacity style={styles.actionContent} onPress={() => router.push('/most-played')}>
            <LinearGradient
              colors={['#10b981', '#06b6d4']}
              style={styles.actionIcon}
            >
              <Headphones size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Más Escuchadas</Text>
          </TouchableOpacity>
        </PremiumGlassCard>

        <PremiumGlassCard style={styles.actionCard}>
          <TouchableOpacity style={styles.actionContent} onPress={() => router.push('/(tabs)/library')}>
            <LinearGradient
              colors={['#f59e0b', '#ef4444']}
              style={styles.actionIcon}
            >
              <Heart size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Favoritos</Text>
          </TouchableOpacity>
        </PremiumGlassCard>
      </View>
    </Animated.View>
  );

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: interpolate(headerOpacity.value, [0, 1], [-50, 0], Extrapolate.CLAMP),
      },
    ],
  }));

  const animatedSearchStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
    transform: [
      {
        translateY: interpolate(searchOpacity.value, [0, 1], [-30, 0], Extrapolate.CLAMP),
      },
    ],
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <PremiumLoading />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0033', '#000000', '#0a0a0a']}
        style={styles.gradient}
      >
        {/* Status Bar */}
        <NetworkStatus isOnline={isOnline} />
        
        {/* Notification Bell - Positioned near status bar */}
        <TouchableOpacity style={styles.notificationBell}>
          <Icon name="bell" type="feather" color="#8b5cf6" size={22} />
          <Badge
            value="3"
            status="error"
            containerStyle={styles.notificationBellBadge}
          />
        </TouchableOpacity>

        {/* Header Premium */}
        <Animated.View style={[animatedHeaderStyle, styles.header]}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Avatar
                size={40}
                rounded
                source={{ uri: user?.user_metadata?.avatar_url }}
                containerStyle={styles.avatar}
              >
                <Icon name="user" type="feather" color="#8b5cf6" />
              </Avatar>
              <View style={styles.userDetails}>
                <Text style={styles.welcomeText}>Bienvenido</Text>
                <Text style={styles.userName}>
                  {user?.user_metadata?.display_name || user?.email || 'Usuario'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Search Bar Premium */}
        <Animated.View style={[animatedSearchStyle, styles.searchContainer]}>
          <PremiumGlassCard style={styles.searchCard}>
            <View style={styles.searchRow}>
              <SearchBar
                placeholder="Buscar música..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={(text) => {
                  console.log('📝 SearchBar cambió a:', text);
                  setSearchQuery(text);
                }}
                containerStyle={styles.searchContainerStyle}
                inputContainerStyle={styles.searchInputContainer}
                inputStyle={styles.searchInput}
                searchIcon={<Icon name="search" type="feather" color="#8b5cf6" size={20} />}
                clearIcon={<Icon name="x" type="feather" color="#666" size={20} />}
              />
              <TouchableOpacity 
                style={[styles.searchButton, (!searchQuery.trim() || searching) && { opacity: 0.5 }]}
                onPress={() => {
                  console.log('🔘 Botón de búsqueda presionado');
                  console.log('📝 searchQuery actual:', searchQuery);
                  console.log('🔍 Llamando handleSearch...');
                  handleSearch(searchQuery);
                }}
                disabled={false} // Temporalmente deshabilitamos la validación
              >
                <LinearGradient
                  colors={['#8b5cf6', '#06b6d4']}
                  style={styles.searchButtonGradient}
                >
                  <Search size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            {/* Botón de prueba temporal */}
            <TouchableOpacity 
              style={{ 
                backgroundColor: '#ff0000', 
                padding: 10, 
                margin: 10, 
                borderRadius: 5 
              }}
              onPress={() => {
                console.log('🧪 BOTÓN DE PRUEBA PRESIONADO');
                console.log('🧪 searchQuery:', searchQuery);
                console.log('🧪 searchResults:', searchResults);
                console.log('🧪 searching:', searching);
                handleSearch('bad bunny'); // Búsqueda fija para probar
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>
                🧪 PRUEBA BÚSQUEDA
              </Text>
            </TouchableOpacity>
          </PremiumGlassCard>
        </Animated.View>

        {/* Content */}
        <Animated.View style={[animatedContentStyle, styles.content]}>
        <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
                onRefresh={loadInitialData}
              tintColor="#8b5cf6"
                colors={['#8b5cf6']}
              />
            }
            ListHeaderComponent={renderListHeader}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInRight.delay(index * 100)}
                style={styles.resultItem}
              >
                <PremiumMusicCard
                  title={item.title}
                  artist={item.artist}
                  thumbnail={item.thumbnail}
                  duration={item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : undefined}
                  isPlaying={currentSong?.id === item.id && isPlaying}
                  onPress={() => handlePlaySong(item)}
                  onPlay={() => handlePlaySong(item)}
                  onMore={() => {}}
                />
                
                <View style={styles.songActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDownload(item)}
                    disabled={isDownloaded(item.id) || downloadingItems.includes(item.id)}
                  >
                    <Icon
                      name={isDownloaded(item.id) ? "check" : "download"}
                      type="feather"
                      color={isDownloaded(item.id) ? "#10b981" : "#8b5cf6"}
                      size={20}
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton}>
                    <Icon name="heart" type="feather" color="#666" size={20} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
            ListEmptyComponent={() => {
              if (searching) {
                return <PremiumLoading />;
              }

              if (searchResults.length === 0 && searchQuery) {
                return (
                  <Animated.View entering={FadeInDown.delay(600)} style={styles.emptyContainer}>
                    <Icon name="search" type="feather" size={64} color="#666" />
                    <Text style={styles.emptyText}>No se encontraron resultados</Text>
                    <Text style={styles.emptySubtext}>
                      {isOnline ? 'Intenta con otros términos de búsqueda' : 'Modo offline - busca en tus descargas'}
                    </Text>
                  </Animated.View>
                );
              }

              return null;
            }}
            contentContainerStyle={styles.listContainer}
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
  notificationBell: {
    position: 'absolute',
    top: 55,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  notificationBellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  header: {
    paddingTop: 65,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchButton: {
    marginLeft: 8,
  },
  searchButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchCard: {
    margin: 0,
  },
  searchContainerStyle: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
  },
  searchInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  searchInput: {
    color: '#fff',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContainer: {
    paddingBottom: 100,
  },
  quickActions: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    marginLeft: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    marginBottom: 12,
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  resultsBadge: {
    marginLeft: 8,
  },
  resultsList: {
    paddingBottom: 100,
  },
  resultItem: {
    marginBottom: 12,
  },
  songActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
  },
  actionButton: {
    padding: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
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
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
