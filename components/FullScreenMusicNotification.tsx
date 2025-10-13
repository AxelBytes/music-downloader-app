import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInDown, 
  FadeOutUp,
  SlideInDown,
  SlideOutUp
} from 'react-native-reanimated';
import { Play, Pause, SkipBack, SkipForward, X, Music } from 'lucide-react-native';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

const { width, height } = Dimensions.get('window');

export default function FullScreenMusicNotification() {
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
    } else {
      hideNotification();
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
    <>
      <StatusBar hidden />
      <Animated.View 
        entering={SlideInDown.duration(400)}
        exiting={SlideOutUp.duration(300)}
        style={styles.container}
      >
        <BlurView intensity={30} style={styles.blurContainer}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.9)', 'rgba(6, 182, 212, 0.8)', 'rgba(16, 185, 129, 0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>Groovify</Text>
                <Text style={styles.statusText}>Reproduciendo</Text>
              </View>
              <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Album Art */}
            <View style={styles.albumArtContainer}>
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4', '#10b981']}
                style={styles.albumArt}
              >
                <Music size={60} color="#fff" />
              </LinearGradient>
            </View>

            {/* Song Info */}
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={2}>
                {currentSong.title}
              </Text>
              <Text style={styles.artistName} numberOfLines={1}>
                {currentSong.artist}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#8b5cf6', '#06b6d4']}
                  style={[styles.progressFill, { width: '30%' }]}
                />
              </View>
              <Text style={styles.progressText}>
                {formatTime(downloaderPlayer.progress || onlinePlayer.progress || 0)}
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity style={styles.controlButton} onPress={handlePrevious}>
                <SkipBack size={32} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
                {isPlaying ? (
                  <Pause size={40} color="#fff" />
                ) : (
                  <Play size={40} color="#fff" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.controlButton} onPress={handleNext}>
                <SkipForward size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientContainer: {
    width: width * 0.9,
    height: height * 0.8,
    borderRadius: 30,
    padding: 30,
    justifyContent: 'space-between',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumArtContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  songTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
  },
});
