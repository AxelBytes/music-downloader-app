import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { X, Music, User, Disc, Heart, Clock, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export type FilterType = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';
export type SortType = 'relevance' | 'newest' | 'oldest' | 'popular' | 'duration';

interface SearchFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    type: FilterType;
    sort: SortType;
    duration?: { min: number; max: number };
    year?: { min: number; max: number };
  }) => void;
  currentFilters?: {
    type: FilterType;
    sort: SortType;
    duration?: { min: number; max: number };
    year?: { min: number; max: number };
  };
}

export default function SearchFilters({
  visible,
  onClose,
  onApplyFilters,
  currentFilters = {
    type: 'all',
    sort: 'relevance',
  },
}: SearchFiltersProps) {
  const [selectedType, setSelectedType] = useState<FilterType>(currentFilters.type);
  const [selectedSort, setSelectedSort] = useState<SortType>(currentFilters.sort);
  const [durationRange, setDurationRange] = useState(
    currentFilters.duration || { min: 0, max: 600 }
  );
  const [yearRange, setYearRange] = useState(
    currentFilters.year || { min: 1950, max: 2024 }
  );

  const slideAnim = new Animated.Value(0);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleApply = () => {
    onApplyFilters({
      type: selectedType,
      sort: selectedSort,
      duration: durationRange,
      year: yearRange,
    });
    onClose();
  };

  const filterTypes = [
    { key: 'all', label: 'Todo', icon: Music, color: '#8b5cf6' },
    { key: 'songs', label: 'Canciones', icon: Music, color: '#06b6d4' },
    { key: 'artists', label: 'Artistas', icon: User, color: '#ef4444' },
    { key: 'albums', label: 'Álbumes', icon: Disc, color: '#10b981' },
    { key: 'playlists', label: 'Playlists', icon: Heart, color: '#f59e0b' },
  ] as const;

  const sortOptions = [
    { key: 'relevance', label: 'Relevancia', icon: Star },
    { key: 'newest', label: 'Más recientes', icon: Clock },
    { key: 'oldest', label: 'Más antiguos', icon: Clock },
    { key: 'popular', label: 'Más populares', icon: Heart },
    { key: 'duration', label: 'Duración', icon: Music },
  ] as const;

  const animatedStyle = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0],
        }),
      },
    ],
    opacity: slideAnim,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={styles.blurOverlay}>
          <Animated.View style={[styles.container, animatedStyle]}>
            <LinearGradient
              colors={['#1a1a1a', '#0a0a0a']}
              style={styles.gradientContainer}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Filtros de Búsqueda</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Tipo de contenido */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tipo de contenido</Text>
                  <View style={styles.filterGrid}>
                    {filterTypes.map((filter) => {
                      const IconComponent = filter.icon;
                      const isSelected = selectedType === filter.key;
                      
                      return (
                        <TouchableOpacity
                          key={filter.key}
                          style={[styles.filterItem, isSelected && styles.filterItemSelected]}
                          onPress={() => setSelectedType(filter.key as FilterType)}
                        >
                          <LinearGradient
                            colors={isSelected ? [filter.color, filter.color] : ['transparent', 'transparent']}
                            style={styles.filterItemGradient}
                          >
                            <IconComponent size={20} color={isSelected ? '#fff' : filter.color} />
                            <Text style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}>
                              {filter.label}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Ordenar por */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Ordenar por</Text>
                  <View style={styles.sortList}>
                    {sortOptions.map((option) => {
                      const IconComponent = option.icon;
                      const isSelected = selectedSort === option.key;
                      
                      return (
                        <TouchableOpacity
                          key={option.key}
                          style={[styles.sortItem, isSelected && styles.sortItemSelected]}
                          onPress={() => setSelectedSort(option.key as SortType)}
                        >
                          <IconComponent size={18} color={isSelected ? '#8b5cf6' : '#999'} />
                          <Text style={[styles.sortLabel, isSelected && styles.sortLabelSelected]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Rango de duración */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Duración (segundos)</Text>
                  <View style={styles.rangeContainer}>
                    <Text style={styles.rangeLabel}>
                      {Math.floor(durationRange.min / 60)}:{(durationRange.min % 60).toString().padStart(2, '0')}
                    </Text>
                    <Text style={styles.rangeLabel}>
                      {Math.floor(durationRange.max / 60)}:{(durationRange.max % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                </View>

                {/* Rango de año */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Año</Text>
                  <View style={styles.rangeContainer}>
                    <Text style={styles.rangeLabel}>{yearRange.min}</Text>
                    <Text style={styles.rangeLabel}>{yearRange.max}</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => {
                    setSelectedType('all');
                    setSelectedSort('relevance');
                    setDurationRange({ min: 0, max: 600 });
                    setYearRange({ min: 1950, max: 2024 });
                  }}
                >
                  <Text style={styles.resetButtonText}>Restablecer</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                  <LinearGradient
                    colors={['#06b6d4', '#8b5cf6']}
                    style={styles.applyButtonGradient}
                  >
                    <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  gradientContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterItem: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  filterItemSelected: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  filterItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  filterLabelSelected: {
    color: '#fff',
  },
  sortList: {
    gap: 8,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  sortItemSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  sortLabel: {
    fontSize: 16,
    color: '#999',
  },
  sortLabelSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  rangeLabel: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  applyButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
