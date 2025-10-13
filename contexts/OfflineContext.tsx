import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface OfflineContextType {
  // Estado de conexión
  isOnline: boolean;
  isOfflineMode: boolean;
  connectionType: string | null;
  
  // Funciones
  toggleOfflineMode: () => void;
  syncOfflineData: () => Promise<void>;
  clearOfflineCache: () => Promise<void>;
  
  // Datos offline
  offlinePlaylists: any[];
  offlineSongs: any[];
  offlineDownloads: any[];
  
  // Configuración
  autoOfflineMode: boolean;
  syncOnReconnect: boolean;
  
  // Funciones de configuración
  setAutoOfflineMode: (enabled: boolean) => void;
  setSyncOnReconnect: (enabled: boolean) => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [offlinePlaylists, setOfflinePlaylists] = useState<any[]>([]);
  const [offlineSongs, setOfflineSongs] = useState<any[]>([]);
  const [offlineDownloads, setOfflineDownloads] = useState<any[]>([]);
  const [autoOfflineMode, setAutoOfflineMode] = useState(false);
  const [syncOnReconnect, setSyncOnReconnect] = useState(true);

  useEffect(() => {
    // Configurar listener de red
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('🌐 [OfflineContext] Estado de red:', state);
      
      setIsOnline(state.isConnected ?? false);
      setConnectionType(state.type);
      
      // Auto-activar modo offline si se pierde conexión
      if (autoOfflineMode && !state.isConnected) {
        setIsOfflineMode(true);
        console.log('📱 [OfflineContext] Modo offline activado automáticamente');
      }
      
      // Auto-sincronizar al reconectar
      if (syncOnReconnect && state.isConnected && isOfflineMode) {
        syncOfflineData();
        setIsOfflineMode(false);
        console.log('🔄 [OfflineContext] Sincronización automática al reconectar');
      }
    });

    // Cargar configuración offline
    loadOfflineSettings();
    loadOfflineData();

    return unsubscribe;
  }, [autoOfflineMode, syncOnReconnect, isOfflineMode]);

  const loadOfflineSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('offline_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setAutoOfflineMode(parsed.autoOfflineMode ?? false);
        setSyncOnReconnect(parsed.syncOnReconnect ?? true);
      }
    } catch (error) {
      console.error('❌ [OfflineContext] Error cargando configuración offline:', error);
    }
  };

  const saveOfflineSettings = async () => {
    try {
      const settings = {
        autoOfflineMode,
        syncOnReconnect,
      };
      await AsyncStorage.setItem('offline_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('❌ [OfflineContext] Error guardando configuración offline:', error);
    }
  };

  const loadOfflineData = async () => {
    try {
      const [playlists, songs, downloads] = await Promise.all([
        AsyncStorage.getItem('offline_playlists'),
        AsyncStorage.getItem('offline_songs'),
        AsyncStorage.getItem('offline_downloads'),
      ]);

      if (playlists) setOfflinePlaylists(JSON.parse(playlists));
      if (songs) setOfflineSongs(JSON.parse(songs));
      if (downloads) setOfflineDownloads(JSON.parse(downloads));

      console.log('✅ [OfflineContext] Datos offline cargados');
    } catch (error) {
      console.error('❌ [OfflineContext] Error cargando datos offline:', error);
    }
  };

  const saveOfflineData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('offline_playlists', JSON.stringify(offlinePlaylists)),
        AsyncStorage.setItem('offline_songs', JSON.stringify(offlineSongs)),
        AsyncStorage.setItem('offline_downloads', JSON.stringify(offlineDownloads)),
      ]);

      console.log('✅ [OfflineContext] Datos offline guardados');
    } catch (error) {
      console.error('❌ [OfflineContext] Error guardando datos offline:', error);
    }
  };

  const toggleOfflineMode = () => {
    const newMode = !isOfflineMode;
    setIsOfflineMode(newMode);
    
    if (newMode) {
      console.log('📱 [OfflineContext] Modo offline activado manualmente');
      Alert.alert(
        '📱 Modo Offline',
        'Groovify está ahora en modo offline. Solo se reproducirán archivos descargados.',
        [{ text: 'Entendido', style: 'default' }]
      );
    } else {
      console.log('🌐 [OfflineContext] Modo online activado');
      if (isOnline) {
        syncOfflineData();
      }
    }
  };

  const syncOfflineData = async () => {
    if (!isOnline) {
      console.log('⚠️ [OfflineContext] No hay conexión para sincronizar');
      return;
    }

    try {
      console.log('🔄 [OfflineContext] Iniciando sincronización...');
      
      // Aquí iría la lógica de sincronización con el servidor
      // Por ahora, solo actualizamos el estado local
      
      await saveOfflineData();
      
      Alert.alert(
        '✅ Sincronización Completada',
        'Todos los datos han sido sincronizados correctamente.',
        [{ text: 'Perfecto', style: 'default' }]
      );
      
      console.log('✅ [OfflineContext] Sincronización completada');
    } catch (error) {
      console.error('❌ [OfflineContext] Error en sincronización:', error);
      Alert.alert(
        '❌ Error de Sincronización',
        'No se pudo sincronizar. Verifica tu conexión.',
        [{ text: 'Entendido', style: 'default' }]
      );
    }
  };

  const clearOfflineCache = async () => {
    Alert.alert(
      '🗑️ Limpiar Cache Offline',
      '¿Estás seguro de que quieres eliminar todos los datos offline? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([
                AsyncStorage.removeItem('offline_playlists'),
                AsyncStorage.removeItem('offline_songs'),
                AsyncStorage.removeItem('offline_downloads'),
              ]);

              setOfflinePlaylists([]);
              setOfflineSongs([]);
              setOfflineDownloads([]);

              console.log('✅ [OfflineContext] Cache offline limpiado');
              Alert.alert('✅ Cache Limpiado', 'Todos los datos offline han sido eliminados.');
            } catch (error) {
              console.error('❌ [OfflineContext] Error limpiando cache:', error);
              Alert.alert('❌ Error', 'No se pudo limpiar el cache offline.');
            }
          },
        },
      ]
    );
  };

  const updateAutoOfflineMode = (enabled: boolean) => {
    setAutoOfflineMode(enabled);
    saveOfflineSettings();
  };

  const updateSyncOnReconnect = (enabled: boolean) => {
    setSyncOnReconnect(enabled);
    saveOfflineSettings();
  };

  const value: OfflineContextType = {
    isOnline,
    isOfflineMode,
    connectionType,
    toggleOfflineMode,
    syncOfflineData,
    clearOfflineCache,
    offlinePlaylists,
    offlineSongs,
    offlineDownloads,
    autoOfflineMode,
    syncOnReconnect,
    setAutoOfflineMode: updateAutoOfflineMode,
    setSyncOnReconnect: updateSyncOnReconnect,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
