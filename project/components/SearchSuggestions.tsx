import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
} from 'react-native';
import { Music, Clock, TrendingUp, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface SearchSuggestionsProps {
  suggestions: string[];
  recentSearches: string[];
  onSuggestionPress: (suggestion: string) => void;
  onRecentPress: (recent: string) => void;
  visible: boolean;
}

export default function SearchSuggestions({
  suggestions,
  recentSearches,
  onSuggestionPress,
  onRecentPress,
  visible,
}: SearchSuggestionsProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const renderSuggestionItem = ({ item, index }: { item: string; index: number }) => (
    <Animated.View
      style={[
        styles.suggestionItem,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 20],
                outputRange: [0, 20],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.suggestionButton}
        onPress={() => onSuggestionPress(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.1)', 'rgba(6, 182, 212, 0.1)']}
          style={styles.suggestionGradient}
        >
          <View style={styles.suggestionIcon}>
            <Sparkles size={16} color="#8b5cf6" />
          </View>
          <Text style={styles.suggestionText}>{item}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderRecentItem = ({ item, index }: { item: string; index: number }) => (
    <Animated.View
      style={[
        styles.recentItem,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 20],
                outputRange: [0, 20],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.recentButton}
        onPress={() => onRecentPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.recentIcon}>
          <Clock size={16} color="#666" />
        </View>
        <Text style={styles.recentText}>{item}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  if (!visible || (suggestions.length === 0 && recentSearches.length === 0)) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <BlurView intensity={20} style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(26, 0, 51, 0.9)', 'rgba(0, 0, 0, 0.9)']}
          style={styles.gradientContainer}
        >
          {suggestions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={20} color="#8b5cf6" />
                <Text style={styles.sectionTitle}>Sugerencias</Text>
              </View>
              <FlatList
                data={suggestions}
                keyExtractor={(item, index) => `suggestion-${index}`}
                renderItem={renderSuggestionItem}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            </View>
          )}

          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={20} color="#666" />
                <Text style={styles.sectionTitle}>Recientes</Text>
              </View>
              <FlatList
                data={recentSearches}
                keyExtractor={(item, index) => `recent-${index}`}
                renderItem={renderRecentItem}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            </View>
          )}
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    marginHorizontal: 20,
    marginTop: 80,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  suggestionItem: {
    marginBottom: 8,
  },
  suggestionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  recentItem: {
    marginBottom: 8,
  },
  recentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    gap: 12,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentText: {
    flex: 1,
    fontSize: 16,
    color: '#999',
  },
});
