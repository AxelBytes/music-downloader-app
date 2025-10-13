import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useFloatingWindow } from '@/contexts/FloatingWindowContext';
import { useDriveMode } from '@/contexts/DriveModeContext';
import RealFloatingWindow from './RealFloatingWindow';

interface GlobalFloatingWindowProps {
  visible: boolean;
  onClose: () => void;
}

export default function GlobalFloatingWindow({ visible, onClose }: GlobalFloatingWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { 
    isFloatingWindowEnabled,
    isFloatingWindowVisible,
    hasOverlayPermission,
    showFloatingWindow,
    hideFloatingWindow,
    requestOverlayPermission,
  } = useFloatingWindow();
  
  const { isDriveModeActive } = useDriveMode();

  useEffect(() => {
    if (visible && isDriveModeActive && isFloatingWindowEnabled) {
      if (hasOverlayPermission) {
        showFloatingWindow();
      } else {
        // Solicitar permisos automáticamente
        requestOverlayPermission();
      }
    } else {
      hideFloatingWindow();
    }
  }, [visible, isDriveModeActive, isFloatingWindowEnabled, hasOverlayPermission]);

  const handleClose = () => {
    Alert.alert(
      '🚗 Cerrar Ventana Flotante Global',
      '¿Estás seguro de que quieres cerrar la ventana flotante? Esto la ocultará de todas las aplicaciones.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar',
          style: 'destructive',
          onPress: () => {
            hideFloatingWindow();
            onClose();
          },
        },
      ]
    );
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    console.log('🪟 [GlobalFloatingWindow] Minimizada:', !isMinimized);
  };

  const handleRequestPermission = async () => {
    const granted = await requestOverlayPermission();
    if (granted && isDriveModeActive) {
      showFloatingWindow();
    }
  };

  // Mostrar ventana flotante solo si tiene permisos y está habilitada
  if (!visible || !isDriveModeActive || !isFloatingWindowEnabled) {
    return null;
  }

  // Si no tiene permisos, mostrar mensaje
  if (!hasOverlayPermission) {
    return (
      <View style={styles.permissionContainer}>
        {/* Aquí podrías mostrar un mensaje de permisos */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* VENTANA FLOTANTE REAL que funciona sobre otras apps */}
      <RealFloatingWindow
        visible={isFloatingWindowVisible}
        onClose={handleClose}
      />
      
      {/* Indicador de estado global */}
      {isFloatingWindowVisible && (
        <View style={styles.globalIndicator}>
          {/* Indicador visual de que está activo globalmente */}
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
    zIndex: 99999,
    elevation: 1000,
    pointerEvents: 'box-none', // Permite que los toques pasen a través cuando no hay contenido
  },
  permissionContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 1000,
  },
  globalIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    zIndex: 100000,
    elevation: 1001,
  },
});
