import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Card, Button, Icon, Avatar, Badge } from '@rneui/themed';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  FadeInDown,
  FadeInRight,
  SlideInUp
} from 'react-native-reanimated';
import { User, Music, Heart, LogOut, Settings, Bell, Crown, Star } from 'lucide-react-native';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDownloads } from '@/contexts/DownloadsContext';
import { useEqualizer } from '@/contexts/EqualizerContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useOffline } from '@/contexts/OfflineContext';
import { useDriveMode } from '@/contexts/DriveModeContext';
import { useLockScreen } from '@/contexts/LockScreenContext';
import { useMapOverlay } from '@/contexts/MapOverlayContext';
import { useFloatingWindow } from '@/contexts/FloatingWindowContext';
import { useUserData } from '@/contexts/UserDataContext';
import { router } from 'expo-router';
import { PremiumGlassCard, PremiumButton } from '@/components/PremiumComponents';

type Profile = Database['public']['Tables']['users']['Row'];

export default function PremiumProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ playlists: 0, favorites: 0 });
  const [loading, setLoading] = useState(true);

  const { user, signOut } = useAuth();
  const { downloadedFiles } = useDownloads();
  const { selectedPreset } = useEqualizer();
  const { 
    notificationsEnabled, 
    playbackNotificationsEnabled, 
    driveModeNotificationsEnabled,
    toggleNotifications,
    togglePlaybackNotifications,
    toggleDriveModeNotifications 
  } = useNotifications();
  const {
    isOfflineMode,
    autoOfflineMode,
    syncOnReconnect,
    isOnline,
    toggleOfflineMode,
    setAutoOfflineMode,
    setSyncOnReconnect
  } = useOffline();
  const { 
    isDriveModeEnabled, 
    autoActivateOnBluetooth, 
    voiceCommandsEnabled,
    setAutoActivateOnBluetooth,
    setVoiceCommandsEnabled 
  } = useDriveMode();
  const { 
    lockScreenNotificationsEnabled,
    floatingWindowVisible,
    setLockScreenNotificationsEnabled,
    toggleFloatingWindow 
  } = useLockScreen();
  const { 
    overlayEnabled,
    isGoogleMapsActive,
    setOverlayEnabled 
  } = useMapOverlay();
  const { 
    isFloatingWindowEnabled,
    hasOverlayPermission,
    requestOverlayPermission,
    setFloatingWindowEnabled 
  } = useFloatingWindow();
  const { 
    savedUserData, 
    clearUserData, 
    hasSavedData 
  } = useUserData();

  useEffect(() => {
    loadData();
  }, [downloadedFiles]);

  const loadData = async () => {
    if (!user) return;

    try {
      console.log('👤 [Profile] Cargando datos del usuario:', user.id);
      
      // Cargar playlists del usuario desde user_playlists
      const playlistsResult = await supabase
        .from('user_playlists')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      // Usar los archivos descargados del contexto
      const downloadCount = downloadedFiles ? downloadedFiles.length : 0;
      
      console.log('📥 [Profile] Archivos descargados del contexto:', downloadCount);
      
      console.log('📊 [Profile] Estadísticas cargadas:', {
        playlists: playlistsResult.count || 0,
        downloads: downloadCount,
      });

      setStats({
        playlists: playlistsResult.count || 0,
        favorites: downloadCount, // Usamos downloads como "descargas"
      });
    } catch (error) {
      console.error('❌ [Profile] Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log('🔐 [Profile] Iniciando cierre de sesión...');
    await signOut();
    console.log('🔐 [Profile] Sesión cerrada, redirigiendo a auth...');
    router.replace('/auth');
  };

  const handleNotificationsSettings = () => {
    Alert.alert(
      '🔔 Configuración de Notificaciones',
      `Estado actual: ${notificationsEnabled ? 'Activadas' : 'Desactivadas'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: notificationsEnabled ? 'Desactivar Notificaciones' : 'Activar Notificaciones', 
          onPress: () => {
            toggleNotifications();
            Alert.alert(
              notificationsEnabled ? '🔕 Notificaciones Desactivadas' : '🔔 Notificaciones Activadas', 
              notificationsEnabled ? 'Ya no recibirás notificaciones de la app' : 'Recibirás notificaciones sobre reproducción y descargas'
            );
          }
        },
        { 
          text: 'Notificaciones de Reproducción', 
          onPress: () => {
            togglePlaybackNotifications();
            Alert.alert(
              playbackNotificationsEnabled ? '⏸️ Notificaciones de Reproducción Desactivadas' : '▶️ Notificaciones de Reproducción Activadas',
              playbackNotificationsEnabled ? 'No verás notificaciones cuando cambie la canción' : 'Verás notificaciones cuando cambie la canción'
            );
          }
        },
        { 
          text: 'Notificaciones de Modo Drive', 
          onPress: () => {
            toggleDriveModeNotifications();
            Alert.alert(
              driveModeNotificationsEnabled ? '🚗 Notificaciones de Drive Desactivadas' : '🚗 Notificaciones de Drive Activadas',
              driveModeNotificationsEnabled ? 'No recibirás notificaciones del modo drive' : 'Recibirás notificaciones cuando se active el modo drive'
            );
          }
        }
      ]
    );
  };

  const handlePlaybackSettings = () => {
    Alert.alert(
      '🎵 Configuración de Reproducción',
      'Ajusta la calidad y comportamiento del reproductor',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Calidad Alta', onPress: () => {
          Alert.alert('🎧 Calidad Alta', 'La música se reproducirá en la mejor calidad disponible');
        }},
        { text: 'Reproducción Continua', onPress: () => {
          Alert.alert('🔄 Reproducción Continua', 'La música continuará automáticamente entre playlists');
        }},
        { text: `Ecualizador (${selectedPreset})`, onPress: () => {
          // Abrir el ecualizador desde el reproductor
          Alert.alert(
            '🎛️ Ecualizador',
            `Preset actual: ${selectedPreset}\n\nPara ajustar el ecualizador, ve al reproductor de música y toca el botón de ecualizador.`,
            [
              { text: 'Entendido', style: 'default' },
              { text: 'Ir al Reproductor', onPress: () => {
                // Navegar a la pantalla de música
                router.push('/(tabs)');
              }}
            ]
          );
        }}
      ]
    );
  };

  const handlePremiumSettings = () => {
    Alert.alert(
      '⭐ Funciones Premium',
      'Desbloquea funciones avanzadas de Groovify',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descarga Ilimitada', onPress: () => {
          Alert.alert('📥 Descarga Ilimitada', 'Con Premium puedes descargar música sin límites');
        }},
        { text: 'Calidad Ultra HD', onPress: () => {
          Alert.alert('🎧 Calidad Ultra HD', 'Disfruta de la música en calidad Ultra HD');
        }},
        { text: 'Sin Anuncios', onPress: () => {
          Alert.alert('🚫 Sin Anuncios', 'Experiencia completamente libre de anuncios');
        }},
        { text: 'Más Información', onPress: () => {
          Alert.alert('ℹ️ Premium', 'Las funciones Premium estarán disponibles próximamente. ¡Mantente atento!');
        }}
      ]
    );
  };

  const handleMyPlaylists = () => {
    Alert.alert(
      '📋 Mis Playlists',
      'Gestiona tus playlists personales',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ver Todas', onPress: () => {
          router.push('/playlists');
        }},
        { text: 'Crear Nueva', onPress: () => {
          router.push('/library');
        }},
        { text: 'Estadísticas', onPress: () => {
          Alert.alert('📊 Estadísticas', `Tienes ${stats.playlists} playlists creadas`);
        }}
      ]
    );
  };

  const handleClearSavedData = () => {
    Alert.alert(
      '🗑️ Limpiar Datos Guardados',
      '¿Estás seguro de que quieres eliminar la información de login guardada? Esto hará que tengas que volver a ingresar tus datos la próxima vez.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            clearUserData();
          }
        }
      ]
    );
  };

  const handleOfflineSettings = () => {
    Alert.alert(
      '📱 Configuración Offline',
      `Estado de red: ${isOnline ? 'Conectado' : 'Desconectado'}\nModo offline: ${isOfflineMode ? 'Activado' : 'Desactivado'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: isOfflineMode ? 'Desactivar Modo Offline' : 'Activar Modo Offline', 
          onPress: () => {
            toggleOfflineMode();
          }
        },
        { 
          text: `Auto-activar al perder conexión: ${autoOfflineMode ? 'ON' : 'OFF'}`, 
          onPress: () => {
            setAutoOfflineMode(!autoOfflineMode);
            Alert.alert(
              '📱 Auto-activación Offline',
              !autoOfflineMode ? 'El modo offline se activará automáticamente cuando pierdas conexión' : 'El modo offline no se activará automáticamente'
            );
          }
        },
        { 
          text: `Sincronizar al reconectar: ${syncOnReconnect ? 'ON' : 'OFF'}`, 
          onPress: () => {
            setSyncOnReconnect(!syncOnReconnect);
            Alert.alert(
              '🔄 Sincronización Automática',
              !syncOnReconnect ? 'Los datos se sincronizarán automáticamente al reconectar' : 'Los datos no se sincronizarán automáticamente'
            );
          }
        }
      ]
    );
  };

  const handleDriveModeSettings = () => {
    Alert.alert(
      '🚗 Configuración de Modo Drive Avanzado',
      `Modo drive: ${isDriveModeEnabled ? 'Habilitado' : 'Deshabilitado'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: isDriveModeEnabled ? 'Deshabilitar Modo Drive' : 'Habilitar Modo Drive', 
          onPress: () => {
            Alert.alert(
              '🚗 Modo Drive',
              isDriveModeEnabled ? 'Modo drive deshabilitado' : 'Modo drive habilitado'
            );
          }
        },
        { 
          text: `Auto-activar con Bluetooth: ${autoActivateOnBluetooth ? 'ON' : 'OFF'}`, 
          onPress: () => {
            setAutoActivateOnBluetooth(!autoActivateOnBluetooth);
            Alert.alert(
              '🔵 Auto-activación Bluetooth',
              !autoActivateOnBluetooth ? 'El modo drive se activará automáticamente al conectar Bluetooth del auto' : 'El modo drive no se activará automáticamente con Bluetooth'
            );
          }
        },
        { 
          text: `Comandos de voz: ${voiceCommandsEnabled ? 'ON' : 'OFF'}`, 
          onPress: () => {
            setVoiceCommandsEnabled(!voiceCommandsEnabled);
            Alert.alert(
              '🎤 Comandos de Voz',
              voiceCommandsEnabled ? 'Los comandos de voz están habilitados para el modo drive' : 'Los comandos de voz están deshabilitados'
            );
          }
        },
        { 
          text: `Notificaciones de pantalla de bloqueo: ${lockScreenNotificationsEnabled ? 'ON' : 'OFF'}`, 
          onPress: () => {
            setLockScreenNotificationsEnabled(!lockScreenNotificationsEnabled);
            Alert.alert(
              '🔒 Notificaciones de Pantalla de Bloqueo',
              lockScreenNotificationsEnabled ? 'Las notificaciones aparecerán en la pantalla de bloqueo durante el modo drive' : 'Las notificaciones no aparecerán en la pantalla de bloqueo'
            );
          }
        },
        { 
          text: `Ventana flotante global: ${isFloatingWindowEnabled ? 'ON' : 'OFF'}`, 
          onPress: () => {
            setFloatingWindowEnabled(!isFloatingWindowEnabled);
            Alert.alert(
              '🪟 Ventana Flotante Global',
              isFloatingWindowEnabled ? 'La ventana flotante aparecerá sobre cualquier aplicación durante el modo drive' : 'La ventana flotante está deshabilitada'
            );
          }
        },
        { 
          text: `Permisos de overlay: ${hasOverlayPermission ? '✅ Concedidos' : '❌ No concedidos'}`, 
          onPress: async () => {
            if (!hasOverlayPermission) {
              const granted = await requestOverlayPermission();
              if (granted) {
                Alert.alert('✅ Permisos Concedidos', 'Ahora la ventana flotante funcionará sobre todas las aplicaciones');
              }
            } else {
              Alert.alert('✅ Permisos Concedidos', 'La ventana flotante puede aparecer sobre cualquier aplicación');
            }
          }
        },
        { 
          text: `Overlay en Google Maps: ${overlayEnabled ? 'ON' : 'OFF'}`, 
          onPress: () => {
            setOverlayEnabled(!overlayEnabled);
            Alert.alert(
              '🗺️ Overlay en Google Maps',
              overlayEnabled ? 'El overlay aparecerá cuando uses Google Maps durante el modo drive' : 'El overlay no aparecerá en Google Maps'
            );
          }
        }
      ]
    );
  };


  const renderPremiumStatCard = ({ icon, value, label, colors }: { 
    icon: string; 
    value: number; 
    label: string; 
    colors: [string, string, ...string[]];
  }) => (
    <Animated.View entering={FadeInRight.delay(Math.random() * 200)} style={styles.statCardContainer}>
      <PremiumGlassCard style={styles.statCard}>
        <LinearGradient
          colors={colors}
          style={styles.statCardGradient}
        >
          <View style={styles.statContent}>
            <Icon name={icon} type="feather" color="#fff" size={32} />
            <Text style={styles.statNumber}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        </LinearGradient>
      </PremiumGlassCard>
    </Animated.View>
  );

  const renderPremiumActionCard = ({ 
    title, 
    subtitle, 
    icon, 
    colors, 
    onPress 
  }: { 
    title: string, 
    subtitle: string, 
    icon: string, 
    colors: [string, string, ...string[]], 
    onPress: () => void 
  }) => (
    <Animated.View entering={FadeInRight.delay(Math.random() * 200)} style={styles.actionCardContainer}>
      <PremiumGlassCard style={styles.actionCard} onPress={onPress}>
        <View style={styles.actionContent}>
          <LinearGradient
            colors={colors}
            style={styles.actionIcon}
          >
            <Icon name={icon} type="feather" color="#fff" size={24} />
          </LinearGradient>
          
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionSubtitle}>{subtitle}</Text>
          </View>
          
          <Icon name="chevron-right" type="feather" color="#666" size={20} />
        </View>
      </PremiumGlassCard>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#1a0033', '#000000']} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0033', '#000000']} style={styles.gradient}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Premium */}
          <Animated.View entering={FadeInDown} style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Perfil</Text>
              <TouchableOpacity style={styles.settingsButton}>
                <LinearGradient
                  colors={['#8b5cf6', '#06b6d4']}
                  style={styles.settingsButtonGradient}
                >
                  <Icon name="settings" type="feather" color="#fff" size={20} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Profile Card Premium */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.profileSection}>
            <PremiumGlassCard style={styles.profileCard}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(6, 182, 212, 0.1)']}
                style={styles.profileGradient}
              >
                <View style={styles.profileContent}>
                  <View style={styles.avatarContainer}>
                    <LinearGradient
                      colors={['#8b5cf6', '#06b6d4']}
                      style={styles.avatarGradient}
                    >
                      <Avatar
                        size={80}
                        rounded
                        source={{ uri: user?.user_metadata?.avatar_url || undefined }}
                        containerStyle={styles.avatar}
                      >
                        <Icon name="user" type="feather" color="#fff" size={40} />
                      </Avatar>
                    </LinearGradient>
                  </View>

                  <Text style={styles.displayName}>
                    {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Usuario'}
                  </Text>
                  <Text style={styles.email}>{user?.email}</Text>

                  {/* Premium Badge */}
                  <View style={styles.premiumBadge}>
                    <LinearGradient
                      colors={['#f59e0b', '#ef4444']}
                      style={styles.premiumBadgeGradient}
                    >
                      <Crown size={16} color="#fff" />
                      <Text style={styles.premiumBadgeText}>Plan: Premium</Text>
                    </LinearGradient>
                  </View>
                </View>
              </LinearGradient>
            </PremiumGlassCard>
          </Animated.View>

          {/* Stats Premium */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Estadísticas</Text>
            <View style={styles.statsGrid}>
              {renderPremiumStatCard({
                icon: 'music',
                value: stats.playlists,
                label: 'Playlists',
                colors: ['#8b5cf6', '#06b6d4']
              })}
              {renderPremiumStatCard({
                icon: 'download',
                value: stats.favorites,
                label: 'Descargas',
                colors: ['#06b6d4', '#10b981']
              })}
            </View>
          </Animated.View>

          {/* Actions Premium */}
          <Animated.View entering={FadeInDown.delay(600)} style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Configuración</Text>
            
            {renderPremiumActionCard({
              title: 'Notificaciones',
              subtitle: 'Gestiona tus notificaciones',
              icon: 'bell',
              colors: ['#8b5cf6', '#06b6d4'],
              onPress: handleNotificationsSettings
            })}
            
            {renderPremiumActionCard({
              title: 'Reproducción',
              subtitle: 'Configuración de audio',
              icon: 'music',
              colors: ['#06b6d4', '#10b981'],
              onPress: handlePlaybackSettings
            })}
            
            {renderPremiumActionCard({
              title: 'Calidad Premium',
              subtitle: 'Activar funciones premium',
              icon: 'star',
              colors: ['#f59e0b', '#ef4444'],
              onPress: handlePremiumSettings
            })}
            
                    {renderPremiumActionCard({
                      title: 'Mis Playlists',
                      subtitle: 'Gestionar mis playlists',
                      icon: 'music',
                      colors: ['#10b981', '#06b6d4'],
                      onPress: handleMyPlaylists
                    })}

                    {renderPremiumActionCard({
                      title: 'Modo Offline',
                      subtitle: 'Configuración para uso sin internet',
                      icon: 'wifi-off',
                      colors: ['#f59e0b', '#ef4444'],
                      onPress: handleOfflineSettings
                    })}

                    {renderPremiumActionCard({
                      title: 'Notificaciones de Música',
                      subtitle: 'Control de notificaciones en pantalla completa',
                      icon: 'music',
                      colors: ['#8b5cf6', '#06b6d4'],
                      onPress: () => {
                        Alert.alert(
                          '🎵 Notificaciones de Música',
                          'Las notificaciones aparecen automáticamente cuando reproduces música. Funcionan tanto en pantalla de bloqueo como cuando el celular está prendido.',
                          [
                            { text: 'Entendido', style: 'default' }
                          ]
                        );
                      }
                    })}

                    {/* Datos guardados */}
                    {hasSavedData && savedUserData && (
                      <View style={styles.savedDataInfo}>
                        <Text style={styles.savedDataTitle}>💾 Datos Guardados</Text>
                        <Text style={styles.savedDataUser}>Usuario: {savedUserData.username}</Text>
                        <Text style={styles.savedDataKey}>Key: {savedUserData.activationKey.substring(0, 15)}...</Text>
                        <TouchableOpacity 
                          style={styles.clearDataButton}
                          onPress={handleClearSavedData}
                        >
                          <Text style={styles.clearDataButtonText}>🗑️ Limpiar Datos</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {renderPremiumActionCard({
                      title: 'Modo Drive',
                      subtitle: 'Optimización para conducción',
                      icon: 'car',
                      colors: ['#10b981', '#06b6d4'],
                      onPress: handleDriveModeSettings
                    })}
          </Animated.View>

          {/* App Info Premium */}
          <Animated.View entering={FadeInDown.delay(800)} style={styles.appInfoSection}>
            <PremiumGlassCard style={styles.appInfoCard}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(6, 182, 212, 0.1)']}
                style={styles.appInfoGradient}
              >
                <View style={styles.appInfoContent}>
                  <LinearGradient
                    colors={['#8b5cf6', '#06b6d4']}
                    style={styles.appIcon}
                  >
                    <Icon name="music" type="feather" color="#fff" size={32} />
                  </LinearGradient>
                  
                  <View style={styles.appInfoText}>
                    <Text style={styles.appName}>Groovify</Text>
                    <Text style={styles.appVersion}>Versión 1.0.0</Text>
                    <Text style={styles.appDescription}>
                      Tu reproductor de música premium
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </PremiumGlassCard>
          </Animated.View>

          {/* Sign Out Button Premium */}
          <Animated.View entering={FadeInDown.delay(1000)} style={styles.signOutSection}>
            <PremiumButton
              title="Cerrar Sesión"
              icon={<LogOut size={20} color="#fff" />}
              onPress={handleSignOut}
              variant="glass"
            />
          </Animated.View>


          <View style={styles.bottomSpacing} />
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingsButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  profileCard: {
    margin: 0,
  },
  profileGradient: {
    padding: 24,
  },
  profileContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 4,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  premiumBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  premiumBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardContainer: {
    flex: 1,
  },
  statCard: {
    margin: 0,
  },
  statCardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionCardContainer: {
    marginBottom: 12,
  },
  actionCard: {
    margin: 0,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  appInfoSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  appInfoCard: {
    margin: 0,
  },
  appInfoGradient: {
    padding: 20,
  },
  appInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  appInfoText: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  appVersion: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 12,
    color: '#999',
  },
  signOutSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  bottomSpacing: {
    height: 100,
  },
  savedDataInfo: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  savedDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 8,
  },
  savedDataUser: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  savedDataKey: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  clearDataButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearDataButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
});
