import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

interface DriveModeContextType {
  // Estado del modo drive
  isDriveModeActive: boolean;
  isDriveModeEnabled: boolean;
  
  // Configuración
  autoActivateOnBluetooth: boolean;
  autoActivateOnCarPlay: boolean;
  voiceCommandsEnabled: boolean;
  largeButtonsMode: boolean;
  
  // Funciones
  toggleDriveMode: () => void;
  activateDriveMode: () => void;
  deactivateDriveMode: () => void;
  
  // Configuración
  setAutoActivateOnBluetooth: (enabled: boolean) => void;
  setAutoActivateOnCarPlay: (enabled: boolean) => void;
  setVoiceCommandsEnabled: (enabled: boolean) => void;
  setLargeButtonsMode: (enabled: boolean) => void;
  
  // Funciones del modo drive
  playNextSong: () => void;
  playPreviousSong: () => void;
  togglePlayPause: () => void;
  skipToPlaylist: (playlistId: string) => void;
  
  // Notificaciones
  showDriveModeNotification: () => Promise<void>;
}

const DriveModeContext = createContext<DriveModeContextType | undefined>(undefined);

interface DriveModeProviderProps {
  children: ReactNode;
}

export function DriveModeProvider({ children }: DriveModeProviderProps) {
  const [isDriveModeActive, setIsDriveModeActive] = useState(false);
  const [isDriveModeEnabled, setIsDriveModeEnabled] = useState(true);
  const [autoActivateOnBluetooth, setAutoActivateOnBluetooth] = useState(false);
  const [autoActivateOnCarPlay, setAutoActivateOnCarPlay] = useState(false);
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(true);
  const [largeButtonsMode, setLargeButtonsMode] = useState(true);

  useEffect(() => {
    loadDriveModeSettings();
    setupBluetoothListener();
  }, []);

  const loadDriveModeSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('drive_mode_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setIsDriveModeEnabled(parsed.isDriveModeEnabled ?? true);
        setAutoActivateOnBluetooth(parsed.autoActivateOnBluetooth ?? false);
        setAutoActivateOnCarPlay(parsed.autoActivateOnCarPlay ?? false);
        setVoiceCommandsEnabled(parsed.voiceCommandsEnabled ?? true);
        setLargeButtonsMode(parsed.largeButtonsMode ?? true);
      }
    } catch (error) {
      console.error('❌ [DriveModeContext] Error cargando configuración:', error);
    }
  };

  const saveDriveModeSettings = async () => {
    try {
      const settings = {
        isDriveModeEnabled,
        autoActivateOnBluetooth,
        autoActivateOnCarPlay,
        voiceCommandsEnabled,
        largeButtonsMode,
      };
      await AsyncStorage.setItem('drive_mode_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('❌ [DriveModeContext] Error guardando configuración:', error);
    }
  };

  const setupBluetoothListener = () => {
    // Aquí iría la lógica para detectar conexión Bluetooth del auto
    // Por ahora, simulamos la detección
    console.log('🚗 [DriveModeContext] Listener de Bluetooth configurado');
  };

  const toggleDriveMode = () => {
    if (isDriveModeActive) {
      deactivateDriveMode();
    } else {
      activateDriveMode();
    }
  };

  const activateDriveMode = () => {
    if (!isDriveModeEnabled) {
      Alert.alert(
        '🚗 Modo Drive Deshabilitado',
        'El modo drive está deshabilitado. ¿Quieres habilitarlo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Habilitar',
            onPress: () => {
              setIsDriveModeEnabled(true);
              saveDriveModeSettings();
              activateDriveMode();
            },
          },
        ]
      );
      return;
    }

    setIsDriveModeActive(true);
    showDriveModeNotification();
    
    Alert.alert(
      '🚗 Modo Drive Activado',
      'Groovify está optimizado para conducción segura. Interfaz simplificada y controles grandes activados.',
      [{ text: 'Entendido', style: 'default' }]
    );
    
    console.log('✅ [DriveModeContext] Modo drive activado');
  };

  const deactivateDriveMode = () => {
    setIsDriveModeActive(false);
    
    Alert.alert(
      '🚗 Modo Drive Desactivado',
      'Has vuelto al modo normal de Groovify.',
      [{ text: 'Perfecto', style: 'default' }]
    );
    
    console.log('✅ [DriveModeContext] Modo drive desactivado');
  };

  const showDriveModeNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚗 Modo Drive Activado',
          body: 'Groovify está optimizado para conducción segura',
          data: { type: 'drive-mode' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
        identifier: 'groovify-drive-mode',
      });
    } catch (error) {
      console.error('❌ [DriveModeContext] Error enviando notificación:', error);
    }
  };

  const playNextSong = () => {
    console.log('⏭️ [DriveModeContext] Siguiente canción');
    // Aquí iría la lógica para reproducir la siguiente canción
    // Se integraría con el MusicPlayerContext
  };

  const playPreviousSong = () => {
    console.log('⏮️ [DriveModeContext] Canción anterior');
    // Aquí iría la lógica para reproducir la canción anterior
    // Se integraría con el MusicPlayerContext
  };

  const togglePlayPause = () => {
    console.log('⏯️ [DriveModeContext] Play/Pause');
    // Aquí iría la lógica para pausar/reanudar
    // Se integraría con el MusicPlayerContext
  };

  const skipToPlaylist = (playlistId: string) => {
    console.log('📋 [DriveModeContext] Cambiar a playlist:', playlistId);
    // Aquí iría la lógica para cambiar de playlist
    // Se integraría con el PlaylistContext
  };

  const updateAutoActivateOnBluetooth = (enabled: boolean) => {
    setAutoActivateOnBluetooth(enabled);
    saveDriveModeSettings();
  };

  const updateAutoActivateOnCarPlay = (enabled: boolean) => {
    setAutoActivateOnCarPlay(enabled);
    saveDriveModeSettings();
  };

  const updateVoiceCommandsEnabled = (enabled: boolean) => {
    setVoiceCommandsEnabled(enabled);
    saveDriveModeSettings();
  };

  const updateLargeButtonsMode = (enabled: boolean) => {
    setLargeButtonsMode(enabled);
    saveDriveModeSettings();
  };

  const value: DriveModeContextType = {
    isDriveModeActive,
    isDriveModeEnabled,
    autoActivateOnBluetooth,
    autoActivateOnCarPlay,
    voiceCommandsEnabled,
    largeButtonsMode,
    toggleDriveMode,
    activateDriveMode,
    deactivateDriveMode,
    setAutoActivateOnBluetooth: updateAutoActivateOnBluetooth,
    setAutoActivateOnCarPlay: updateAutoActivateOnCarPlay,
    setVoiceCommandsEnabled: updateVoiceCommandsEnabled,
    setLargeButtonsMode: updateLargeButtonsMode,
    playNextSong,
    playPreviousSong,
    togglePlayPause,
    skipToPlaylist,
    showDriveModeNotification,
  };

  return (
    <DriveModeContext.Provider value={value}>
      {children}
    </DriveModeContext.Provider>
  );
}

export function useDriveMode() {
  const context = useContext(DriveModeContext);
  if (context === undefined) {
    throw new Error('useDriveMode must be used within a DriveModeProvider');
  }
  return context;
}
