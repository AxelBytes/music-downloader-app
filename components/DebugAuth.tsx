import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSegments } from 'expo-router';

export default function DebugAuth() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    console.log('🐛 [DebugAuth] Estado actual:', {
      user: user ? `ID: ${user.id}, Email: ${user.email}` : 'No user',
      loading,
      segments: segments.join('/'),
      timestamp: new Date().toISOString()
    });
  }, [user, loading, segments]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>🐛 DEBUG AUTH</Text>
      <Text style={styles.text}>User: {user ? 'Presente' : 'No presente'}</Text>
      <Text style={styles.text}>Loading: {loading ? 'Sí' : 'No'}</Text>
      <Text style={styles.text}>Segments: {segments.join('/')}</Text>
      <Text style={styles.text}>Timestamp: {new Date().toLocaleTimeString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 9999,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
});
