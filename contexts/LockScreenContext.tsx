import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDriveMode } from './DriveModeContext';

interface LockScreenContextType {
  // Estado
  isLockScreenActive: boolean;
  lockScreenNotificationsEnabled: boolean;
  floatingWindowVisible: boolean;
  
  // Funciones
  showLockScreenNotification: (song: any, isPlaying: boolean) => Promise<void>;
  hideLockScreenNotification: () => Promise<void>;
  toggleFloatingWindow: () => void;
  setLockScreenNotificationsEnabled: (enabled: boolean) => void;
  
  // Configuración
  loadLockScreenSettings: () => Promise<void>;
  saveLockScreenSettings: () => Promise<void>;
}

const LockScreenContext = createContext<LockScreenContextType | undefined>(undefined);

interface LockScreenProviderProps {
  children: ReactNode;
}

export function LockScreenProvider({ children }: LockScreenProviderProps) {
  const [isLockScreenActive, setIsLockScreenActive] = useState(false);
  const [lockScreenNotificationsEnabled, setLockScreenNotificationsEnabled] = useState(true);
  const [floatingWindowVisible, setFloatingWindowVisible] = useState(false);
  const { isDriveModeActive } = useDriveMode();

  useEffect(() => {
    loadLockScreenSettings();
    setupAppStateListener();
    setupNotificationChannels();
  }, []);

  useEffect(() => {
    // Mostrar ventana flotante cuando se active el modo drive
    if (isDriveModeActive) {
      setFloatingWindowVisible(true);
    }
  }, [isDriveModeActive]);

  const setupAppStateListener = () => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('📱 [LockScreenContext] Estado de la app:', nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsLockScreenActive(true);
        console.log('🔒 [LockScreenContext] Pantalla de bloqueo activa');
      } else if (nextAppState === 'active') {
        setIsLockScreenActive(false);
        console.log('🔓 [LockScreenContext] Pantalla de bloqueo desactivada');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  };

  const setupNotificationChannels = async () => {
    if (Platform.OS === 'android') {
      // Canal para notificaciones de pantalla de bloqueo
      await Notifications.setNotificationChannelAsync('groovify-lockscreen', {
        name: 'Groovify Lock Screen',
        description: 'Notificaciones de pantalla de bloqueo para modo drive',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8b5cf6',
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC as any,
        bypassDnd: true,
      });

      // Canal para ventana flotante
      await Notifications.setNotificationChannelAsync('groovify-floating', {
        name: 'Groovify Floating Window',
        description: 'Ventana flotante para modo drive',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250],
        lightColor: '#10b981',
        sound: 'false' as any,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC as any,
        bypassDnd: true,
      });
    }
  };

  const loadLockScreenSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('lockscreen_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setLockScreenNotificationsEnabled(parsed.lockScreenNotificationsEnabled ?? true);
        setFloatingWindowVisible(parsed.floatingWindowVisible ?? false);
      }
    } catch (error) {
      console.error('❌ [LockScreenContext] Error cargando configuración:', error);
    }
  };

  const saveLockScreenSettings = async () => {
    try {
      const settings = {
        lockScreenNotificationsEnabled,
        floatingWindowVisible,
      };
      await AsyncStorage.setItem('lockscreen_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('❌ [LockScreenContext] Error guardando configuración:', error);
    }
  };

  const showLockScreenNotification = async (song: any, isPlaying: boolean) => {
    if (!lockScreenNotificationsEnabled || !isDriveModeActive) return;

    try {
      const title = isPlaying ? '🎵 Reproduciendo' : '⏸️ Pausado';
      const body = `${song.title || song.filename} - ${song.artist || 'Artista Desconocido'}`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'lockscreen',
            songId: song.id,
            isPlaying,
            driveMode: true,
          },
          sound: false, // No sonido en pantalla de bloqueo
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'groovify-drive',
        },
        trigger: null,
        identifier: 'groovify-lockscreen-drive',
      });

      console.log('✅ [LockScreenContext] Notificación de pantalla de bloqueo enviada');
    } catch (error) {
      console.error('❌ [LockScreenContext] Error enviando notificación de pantalla de bloqueo:', error);
    }
  };

  const hideLockScreenNotification = async () => {
    try {
      await Notifications.dismissNotificationAsync('groovify-lockscreen-drive');
      console.log('✅ [LockScreenContext] Notificación de pantalla de bloqueo ocultada');
    } catch (error) {
      console.error('❌ [LockScreenContext] Error ocultando notificación:', error);
    }
  };

  const toggleFloatingWindow = () => {
    const newState = !floatingWindowVisible;
    setFloatingWindowVisible(newState);
    saveLockScreenSettings();
    
    console.log('🪟 [LockScreenContext] Ventana flotante:', newState ? 'visible' : 'oculta');
  };

  const updateLockScreenNotificationsEnabled = (enabled: boolean) => {
    setLockScreenNotificationsEnabled(enabled);
    saveLockScreenSettings();
  };

  const value: LockScreenContextType = {
    isLockScreenActive,
    lockScreenNotificationsEnabled,
    floatingWindowVisible,
    showLockScreenNotification,
    hideLockScreenNotification,
    toggleFloatingWindow,
    setLockScreenNotificationsEnabled: updateLockScreenNotificationsEnabled,
    loadLockScreenSettings,
    saveLockScreenSettings,
  };

  return (
    <LockScreenContext.Provider value={value}>
      {children}
    </LockScreenContext.Provider>
  );
}

export function useLockScreen() {
  const context = useContext(LockScreenContext);
  if (context === undefined) {
    throw new Error('useLockScreen must be used within a LockScreenProvider');
  }
  return context;
}
