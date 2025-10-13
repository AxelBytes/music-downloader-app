import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeIn,
  FadeInDown,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const screenDimensions = Dimensions.get('window');
const { width, height } = screenDimensions;

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const progressValue = useSharedValue(0);

  useEffect(() => {
    console.log('🎬 [SplashScreen] INICIANDO SPLASH SCREEN');
    
    // Iniciar animaciones del logo
    logoScale.value = withTiming(1, { duration: 800 });
    logoOpacity.value = withTiming(1, { duration: 600 });
    
    // Mostrar texto después del logo
    setTimeout(() => {
      setShowContent(true);
      textOpacity.value = withTiming(1, { duration: 600 });
      textTranslateY.value = withTiming(0, { duration: 600 });
    }, 800);

    // SPLASH RÁPIDO PARA PRUEBAS - 2 SEGUNDOS
    setTimeout(() => {
      console.log('🎬 [SplashScreen] TERMINANDO SPLASH - LLAMANDO onFinish');
      onFinish();
    }, 2000); // 2 segundos para evitar crashes

    // Simular progreso de carga RÁPIDO
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 5; // Llegar a 100% en ~2 segundos
        if (newProgress >= 100) {
          clearInterval(progressInterval);
        }
        return Math.min(newProgress, 100);
      });
    }, 100); // Actualizar cada 100ms

    // Animar la barra de progreso
    progressValue.value = withTiming(1, { duration: 2000 });

    return () => clearInterval(progressInterval);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const progressBarStyle = useAnimatedStyle(() => {
    const progressWidth = interpolate(
      progressValue.value,
      [0, 1],
      [0, width - 80], // 80 = padding horizontal
      Extrapolate.CLAMP
    );
    
    return {
      width: progressWidth,
    };
  });

  const progressGlowStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(
      progressValue.value,
      [0, 0.5, 1],
      [0, 0.8, 0],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: glowOpacity,
    };
  });

  return (
    <LinearGradient
      colors={['#1a0033', '#000000', '#0a0a0a']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require('@/assets/images/512x512.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Texto */}
        {showContent && (
          <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
            <Text style={styles.appName}>Groovify</Text>
            <Text style={styles.creatorText}>
              Creada por A.L.A Dev Works
            </Text>
            <Text style={styles.creatorName}>de Lionel Adams</Text>
          </Animated.View>
        )}

        {/* Barra de progreso */}
        <Animated.View 
          entering={FadeInDown.delay(1500)} 
          style={styles.progressContainer}
        >
          <View style={styles.progressBarBackground}>
            <Animated.View style={[styles.progressBarFill, progressBarStyle]}>
              <LinearGradient
                colors={['#8b5cf6', '#06b6d4', '#10b981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
              {/* Efecto de brillo */}
              <Animated.View style={[styles.progressGlow, progressGlowStyle]} />
            </Animated.View>
          </View>
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            <Text style={styles.loadingText}>Cargando Groovify...</Text>
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  creatorText: {
    fontSize: 16,
    color: '#8b5cf6',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  creatorName: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  progressTextContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    color: '#8b5cf6',
    fontWeight: '700',
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
});
