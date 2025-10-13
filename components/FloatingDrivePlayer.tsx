import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Car,
  Minimize2,
  Maximize2,
} from 'lucide-react-native';
import { useDriveMode } from '@/contexts/DriveModeContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';

const { width, height } = Dimensions.get('window');

interface FloatingDrivePlayerProps {
  visible: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

export default function FloatingDrivePlayer({ 
  visible, 
  onClose, 
  onMinimize 
}: FloatingDrivePlayerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<any>(null);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  const { isDriveModeActive, largeButtonsMode } = useDriveMode();
  const { isPlaying: isOnlinePlaying, currentSong: onlineSong } = useMusicPlayer();
  const { isPlaying: isDownloadedPlaying, currentSong: downloadedSong } = useDownloaderMusicPlayer();

  useEffect(() => {
    // Determinar qué reproductor está activo
    if (isOnlinePlaying && onlineSong) {
      setCurrentSong(onlineSong);
      setIsPlaying(isOnlinePlaying);
    } else if (isDownloadedPlaying && downloadedSong) {
      setCurrentSong(downloadedSong);
      setIsPlaying(isDownloadedPlaying);
    }
  }, [isOnlinePlaying, onlineSong, isDownloadedPlaying, downloadedSong]);

  const handleGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY } = event.nativeEvent;
      
      // Snap to edges
      const snapX = translationX > width / 4 ? width - 80 : translationX < -width / 4 ? 0 : translationX;
      const snapY = Math.max(50, Math.min(height - 200, translationY));
      
      Animated.spring(translateX, {
        toValue: snapX,
        useNativeDriver: true,
      }).start();
      
      Animated.spring(translateY, {
        toValue: snapY,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePlayPause = () => {
    console.log('⏯️ [FloatingDrivePlayer] Play/Pause');
    // Lógica para play/pause
  };

  const handleNext = () => {
    console.log('⏭️ [FloatingDrivePlayer] Siguiente canción');
    // Lógica para siguiente canción
  };

  const handlePrevious = () => {
    console.log('⏮️ [FloatingDrivePlayer] Canción anterior');
    // Lógica para canción anterior
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    onMinimize();
  };

  const handleClose = () => {
    Alert.alert(
      '🚗 Cerrar Modo Drive',
      '¿Estás seguro de que quieres cerrar el modo drive?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar',
          style: 'destructive',
          onPress: onClose,
        },
      ]
    );
  };

  if (!visible || !isDriveModeActive) {
    return null;
  }

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleStateChange}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateX },
              { translateY },
              { scale },
            ],
          },
        ]}
      >
        <BlurView intensity={20} style={styles.blurContainer}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.9)', 'rgba(16, 185, 129, 0.9)']}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.driveModeIndicator}>
                <Car size={16} color="#fff" />
                <Text style={styles.driveModeText}>DRIVE</Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  onPress={toggleMinimize}
                  style={styles.headerButton}
                >
                  {isMinimized ? (
                    <Maximize2 size={16} color="#fff" />
                  ) : (
                    <Minimize2 size={16} color="#fff" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.headerButton}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {!isMinimized && (
              <>
                {/* Song Info */}
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {currentSong?.title || currentSong?.filename || 'Sin canción'}
                  </Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {currentSong?.artist || 'Artista Desconocido'}
                  </Text>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                  <TouchableOpacity
                    style={[styles.controlButton, styles.secondaryButton]}
                    onPress={handlePrevious}
                  >
                    <SkipBack size={20} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.controlButton, styles.playButton]}
                    onPress={handlePlayPause}
                  >
                    {isPlaying ? (
                      <Pause size={24} color="#fff" />
                    ) : (
                      <Play size={24} color="#fff" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.controlButton, styles.secondaryButton]}
                    onPress={handleNext}
                  >
                    <SkipForward size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Minimized View */}
            {isMinimized && (
              <TouchableOpacity
                style={styles.minimizedPlayButton}
                onPress={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause size={20} color="#fff" />
                ) : (
                  <Play size={20} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 20,
    zIndex: 99999, // Z-index más alto para aparecer sobre cualquier app
    elevation: 1000, // Para Android
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 12,
    minWidth: 280,
    maxWidth: 320,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  driveModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driveModeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    marginBottom: 12,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  minimizedPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
