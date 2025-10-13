import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react-native';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import FullScreenPlayer from './FullScreenPlayer';

export default function DownloaderMiniPlayer() {
  const {
    currentSong,
    isPlaying,
    pauseSong,
    resumeSong,
    nextSong,
    previousSong,
    progress,
    duration,
    seekTo,
  } = useDownloaderMusicPlayer();

  const [fullPlayerVisible, setFullPlayerVisible] = useState(false);

  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (currentSong) {
      translateY.value = withSpring(0, { damping: 20 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withSpring(100);
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [currentSong]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!currentSong) return null;

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

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

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setFullPlayerVisible(true)}
      >
        <Animated.View style={[styles.container, animatedStyle]}>
          <LinearGradient colors={['#1a1a1a', '#0a0a0a']} style={styles.gradient}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>

            <View style={styles.content}>
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                  {currentSong.filename.replace(/\.(mp3|m4a|webm)$/i, '')}
                </Text>
                <Text style={styles.time}>
                  {formatTime(progress)} / {formatTime(duration)}
                </Text>
              </View>

              <View style={styles.controls}>
                <TouchableOpacity onPress={previousSong} style={styles.controlButton}>
                  <SkipBack size={24} color="#fff" fill="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePlayPause}
                  style={styles.playButton}
                >
                  {isPlaying ? (
                    <Pause size={28} color="#fff" fill="#fff" />
                  ) : (
                    <Play size={28} color="#fff" fill="#fff" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={nextSong} style={styles.controlButton}>
                  <SkipForward size={24} color="#fff" fill="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      <FullScreenPlayer
        visible={fullPlayerVisible}
        onClose={() => setFullPlayerVisible(false)}
        currentSong={currentSong}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        onPlayPause={handlePlayPause}
        onNext={nextSong}
        onPrevious={previousSong}
        onSeek={seekTo}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    zIndex: 1000,
  },
  gradient: {
    paddingTop: 4,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

