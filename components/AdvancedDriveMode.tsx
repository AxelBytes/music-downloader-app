import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { useDriveMode } from '@/contexts/DriveModeContext';
import { useLockScreen } from '@/contexts/LockScreenContext';
import { useMapOverlay } from '@/contexts/MapOverlayContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useDownloaderMusicPlayer } from '@/contexts/DownloaderMusicPlayerContext';
import FloatingDrivePlayer from './FloatingDrivePlayer';

interface AdvancedDriveModeProps {
  visible: boolean;
  onClose: () => void;
}

export default function AdvancedDriveMode({ visible, onClose }: AdvancedDriveModeProps) {
  const [floatingWindowVisible, setFloatingWindowVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { isDriveModeActive, toggleDriveMode } = useDriveMode();
  const { 
    lockScreenNotificationsEnabled, 
    showLockScreenNotification,
    hideLockScreenNotification,
    toggleFloatingWindow,
    setLockScreenNotificationsEnabled 
  } = useLockScreen();
  const { 
    isGoogleMapsActive, 
    isOverlayVisible, 
    overlayEnabled,
    showOverlay,
    hideOverlay,
    setOverlayEnabled 
  } = useMapOverlay();
  const { isPlaying: isOnlinePlaying, currentSong: onlineSong } = useMusicPlayer();
  const { isPlaying: isDownloadedPlaying, currentSong: downloadedSong } = useDownloaderMusicPlayer();

  useEffect(() => {
    if (visible && isDriveModeActive) {
      setFloatingWindowVisible(true);
      
      // Mostrar notificación de pantalla de bloqueo
      const currentSong = onlineSong || downloadedSong;
      if (currentSong) {
        showLockScreenNotification(currentSong, isOnlinePlaying || isDownloadedPlaying);
      }
      
      // Activar overlay si Google Maps está activo
      if (isGoogleMapsActive && overlayEnabled) {
        showOverlay();
      }
    } else {
      setFloatingWindowVisible(false);
      hideLockScreenNotification();
      hideOverlay();
    }
  }, [visible, isDriveModeActive, isGoogleMapsActive, overlayEnabled]);

  useEffect(() => {
    // Actualizar notificación de pantalla de bloqueo cuando cambie la canción
    const currentSong = onlineSong || downloadedSong;
    const isPlaying = isOnlinePlaying || isDownloadedPlaying;
    
    if (visible && isDriveModeActive && currentSong) {
      showLockScreenNotification(currentSong, isPlaying);
    }
  }, [onlineSong, downloadedSong, isOnlinePlaying, isDownloadedPlaying]);

  const handleClose = () => {
    Alert.alert(
      '🚗 Cerrar Modo Drive Avanzado',
      '¿Estás seguro de que quieres cerrar el modo drive? Se ocultarán las notificaciones y la ventana flotante.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar',
          style: 'destructive',
          onPress: () => {
            setFloatingWindowVisible(false);
            hideLockScreenNotification();
            hideOverlay();
            onClose();
          },
        },
      ]
    );
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    toggleFloatingWindow();
  };

  const handleToggleLockScreenNotifications = () => {
    const newState = !lockScreenNotificationsEnabled;
    setLockScreenNotificationsEnabled(newState);
    
    if (!newState) {
      hideLockScreenNotification();
    } else if (isDriveModeActive) {
      const currentSong = onlineSong || downloadedSong;
      if (currentSong) {
        showLockScreenNotification(currentSong, isOnlinePlaying || isDownloadedPlaying);
      }
    }
    
    Alert.alert(
      '🔒 Notificaciones de Pantalla de Bloqueo',
      newState ? 'Las notificaciones de pantalla de bloqueo están activadas' : 'Las notificaciones de pantalla de bloqueo están desactivadas'
    );
  };

  const handleToggleOverlay = () => {
    const newState = !overlayEnabled;
    setOverlayEnabled(newState);
    
    if (!newState) {
      hideOverlay();
    } else if (isGoogleMapsActive) {
      showOverlay();
    }
    
    Alert.alert(
      '🗺️ Overlay en Google Maps',
      newState ? 'El overlay en Google Maps está activado' : 'El overlay en Google Maps está desactivado'
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Floating Window */}
      <FloatingDrivePlayer
        visible={floatingWindowVisible}
        onClose={handleClose}
        onMinimize={handleMinimize}
      />
      
      {/* Overlay Controls */}
      {isGoogleMapsActive && overlayEnabled && (
        <View style={styles.overlayControls}>
          {/* Aquí irían los controles específicos para Google Maps */}
        </View>
      )}
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
  },
  overlayControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10000,
  },
});
