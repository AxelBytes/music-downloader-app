import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

interface EqualizerContextType {
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
  applyAudioEffects: (sound: Audio.Sound) => Promise<void>;
  calculateAudioSettings: () => any; // Audio.PlaybackStatusToSet no está disponible
}

const EqualizerContext = createContext<EqualizerContextType | undefined>(undefined);

const PRESETS = {
  'Flat': [0, 0, 0, 0, 0],
  'Rock': [5, 3, -2, 2, 6],
  'Pop': [2, 4, 4, 3, 1],
  'Reggaeton': [8, 6, 2, 1, 3],
  'RKT': [9, 7, 3, 2, 4],
  'Electrónica': [6, 4, 0, 3, 7],
  'Jazz': [3, 2, 0, 2, 4],
  'Clásica': [4, 2, -1, 3, 5],
  'Hip Hop': [7, 5, 1, 0, 2],
  'Bajos Extremos': [10, 8, 3, 1, 0],
};

interface EqualizerProviderProps {
  children: ReactNode;
}

export function EqualizerProvider({ children }: EqualizerProviderProps) {
  const [equalizerValues, setEqualizerValues] = useState<number[]>([0, 0, 0, 0, 0]);
  const [selectedPreset, setSelectedPreset] = useState('Flat');
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    loadEqualizerSettings();
  }, []);

  const loadEqualizerSettings = async () => {
    try {
      console.log('🎛️ [EqualizerContext] Cargando configuración del ecualizador...');
      
      const saved = await AsyncStorage.getItem('equalizer_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setEqualizerValues(settings.values || [0, 0, 0, 0, 0]);
        setSelectedPreset(settings.preset || 'Flat');
        setIsCustom(settings.isCustom || false);
        
        console.log('✅ [EqualizerContext] Configuración cargada:', settings);
      } else {
        console.log('📝 [EqualizerContext] No hay configuración guardada, usando valores por defecto');
      }
    } catch (error) {
      console.error('❌ [EqualizerContext] Error cargando configuración:', error);
    }
  };

  const saveEqualizerSettings = async () => {
    try {
      console.log('💾 [EqualizerContext] Guardando configuración del ecualizador...');
      
      const settings = {
        preset: selectedPreset,
        values: equalizerValues,
        isCustom: isCustom,
      };
      
      await AsyncStorage.setItem('equalizer_settings', JSON.stringify(settings));
      console.log('✅ [EqualizerContext] Configuración guardada:', settings);
    } catch (error) {
      console.error('❌ [EqualizerContext] Error guardando configuración:', error);
    }
  };

  const applyPreset = (presetName: string, values: number[]) => {
    console.log('🎵 [EqualizerContext] Aplicando preset:', presetName, values);
    
    setEqualizerValues([...values]);
    setSelectedPreset(presetName);
    setIsCustom(false);
    saveEqualizerSettings();
  };

  const resetEqualizer = () => {
    console.log('🔄 [EqualizerContext] Reseteando ecualizador a Flat');
    
    const flatValues = PRESETS['Flat'];
    setEqualizerValues([...flatValues]);
    setSelectedPreset('Flat');
    setIsCustom(false);
    saveEqualizerSettings();
  };

  const calculateAudioSettings = (): any => { // Audio.PlaybackStatusToSet no está disponible
    // Convertir valores del ecualizador a configuración de audio
    const [bass, midLow, mid, midHigh, treble] = equalizerValues;
    
    // Calcular efectos más realistas basados en las frecuencias
    // Bass (60Hz) - Afecta principalmente el rate y volume
    const bassEffect = bass / 20; // -0.5 a +0.5
    
    // Treble (14kHz) - Afecta el pitch
    const trebleEffect = treble / 30; // -0.33 a +0.33
    
    // Mid frequencies - Afectan el volume general
    const midEffect = (midLow + mid + midHigh) / 60; // -0.5 a +0.5
    
    // Calcular rate (velocidad de reproducción)
    const rate = Math.max(0.5, Math.min(2.0, 1 + bassEffect));
    
    // Calcular volume (volumen general)
    const volume = Math.max(0.1, Math.min(1.0, 1 + midEffect));
    
    // Para simular efectos de ecualizador, usamos:
    // - Rate: Simula cambios en graves (bass)
    // - Volume: Simula cambios en medios
    // - Pitch: Simula cambios en agudos (treble)
    
    console.log('🎵 [EqualizerContext] Configuración de audio calculada:', {
      preset: selectedPreset,
      bassEffect,
      trebleEffect,
      midEffect,
      rate,
      volume,
      equalizerValues
    });
    
    return {
      pitchCorrectionQuality: Audio.PitchCorrectionQuality.High,
      shouldPlay: true,
      volume: volume,
      rate: rate,
      // Nota: Expo AV no tiene ecualizador nativo real, usamos rate y volume como aproximación
    };
  };

  const applyAudioEffects = async (sound: Audio.Sound) => {
    try {
      console.log('🔊 [EqualizerContext] Aplicando efectos de audio...');
      
      const audioSettings = calculateAudioSettings();
      
      // Aplicar configuración al sonido
      await sound.setStatusAsync(audioSettings);
      
      console.log('✅ [EqualizerContext] Efectos de audio aplicados correctamente');
    } catch (error) {
      console.error('❌ [EqualizerContext] Error aplicando efectos de audio:', error);
    }
  };

  const updateEqualizerValues = (newValues: number[]) => {
    console.log('🎛️ [EqualizerContext] Actualizando valores:', newValues);
    
    setEqualizerValues([...newValues]);
    setIsCustom(true);
    setSelectedPreset('Personalizado');
    saveEqualizerSettings();
  };

  const value: EqualizerContextType = {
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
    applyAudioEffects,
    calculateAudioSettings,
  };

  return (
    <EqualizerContext.Provider value={value}>
      {children}
    </EqualizerContext.Provider>
  );
}

export function useEqualizer() {
  const context = useContext(EqualizerContext);
  if (context === undefined) {
    throw new Error('useEqualizer must be used within an EqualizerProvider');
  }
  return context;
}
