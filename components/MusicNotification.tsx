import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInDown, 
  FadeOutUp
} from 'react-native-reanimated';
import { Play, Pause, SkipBack, SkipForward, Heart, Volume2 } from 'lucide-react-native';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

const { width } = Dimensions.get('window');

export default function MusicNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const downloaderPlayer = useDownloaderMusicPlayer();
  const onlinePlayer = useMusicPlayer();
  
  // Removidas las animaciones complejas que causan el error

  useEffect(() => {
    // Escuchar cambios en el reproductor de descargas
    if (downloaderPlayer.currentSong) {
      setCurrentSong({
        title: downloaderPlayer.currentSong.filename.replace('.mp3', '').replace('.m4a', ''),
        artist: 'Groovify',
        albumArt: null,
        isDownloaded: true
      });
      setIsPlaying(downloaderPlayer.isPlaying);
      showNotification();
    }
    // Escuchar cambios en el reproductor online
    else if (onlinePlayer.currentSong) {
      setCurrentSong({
        title: onlinePlayer.currentSong.title,
        artist: onlinePlayer.currentSong.artist,
        albumArt: onlinePlayer.currentSong.albumArt,
        isDownloaded: false
      });
      setIsPlaying(onlinePlayer.isPlaying);
      showNotification();
    }
  }, [downloaderPlayer.currentSong, downloaderPlayer.isPlaying, onlinePlayer.currentSong, onlinePlayer.isPlaying]);

  const showNotification = () => {
    setIsVisible(true);
  };

  const hideNotification = () => {
    setIsVisible(false);
  };

  const handlePlayPause = async () => {
    if (currentSong?.isDownloaded) {
      if (isPlaying) {
        await downloaderPlayer.pauseSong();
      } else {
        await downloaderPlayer.resumeSong();
      }
    } else {
      if (isPlaying) {
        await onlinePlayer.pauseSong();
      } else {
        await onlinePlayer.resumeSong();
      }
    }
  };

  const handlePrevious = async () => {
    if (currentSong?.isDownloaded) {
      await downloaderPlayer.previousSong();
    } else {
      await onlinePlayer.previousSong();
    }
  };

  const handleNext = async () => {
    if (currentSong?.isDownloaded) {
      await downloaderPlayer.nextSong();
    } else {
      await onlinePlayer.nextSong();
    }
  };

  const formatTime = (ms: number) => {
    // Verificar si el valor ya está en segundos o en milisegundos
    if (ms > 10000) {
      // Si es mayor a 10000, probablemente está en milisegundos
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      // Si es menor a 10000, probablemente ya está en segundos
      const minutes = Math.floor(ms / 60);
      const seconds = Math.floor(ms % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Removido el estilo animado que causaba el error

  if (!isVisible || !currentSong) return null;

  return (
    <Animated.View 
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(200)}
      style={styles.container}
    >
      <BlurView intensity={20} style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.3)', 'rgba(6, 182, 212, 0.2)', 'rgba(16, 185, 129, 0.3)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>Groovify</Text>
            <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Song Info */}
          <View style={styles.songInfo}>
            <View style={styles.albumArtContainer}>
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4', '#10b981']}
                style={styles.albumArt}
              >
                <Text style={styles.albumArtText}>♪</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {currentSong.title}
              </Text>
              <Text style={styles.artistName} numberOfLines={1}>
                {currentSong.artist}
              </Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={handlePrevious}>
              <SkipBack size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
              {isPlaying ? (
                <Pause size={28} color="#fff" />
              ) : (
                <Play size={28} color="#fff" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={handleNext}>
              <SkipForward size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                style={styles.progressFill}
              />
            </View>
            <Text style={styles.progressText}>
              {formatTime(downloaderPlayer.progress)}
            </Text>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  gradientContainer: {
    padding: 20,
    minHeight: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  albumArtContainer: {
    marginRight: 15,
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  albumArtText: {
    fontSize: 24,
    color: '#fff',
  },
  textContainer: {
    flex: 1,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    width: '30%', // Esto debería ser dinámico basado en el progreso real
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});
