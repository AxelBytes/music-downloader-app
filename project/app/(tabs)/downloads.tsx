import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MusicDownloader from '@/components/MusicDownloader';

export default function DownloadsScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0033', '#000000']} style={styles.gradient}>
        <MusicDownloader />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
});

