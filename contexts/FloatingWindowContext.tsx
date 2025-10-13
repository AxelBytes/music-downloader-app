import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform, Alert, Linking, PermissionsAndroid, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDriveMode } from './DriveModeContext';

interface FloatingWindowContextType {
  // Estado
  isFloatingWindowEnabled: boolean;
  isFloatingWindowVisible: boolean;
  hasOverlayPermission: boolean;
  
  // Funciones
  requestOverlayPermission: () => Promise<boolean>;
  showFloatingWindow: () => void;
  hideFloatingWindow: () => void;
  toggleFloatingWindow: () => void;
  setFloatingWindowEnabled: (enabled: boolean) => void;
  
  // Configuración
  loadFloatingWindowSettings: () => Promise<void>;
  saveFloatingWindowSettings: () => Promise<void>;
  
  // Estado del sistema
  isSystemOverlayActive: boolean;
  canDrawOverlays: boolean;
}

const FloatingWindowContext = createContext<FloatingWindowContextType | undefined>(undefined);

interface FloatingWindowProviderProps {
  children: ReactNode;
}

export function FloatingWindowProvider({ children }: FloatingWindowProviderProps) {
  const [isFloatingWindowEnabled, setIsFloatingWindowEnabled] = useState(true);
  const [isFloatingWindowVisible, setIsFloatingWindowVisible] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [isSystemOverlayActive, setIsSystemOverlayActive] = useState(false);
  const [canDrawOverlays, setCanDrawOverlays] = useState(false);
  
  const { isDriveModeActive } = useDriveMode();

  useEffect(() => {
    loadFloatingWindowSettings();
    checkOverlayPermission();
    setupDriveModeListener();
  }, []);

  useEffect(() => {
    // Mostrar ventana flotante cuando se active el modo drive
    if (isDriveModeActive && isFloatingWindowEnabled && hasOverlayPermission) {
      showFloatingWindow();
    } else {
      hideFloatingWindow();
    }
  }, [isDriveModeActive, isFloatingWindowEnabled, hasOverlayPermission]);

  const setupDriveModeListener = () => {
    // Listener para cambios en el modo drive
    console.log('🚗 [FloatingWindowContext] Configurando listener de modo drive');
  };

  const checkOverlayPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        // Verificar si tiene permisos de overlay
        // const hasPermission = await PermissionsAndroid.check(
        //   PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW // No está disponible
        // );
        const hasPermission = false; // Temporal
        
        setHasOverlayPermission(hasPermission);
        setCanDrawOverlays(hasPermission);
        
        console.log('🔐 [FloatingWindowContext] Permisos de overlay:', hasPermission);
        
        if (!hasPermission) {
          console.log('⚠️ [FloatingWindowContext] Permisos de overlay no concedidos');
        }
      } else {
        // iOS no necesita permisos especiales para overlay
        setHasOverlayPermission(true);
        setCanDrawOverlays(true);
      }
    } catch (error) {
      console.error('❌ [FloatingWindowContext] Error verificando permisos:', error);
      setHasOverlayPermission(false);
      setCanDrawOverlays(false);
    }
  };

  const requestOverlayPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        // Solicitar permiso de overlay
        // Temporalmente deshabilitado hasta que esté disponible
        const granted = PermissionsAndroid.RESULTS.DENIED;

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasOverlayPermission(true);
          setCanDrawOverlays(true);
          console.log('✅ [FloatingWindowContext] Permisos de overlay concedidos');
          
          Alert.alert(
            '✅ Permiso Concedido',
            'Ahora Groovify puede mostrar la ventana flotante sobre otras aplicaciones durante el modo drive.',
            [{ text: 'Perfecto', style: 'default' }]
          );
          
          return true;
        } else {
          setHasOverlayPermission(false);
          setCanDrawOverlays(false);
          console.log('❌ [FloatingWindowContext] Permisos de overlay denegados');
          
          Alert.alert(
            '❌ Permiso Denegado',
            'Sin este permiso, la ventana flotante no funcionará. Puedes activarlo manualmente en Configuración > Aplicaciones > Groovify > Permisos especiales > Mostrar sobre otras aplicaciones.',
            [
              { text: 'Entendido', style: 'default' },
              { 
                text: 'Abrir Configuración', 
                onPress: () => {
                  // Abrir configuración de Android
                  Linking.openSettings();
                }
              }
            ]
          );
          
          return false;
        }
      } else {
        // iOS no necesita permisos especiales
        setHasOverlayPermission(true);
        setCanDrawOverlays(true);
        return true;
      }
    } catch (error) {
      console.error('❌ [FloatingWindowContext] Error solicitando permisos:', error);
      setHasOverlayPermission(false);
      setCanDrawOverlays(false);
      return false;
    }
  };

  const loadFloatingWindowSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('floating_window_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setIsFloatingWindowEnabled(parsed.isFloatingWindowEnabled ?? true);
        setIsFloatingWindowVisible(parsed.isFloatingWindowVisible ?? false);
      }
    } catch (error) {
      console.error('❌ [FloatingWindowContext] Error cargando configuración:', error);
    }
  };

  const saveFloatingWindowSettings = async () => {
    try {
      const settings = {
        isFloatingWindowEnabled,
        isFloatingWindowVisible,
      };
      await AsyncStorage.setItem('floating_window_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('❌ [FloatingWindowContext] Error guardando configuración:', error);
    }
  };

  const showFloatingWindow = () => {
    if (!hasOverlayPermission) {
      Alert.alert(
        '🔐 Permisos Requeridos',
        'Groovify necesita permisos para mostrar la ventana flotante sobre otras aplicaciones. ¿Quieres conceder este permiso?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Conceder',
            onPress: () => requestOverlayPermission(),
          },
        ]
      );
      return;
    }

    if (isFloatingWindowEnabled) {
      setIsFloatingWindowVisible(true);
      setIsSystemOverlayActive(true);
      saveFloatingWindowSettings();
      console.log('✅ [FloatingWindowContext] Ventana flotante mostrada globalmente');
    }
  };

  const hideFloatingWindow = () => {
    setIsFloatingWindowVisible(false);
    setIsSystemOverlayActive(false);
    saveFloatingWindowSettings();
    console.log('✅ [FloatingWindowContext] Ventana flotante ocultada');
  };

  const toggleFloatingWindow = () => {
    if (isFloatingWindowVisible) {
      hideFloatingWindow();
    } else {
      showFloatingWindow();
    }
  };

  const updateFloatingWindowEnabled = (enabled: boolean) => {
    setIsFloatingWindowEnabled(enabled);
    saveFloatingWindowSettings();
    
    if (!enabled) {
      hideFloatingWindow();
    }
    
    console.log('⚙️ [FloatingWindowContext] Ventana flotante habilitada:', enabled);
  };

  const value: FloatingWindowContextType = {
    isFloatingWindowEnabled,
    isFloatingWindowVisible,
    hasOverlayPermission,
    requestOverlayPermission,
    showFloatingWindow,
    hideFloatingWindow,
    toggleFloatingWindow,
    setFloatingWindowEnabled: updateFloatingWindowEnabled,
    loadFloatingWindowSettings,
    saveFloatingWindowSettings,
    isSystemOverlayActive,
    canDrawOverlays,
  };

  return (
    <FloatingWindowContext.Provider value={value}>
      {children}
    </FloatingWindowContext.Provider>
  );
}

export function useFloatingWindow() {
  const context = useContext(FloatingWindowContext);
  if (context === undefined) {
    throw new Error('useFloatingWindow must be used within a FloatingWindowProvider');
  }
  return context;
}
