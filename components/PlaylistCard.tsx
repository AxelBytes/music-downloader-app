import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Music, Trash2, Heart } from 'lucide-react-native';
import { Database } from '@/lib/supabase';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

type Playlist = Database['public']['Tables']['playlists']['Row'];

type PlaylistCardProps = {
  playlist: Playlist;
  onDelete: (playlistId: string) => void;
};

export default function PlaylistCard({ playlist, onDelete }: PlaylistCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    router.push(`/playlist/${playlist.id}`);
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity style={styles.content} onPress={handlePress} activeOpacity={0.7}>
        <View style={[styles.icon, playlist.is_favorite_playlist && styles.favoriteIcon]}>
          {playlist.is_favorite_playlist ? (
            <Heart size={32} color="#ef4444" fill="#ef4444" />
          ) : (
            <Music size={32} color="#8b5cf6" />
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {playlist.name}
          </Text>
          {playlist.description && (
            <Text style={styles.description} numberOfLines={2}>
              {playlist.description}
            </Text>
          )}
        </View>

        {!playlist.is_favorite_playlist && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(playlist.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  favoriteIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
});
