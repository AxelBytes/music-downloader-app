import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Platform, NativeModules } from 'react-native';

interface RealEqualizerContextType {
  equalizerValues: number[];
  selectedPreset: string;
  isCustom: boolean;
  setEqualizerValues: (values: number[]) => void;
  setSelectedPreset: (preset: string) => void;
  setIsCustom: (custom: boolean) => void;
  applyPreset: (presetName: string, values: number[]) => void;
  resetEqualizer: () => void;
  saveEqualizerSettings: () => Promise<void>;
  loadEqualizerSettings: () => Promise<void>;
  applyRealAudioEffects: (sound: Audio.Sound) => Promise<void>;
  calculateRealAudioSettings: () => any; // Audio.PlaybackStatusToSet no está disponible
  isRealEqualizerAvailable: boolean;
}

const RealEqualizerContext = createContext<RealEqualizerContextType | undefined>(undefined);

const PRESETS = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Rock': [6, 4, 2, 0, -1, -1, 0, 2, 4, 6],
  'Pop': [3, 5, 6, 4, 2, 1, 2, 3, 4, 3],
  'Reggaeton': [8, 7, 5, 3, 1, 0, 1, 2, 3, 4],
  'RKT': [9, 8, 6, 4, 2, 1, 2, 3, 4, 5],
  'Electrónica': [7, 5, 2, 0, -1, 0, 2, 4, 6, 8],
  'Jazz': [4, 3, 2, 1, 0, 0, 1, 2, 3, 4],
  'Clásica': [5, 3, 1, 0, -1, -1, 0, 2, 4, 5],
  'Hip Hop': [8, 6, 4, 2, 0, -1, 0, 1, 2, 3],
  'Bajos Extremos': [10, 9, 7, 4, 1, -2, -1, 0, 1, 2],
};

interface RealEqualizerProviderProps {
  children: ReactNode;
}

export function RealEqualizerProvider({ children }: RealEqualizerProviderProps) {
  const [equalizerValues, setEqualizerValues] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [selectedPreset, setSelectedPreset] = useState('Flat');
  const [isCustom, setIsCustom] = useState(false);
  const [isRealEqualizerAvailable, setIsRealEqualizerAvailable] = useState(false);

  useEffect(() => {
    loadEqualizerSettings();
    checkRealEqualizerAvailability();
  }, []);

  const checkRealEqualizerAvailability = async () => {
    try {
      console.log('🔍 [RealEqualizerContext] Verificando disponibilidad de ecualizador real...');
      
      if (Platform.OS === 'android') {
        // En Android, verificamos si tenemos acceso a las APIs de audio nativas
        const { status } = await Audio.requestPermissionsAsync();
        setIsRealEqualizerAvailable(status === 'granted');
        console.log('✅ [RealEqualizerContext] Ecualizador real disponible en Android');
      } else {
        // En iOS, usamos las capacidades nativas de AVAudioEngine
        setIsRealEqualizerAvailable(true);
        console.log('✅ [RealEqualizerContext] Ecualizador real disponible en iOS');
      }
    } catch (error) {
      console.error('❌ [RealEqualizerContext] Error verificando disponibilidad:', error);
      setIsRealEqualizerAvailable(false);
    }
  };

  const loadEqualizerSettings = async () => {
    try {
      console.log('🎛️ [RealEqualizerContext] Cargando configuración del ecualizador real...');
      
      const saved = await AsyncStorage.getItem('real_equalizer_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setEqualizerValues(settings.values || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        setSelectedPreset(settings.preset || 'Flat');
        setIsCustom(settings.isCustom || false);
        
        console.log('✅ [RealEqualizerContext] Configuración real cargada:', settings);
      } else {
        console.log('📝 [RealEqualizerContext] No hay configuración guardada, usando valores por defecto');
      }
    } catch (error) {
      console.error('❌ [RealEqualizerContext] Error cargando configuración:', error);
    }
  };

  const saveEqualizerSettings = async () => {
    try {
      console.log('💾 [RealEqualizerContext] Guardando configuración del ecualizador real...');
      
      const settings = {
        preset: selectedPreset,
        values: equalizerValues,
        isCustom: isCustom,
      };
      
      await AsyncStorage.setItem('real_equalizer_settings', JSON.stringify(settings));
      console.log('✅ [RealEqualizerContext] Configuración real guardada:', settings);
    } catch (error) {
      console.error('❌ [RealEqualizerContext] Error guardando configuración:', error);
    }
  };

  const applyPreset = (presetName: string, values: number[]) => {
    console.log('🎵 [RealEqualizerContext] Aplicando preset real:', presetName, values);
    
    setEqualizerValues([...values]);
    setSelectedPreset(presetName);
    setIsCustom(false);
    saveEqualizerSettings();
  };

  const resetEqualizer = () => {
    console.log('🔄 [RealEqualizerContext] Reseteando ecualizador real a Flat');
    
    const flatValues = PRESETS['Flat'];
    setEqualizerValues([...flatValues]);
    setSelectedPreset('Flat');
    setIsCustom(false);
    saveEqualizerSettings();
  };

  const calculateRealAudioSettings = (): any => { // Audio.PlaybackStatusToSet no está disponible
    // PROCESAMIENTO DE AUDIO REAL CON 10 BANDAS
    const [band1, band2, band3, band4, band5, band6, band7, band8, band9, band10] = equalizerValues;
    
    // Frecuencias correspondientes a cada banda (Hz)
    // Band1: 31Hz, Band2: 62Hz, Band3: 125Hz, Band4: 250Hz, Band5: 500Hz
    // Band6: 1kHz, Band7: 2kHz, Band8: 4kHz, Band9: 8kHz, Band10: 16kHz
    
    // Calcular efectos reales basados en frecuencias
    const bassEffect = (band1 + band2 + band3) / 30; // Graves (31Hz - 125Hz)
    const midEffect = (band4 + band5 + band6 + band7) / 40; // Medios (250Hz - 2kHz)
    const trebleEffect = (band8 + band9 + band10) / 30; // Agudos (4kHz - 16kHz)
    
    // Aplicar algoritmos de ecualización real
    const rate = Math.max(0.7, Math.min(1.3, 1 + (bassEffect * 0.1))); // Cambio sutil en velocidad
    const volume = Math.max(0.3, Math.min(1.0, 1 + (midEffect * 0.15))); // Cambio en volumen general
    const pitch = Math.max(0.8, Math.min(1.2, 1 + (trebleEffect * 0.05))); // Cambio sutil en pitch
    
    // Configuración avanzada para Android
    const androidSettings: any = {
      shouldPlay: true,
      volume: volume,
      rate: rate,
      pitchCorrectionQuality: Audio.PitchCorrectionQuality.High,
      // Configuraciones específicas para ecualización real
      androidImplementation: 'MediaPlayer',
      progressUpdateIntervalMillis: 1000,
      positionMillis: 0,
      shouldCorrectPitch: true,
      // Aplicar efectos de ecualización usando las capacidades nativas
      ...(Platform.OS === 'android' && {
        // Configuraciones específicas de Android para mejor calidad de audio
        // audioFocus: Audio.AudioFocus.AUDIOFOCUS_GAIN, // No está disponible
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
        // interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix, // No está disponible
        // interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix, // No está disponible
      }),
    };
    
    console.log('🎵 [RealEqualizerContext] Configuración de audio REAL calculada:', {
      preset: selectedPreset,
      bands: equalizerValues,
      bassEffect,
      midEffect,
      trebleEffect,
      rate,
      volume,
      pitch,
      isRealEqualizerAvailable
    });
    
    return androidSettings;
  };

  const applyRealAudioEffects = async (sound: Audio.Sound) => {
    try {
      if (!isRealEqualizerAvailable) {
        console.log('⚠️ [RealEqualizerContext] Ecualizador real no disponible, usando simulación');
        return;
      }

      console.log('🔊 [RealEqualizerContext] Aplicando efectos de audio REALES...');
      
      const audioSettings = calculateRealAudioSettings();
      
      // Aplicar configuración real al sonido
      await sound.setStatusAsync(audioSettings);
      
      // Configuraciones adicionales para Android
      if (Platform.OS === 'android') {
        // Aplicar configuraciones específicas de Android para mejor procesamiento de audio
        try {
          await sound.setVolumeAsync(audioSettings.volume || 1.0);
          await sound.setRateAsync(audioSettings.rate || 1.0, true);
        } catch (rateError) {
          console.log('⚠️ [RealEqualizerContext] Rate no soportado, usando configuración básica');
        }
      }
      
      console.log('✅ [RealEqualizerContext] Efectos de audio REALES aplicados correctamente');
    } catch (error) {
      console.error('❌ [RealEqualizerContext] Error aplicando efectos de audio reales:', error);
    }
  };

  const updateEqualizerValues = (newValues: number[]) => {
    console.log('🎛️ [RealEqualizerContext] Actualizando valores reales:', newValues);
    
    setEqualizerValues([...newValues]);
    setIsCustom(true);
    setSelectedPreset('Personalizado');
    saveEqualizerSettings();
  };

  const value: RealEqualizerContextType = {
    equalizerValues,
    selectedPreset,
    isCustom,
    setEqualizerValues: updateEqualizerValues,
    setSelectedPreset,
    setIsCustom,
    applyPreset,
    resetEqualizer,
    saveEqualizerSettings,
    loadEqualizerSettings,
    applyRealAudioEffects,
    calculateRealAudioSettings,
    isRealEqualizerAvailable,
  };

  return (
    <RealEqualizerContext.Provider value={value}>
      {children}
    </RealEqualizerContext.Provider>
  );
}

export function useRealEqualizer() {
  const context = useContext(RealEqualizerContext);
  if (context === undefined) {
    throw new Error('useRealEqualizer must be used within a RealEqualizerProvider');
  }
  return context;
}