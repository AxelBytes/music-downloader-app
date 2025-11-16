import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { ArrowLeft, Play, Headphones, Trophy, Star } from 'lucide-react-native';
import { usePlayCount } from '@/contexts/PlayCountContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import { PremiumGlassCard } from '@/components/PremiumComponents';
import { Icon } from '@rneui/themed';

export default function MostPlayedScreen() {
  const { getMostPlayed, getTotalPlays, clearPlayCounts } = usePlayCount();
  const { playSong: playOnlineSong, currentSong: currentOnlineSong, isPlaying: isOnlinePlaying } = useMusicPlayer();
  const { playSong: playDownloadedSong, currentSong: currentDownloadedSong, isPlaying: isDownloadedPlaying } = useDownloaderMusicPlayer();

  const mostPlayedSongs = getMostPlayed(20); // Top 20
  const totalPlays = getTotalPlays();

  const handlePlaySong = async (song: any) => {
    try {
      console.log('🎵 Reproduciendo desde Más Escuchadas:', song.title);
      
      // Determinar si la canción es local o online
      const isLocal = song.url && !song.url.startsWith('http');

      if (isLocal) {
        // Para canciones locales
        const downloadedFile = {
          filename: song.title + '.mp3',
          file_path: song.url,
          file_size: 0,
          created_at: Date.now() / 1000
        };
        
        if (currentDownloadedSong?.filename === downloadedFile.filename) {
          if (isDownloadedPlaying) {
            await playDownloadedSong(downloadedFile); // Pausar/Reanudar
          } else {
            await playDownloadedSong(downloadedFile);
          }
        } else {
          await playDownloadedSong(downloadedFile, [downloadedFile]);
        }
      } else {
        // Para canciones online
        const onlineSong = {
          id: song.id,
          title: song.title,
          artist: song.artist,
          thumbnail_url: song.thumbnail,
          audio_url: song.url,
          created_at: new Date().toISOString(),
          user_id: 'mock_user_id',
          external_url: song.url,
          duration: 0,
          view_count: 0,
        };
        
        if (currentOnlineSong?.id === onlineSong.id) {
          if (isOnlinePlaying) {
            await playOnlineSong(onlineSong); // Pausar/Reanudar
          } else {
            await playOnlineSong(onlineSong);
          }
        } else {
          await playOnlineSong(onlineSong, [onlineSong]);
        }
      }
    } catch (error) {
      console.error('Error reproduciendo canción:', error);
    }
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy size={20} color="#FFD700" />; // Gold
    if (index === 1) return <Trophy size={20} color="#C0C0C0" />; // Silver
    if (index === 2) return <Trophy size={20} color="#CD7F32" />; // Bronze
    return null;
  };

  const renderSongItem = ({ item, index }: { item: any; index: number }) => (
    <PremiumGlassCard style={styles.songCard}>
      <View style={styles.songContent}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{index + 1}.</Text>
          {getMedalIcon(index)}
        </View>
        
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
        
        <View style={styles.songActions}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => handlePlaySong(item)}
          >
            <LinearGradient
              colors={['#8b5cf6', '#06b6d4']}
              style={styles.playButtonGradient}
            >
              <Play size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.playCountContainer}>
            <Headphones size={14} color="#06b6d4" />
            <Text style={styles.playCountText}>{item.playCount}</Text>
          </View>
        </View>
      </View>
    </PremiumGlassCard>
  );

  if (false) { // loading no está disponible en el contexto
    return (
      <LinearGradient colors={['#1a0033', '#000000']} style={styles.gradient}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#1a0033', '#000000', '#0a0a0a']}
      style={styles.gradient}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {}} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Más Escuchadas</Text>
          <TouchableOpacity onPress={clearPlayCounts} style={styles.clearButton}>
            <Icon name="trash-2" type="feather" color="#ef4444" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <PremiumGlassCard style={styles.statsCard}>
            <View style={styles.statsRow}>
              <Headphones size={24} color="#8b5cf6" />
              <Text style={styles.statsText}>Total de reproducciones: {totalPlays}</Text>
            </View>
            <View style={styles.statsRow}>
              <Star size={24} color="#f59e0b" />
              <Text style={styles.statsText}>Canciones únicas: {mostPlayedSongs.length}</Text>
            </View>
          </PremiumGlassCard>
        </View>

        {mostPlayedSongs.length === 0 ? (
          <View style={styles.emptyState}>
            <Headphones size={64} color="#8b5cf6" />
            <Text style={styles.emptyTitle}>Aún no hay canciones en tu ranking</Text>
            <Text style={styles.emptySubtitle}>¡Empieza a escuchar para ver tus favoritas aquí!</Text>
          </View>
        ) : (
          <FlatList
            data={mostPlayedSongs}
            keyExtractor={(item) => item.id}
            renderItem={renderSongItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    padding: 5,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsCard: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  songCard: {
    marginBottom: 15,
    padding: 15,
  },
  songContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    width: 40,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 5,
  },
  songInfo: {
    flex: 1,
    marginRight: 15,
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
    alignItems: 'center',
  },
  playButton: {
    marginBottom: 8,
  },
  playButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playCountText: {
    fontSize: 12,
    color: '#06b6d4',
    marginLeft: 4,
    fontWeight: '600',
  },
});