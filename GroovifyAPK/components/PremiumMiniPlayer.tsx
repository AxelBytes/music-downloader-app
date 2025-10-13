import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Icon } from '@rneui/themed';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolate 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface PremiumMiniPlayerProps {
  currentSong?: any;
  isPlaying: boolean;
  progress: number;
  duration: number;
  onPress: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const PremiumMiniPlayer: React.FC<PremiumMiniPlayerProps> = ({
  currentSong,
  isPlaying,
  progress,
  duration,
  onPress,
  onPlayPause,
  onNext,
  onPrevious,
}) => {
  const playButtonScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  React.useEffect(() => {
    if (duration > 0) {
      progressWidth.value = withTiming((progress / duration) * (width - 40), {
        duration: 1000,
      });
    }
  }, [progress, duration]);

  const playButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playButtonScale.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  const handlePlayPress = () => {
    playButtonScale.value = withSpring(0.9, {}, () => {
      playButtonScale.value = withSpring(1);
    });
    onPlayPause();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BlurView intensity={20} style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.2)', 'rgba(6, 182, 212, 0.1)']}
          style={styles.gradient}
        >
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
            </View>
          </View>

          {/* Player Content */}
          <TouchableOpacity style={styles.playerContent} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.songInfo}>
              <View style={styles.albumArtContainer}>
                <LinearGradient
                  colors={['#8b5cf6', '#06b6d4']}
                  style={styles.albumArt}
                >
                  <Icon name="music" type="feather" color="#fff" size={20} />
                </LinearGradient>
              </View>
              
              <View style={styles.songDetails}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {currentSong.title || currentSong.filename?.replace(/\.(mp3|m4a|webm)$/i, '') || 'Canción desconocida'}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {currentSong.artist || 'Artista desconocido'}
                </Text>
              </View>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity style={styles.controlButton} onPress={onPrevious}>
                <Icon name="skip-previous" type="material" color="#8b5cf6" size={24} />
              </TouchableOpacity>

              <Animated.View style={playButtonAnimatedStyle}>
                <TouchableOpacity style={styles.playButton} onPress={handlePlayPress}>
                  <LinearGradient
                    colors={['#8b5cf6', '#06b6d4']}
                    style={styles.playButtonGradient}
                  >
                    <Icon
                      name={isPlaying ? "pause" : "play"}
                      type="feather"
                      color="#fff"
                      size={20}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity style={styles.controlButton} onPress={onNext}>
                <Icon name="skip-next" type="material" color="#8b5cf6" size={24} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blurContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  gradient: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressContainer: {
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  albumArtContainer: {
    marginRight: 12,
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 14,
    color: '#999',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  playButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
