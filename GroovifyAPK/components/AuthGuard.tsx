import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router, useSegments } from 'expo-router';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!loading) {
      const inAuthGroup = segments[0] === 'auth';
      
      console.log('🔐 [AuthGuard] Verificando autenticación:', {
        user: user ? 'Presente' : 'No presente',
        inAuthGroup,
        segments: segments.join('/')
      });
      
      if (!user && !inAuthGroup) {
        // Usuario no autenticado y no está en auth, redirigir a login
        console.log('🔐 [AuthGuard] Redirigiendo a login');
        router.replace('/auth');
      } else if (user && inAuthGroup) {
        // Usuario autenticado y está en auth, redirigir a app
        console.log('🔐 [AuthGuard] Redirigiendo a app principal');
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
