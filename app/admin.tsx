import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ActivationKeyManager, ActivationKey } from '@/lib/activationKeys';
import { Ionicons } from '@expo/vector-icons';

export default function AdminPanel() {
  const [keys, setKeys] = useState<ActivationKey[]>([]);
  const [stats, setStats] = useState({ total: 0, used: 0, available: 0 });
  const [loading, setLoading] = useState(false);
  const [newKeysCount, setNewKeysCount] = useState('5');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [keysData, statsData] = await Promise.all([
        ActivationKeyManager.getAllKeys(),
        ActivationKeyManager.getKeyStats()
      ]);
      
      setKeys(keysData);
      setStats(statsData);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const createNewKeys = async () => {
    const count = parseInt(newKeysCount);
    if (isNaN(count) || count <= 0) {
      Alert.alert('Error', 'Ingresa un número válido de keys');
      return;
    }

    setLoading(true);
    try {
      await ActivationKeyManager.createKeys(count);
      Alert.alert('Éxito', `${count} keys creadas correctamente`);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron crear las keys');
    } finally {
      setLoading(false);
    }
  };

  const copyKey = (key: string) => {
    // En React Native necesitarías usar una librería como @react-native-clipboard/clipboard
    Alert.alert('Key copiada', key);
  };

  return (
    <LinearGradient colors={['#1a0033', '#000000', '#0a0a0a']} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <BlurView intensity={20} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Panel de Administración</Text>
          <Text style={styles.subtitle}>Gestión de Keys de Activación</Text>
        </View>
      </BlurView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.used}</Text>
            <Text style={styles.statLabel}>Usadas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.available}</Text>
            <Text style={styles.statLabel}>Disponibles</Text>
          </View>
        </View>

        {/* Crear nuevas keys */}
        <View style={styles.createSection}>
          <Text style={styles.sectionTitle}>Crear Nuevas Keys</Text>
          <View style={styles.createForm}>
            <TextInput
              style={styles.input}
              placeholder="Cantidad de keys"
              placeholderTextColor="#666"
              value={newKeysCount}
              onChangeText={setNewKeysCount}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.createButton, loading && styles.disabledButton]}
              onPress={createNewKeys}
              disabled={loading}
            >
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creando...' : 'Crear Keys'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de keys */}
        <View style={styles.keysSection}>
          <Text style={styles.sectionTitle}>Keys de Activación</Text>
          {loading ? (
            <Text style={styles.loadingText}>Cargando...</Text>
          ) : (
            keys.map((key) => (
              <View key={key.id} style={styles.keyCard}>
                <View style={styles.keyInfo}>
                  <Text style={styles.keyText}>{key.key}</Text>
                  <View style={styles.keyStatus}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: key.is_used ? '#ef4444' : '#22c55e' }
                    ]} />
                    <Text style={styles.statusText}>
                      {key.is_used ? 'Usada' : 'Disponible'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyKey(key.key)}
                >
                  <Ionicons name="copy" type="feather" color="#06b6d4" size={20} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Botón de actualizar */}
        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <Ionicons name="refresh" color="#fff" size={20} />
          <Text style={styles.refreshText}>Actualizar</Text>
        </TouchableOpacity>
      </ScrollView>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  createSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  createForm: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginRight: 10,
  },
  createButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  keysSection: {
    marginBottom: 20,
  },
  loadingText: {
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  keyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  keyInfo: {
    flex: 1,
  },
  keyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  keyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#999',
    fontSize: 12,
  },
  copyButton: {
    padding: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 30,
  },
  refreshText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
});
