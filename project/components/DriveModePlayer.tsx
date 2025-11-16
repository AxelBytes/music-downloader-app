import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Car,
  Volume2,
} from 'lucide-react-native';
import { useDriveMode } from '@/contexts/DriveModeContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';

const { width, height } = Dimensions.get('window');

interface DriveModePlayerProps {
  visible: boolean;
  onClose: () => void;
}

export default function DriveModePlayer({ visible, onClose }: DriveModePlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<any>(null);
  
  const { isDriveModeActive, largeButtonsMode, voiceCommandsEnabled } = useDriveMode();
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

  const handlePlayPause = () => {
    if (isOnlinePlaying) {
      // Usar reproductor online
      // playSong(currentSong, playlist);
    } else if (isDownloadedPlaying) {
      // Usar reproductor descargado
      // playDownloadedSong(currentSong);
    }
  };

  const handleNext = () => {
    console.log('⏭️ [DriveModePlayer] Siguiente canción');
    // Lógica para siguiente canción
  };

  const handlePrevious = () => {
    console.log('⏮️ [DriveModePlayer] Canción anterior');
    // Lógica para canción anterior
  };

  const handleShuffle = () => {
    console.log('🔀 [DriveModePlayer] Modo aleatorio');
    // Lógica para modo aleatorio
  };

  const handleRepeat = () => {
    console.log('🔁 [DriveModePlayer] Modo repetición');
    // Lógica para modo repetición
  };

  if (!visible || !isDriveModeActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0033', '#000000', '#0a0a0a']} style={styles.gradient}>
        {/* Header */}
        <BlurView intensity={20} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.driveModeIndicator}>
              <Car size={24} color="#10b981" />
              <Text style={styles.driveModeText}>MODO DRIVE</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* Song Info */}
        <View style={styles.songInfoContainer}>
          <Text style={styles.songTitle} numberOfLines={2}>
            {currentSong?.title || currentSong?.filename || 'Sin canción'}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {currentSong?.artist || 'Artista Desconocido'}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentTime / duration) * 100}%` }]} />
          </View>
          <Text style={styles.timeText}>
            {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')} / {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
          </Text>
        </View>

        {/* Main Controls */}
        <View style={styles.mainControls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={handlePrevious}
          >
            <SkipBack size={largeButtonsMode ? 32 : 24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.playButton]}
            onPress={handlePlayPause}
          >
            {isPlaying ? (
              <Pause size={largeButtonsMode ? 48 : 36} color="#fff" />
            ) : (
              <Play size={largeButtonsMode ? 48 : 36} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={handleNext}
          >
            <SkipForward size={largeButtonsMode ? 32 : 24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Secondary Controls */}
        <View style={styles.secondaryControls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.smallButton]}
            onPress={handleShuffle}
          >
            <Shuffle size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.smallButton]}
            onPress={handleRepeat}
          >
            <Repeat size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.smallButton]}
            onPress={() => console.log('🔊 [DriveModePlayer] Volumen')}
          >
            <Volume2 size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Voice Commands Indicator */}
        {voiceCommandsEnabled && (
          <View style={styles.voiceCommandsIndicator}>
            <Text style={styles.voiceCommandsText}>
              🎤 Comandos de voz activados
            </Text>
          </View>
        )}

        {/* Safety Notice */}
        <View style={styles.safetyNotice}>
          <Text style={styles.safetyNoticeText}>
            ⚠️ Conduce con precaución. Usa solo cuando sea seguro.
          </Text>
        </View>
      </LinearGradient>
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
    zIndex: 1000,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driveModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driveModeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  songInfoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  songTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  songArtist: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    marginBottom: 40,
  },
  controlButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  smallButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginBottom: 40,
  },
  voiceCommandsIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  voiceCommandsText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  safetyNotice: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  safetyNoticeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
