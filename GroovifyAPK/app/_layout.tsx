import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@rneui/themed';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import { DownloaderMusicPlayerProvider } from '@/contexts/DownloaderMusicPlayerContext';
import { DownloadsProvider } from '@/contexts/DownloadsContext';
import { PlayCountProvider } from '@/contexts/PlayCountContext';
import { PlaylistProvider } from '@/contexts/PlaylistContext';
import { premiumTheme } from '@/theme/premiumTheme';
import MiniPlayer from '@/components/MiniPlayer';
import DownloaderMiniPlayer from '@/components/DownloaderMiniPlayer';
import SplashScreen from '@/components/SplashScreen';
import AuthGuard from '@/components/AuthGuard';

export default function RootLayout() {
  useFrameworkReady();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <ThemeProvider theme={premiumTheme}>
      <AuthProvider>
        <AuthGuard>
          <PlaylistProvider>
            <PlayCountProvider>
            <MusicPlayerProvider>
              <DownloaderMusicPlayerProvider>
                <DownloadsProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="auth" />
                    <Stack.Screen name="+not-found" />
                    <Stack.Screen name="most-played" />
                    <Stack.Screen name="admin" />
                    <Stack.Screen name="playlists" />
                  </Stack>
                  <MiniPlayer />
                  <DownloaderMiniPlayer />
                  <StatusBar style="light" />
                </DownloadsProvider>
              </DownloaderMusicPlayerProvider>
            </MusicPlayerProvider>
            </PlayCountProvider>
          </PlaylistProvider>
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}
