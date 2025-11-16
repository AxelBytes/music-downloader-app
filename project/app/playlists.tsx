import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { usePlaylists } from '@/contexts/PlaylistContext';
import PlaylistCard from '@/components/PlaylistCard';
import CreatePlaylistModal from '@/components/CreatePlaylistModal';

export default function PlaylistsScreen() {
  const { playlists, loading, deletePlaylist } = usePlaylists();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreatePlaylist = () => {
    setShowCreateModal(true);
  };

  const handlePlaylistPress = (playlistId: string) => {
    router.push(`/playlist/${playlistId}`);
  };

  const handleEditPlaylist = (playlistId: string) => {
    // TODO: Implementar edición de playlist
    Alert.alert('Próximamente', 'La edición de playlists estará disponible pronto');
  };

  const handleDeletePlaylist = (playlistId: string, playlistName: string) => {
    Alert.alert(
      'Eliminar Playlist',
      `¿Estás seguro de que quieres eliminar "${playlistName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deletePlaylist(playlistId),
        },
      ]
    );
  };

  const renderPlaylist = ({ item }: { item: any }) => (
    <PlaylistCard
      playlist={item}
      onPress={() => handlePlaylistPress(item.id)}
      onEdit={() => handleEditPlaylist(item.id)}
      onDelete={() => handleDeletePlaylist(item.id, item.name)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
                <Ionicons name="musical-notes" color="#8b5cf6" size={64} />
      <Text style={styles.emptyTitle}>No tienes playlists</Text>
      <Text style={styles.emptySubtitle}>
        Crea tu primera playlist para organizar tu música favorita
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleCreatePlaylist}>
        <LinearGradient
          colors={['#8b5cf6', '#06b6d4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyButtonGradient}
        >
                <Ionicons name="add" color="#fff" size={20} />
          <Text style={styles.emptyButtonText}>Crear Playlist</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#1a0033', '#000000', '#0a0a0a']} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <BlurView intensity={20} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Mis Playlists</Text>
          <TouchableOpacity onPress={handleCreatePlaylist} style={styles.addButton}>
                <Ionicons name="add" color="#fff" size={24} />
          </TouchableOpacity>
        </View>
      </BlurView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando playlists...</Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          renderItem={renderPlaylist}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      <CreatePlaylistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
