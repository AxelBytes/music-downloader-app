import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Pressable } from 'react-native';
import { Play, Pause, SkipForward, SkipBack, ChevronUp } from 'lucide-react-native';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import FullScreenPlayer from './FullScreenPlayer';

const { width } = Dimensions.get('window');

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
  const scale = useSharedValue(0.95);
  const playButtonScale = useSharedValue(1);
  const rotateValue = useSharedValue(0);

  useEffect(() => {
    if (currentSong) {
      translateY.value = withSpring(0, { damping: 16, mass: 1.2 });
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 16, mass: 1.2 });
    } else {
      translateY.value = withSpring(100);
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withSpring(0.9);
    }
  }, [currentSong]);

  // Animate play button on press
  const handlePlayButtonPress = () => {
    playButtonScale.value = withSpring(0.92, { damping: 20, mass: 0.8 });
    setTimeout(() => {
      playButtonScale.value = withSpring(1, { damping: 20, mass: 0.8 });
    }, 100);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  const playButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playButtonScale.value }],
  }));

  if (!currentSong) return null;

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    handlePlayButtonPress();
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  return (
    <>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Pressable
          onPress={() => setFullPlayerVisible(true)}
          style={{ flex: 1 }}
        >
          <BlurView intensity={90} style={styles.blurContainer}>
            {/* Shimmer Effect Background */}
            <View style={styles.shimmerOverlay} />
            
            <LinearGradient 
              colors={['rgba(139, 92, 246, 0.2)', 'rgba(6, 182, 212, 0.08)']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              {/* Premium Progress Bar with Glow */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <Animated.View style={[styles.progressFill, { width: `${progressPercentage}%` }]}>
                    <LinearGradient
                      colors={['#8b5cf6', '#06b6d4', '#8b5cf6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.progressGradient}
                    />
                  </Animated.View>
                </View>
                <View style={[styles.progressGlowEffect, { width: `${progressPercentage}%` }]} />
              </View>

              {/* Main Content */}
              <View style={styles.content}>
                {/* Premium Album Art Thumbnail */}
                <View style={styles.thumbnailWrapper}>
                  <LinearGradient
                    colors={['#8b5cf6', '#06b6d4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.thumbnailGradient}
                  >
                    <View style={styles.musicIconContainer}>
                      <Text style={styles.musicIcon}>♪</Text>
                    </View>
                  </LinearGradient>
                  {/* Gradient Border Effect */}
                  <LinearGradient
                    colors={['rgba(139, 92, 246, 0.5)', 'rgba(6, 182, 212, 0.5)', 'rgba(139, 92, 246, 0.5)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.thumbnailBorder}
                  />
                </View>

                {/* Song Info */}
                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={1}>
                    {currentSong.filename.replace(/\.(mp3|m4a|webm)$/i, '')}
                  </Text>
                  <View style={styles.timeRow}>
                    <Text style={styles.time}>
                      {formatTime(progress)}
                    </Text>
                    <Text style={styles.timeSeparator}>•</Text>
                    <Text style={styles.timeDuration}>
                      {formatTime(duration)}
                    </Text>
                  </View>
                </View>

                {/* Control Buttons */}
                <View style={styles.controls}>
                  <Pressable 
                    onPress={previousSong} 
                    style={({ pressed }) => [
                      styles.controlButton,
                      pressed && styles.controlButtonPressed
                    ]}
                  >
                    <SkipBack size={22} color="#fff" fill="#fff" />
                  </Pressable>

                  <Animated.View style={[playButtonAnimatedStyle]}>
                    <Pressable
                      onPress={handlePlayPause}
                      style={({ pressed }) => [
                        styles.playButton,
                        pressed && styles.playButtonPressed
                      ]}
                    >
                      <LinearGradient
                        colors={['#8b5cf6', '#06b6d4']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.playButtonGradient}
                      >
                        <View style={styles.playButtonInner}>
                          {isPlaying ? (
                            <Pause size={28} color="#fff" fill="#fff" />
                          ) : (
                            <Play size={28} color="#fff" fill="#fff" />
                          )}
                        </View>
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>

                  <Pressable 
                    onPress={nextSong} 
                    style={({ pressed }) => [
                      styles.controlButton,
                      pressed && styles.controlButtonPressed
                    ]}
                  >
                    <SkipForward size={22} color="#fff" fill="#fff" />
                  </Pressable>
                </View>
              </View>

              {/* Chevron Up indicator */}
              <View style={styles.chevronContainer}>
                <ChevronUp size={18} color="rgba(255, 255, 255, 0.6)" strokeWidth={2.5} />
              </View>
            </LinearGradient>
          </BlurView>
        </Pressable>
      </Animated.View>

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
    height: 80,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    zIndex: 1000,
  },
  blurContainer: {
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
  },
  gradient: {
    paddingBottom: 12,
  },
  progressBarContainer: {
    position: 'relative',
    height: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginHorizontal: 0,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressGradient: {
    width: '100%',
    height: '100%',
  },
  progressGlowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.4)',
    borderRadius: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 14,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 60,
    height: 60,
  },
  thumbnailGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  thumbnailBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    opacity: 0.3,
    borderWidth: 1,
  },
  musicIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '800',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontSize: 12,
    color: '#06b6d4',
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  timeDuration: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  controlButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ scale: 0.92 }],
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  playButtonPressed: {
    elevation: 4,
    shadowOpacity: 0.3,
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronContainer: {
    paddingTop: 4,
    paddingBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

