import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  } as any), // Agregar propiedades faltantes
});

interface NotificationContextType {
  // Estado
  notificationsEnabled: boolean;
  playbackNotificationsEnabled: boolean;
  driveModeNotificationsEnabled: boolean;
  
  // Funciones
  toggleNotifications: () => Promise<void>;
  togglePlaybackNotifications: () => Promise<void>;
  toggleDriveModeNotifications: () => Promise<void>;
  
  // Notificaciones del player
  showPlaybackNotification: (song: any, isPlaying: boolean) => Promise<void>;
  showDownloadNotification: (song: any, progress: number) => Promise<void>;
  showDriveModeNotification: () => Promise<void>;
  
  // Configuración
  loadNotificationSettings: () => Promise<void>;
  saveNotificationSettings: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [playbackNotificationsEnabled, setPlaybackNotificationsEnabled] = useState(true);
  const [driveModeNotificationsEnabled, setDriveModeNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadNotificationSettings();
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('groovify-music', {
        name: 'Groovify Music',
        description: 'Notificaciones de reproducción de música',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8b5cf6',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('groovify-downloads', {
        name: 'Groovify Downloads',
        description: 'Notificaciones de descarga',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#06b6d4',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('groovify-drive', {
        name: 'Groovify Drive Mode',
        description: 'Notificaciones del modo drive',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#10b981',
        sound: 'default',
      });
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('notification_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setNotificationsEnabled(parsed.notificationsEnabled ?? true);
        setPlaybackNotificationsEnabled(parsed.playbackNotificationsEnabled ?? true);
        setDriveModeNotificationsEnabled(parsed.driveModeNotificationsEnabled ?? true);
      }
    } catch (error) {
      console.error('❌ [NotificationContext] Error cargando configuración:', error);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      const settings = {
        notificationsEnabled,
        playbackNotificationsEnabled,
        driveModeNotificationsEnabled,
      };
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('❌ [NotificationContext] Error guardando configuración:', error);
    }
  };

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await saveNotificationSettings();
    
    if (newValue) {
      await registerForPushNotificationsAsync();
    }
  };

  const togglePlaybackNotifications = async () => {
    const newValue = !playbackNotificationsEnabled;
    setPlaybackNotificationsEnabled(newValue);
    await saveNotificationSettings();
  };

  const toggleDriveModeNotifications = async () => {
    const newValue = !driveModeNotificationsEnabled;
    setDriveModeNotificationsEnabled(newValue);
    await saveNotificationSettings();
  };

  const showPlaybackNotification = async (song: any, isPlaying: boolean) => {
    if (!notificationsEnabled || !playbackNotificationsEnabled) return;

    try {
      const title = isPlaying ? '🎵 Reproduciendo' : '⏸️ Pausado';
      const body = `${song.title || song.filename} - ${song.artist || 'Artista Desconocido'}`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'playback',
            songId: song.id,
            isPlaying,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
        identifier: 'groovify-playback',
      });

      console.log('✅ [NotificationContext] Notificación de reproducción enviada');
    } catch (error) {
      console.error('❌ [NotificationContext] Error enviando notificación de reproducción:', error);
    }
  };

  const showDownloadNotification = async (song: any, progress: number) => {
    if (!notificationsEnabled) return;

    try {
      const title = progress === 100 ? '✅ Descarga completada' : '📥 Descargando...';
      const body = progress === 100 
        ? `${song.title || song.filename} está listo`
        : `${song.title || song.filename} - ${progress}%`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'download',
            songId: song.id,
            progress,
          },
          sound: progress === 100,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null,
        identifier: `groovify-download-${song.id}`,
      });

      console.log('✅ [NotificationContext] Notificación de descarga enviada');
    } catch (error) {
      console.error('❌ [NotificationContext] Error enviando notificación de descarga:', error);
    }
  };

  const showDriveModeNotification = async () => {
    if (!notificationsEnabled || !driveModeNotificationsEnabled) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚗 Modo Drive Activado',
          body: 'Groovify está optimizado para conducción segura',
          data: {
            type: 'drive-mode',
            active: true,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
        identifier: 'groovify-drive-mode',
      });

      console.log('✅ [NotificationContext] Notificación de modo drive enviada');
    } catch (error) {
      console.error('❌ [NotificationContext] Error enviando notificación de modo drive:', error);
    }
  };

  const value: NotificationContextType = {
    notificationsEnabled,
    playbackNotificationsEnabled,
    driveModeNotificationsEnabled,
    toggleNotifications,
    togglePlaybackNotifications,
    toggleDriveModeNotifications,
    showPlaybackNotification,
    showDownloadNotification,
    showDriveModeNotification,
    loadNotificationSettings,
    saveNotificationSettings,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
