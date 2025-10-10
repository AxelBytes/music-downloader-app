import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { ArrowLeft, Play, Headphones, BarChart3 } from 'lucide-react-native';
import { usePlayCount } from '@/contexts/PlayCountContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';

const { width } = Dimensions.get('window');

export default function MostPlayedScreen() {
  const { getMostPlayed, playCounts } = usePlayCount();
  const { playSong: playOnlineSong } = useMusicPlayer();
  const { playSong: playDownloadedSong } = useDownloaderMusicPlayer();
  const [mostPlayed, setMostPlayed] = useState<any[]>([]);

  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentOpacity.value = withTiming(1, { duration: 800 });
  }, []);

  useEffect(() => {
    const topSongs = getMostPlayed(20);
    setMostPlayed(topSongs);
  }, [playCounts]);

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: withSpring(headerOpacity.value * -20) }],
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: withSpring(contentOpacity.value * 30) }],
  }));

  const handlePlaySong = async (song: any) => {
    try {
      // Intentar reproducir como canción online primero
      const onlineSong = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
        url: song.url,
        duration: 0,
        view_count: 0,
      };

      if (song.url && song.url.startsWith('http')) {
        await playOnlineSong(onlineSong, [onlineSong]);
      } else {
        // Si no tiene URL o es local, intentar como descarga
        const downloadedSong = {
          filename: `${song.title}.mp3`,
          file_path: song.url || '',
          file_size: 0,
          created_at: Date.now() / 1000,
        };
        await playDownloadedSong(downloadedSong, [downloadedSong]);
      }
    } catch (error) {
      console.error('Error reproduciendo canción:', error);
    }
  };

  const renderSongItem = (song: any, index: number) => (
    <Animated.View
      key={song.id}
      style={[
        styles.songCard,
        {
          opacity: contentOpacity.value,
          transform: [
            {
              translateY: withSpring(contentOpacity.value * (index * 10)),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.songCardGradient}
      >
        <BlurView intensity={20} style={styles.songCardBlur}>
          <View style={styles.songInfo}>
            <View style={styles.rankContainer}>
              <LinearGradient
                colors={
                  index === 0
                    ? ['#ffd700', '#ffed4e']
                    : index === 1
                    ? ['#c0c0c0', '#e5e5e5']
                    : index === 2
                    ? ['#cd7f32', '#daa520']
                    : ['#8b5cf6', '#06b6d4']
                }
                style={styles.rankBadge}
              >
                <Text style={styles.rankText}>#{index + 1}</Text>
              </LinearGradient>
            </View>

            <View style={styles.songDetails}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {song.title}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {song.artist}
              </Text>
              <View style={styles.playCountContainer}>
                <Headphones size={14} color="#8b5cf6" />
                <Text style={styles.playCountText}>
                  {song.playCount} reproducción{song.playCount !== 1 ? 'es' : ''}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.playButton}
              onPress={() => handlePlaySong(song)}
            >
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                style={styles.playButtonGradient}
              >
                <Play size={20} color="#fff" fill="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a2e', '#16213e']}
        style={styles.backgroundGradient}
      >
        {/* Header */}
        <Animated.View style={[styles.header, animatedHeaderStyle]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <LinearGradient
              colors={['#8b5cf6', '#06b6d4']}
              style={styles.backButtonGradient}
            >
              <ArrowLeft size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <LinearGradient
              colors={['#8b5cf6', '#06b6d4']}
              style={styles.headerIcon}
            >
              <BarChart3 size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.headerTitle}>Más Escuchadas</Text>
            <Text style={styles.headerSubtitle}>
              Tus canciones favoritas
            </Text>
          </View>
        </Animated.View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <Animated.View style={animatedContentStyle}>
            {mostPlayed.length === 0 ? (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.emptyCard}
                >
                  <BlurView intensity={20} style={styles.emptyBlur}>
                    <Headphones size={48} color="#8b5cf6" />
                    <Text style={styles.emptyTitle}>
                      Aún no hay estadísticas
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      Reproduce algunas canciones para ver tu ranking personal
                    </Text>
                  </BlurView>
                </LinearGradient>
              </View>
            ) : (
              <>
                <View style={styles.statsContainer}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                    style={styles.statsCard}
                  >
                    <BlurView intensity={20} style={styles.statsBlur}>
                      <Text style={styles.statsTitle}>Estadísticas</Text>
                      <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                          <Text style={styles.statNumber}>{playCounts.length}</Text>
                          <Text style={styles.statLabel}>Canciones</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statNumber}>
                            {playCounts.reduce((sum, song) => sum + song.playCount, 0)}
                          </Text>
                          <Text style={styles.statLabel}>Reproducciones</Text>
                        </View>
                      </View>
                    </BlurView>
                  </LinearGradient>
                </View>

                <Text style={styles.sectionTitle}>Top Canciones</Text>
                {mostPlayed.map((song, index) => renderSongItem(song, index))}
              </>
            )}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyCard: {
    width: width - 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyBlur: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8b5cf6',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  statsBlur: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  songCard: {
    marginBottom: 12,
  },
  songCardGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  songCardBlur: {
    padding: 16,
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    marginRight: 16,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#8b5cf6',
    marginBottom: 6,
  },
  playCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playCountText: {
    fontSize: 12,
    color: '#8b5cf6',
    marginLeft: 6,
    fontWeight: '500',
  },
  playButton: {
    marginLeft: 12,
  },
  playButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
