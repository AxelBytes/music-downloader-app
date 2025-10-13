import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { usePlaylists } from '@/contexts/PlaylistContext';

interface AddToPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  song: any;
}

export default function AddToPlaylistModal({ visible, onClose, song }: AddToPlaylistModalProps) {
  const { playlists, addSongToPlaylist } = usePlaylists();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAddToPlaylist = async (playlistId: string) => {
    setLoading(playlistId);
    try {
      const success = await addSongToPlaylist(playlistId, song);
      if (success) {
        Alert.alert('Éxito', 'Canción agregada a la playlist');
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar la canción');
    } finally {
      setLoading(null);
    }
  };

  const renderPlaylist = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => handleAddToPlaylist(item.id)}
      disabled={loading === item.id}
    >
      <View style={styles.playlistContent}>
        <View style={styles.playlistInfo}>
                <Ionicons name="musical-notes" color="#8b5cf6" size={20} />
          <Text style={styles.playlistName}>{item.name}</Text>
          <Text style={styles.playlistCount}>
            {item.songs.length} {item.songs.length === 1 ? 'canción' : 'canciones'}
          </Text>
        </View>
        {loading === item.id ? (
                <Ionicons name="refresh" color="#06b6d4" size={20} />
        ) : (
                <Ionicons name="add" color="#06b6d4" size={20} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
                <Ionicons name="musical-notes" color="#8b5cf6" size={48} />
      <Text style={styles.emptyTitle}>No tienes playlists</Text>
      <Text style={styles.emptySubtitle}>
        Crea una playlist primero para agregar canciones
      </Text>
    </View>
  );

  if (!song) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Agregar a Playlist</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" color="#fff" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {song.title || song.filename?.replace(/\.(mp3|m4a|webm)$/i, '')}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {song.artist || 'Artista Desconocido'}
            </Text>
          </View>

          <FlatList
            data={playlists}
            renderItem={renderPlaylist}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#999',
  },
  listContent: {
    padding: 20,
  },
  playlistItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
  },
  playlistContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
    marginBottom: 4,
  },
  playlistCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
