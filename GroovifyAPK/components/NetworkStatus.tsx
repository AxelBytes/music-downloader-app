import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';

interface NetworkStatusProps {
  isOnline: boolean;
}

export default function NetworkStatus({ isOnline }: NetworkStatusProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowStatus(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowStatus(false);
      });
    }
  }, [isOnline]);

  if (!showStatus) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.statusBar}>
        {isOnline ? (
          <>
            <Wifi size={16} color="#4ade80" />
            <Text style={styles.onlineText}>Conectado</Text>
          </>
        ) : (
          <>
            <WifiOff size={16} color="#ef4444" />
            <Text style={styles.offlineText}>Modo Offline</Text>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  onlineText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
  },
  offlineText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
});
