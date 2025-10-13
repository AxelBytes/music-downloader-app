import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Cloud, CloudOff } from 'lucide-react-native';
import { useOffline } from '@/contexts/OfflineContext';

interface NetworkStatusIconProps {
  size?: 'small' | 'medium' | 'large';
}

export default function NetworkStatusIcon({ size = 'small' }: NetworkStatusIconProps) {
  const { isOnline, isOfflineMode } = useOffline();

  const getIconSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'medium': return 32;
      case 'large': return 64;
      default: return 20;
    }
  };

  const iconSize = getIconSize();

  return (
    <View style={[styles.container, size === 'large' && styles.largeContainer]}>
      {isOnline && !isOfflineMode ? (
        <Cloud size={iconSize} color="#10b981" />
      ) : (
        <CloudOff size={iconSize} color="#ef4444" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  largeContainer: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
