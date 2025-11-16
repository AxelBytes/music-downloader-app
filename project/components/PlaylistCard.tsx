import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Playlist } from '@/contexts/PlaylistContext';

interface PlaylistCardProps {
  playlist: Playlist;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PlaylistCard({ playlist, onPress, onEdit, onDelete }: PlaylistCardProps) {
  const songCount = playlist.songs.length;
  const duration = playlist.songs.reduce((total, song) => total + (song.duration || 0), 0);
  
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <BlurView intensity={20} style={styles.card}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.1)', 'rgba(6, 182, 212, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="musical-notes" color="#8b5cf6" size={24} />
            </View>
            <View style={styles.actions}>
              {onEdit && (
                <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                  <Ionicons name="create" color="#06b6d4" size={16} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                  <Ionicons name="trash" color="#ef4444" size={16} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.name} numberOfLines={1}>
              {playlist.name}
            </Text>
            
            {playlist.description && (
              <Text style={styles.description} numberOfLines={2}>
                {playlist.description}
              </Text>
            )}

            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Ionicons name="musical-notes" color="#999" size={14} />
                <Text style={styles.statText}>
                  {songCount} {songCount === 1 ? 'canción' : 'canciones'}
                </Text>
              </View>
              
              {duration > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="time" color="#999" size={14} />
                  <Text style={styles.statText}>
                    {formatDuration(duration)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.date}>
              Creada {new Date(playlist.created_at).toLocaleDateString()}
            </Text>
          </View>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginBottom: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
});