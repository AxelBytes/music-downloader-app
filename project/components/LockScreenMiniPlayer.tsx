import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, Platform } from 'react-native';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react-native';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import { useLockScreen } from '@/contexts/LockScreenContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { height, width } = Dimensions.get('window');

export default function LockScreenMiniPlayer() {
  const {
    currentSong,
    isPlaying,
    pauseSong,
    resumeSong,
    nextSong,
    previousSong,
    progress,
    duration,
  } = useDownloaderMusicPlayer();

  const [lockScreenVisible, setLockScreenVisible] = useState(false);

  const slideUp = useSharedValue(height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (currentSong && isPlaying && Platform.OS === 'ios') {
      slideUp.value = withSpring(0, { damping: 16, mass: 1 });
      opacity.value = withTiming(1, { duration: 300 });
      setLockScreenVisible(true);
    } else {
      slideUp.value = withSpring(height);
      opacity.value = withTiming(0, { duration: 300 });
      setTimeout(() => setLockScreenVisible(false), 300);
    }
  }, [currentSong, isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideUp.value }],
    opacity: opacity.value,
  }));

  if (!currentSong || !lockScreenVisible) return null;

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  return (
    <Modal
      transparent
      visible={lockScreenVisible}
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        <BlurView intensity={95} style={styles.blurContainer}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.2)', 'rgba(6, 182, 212, 0.1)', 'rgba(20, 20, 35, 0.3)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Top Accent Line */}
            <View style={styles.accentLine} />

            {/* Main Content */}
            <View style={styles.content}>
              {/* Album Art */}
              <View style={styles.albumArtContainer}>
                <LinearGradient
                  colors={['#8b5cf6', '#06b6d4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.albumArt}
                >
                  <Text style={styles.albumArtIcon}>♪</Text>
                </LinearGradient>
              </View>

              {/* Song Info */}
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {currentSong.filename.replace(/\.(mp3|m4a|webm)$/i, '')}
                </Text>
                <View style={styles.progressContainer}>
                  <Text style={styles.progressTime}>{formatTime(progress)}</Text>
                  <View style={styles.progressBarSmall}>
                    <View style={[styles.progressFillSmall, { width: `${progressPercentage}%` }]} />
                  </View>
                  <Text style={styles.durationTime}>{formatTime(duration)}</Text>
                </View>
              </View>

              {/* Controls */}
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  onPress={previousSong}
                  style={styles.controlButtonSmall}
                  activeOpacity={0.7}
                >
                  <SkipBack size={20} color="#fff" fill="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePlayPause}
                  style={styles.playButtonLock}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#8b5cf6', '#06b6d4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.playButtonGradient}
                  >
                    {isPlaying ? (
                      <Pause size={24} color="#fff" fill="#fff" />
                    ) : (
                      <Play size={24} color="#fff" fill="#fff" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={nextSong}
                  style={styles.controlButtonSmall}
                  activeOpacity={0.7}
                >
                  <SkipForward size={20} color="#fff" fill="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Accent */}
            <View style={styles.bottomAccent} />
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  blurContainer: {
    overflow: 'hidden',
  },
  gradient: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    gap: 16,
  },
  accentLine: {
    height: 4,
    width: 50,
    backgroundColor: 'rgba(139, 92, 246, 0.5)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  content: {
    gap: 16,
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  albumArt: {
    width: 120,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  albumArtIcon: {
    fontSize: 56,
    color: '#fff',
    fontWeight: '800',
  },
  songInfo: {
    gap: 12,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTime: {
    fontSize: 12,
    color: '#06b6d4',
    fontWeight: '600',
    minWidth: 28,
  },
  progressBarSmall: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: '#06b6d4',
    borderRadius: 2,
  },
  durationTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    minWidth: 28,
    textAlign: 'right',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlButtonSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  playButtonLock: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomAccent: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
  },
});
