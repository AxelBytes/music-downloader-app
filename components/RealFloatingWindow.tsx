import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  // PanGestureHandler,
  // GestureHandlerRootView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFloatingWindow } from '@/contexts/FloatingWindowContext';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface RealFloatingWindowProps {
  visible: boolean;
  onClose: () => void;
}

export default function RealFloatingWindow({ visible, onClose }: RealFloatingWindowProps) {
  const [position, setPosition] = useState({ x: screenWidth - 80, y: screenHeight / 2 - 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { hideFloatingWindow } = useFloatingWindow();
  const downloaderPlayer = useDownloaderMusicPlayer();
  const onlinePlayer = useMusicPlayer();

  // Obtener el reproductor activo
  const currentPlayer = downloaderPlayer.currentSong ? downloaderPlayer : onlinePlayer;
  const currentSong = currentPlayer.currentSong;
  const isPlaying = currentPlayer.isPlaying;

  useEffect(() => {
    if (!visible) {
      setIsExpanded(false);
    }
  }, [visible]);

  if (!visible || !currentSong) {
    return null;
  }

  const formatTime = (milliseconds: number): string => {
    if (!milliseconds || isNaN(milliseconds)) return '0:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSongTitle = () => {
    if (downloaderPlayer.currentSong) {
      return downloaderPlayer.currentSong.filename
        .replace('.mp3', '')
        .replace('.m4a', '')
        .replace('.webm', '');
    }
    return onlinePlayer.currentSong?.title || 'Canción';
  };

  const getSongArtist = () => {
    if (downloaderPlayer.currentSong) {
      return 'Groovify';
    }
    return onlinePlayer.currentSong?.artist || 'Artista';
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      currentPlayer.pauseSong();
    } else {
      currentPlayer.resumeSong();
    }
  };

  const handleNext = () => {
    currentPlayer.nextSong();
  };

  const handlePrevious = () => {
    currentPlayer.previousSong();
  };

  const handleClose = () => {
    Alert.alert(
      'Cerrar Ventana Flotante',
      '¿Quieres cerrar la ventana flotante?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar', 
          style: 'destructive',
          onPress: () => {
            hideFloatingWindow();
            onClose();
          }
        }
      ]
    );
  };

  const onGestureEvent = (event: any) => {
    const { translationX, translationY } = event.nativeEvent;
    
    if (isDragging) {
      const newX = Math.max(0, Math.min(screenWidth - 80, position.x + translationX));
      const newY = Math.max(0, Math.min(screenHeight - 80, position.y + translationY));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const onHandlerStateChange = (event: any) => {
    const { state } = event.nativeEvent;
    
    if (state === 2) { // BEGAN
      setIsDragging(true);
    } else if (state === 5) { // END
      setIsDragging(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (Platform.OS !== 'android') {
    // Solo funciona en Android
    return null;
  }

  return (
      <View style={styles.container}>
      <View style={[styles.floatingContainer, { left: position.x, top: position.y }]}>
        {isExpanded ? (
          // Vista expandida
          <LinearGradient
            colors={['#1a1a1a', '#2d2d2d']}
            style={styles.expandedContainer}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.appName}>Groovify</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Song Info */}
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {getSongTitle()}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {getSongArtist()}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '30%' }]} />
              </View>
              <Text style={styles.timeText}>
                {formatTime(currentPlayer.progress || 0)} / {formatTime(currentPlayer.duration || 0)}
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity onPress={handlePrevious} style={styles.controlButton}>
                <Ionicons name="play-skip-back" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={32} 
                  color="#fff" 
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleNext} style={styles.controlButton}>
                <Ionicons name="play-skip-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Minimize Button */}
            <TouchableOpacity onPress={toggleExpanded} style={styles.minimizeButton}>
              <Ionicons name="chevron-down" size={20} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          // Vista compacta
          <View>
            <TouchableOpacity 
              onPress={toggleExpanded}
              style={styles.compactContainer}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8b5cf6', '#a855f7']}
                style={styles.compactGradient}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={24} 
                  color="#fff" 
                />
              </LinearGradient>
              
              {/* Drag indicator */}
              <View style={styles.dragIndicator}>
                <View style={styles.dragDot} />
                <View style={styles.dragDot} />
                <View style={styles.dragDot} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
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
    pointerEvents: 'box-none',
  },
  floatingContainer: {
    position: 'absolute',
    zIndex: 10000,
    elevation: 10000, // Android
  },
  compactContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  compactGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    flexDirection: 'row',
    gap: 2,
  },
  dragDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  expandedContainer: {
    width: 280,
    borderRadius: 16,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  songInfo: {
    marginBottom: 16,
  },
  songTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  songArtist: {
    color: '#ccc',
    fontSize: 14,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  timeText: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimizeButton: {
    alignSelf: 'center',
    padding: 8,
  },
});
