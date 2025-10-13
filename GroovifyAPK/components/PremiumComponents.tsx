import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Button, Icon, Avatar, Badge } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolate 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Premium Glass Card Component
interface PremiumGlassCardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  intensity?: number;
}

export const PremiumGlassCard: React.FC<PremiumGlassCardProps> = ({ 
  children, 
  style, 
  onPress, 
  intensity = 20 
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
    opacity.value = withTiming(0.8);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1);
  };

  const CardComponent = (
    <Animated.View style={[animatedStyle, style]}>
      <BlurView intensity={intensity} style={styles.glassCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.glassGradient}
        >
          {children}
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {CardComponent}
      </TouchableOpacity>
    );
  }

  return CardComponent;
};

// Premium Button Component
interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'glass';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  disabled = false,
  loading = false,
}) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    glowOpacity.value = withTiming(1);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    glowOpacity.value = withTiming(0);
  };

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: 16,
      paddingVertical: size === 'small' ? 10 : size === 'large' ? 18 : 14,
      paddingHorizontal: size === 'small' ? 16 : size === 'large' ? 32 : 24,
      shadowColor: '#8b5cf6',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 12,
    };

    switch (variant) {
      case 'primary':
        return { ...baseStyle, backgroundColor: '#8b5cf6' };
      case 'secondary':
        return { ...baseStyle, backgroundColor: '#06b6d4' };
      case 'glass':
        return { ...baseStyle, backgroundColor: 'rgba(255, 255, 255, 0.1)' };
      default:
        return baseStyle;
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        <LinearGradient
          colors={variant === 'primary' ? ['#8b5cf6', '#06b6d4'] : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
          style={styles.buttonGradient}
        >
          <View style={styles.buttonContent}>
            {icon && <Icon name={icon} color="#fff" size={20} style={{ marginRight: 8 }} />}
            <Text style={[styles.buttonText, { fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16 }]}>
              {title}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Glow effect */}
      <Animated.View style={[styles.buttonGlow, glowStyle]} />
    </Animated.View>
  );
};

// Premium Music Card Component
interface PremiumMusicCardProps {
  title: string;
  artist: string;
  thumbnail?: string;
  duration?: string;
  isPlaying?: boolean;
  onPress: () => void;
  onPlay: () => void;
  onMore: () => void;
}

export const PremiumMusicCard: React.FC<PremiumMusicCardProps> = ({
  title,
  artist,
  thumbnail,
  duration,
  isPlaying = false,
  onPress,
  onPlay,
  onMore,
}) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(1.02);
    rotation.value = withSpring(2);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    rotation.value = withSpring(0);
  };

  return (
    <Animated.View style={animatedStyle}>
      <PremiumGlassCard onPress={onPress} style={styles.musicCard}>
        <View style={styles.musicCardContent}>
          <View style={styles.musicInfo}>
            <Avatar
              size={60}
              rounded
              source={{ uri: thumbnail }}
              containerStyle={styles.avatarContainer}
            >
              <Icon name="music" type="feather" color="#8b5cf6" size={30} />
            </Avatar>
            
            <View style={styles.musicDetails}>
              <Text style={styles.musicTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.musicArtist} numberOfLines={1}>
                {artist}
              </Text>
              {duration && (
                <Text style={styles.musicDuration}>
                  {duration}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.musicActions}>
            {isPlaying && (
              <Badge
                value="♪"
                status="primary"
                containerStyle={styles.playingBadge}
                textStyle={styles.playingBadgeText}
              />
            )}
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onPlay}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Icon
                name={isPlaying ? "pause" : "play"}
                type="feather"
                color="#8b5cf6"
                size={24}
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={onMore}>
              <Icon name="more-horizontal" type="feather" color="#666" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </PremiumGlassCard>
    </Animated.View>
  );
};

// Premium Loading Component
export const PremiumLoading: React.FC = () => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withTiming(360, { duration: 1000 });
    const interval = setInterval(() => {
      rotation.value = withTiming(rotation.value + 360, { duration: 1000 });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={['#8b5cf6', '#06b6d4']}
          style={styles.loadingGradient}
        >
          <Icon name="music" type="feather" color="#fff" size={32} />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.loadingText}>Cargando música...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  glassGradient: {
    padding: 20,
  },
  buttonGradient: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    zIndex: -1,
  },
  musicCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  musicCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    marginRight: 16,
  },
  musicDetails: {
    flex: 1,
  },
  musicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  musicArtist: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  musicDuration: {
    fontSize: 12,
    color: '#666',
  },
  musicActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playingBadge: {
    marginRight: 8,
  },
  playingBadgeText: {
    fontSize: 16,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '500',
  },
});
