import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface PremiumNotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  visible: boolean;
}

export default function PremiumNotification({
  type,
  title,
  message,
  duration = 4000,
  onClose,
  visible,
}: PremiumNotificationProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });

      // Auto cerrar después de la duración
      if (duration > 0) {
        setTimeout(() => {
          hideNotification();
        }, duration);
      }
    } else {
      hideNotification();
    }
  }, [visible]);

  const hideNotification = () => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 300 }, () => {
      if (onClose) {
        runOnJS(onClose)();
      }
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} color="#10b981" />;
      case 'error':
        return <XCircle size={24} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={24} color="#f59e0b" />;
      case 'info':
        return <Info size={24} color="#3b82f6" />;
      default:
        return <Info size={24} color="#3b82f6" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          primary: '#10b981',
          secondary: '#34d399',
          background: 'rgba(16, 185, 129, 0.1)',
        };
      case 'error':
        return {
          primary: '#ef4444',
          secondary: '#f87171',
          background: 'rgba(239, 68, 68, 0.1)',
        };
      case 'warning':
        return {
          primary: '#f59e0b',
          secondary: '#fbbf24',
          background: 'rgba(245, 158, 11, 0.1)',
        };
      case 'info':
        return {
          primary: '#3b82f6',
          secondary: '#60a5fa',
          background: 'rgba(59, 130, 246, 0.1)',
        };
      default:
        return {
          primary: '#3b82f6',
          secondary: '#60a5fa',
          background: 'rgba(59, 130, 246, 0.1)',
        };
    }
  };

  const colors = getColors();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView intensity={20} style={styles.blurContainer}>
        <LinearGradient
          colors={[colors.background, 'rgba(0, 0, 0, 0.8)']}
          style={styles.gradientContainer}
        >
          <View style={styles.content}>
            {/* Icono con efecto glow */}
            <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.iconGradient}
              >
                {getIcon()}
              </LinearGradient>
            </View>

            {/* Texto */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              {message && <Text style={styles.message}>{message}</Text>}
            </View>

            {/* Botón cerrar */}
            <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
              <X size={20} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          </View>

          {/* Barra de progreso */}
          <View style={styles.progressContainer}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={[styles.progressBar, { width: '100%' }]}
            />
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  progressContainer: {
    marginTop: 12,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
