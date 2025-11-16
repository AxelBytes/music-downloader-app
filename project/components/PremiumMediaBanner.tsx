import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Play, Pause, X } from 'lucide-react-native';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

/**
 * Premium Media Notification Banner
 * Banner elegante que aparece cuando hay música reproduciendo
 * Simula una notificación de media premium del sistema
 */
export default function PremiumMediaBanner() {
  const {
    currentSong,
    isPlaying,
    pauseSong,
    resumeSong,
    duration,
    progress,
  } = useDownloaderMusicPlayer();

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (currentSong && isPlaying) {
      translateY.value = withSpring(0, { damping: 18 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withSpring(-100);
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [currentSong, isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!currentSong) return null;

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  const songTitle = currentSong.filename.replace(/\.(mp3|m4a|webm)$/i, '');

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView intensity={98} style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.2)', 'rgba(6, 182, 212, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Animated Progress Line */}
          <View style={styles.progressLineContainer}>
            <Animated.View
              style={[
                styles.progressLine,
                { width: `${progressPercentage}%` }
              ]}
            />
          </View>

          <View style={styles.content}>
            {/* Music Icon */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.icon}
              >
                <Text style={styles.musicSymbol}>♪</Text>
              </LinearGradient>
            </View>

            {/* Song Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.label}>🎵 Reproduciendo</Text>
              <Text style={styles.title} numberOfLines={1}>
                {songTitle}
              </Text>
            </View>

            {/* Play/Pause Button */}
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                style={styles.playButtonGradient}
              >
                {isPlaying ? (
                  <Pause size={18} color="#fff" fill="#fff" />
                ) : (
                  <Play size={18} color="#fff" fill="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 20,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  blurContainer: {
    overflow: 'hidden',
  },
  gradient: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  progressLineContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressLine: {
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  icon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicSymbol: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
