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

const { width, height } = Dimensions.get('window');

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
    // Iniciar animaciones del logo
    logoScale.value = withTiming(1, { duration: 800 });
    logoOpacity.value = withTiming(1, { duration: 600 });
    
    // Mostrar texto después del logo
    setTimeout(() => {
      setShowContent(true);
      textOpacity.value = withTiming(1, { duration: 600 });
      textTranslateY.value = withTiming(0, { duration: 600 });
    }, 800);

    // Iniciar barra de progreso después de 1.5 segundos
    setTimeout(() => {
      progressValue.value = withTiming(1, { duration: 13500 }); // 13.5 segundos para la barra
    }, 1500);

    // Simular progreso de carga
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          // Finalizar splash después de 15 segundos
          setTimeout(() => {
            onFinish();
          }, 500);
        }
        return newProgress;
      });
    }, 150); // Actualizar cada 150ms para llegar a 100% en ~15 segundos

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
    const width = interpolate(
      progressValue.value,
      [0, 1],
      [0, width - 80], // 80 = padding horizontal
      Extrapolate.CLAMP
    );
    
    return {
      width,
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
            </Animated.View>
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
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
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  progressText: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
  },
});
