import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Heart,
  Shuffle,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Repeat,
  Music,
  MoreHorizontal,
  ListMusic,
  Sliders,
} from 'lucide-react-native';
// import Slider from 'react-native-slider'; // Temporalmente comentado por error
import Equalizer from './Equalizer';
import RealEqualizer from './RealEqualizer';

const { width, height } = Dimensions.get('window');

interface FullScreenPlayerProps {
  visible: boolean;
  onClose: () => void;
  currentSong: any;
  isPlaying: boolean;
  progress: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (position: number) => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

export default function FullScreenPlayer({
  visible,
  onClose,
  currentSong,
  isPlaying,
  progress,
  duration,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onToggleFavorite,
  isFavorite = false,
}: FullScreenPlayerProps) {
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [slideAnimation] = useState(new Animated.Value(height));
  const [equalizerVisible, setEqualizerVisible] = useState(false);
  const [realEqualizerVisible, setRealEqualizerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnimation, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
      }).start();
    } else {
      Animated.spring(slideAnimation, {
        toValue: height,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  const songTitle = currentSong.filename
    ? currentSong.filename.replace(/\.(mp3|m4a|webm)$/i, '')
    : currentSong.title || 'Sin título';

  const artist = currentSong.artist || 'Descargada';

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateY: slideAnimation }] },
        ]}
      >
        <LinearGradient colors={['#1a0033', '#0a0a0a', '#000000']} style={styles.gradient}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>REPRODUCIENDO DESDE TU BIBLIOTECA</Text>
              <Text style={styles.headerSubtitle}>Tus Me Gusta</Text>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <MoreHorizontal size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Album Art */}
          <View style={styles.albumContainer}>
            <View style={styles.albumArt}>
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                style={styles.albumGradient}
              >
                <Music size={120} color="#fff" />
              </LinearGradient>
            </View>
          </View>

          {/* Song Info */}
          <View style={styles.songInfo}>
            <View style={styles.songTitleContainer}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {songTitle}
              </Text>
              {onToggleFavorite && (
                <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
                  <Heart
                    size={28}
                    color={isFavorite ? '#4ade80' : '#fff'}
                    fill={isFavorite ? '#4ade80' : 'transparent'}
                  />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.artist} numberOfLines={1}>
              {artist}
            </Text>
          </View>

          {/* Progress Bar - Versión simplificada sin slider */}
          <View style={styles.progressContainer}>
            <View style={styles.simpleProgressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(progress / (duration || 100)) * 100}%` }
                ]} 
              />
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{formatTime(progress)}</Text>
              <Text style={styles.time}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={() => setShuffle(!shuffle)}
              style={styles.secondaryControl}
            >
              <Shuffle size={24} color={shuffle ? '#4ade80' : '#fff'} />
            </TouchableOpacity>

            <TouchableOpacity onPress={onPrevious} style={styles.primaryControl}>
              <SkipBack size={32} color="#fff" fill="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                style={styles.playButtonGradient}
              >
                {isPlaying ? (
                  <Pause size={36} color="#fff" fill="#fff" />
                ) : (
                  <Play size={36} color="#fff" fill="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={onNext} style={styles.primaryControl}>
              <SkipForward size={32} color="#fff" fill="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRepeat(!repeat)}
              style={styles.secondaryControl}
            >
              <Repeat size={24} color={repeat ? '#4ade80' : '#fff'} />
            </TouchableOpacity>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity 
              style={styles.bottomButton}
              onPress={() => setRealEqualizerVisible(true)}
            >
              <Sliders size={24} color="#10b981" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomButton}>
              <ListMusic size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Equalizer Modal */}
      <Equalizer
        visible={equalizerVisible}
        onClose={() => setEqualizerVisible(false)}
      />
      
      {/* Real Equalizer Modal */}
      <RealEqualizer
        visible={realEqualizerVisible}
        onClose={() => setRealEqualizerVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  moreButton: {
    padding: 8,
  },
  albumContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  albumArt: {
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  albumGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  songTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  favoriteButton: {
    padding: 8,
  },
  artist: {
    fontSize: 18,
    color: '#999',
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  simpleProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  time: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginBottom: 40,
    gap: 20,
  },
  secondaryControl: {
    padding: 12,
  },
  primaryControl: {
    padding: 12,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    marginBottom: 40,
  },
  bottomButton: {
    padding: 12,
  },
});

