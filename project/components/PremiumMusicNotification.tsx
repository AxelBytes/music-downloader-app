import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInDown, 
  FadeOutUp
} from 'react-native-reanimated';
import { Play, Pause, SkipBack, SkipForward, Heart, Volume2, X } from 'lucide-react-native';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

const { width } = Dimensions.get('window');

export default function PremiumMusicNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const downloaderPlayer = useDownloaderMusicPlayer();
  const onlinePlayer = useMusicPlayer();

  useEffect(() => {
    // Escuchar cambios en el reproductor de descargas
    if (downloaderPlayer.currentSong) {
      setCurrentSong({
        title: downloaderPlayer.currentSong.filename.replace('.mp3', '').replace('.m4a', '').replace('.webm', ''),
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

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible || !currentSong) return null;

  return (
    <Animated.View 
      entering={FadeInDown.duration(400)}
      exiting={FadeOutUp.duration(300)}
      style={styles.container}
    >
      <BlurView intensity={30} style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.95)', 'rgba(6, 182, 212, 0.9)', 'rgba(16, 185, 129, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {/* Header Premium */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                style={styles.appIcon}
              >
                <Text style={styles.appIconText}>♪</Text>
              </LinearGradient>
              <View style={styles.headerText}>
                <Text style={styles.appName}>Groovify</Text>
                <Text style={styles.statusText}>ahora</Text>
              </View>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.bellButton}>
                <Text style={styles.bellIcon}>🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
                <X size={20} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Song Info Premium */}
          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={2}>
              {currentSong.title}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {currentSong.artist}
            </Text>
          </View>

          {/* Progress Bar Premium */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#fff', 'rgba(255, 255, 255, 0.8)']}
                style={[styles.progressFill, { 
                  width: `${Math.min(100, Math.max(0, 
                    ((downloaderPlayer.progress || onlinePlayer.progress || 0) / 
                     (downloaderPlayer.duration || onlinePlayer.duration || 1)) * 100
                  ))}%` 
                }]}
              />
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>
                {formatTime(downloaderPlayer.progress || onlinePlayer.progress || 0)}
              </Text>
              <Text style={styles.timeText}>
                {formatTime(downloaderPlayer.duration || onlinePlayer.duration || 0)}
              </Text>
            </View>
          </View>

          {/* Controls Premium - BOTONES MÁS GRANDES */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={handlePrevious}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.controlButtonGradient}
              >
                <SkipBack size={28} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
              <LinearGradient
                colors={['#fff', 'rgba(255, 255, 255, 0.9)']}
                style={styles.playButtonGradient}
              >
                {isPlaying ? (
                  <Pause size={36} color="#8b5cf6" />
                ) : (
                  <Play size={36} color="#8b5cf6" />
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={handleNext}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.controlButtonGradient}
              >
                <SkipForward size={28} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Decorative Elements */}
          <View style={styles.decorativeElements}>
            <View style={styles.sparkle1}>✨</View>
            <View style={styles.sparkle2}>⭐</View>
            <View style={styles.sparkle3}>💫</View>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 15,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradientContainer: {
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appIconText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bellIcon: {
    fontSize: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    marginBottom: 20,
  },
  songTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    lineHeight: 26,
  },
  artistName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlButton: {
    marginHorizontal: 16,
  },
  controlButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playButton: {
    marginHorizontal: 20,
  },
  playButtonGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  sparkle1: {
    position: 'absolute',
    top: 20,
    right: 60,
    opacity: 0.6,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    opacity: 0.4,
  },
  sparkle3: {
    position: 'absolute',
    top: 60,
    left: 80,
    opacity: 0.5,
  },
});
