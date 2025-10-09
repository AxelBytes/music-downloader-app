import { useState, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as Speech from 'expo-speech';

export function useVoiceSearch() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  // Verificar si el reconocimiento de voz está disponible
  const checkVoiceSupport = async () => {
    try {
      // En una implementación real, usarías una librería como react-native-voice
      // o expo-speech para el reconocimiento de voz
      setIsSupported(true);
      return true;
    } catch (error) {
      console.error('Voice recognition not supported:', error);
      setIsSupported(false);
      return false;
    }
  };

  const startListening = async () => {
    try {
      if (!isSupported) {
        const supported = await checkVoiceSupport();
        if (!supported) {
          Alert.alert(
            'Reconocimiento de voz no disponible',
            'Tu dispositivo no soporta reconocimiento de voz o no tienes los permisos necesarios.'
          );
          return;
        }
      }

      setIsListening(true);
      setTranscript('');

      // Simular reconocimiento de voz
      // En una implementación real, usarías:
      // - react-native-voice para React Native
      // - expo-speech para Expo
      // - Web Speech API para web
      
      if (Platform.OS === 'web') {
        // Implementación para web usando Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'es-ES';

          recognition.onstart = () => {
            console.log('Voice recognition started');
          };

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setTranscript(transcript);
            setIsListening(false);
            recognition.stop();
          };

          recognition.onerror = (event: any) => {
            console.error('Voice recognition error:', event.error);
            setIsListening(false);
            Alert.alert('Error', 'No se pudo procesar el audio. Intenta de nuevo.');
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
          recognition.start();
        } else {
          Alert.alert(
            'Reconocimiento de voz no soportado',
            'Tu navegador no soporta reconocimiento de voz.'
          );
          setIsListening(false);
        }
      } else {
        // Para React Native, usarías react-native-voice
        Alert.alert(
          'Funcionalidad en desarrollo',
          'El reconocimiento de voz estará disponible próximamente.'
        );
        setIsListening(false);
      }
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
      Alert.alert('Error', 'No se pudo iniciar el reconocimiento de voz.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const speakText = async (text: string) => {
    try {
      await Speech.speak(text, {
        language: 'es-ES',
        pitch: 1.0,
        rate: 0.8,
      });
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    speakText,
    clearTranscript,
  };
}
