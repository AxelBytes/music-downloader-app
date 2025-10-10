import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@rneui/themed';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import { DownloaderMusicPlayerProvider } from '@/contexts/DownloaderMusicPlayerContext';
import { DownloadsProvider } from '@/contexts/DownloadsContext';
import { PlayCountProvider } from '@/contexts/PlayCountContext';
import { premiumTheme } from '@/theme/premiumTheme';
import MiniPlayer from '@/components/MiniPlayer';
import DownloaderMiniPlayer from '@/components/DownloaderMiniPlayer';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ThemeProvider theme={premiumTheme}>
      <AuthProvider>
        <PlayCountProvider>
          <MusicPlayerProvider>
            <DownloaderMusicPlayerProvider>
              <DownloadsProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <MiniPlayer />
                <DownloaderMiniPlayer />
                <StatusBar style="light" />
              </DownloadsProvider>
            </DownloaderMusicPlayerProvider>
          </MusicPlayerProvider>
        </PlayCountProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
