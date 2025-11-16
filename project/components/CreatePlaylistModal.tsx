import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { usePlaylists } from '@/contexts/PlaylistContext';

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreatePlaylistModal({ visible, onClose }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { createPlaylist } = usePlaylists();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la playlist es requerido');
      return;
    }

    setLoading(true);
    try {
      const playlist = await createPlaylist(name.trim(), description.trim());
      if (playlist) {
        Alert.alert('Éxito', 'Playlist creada correctamente');
        setName('');
        setDescription('');
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={styles.container}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Nueva Playlist</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" color="#fff" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de la playlist"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descripción opcional"
                  placeholderTextColor="#666"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.createButton, loading && styles.disabledButton]}
                onPress={handleCreate}
                disabled={loading || !name.trim()}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#06b6d4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.createButtonText}>
                    {loading ? 'Creando...' : 'Crear Playlist'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
