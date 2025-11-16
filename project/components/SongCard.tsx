import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Heart, Play, Pause } from 'lucide-react-native';
import { Database } from '@/lib/supabase';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// type Song = Database['public']['Tables']['songs']['Row']; // Tabla no existe
type Song = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  thumbnail_url: string;
  cover_url?: string;
  albumArt?: string;
  duration?: number;
};

type SongCardProps = {
  song: Song;
  isFavorite: boolean;
  onToggleFavorite: (songId: string) => void;
  onPlay: () => void;
};

export default function SongCard({ song, isFavorite, onToggleFavorite, onPlay }: SongCardProps) {
  const { currentSong, isPlaying } = useMusicPlayer();
  const isCurrentSong = currentSong?.id === song.id;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    onPlay();
  };

  return (
    <Animated.View style={[styles.container, animatedStyle, isCurrentSong && styles.activeContainer]}>
      <TouchableOpacity style={styles.content} onPress={handlePress} activeOpacity={0.7}>
        <Image source={{ uri: song.cover_url }} style={styles.cover} />

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {song.artist}
          </Text>
        </View>

        <Text style={styles.duration}>{formatDuration(song.duration || 0)}</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onToggleFavorite(song.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart
            size={24}
            color={isFavorite ? '#ef4444' : '#666'}
            fill={isFavorite ? '#ef4444' : 'transparent'}
          />
        </TouchableOpacity>

        <View style={styles.playButton}>
          {isCurrentSong && isPlaying ? (
            <Pause size={20} color="#fff" fill="#fff" />
          ) : (
            <Play size={20} color="#fff" fill="#fff" />
          )}
        </View>
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
  activeContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: '#999',
  },
  duration: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
