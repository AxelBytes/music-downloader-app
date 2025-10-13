import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform, AppState, AppStateStatus, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MapOverlayContextType {
  // Estado
  isGoogleMapsActive: boolean;
  isOverlayVisible: boolean;
  overlayEnabled: boolean;
  
  // Funciones
  showOverlay: () => void;
  hideOverlay: () => void;
  toggleOverlay: () => void;
  setOverlayEnabled: (enabled: boolean) => void;
  
  // Detección
  checkForMapsApp: () => Promise<void>;
  
  // Configuración
  loadOverlaySettings: () => Promise<void>;
  saveOverlaySettings: () => Promise<void>;
}

const MapOverlayContext = createContext<MapOverlayContextType | undefined>(undefined);

interface MapOverlayProviderProps {
  children: ReactNode;
}

export function MapOverlayProvider({ children }: MapOverlayProviderProps) {
  const [isGoogleMapsActive, setIsGoogleMapsActive] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [overlayEnabled, setOverlayEnabled] = useState(true);

  useEffect(() => {
    loadOverlaySettings();
    setupAppStateListener();
    checkForMapsApp();
  }, []);

  const setupAppStateListener = () => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('🗺️ [MapOverlayContext] Estado de la app:', nextAppState);
      
      if (nextAppState === 'active') {
        // Verificar si Google Maps está activo
        checkForMapsApp();
      } else if (nextAppState === 'background') {
        setIsGoogleMapsActive(false);
        setIsOverlayVisible(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  };

  const checkForMapsApp = async () => {
    try {
      // Verificar si Google Maps está instalado
      const googleMapsInstalled = await Linking.canOpenURL('comgooglemaps://');
      const appleMapsInstalled = await Linking.canOpenURL('http://maps.apple.com/');
      
      console.log('🗺️ [MapOverlayContext] Google Maps instalado:', googleMapsInstalled);
      console.log('🗺️ [MapOverlayContext] Apple Maps instalado:', appleMapsInstalled);
      
      // Simular detección de Google Maps activo
      // En una implementación real, esto requeriría permisos especiales
      const mapsActive = googleMapsInstalled || appleMapsInstalled;
      
      if (mapsActive && overlayEnabled) {
        setIsGoogleMapsActive(true);
        setIsOverlayVisible(true);
        console.log('✅ [MapOverlayContext] Google Maps detectado, overlay activado');
      } else {
        setIsGoogleMapsActive(false);
        setIsOverlayVisible(false);
      }
    } catch (error) {
      console.error('❌ [MapOverlayContext] Error verificando Maps:', error);
    }
  };

  const loadOverlaySettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('map_overlay_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setOverlayEnabled(parsed.overlayEnabled ?? true);
        setIsOverlayVisible(parsed.isOverlayVisible ?? false);
      }
    } catch (error) {
      console.error('❌ [MapOverlayContext] Error cargando configuración:', error);
    }
  };

  const saveOverlaySettings = async () => {
    try {
      const settings = {
        overlayEnabled,
        isOverlayVisible,
      };
      await AsyncStorage.setItem('map_overlay_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('❌ [MapOverlayContext] Error guardando configuración:', error);
    }
  };

  const showOverlay = () => {
    if (overlayEnabled) {
      setIsOverlayVisible(true);
      saveOverlaySettings();
      console.log('✅ [MapOverlayContext] Overlay mostrado');
    }
  };

  const hideOverlay = () => {
    setIsOverlayVisible(false);
    saveOverlaySettings();
    console.log('✅ [MapOverlayContext] Overlay ocultado');
  };

  const toggleOverlay = () => {
    if (isOverlayVisible) {
      hideOverlay();
    } else {
      showOverlay();
    }
  };

  const updateOverlayEnabled = (enabled: boolean) => {
    setOverlayEnabled(enabled);
    saveOverlaySettings();
    
    if (!enabled) {
      hideOverlay();
    }
    
    console.log('⚙️ [MapOverlayContext] Overlay habilitado:', enabled);
  };

  const value: MapOverlayContextType = {
    isGoogleMapsActive,
    isOverlayVisible,
    overlayEnabled,
    showOverlay,
    hideOverlay,
    toggleOverlay,
    setOverlayEnabled: updateOverlayEnabled,
    checkForMapsApp,
    loadOverlaySettings,
    saveOverlaySettings,
  };

  return (
    <MapOverlayContext.Provider value={value}>
      {children}
    </MapOverlayContext.Provider>
  );
}

export function useMapOverlay() {
  const context = useContext(MapOverlayContext);
  if (context === undefined) {
    throw new Error('useMapOverlay must be used within a MapOverlayProvider');
  }
  return context;
}
