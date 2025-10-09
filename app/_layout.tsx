import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <MusicPlayerProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </MusicPlayerProvider>
    </AuthProvider>
  );
}
