import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MusicDownloader from '@/components/MusicDownloader';

export default function DownloadScreen() {
  return (
    <View style={styles.container}>
      <MusicDownloader />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
