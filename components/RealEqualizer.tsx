import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Music2, Sliders, Info } from 'lucide-react-native';
import { useRealEqualizer } from '@/contexts/RealEqualizerContext';

interface EqualizerPreset {
  name: string;
  icon: string;
  values: number[];
}

const PRESETS: EqualizerPreset[] = [
  { name: 'Flat', icon: '🎵', values: [0, 0, 0, 0, 0] },
  { name: 'Rock', icon: '🎸', values: [5, 3, -2, 2, 6] },
  { name: 'Pop', icon: '🎤', values: [2, 4, 4, 3, 1] },
  { name: 'Reggaeton', icon: '🔥', values: [8, 6, 2, 1, 3] },
  { name: 'RKT', icon: '💥', values: [9, 7, 3, 2, 4] },
  { name: 'Electrónica', icon: '⚡', values: [6, 4, 0, 3, 7] },
  { name: 'Jazz', icon: '🎷', values: [3, 2, 0, 2, 4] },
  { name: 'Clásica', icon: '🎻', values: [4, 2, -1, 3, 5] },
  { name: 'Hip Hop', icon: '🎧', values: [7, 5, 1, 0, 2] },
  { name: 'Bajos Extremos', icon: '💣', values: [10, 8, 3, 1, 0] },
];

const FREQUENCY_BANDS = ['60Hz', '230Hz', '910Hz', '4kHz', '14kHz'];
const FREQUENCY_LABELS = ['Graves', 'Medios-Bajos', 'Medios', 'Medios-Altos', 'Agudos'];

interface RealEqualizerProps {
  visible: boolean;
  onClose: () => void;
}

export default function RealEqualizer({ visible, onClose }: RealEqualizerProps) {
  const {
    equalizerValues,
    selectedPreset,
    isCustom,
    applyPreset,
    resetEqualizer,
    setEqualizerValues,
    // isRealEqualizerAvailable, // No está disponible en el contexto
    isRealEqualizerAvailable,
  } = useRealEqualizer();

  const handlePresetSelect = (preset: EqualizerPreset) => {
    console.log('🎵 [RealEqualizer] Aplicando preset real:', preset.name);
    applyPreset(preset.name, preset.values);
  };

  const handleBandChange = (index: number, value: number) => {
    console.log('🎛️ [RealEqualizer] Cambiando banda real', index, 'a', value);
    const newValues = [...equalizerValues];
    newValues[index] = value;
    setEqualizerValues(newValues);
  };

  const showNativeAudioInfo = () => {
    Alert.alert(
      '🔊 Ecualizador Real',
      `Estado del audio nativo: ${isRealEqualizerAvailable ? '✅ Disponible' : '❌ No disponible'}\n\n${
        isRealEqualizerAvailable 
          ? 'Los efectos de ecualización se aplicarán en tiempo real al audio.'
          : 'Para usar el ecualizador real, necesitas una build nativa (no Expo Go).'
      }`,
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <LinearGradient colors={['#1a0033', '#0a0a0a', '#000000']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Sliders size={24} color={isRealEqualizerAvailable ? "#10b981" : "#f59e0b"} />
            <Text style={styles.headerTitle}>Ecualizador Real</Text>
            {isRealEqualizerAvailable && (
              <View style={styles.realIndicator}>
                <Text style={styles.realIndicatorText}>REAL</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={showNativeAudioInfo} style={styles.infoButton}>
              <Info size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={resetEqualizer} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Audio Native Status */}
          {!isRealEqualizerAvailable && (
            <View style={styles.warningSection}>
              <LinearGradient colors={['#f59e0b', '#ef4444']} style={styles.warningGradient}>
                <Text style={styles.warningTitle}>⚠️ Audio Nativo No Disponible</Text>
                <Text style={styles.warningText}>
                  Para usar el ecualizador real, necesitas una build nativa.
                  Actualmente estás usando Expo Go.
                </Text>
                <Text style={styles.warningSubtext}>
                  Los cambios se guardarán y se aplicarán cuando uses una build nativa.
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* Preset Selector */}
          <View style={styles.presetsSection}>
            <Text style={styles.sectionTitle}>Presets</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsList}>
              {PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.name}
                  style={[
                    styles.presetCard,
                    selectedPreset === preset.name && !isCustom && styles.presetCardActive,
                  ]}
                  onPress={() => handlePresetSelect(preset)}
                >
                  {selectedPreset === preset.name && !isCustom && (
                    <LinearGradient
                      colors={isRealEqualizerAvailable ? ['#10b981', '#06b6d4'] : ['#8b5cf6', '#06b6d4']}
                      style={styles.presetCardGradient}
                    />
                  )}
                  <Text style={styles.presetIcon}>{preset.icon}</Text>
                  <Text style={[
                    styles.presetName,
                    selectedPreset === preset.name && !isCustom && styles.presetNameActive,
                  ]}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {isCustom && (
                <View style={[styles.presetCard, styles.presetCardActive]}>
                  <LinearGradient
                    colors={isRealEqualizerAvailable ? ['#10b981', '#06b6d4'] : ['#8b5cf6', '#06b6d4']}
                    style={styles.presetCardGradient}
                  />
                  <Text style={styles.presetIcon}>✨</Text>
                  <Text style={styles.presetNameActive}>Personalizado</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Equalizer Bands */}
          <View style={styles.bandsSection}>
            <Text style={styles.sectionTitle}>Bandas de Frecuencia</Text>
            <View style={styles.bandsContainer}>
              {FREQUENCY_BANDS.map((freq, index) => (
                <View key={freq} style={styles.bandColumn}>
                  {/* Value Display */}
                  <View style={styles.valueContainer}>
                    <Text style={[
                      styles.valueText,
                      { color: isRealEqualizerAvailable ? '#10b981' : '#8b5cf6' }
                    ]}>
                      {equalizerValues[index] > 0 ? '+' : ''}{equalizerValues[index].toFixed(1)} dB
                    </Text>
                  </View>

                  {/* Vertical Slider */}
                  <View style={styles.sliderContainer}>
                    <TouchableOpacity
                      style={styles.simpleSlider}
                      onPress={() => {
                        // Simular cambio de valor
                        const newValue = equalizerValues[index] === 10 ? -10 : equalizerValues[index] + 2;
                        handleBandChange(index, Math.max(-10, Math.min(10, newValue)));
                      }}
                    >
                      <View 
                        style={[
                          styles.simpleSliderTrack,
                          { 
                            backgroundColor: isRealEqualizerAvailable 
                              ? (equalizerValues[index] >= 0 ? '#10b981' : 'rgba(16, 185, 129, 0.3)')
                              : (equalizerValues[index] >= 0 ? '#8b5cf6' : 'rgba(139, 92, 246, 0.3)'),
                            height: Math.abs(equalizerValues[index]) * 10 + 10
                          }
                        ]} 
                      />
                      <View 
                        style={[
                          styles.simpleSliderThumb,
                          { 
                            bottom: equalizerValues[index] * 10 + 10,
                            backgroundColor: isRealEqualizerAvailable ? '#10b981' : '#06b6d4'
                          }
                        ]} 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Frequency Label */}
                  <Text style={styles.frequencyText}>{freq}</Text>
                  <Text style={styles.frequencyLabel}>{FREQUENCY_LABELS[index]}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoSection}>
            <Music2 size={20} color={isRealEqualizerAvailable ? "#10b981" : "#666"} />
            <Text style={styles.infoText}>
              {isRealEqualizerAvailable 
                ? 'Ecualizador real: Los efectos se aplican directamente al audio en tiempo real.'
                : 'Configuración guardada: Se aplicará cuando uses una build nativa.'
              }
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  realIndicator: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  realIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoButton: {
    padding: 8,
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  warningSection: {
    marginBottom: 20,
  },
  warningGradient: {
    padding: 16,
    borderRadius: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  warningSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  presetsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  presetsList: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  presetCard: {
    width: 100,
    padding: 16,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  presetCardActive: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  presetIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },
  presetNameActive: {
    color: '#fff',
    fontWeight: '700',
  },
  bandsSection: {
    marginBottom: 30,
  },
  bandsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  bandColumn: {
    alignItems: 'center',
    flex: 1,
  },
  valueContainer: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sliderContainer: {
    height: 200,
    justifyContent: 'center',
    marginBottom: 12,
  },
  simpleSlider: {
    width: 40,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleSliderTrack: {
    width: 4,
    position: 'absolute',
    bottom: 10,
    borderRadius: 2,
  },
  simpleSliderThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
  },
  frequencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  frequencyLabel: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    maxWidth: 50,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 40,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
});
