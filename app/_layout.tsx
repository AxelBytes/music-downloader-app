import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@rneui/themed';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import { DownloaderMusicPlayerProvider } from '@/contexts/DownloaderMusicPlayerContext';
import { DownloadsProvider } from '@/contexts/DownloadsContext';
import { PlayCountProvider } from '@/contexts/PlayCountContext';
import { PlaylistProvider } from '@/contexts/PlaylistContext';
import { EqualizerProvider } from '@/contexts/EqualizerContext';
import { RealEqualizerProvider } from '@/contexts/RealEqualizerContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { MusicNotificationProvider } from '@/contexts/MusicNotificationContext';
import { UserDataProvider } from '@/contexts/UserDataContext';
import { PremiumNotificationProvider } from '@/contexts/PremiumNotificationContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import { DriveModeProvider } from '@/contexts/DriveModeContext';
import { LockScreenProvider } from '@/contexts/LockScreenContext';
import { MapOverlayProvider } from '@/contexts/MapOverlayContext';
import { FloatingWindowProvider } from '@/contexts/FloatingWindowContext';
import { premiumTheme } from '@/theme/premiumTheme';
import MiniPlayer from '@/components/MiniPlayer';
import DownloaderMiniPlayer from '@/components/DownloaderMiniPlayer';
import PremiumMusicNotification from '@/components/PremiumMusicNotification';
// import FullScreenMusicNotification from '@/components/FullScreenMusicNotification'; // Desactivado
import SplashScreen from '@/components/SplashScreen';
import { router } from 'expo-router';

// Componente para manejar la navegación después del login
function AppContent() {
  const { user, loading } = useAuth();

  // Mostrar loading simple mientras se carga el auth
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Cargando...</Text>
      </View>
    );
  }

  if (!user) {
    // Si no hay usuario, mostrar solo auth
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
      </Stack>
    );
  }

  // Si hay usuario, mostrar la app completa
  return (
    <>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="download" />
            <Stack.Screen name="search" />
            <Stack.Screen name="playlist/[id]" />
            <Stack.Screen name="most-played" />
            <Stack.Screen name="playlists" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <MiniPlayer />
          <DownloaderMiniPlayer />
          {/* PremiumMusicNotification se renderiza dentro de PremiumNotificationProvider */}
          {/* FullScreenMusicNotification desactivado para evitar overlay no deseado */}
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    console.log('🎬 [RootLayout] SPLASH TERMINADO');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Mostrar la app completa con todos los providers
  return (
    <ThemeProvider theme={premiumTheme}>
      <PremiumNotificationProvider>
        <AuthProvider>
          <PlayCountProvider>
            <EqualizerProvider>
              <RealEqualizerProvider>
                <OfflineProvider>
                  <MusicPlayerProvider>
                    <DownloaderMusicPlayerProvider>
                      <DownloadsProvider>
                        <PlaylistProvider>
                            <NotificationProvider>
                              <MusicNotificationProvider>
                                <UserDataProvider>
                                    <DriveModeProvider>
                                      <LockScreenProvider>
                                        <MapOverlayProvider>
                                          <FloatingWindowProvider>
                                            <AppContent />
                                            <StatusBar style="light" />
                                          </FloatingWindowProvider>
                                        </MapOverlayProvider>
                                      </LockScreenProvider>
                                    </DriveModeProvider>
                                </UserDataProvider>
                              </MusicNotificationProvider>
                            </NotificationProvider>
                        </PlaylistProvider>
                      </DownloadsProvider>
                    </DownloaderMusicPlayerProvider>
                  </MusicPlayerProvider>
                </OfflineProvider>
              </RealEqualizerProvider>
            </EqualizerProvider>
          </PlayCountProvider>
        </AuthProvider>
      </PremiumNotificationProvider>
    </ThemeProvider>
  );
}
