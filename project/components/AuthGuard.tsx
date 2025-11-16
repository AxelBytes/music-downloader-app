import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router, useSegments } from 'expo-router';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  // FORZAR LOGIN SIEMPRE - TEMPORAL
  useEffect(() => {
    console.log('🔐 [AuthGuard] FORZANDO LOGIN - Redirigiendo a auth');
    router.replace('/auth');
  }, []);

  // Mostrar loading mientras redirige
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8b5cf6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
