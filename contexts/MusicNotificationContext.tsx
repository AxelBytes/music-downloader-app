import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { useDownloaderMusicPlayer } from './DownloaderMusicPlayerContext';
import { useMusicPlayer } from './MusicPlayerContext';

type MusicNotificationContextType = {
  isNotificationVisible: boolean;
  showMusicNotification: () => Promise<void>;
  hideMusicNotification: () => Promise<void>;
  updateNotificationContent: (title: string, artist: string, isPlaying: boolean) => Promise<void>;
};

const MusicNotificationContext = createContext<MusicNotificationContextType | undefined>(undefined);

// Configurar el manejo de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  } as any), // Agregar propiedades faltantes
});

export function MusicNotificationProvider({ children }: { children: React.ReactNode }) {
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationId, setNotificationId] = useState<string | null>(null);
  
  const downloaderPlayer = useDownloaderMusicPlayer();
  const onlinePlayer = useMusicPlayer();

  useEffect(() => {
    // Configurar canales de notificación para Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('music-player', {
        name: 'Reproductor de Música',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8b5cf6',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        // MOSTRAR EN PANTALLA COMPLETA
        showBadge: true,
        enableVibrate: true,
        enableLights: true,
      });

      // Configurar categorías de notificación con controles
      Notifications.setNotificationCategoryAsync('music-controls', [
        {
          identifier: 'PREVIOUS',
          buttonTitle: '⏮',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'PLAY_PAUSE',
          buttonTitle: '⏯',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'NEXT',
          buttonTitle: '⏭',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    }

    // LISTENER PARA ACCIONES DE NOTIFICACIÓN
    const notificationListener = Notifications.addNotificationResponseReceivedListener(response => {
      const actionIdentifier = response.actionIdentifier;
      console.log('🎵 [MusicNotification] Acción de notificación:', actionIdentifier);
      
      switch (actionIdentifier) {
        case 'PREVIOUS':
          if (downloaderPlayer.currentSong) {
            downloaderPlayer.previousSong();
          } else if (onlinePlayer.currentSong) {
            onlinePlayer.previousSong();
          }
          break;
        case 'PLAY_PAUSE':
          if (downloaderPlayer.currentSong) {
            if (downloaderPlayer.isPlaying) {
              downloaderPlayer.pauseSong();
            } else {
              downloaderPlayer.resumeSong();
            }
          } else if (onlinePlayer.currentSong) {
            if (onlinePlayer.isPlaying) {
              onlinePlayer.pauseSong();
            } else {
              onlinePlayer.resumeSong();
            }
          }
          break;
        case 'NEXT':
          if (downloaderPlayer.currentSong) {
            downloaderPlayer.nextSong();
          } else if (onlinePlayer.currentSong) {
            onlinePlayer.nextSong();
          }
          break;
        case Notifications.DEFAULT_ACTION_IDENTIFIER:
          // Tocar la notificación abre la app
          console.log('🎵 [MusicNotification] Notificación tocada - abriendo app');
          break;
      }
    });

    // Solicitar permisos
    requestPermissions();

    return () => {
      notificationListener.remove();
    };
  }, []);

  // Escuchar cambios en el reproductor
  useEffect(() => {
    const currentSong = downloaderPlayer.currentSong || onlinePlayer.currentSong;
    const isPlaying = downloaderPlayer.isPlaying || onlinePlayer.isPlaying;
    
    if (currentSong) {
      const title = downloaderPlayer.currentSong 
        ? downloaderPlayer.currentSong.filename.replace('.mp3', '').replace('.m4a', '')
        : onlinePlayer.currentSong?.title || 'Canción';
      
      const artist = downloaderPlayer.currentSong 
        ? 'Groovify'
        : onlinePlayer.currentSong?.artist || 'Artista';
      
      updateNotificationContent(title, artist, isPlaying);
    } else {
      hideMusicNotification();
    }
  }, [downloaderPlayer.currentSong, downloaderPlayer.isPlaying, onlinePlayer.currentSong, onlinePlayer.isPlaying]);

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos Requeridos',
          'Se necesitan permisos de notificación para mostrar el reproductor en la pantalla de bloqueo.',
          [{ text: 'Entendido', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Error solicitando permisos de notificación:', error);
    }
  };

  const showMusicNotification = async () => {
    try {
      const currentSong = downloaderPlayer.currentSong || onlinePlayer.currentSong;
      if (!currentSong) return;

      const title = downloaderPlayer.currentSong 
        ? downloaderPlayer.currentSong.filename.replace('.mp3', '').replace('.m4a', '')
        : onlinePlayer.currentSong?.title || 'Canción';
      
      const artist = downloaderPlayer.currentSong 
        ? 'Groovify'
        : onlinePlayer.currentSong?.artist || 'Artista';

      const isPlaying = downloaderPlayer.isPlaying || onlinePlayer.isPlaying;

      // CREAR NOTIFICACIÓN RICA CON CONTROLES
      const notificationContent = {
        title: 'Groovify',
        body: `${title} - ${artist}`,
        data: { 
          type: 'music',
          isPlaying,
          title,
          artist 
        },
        categoryIdentifier: 'music-controls',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        sticky: true,
        autoDismiss: false,
        channelId: 'music-player',
        // MOSTRAR EN PANTALLA COMPLETA cuando el celular está prendido
        fullScreenAction: {
          identifier: 'full-screen-music',
          title: 'Groovify',
          launchActivityOnFinish: false,
        },
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Mostrar inmediatamente
      });

      setNotificationId(id);
      setIsNotificationVisible(true);
      
      console.log('🎵 [MusicNotification] Notificación de música mostrada (pantalla completa)');
    } catch (error) {
      console.error('Error mostrando notificación de música:', error);
    }
  };

  const hideMusicNotification = async () => {
    try {
      if (notificationId) {
        await Notifications.dismissNotificationAsync(notificationId);
        setNotificationId(null);
      }
      setIsNotificationVisible(false);
      
      console.log('🎵 [MusicNotification] Notificación de música ocultada');
    } catch (error) {
      console.error('Error ocultando notificación de música:', error);
    }
  };

  const updateNotificationContent = async (title: string, artist: string, isPlaying: boolean) => {
    try {
      if (!isNotificationVisible) {
        await showMusicNotification();
        return;
      }

      const notificationContent = {
        title: 'Groovify',
        body: `${title} - ${artist}`,
        data: { 
          type: 'music',
          isPlaying,
          title,
          artist 
        },
        categoryIdentifier: 'music-controls',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        sticky: true,
        autoDismiss: false,
        channelId: 'music-player',
      };

      if (notificationId) {
        await Notifications.dismissNotificationAsync(notificationId);
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null,
      });

      setNotificationId(id);
      
      console.log('🎵 [MusicNotification] Contenido de notificación actualizado');
    } catch (error) {
      console.error('Error actualizando notificación:', error);
    }
  };

  return (
    <MusicNotificationContext.Provider value={{
      isNotificationVisible,
      showMusicNotification,
      hideMusicNotification,
      updateNotificationContent,
    }}>
      {children}
    </MusicNotificationContext.Provider>
  );
}

export function useMusicNotification() {
  const context = useContext(MusicNotificationContext);
  if (!context) {
    throw new Error('useMusicNotification must be used within a MusicNotificationProvider');
  }
  return context;
}
