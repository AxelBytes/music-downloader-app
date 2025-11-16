/**
 * Media Notifications Helper
 * Maneja notificaciones premium de reproducción de música en el Centro de Control
 */

import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';

interface MediaData {
  title: string;
  artist?: string;
  duration?: number;
  isPlaying?: boolean;
  artwork?: string;
}

export const setupMediaNotifications = async () => {
  try {
    // Configurar el canal de notificaciones para Android
    if (Notifications.getPermissionsAsync !== undefined) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notificaciones no permitidas');
        return;
      }
    }

    // Configurar para que las notificaciones se muestren incluso si la app está en foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      } as any),
    });

    // Crear canal de notificaciones para media (Android 8+)
    // Nota: createChannelAsync está disponible en versiones más nuevas de expo-notifications
    // Por ahora, simplemente lo omitimos
  } catch (error) {
    console.error('Error configurando notificaciones de media:', error);
  }
};

export const showMediaNotification = async (data: MediaData) => {
  try {
    const {
      title,
      artist = 'Desconocido',
      duration = 0,
      isPlaying = false,
    } = data;

    // No mostramos notificaciones in-app, solo dejamos que expo-av maneje el Centro de Control
    // Pero podemos enviar datos para personalización
    console.log('🎵 Media Notification:', {
      title,
      artist,
      duration,
      isPlaying,
    });
  } catch (error) {
    console.error('Error mostrando notificación de media:', error);
  }
};

export const dismissMediaNotification = async () => {
  try {
    // Dimitir todas las notificaciones de media
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error dismissing notification:', error);
  }
};

/**
 * Para mejorar aún más la notificación en el Centro de Control,
 * podemos usar información del sistema (Android/iOS nativo)
 * pero eso requeriría módulos nativos personalizados.
 *
 * La mejor alternativa es mejorar la UI del mini player,
 * que ya hicimos con glassmorphism y gradientes premium.
 */
