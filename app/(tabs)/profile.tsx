import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
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
import { router } from 'expo-router';
import { PremiumGlassCard, PremiumButton } from '@/components/PremiumComponents';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function PremiumProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ playlists: 0, favorites: 0 });
  const [loading, setLoading] = useState(true);

  const { user, signOut } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      const [profileResult, playlistsResult, favoritesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('playlists').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('user_favorites').select('id', { count: 'exact' }).eq('user_id', user.id),
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data);
      }

      setStats({
        playlists: playlistsResult.count || 0,
        favorites: favoritesResult.count || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  const renderPremiumStatCard = ({ icon, value, label, colors }: { 
    icon: string, 
    value: number, 
    label: string, 
    colors: string[] 
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
    colors: string[], 
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
                        source={{ uri: profile?.avatar_url }}
                        containerStyle={styles.avatar}
                      >
                        <Icon name="user" type="feather" color="#fff" size={40} />
                      </Avatar>
                    </LinearGradient>
                  </View>

                  <Text style={styles.displayName}>
                    {profile?.display_name || 'Usuario'}
                  </Text>
                  <Text style={styles.email}>{profile?.email}</Text>

                  {/* Premium Badge */}
                  <View style={styles.premiumBadge}>
                    <LinearGradient
                      colors={['#f59e0b', '#ef4444']}
                      style={styles.premiumBadgeGradient}
                    >
                      <Icon name="crown" type="feather" color="#fff" size={16} />
                      <Text style={styles.premiumBadgeText}>Premium</Text>
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
                icon: 'heart',
                value: stats.favorites,
                label: 'Favoritas',
                colors: ['#ef4444', '#f59e0b']
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
              onPress: () => {}
            })}
            
            {renderPremiumActionCard({
              title: 'Reproducción',
              subtitle: 'Configuración de audio',
              icon: 'music',
              colors: ['#06b6d4', '#10b981'],
              onPress: () => {}
            })}
            
            {renderPremiumActionCard({
              title: 'Calidad Premium',
              subtitle: 'Activar funciones premium',
              icon: 'star',
              colors: ['#f59e0b', '#ef4444'],
              onPress: () => {}
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
                    <Text style={styles.appName}>Music Player Pro</Text>
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
              icon="log-out"
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
});
