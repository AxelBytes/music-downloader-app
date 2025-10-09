import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Search, Mic, X, Filter, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import SearchSuggestions from './SearchSuggestions';

const { width } = Dimensions.get('window');

interface SearchBarProps {
  onSearch: (query: string) => void;
  onVoiceSearch?: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
  showFilters?: boolean;
  showVoiceSearch?: boolean;
  suggestions?: string[];
  recentSearches?: string[];
  onSuggestionPress?: (suggestion: string) => void;
  onRecentPress?: (recent: string) => void;
}

export default function SearchBar({
  onSearch,
  onVoiceSearch,
  onFilterPress,
  placeholder = "Buscar canciones, artistas, álbumes...",
  showFilters = true,
  showVoiceSearch = true,
  suggestions = [],
  recentSearches = [],
  onSuggestionPress,
  onRecentPress,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchInputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.02,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused]);

  useEffect(() => {
    if (query.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [query]);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
    onSuggestionPress?.(suggestion);
  };

  const handleRecentPress = (recent: string) => {
    setQuery(recent);
    setShowSuggestions(false);
    onSearch(recent);
    onRecentPress?.(recent);
  };

  const handleSubmit = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const glowStyle = {
    opacity: glowAnim,
    transform: [
      {
        scale: glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.1],
        }),
      },
    ],
  };

  const sparkleStyle = {
    opacity: sparkleAnim,
    transform: [
      {
        rotate: sparkleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <BlurView intensity={20} style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.1)', 'rgba(6, 182, 212, 0.1)']}
          style={styles.gradientContainer}
        >
          <Animated.View style={[styles.glowEffect, glowStyle]} />
          
          <View style={styles.searchContainer}>
            <View style={styles.inputContainer}>
              <Search size={20} color="#8b5cf6" style={styles.searchIcon} />
              
              <TextInput
                ref={searchInputRef}
                style={styles.input}
                value={query}
                onChangeText={handleSearch}
                onSubmitEditing={handleSubmit}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              
              {query.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                  <X size={18} color="#999" />
                </TouchableOpacity>
              )}
              
              {query.length > 0 && (
                <Animated.View style={[styles.sparkleContainer, sparkleStyle]}>
                  <Sparkles size={16} color="#8b5cf6" />
                </Animated.View>
              )}
            </View>

            <View style={styles.actionButtons}>
              {showVoiceSearch && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onVoiceSearch}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#06b6d4', '#8b5cf6']}
                    style={styles.actionButtonGradient}
                  >
                    <Mic size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {showFilters && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onFilterPress}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#8b5cf6', '#06b6d4']}
                    style={styles.actionButtonGradient}
                  >
                    <Filter size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </BlurView>

      <SearchSuggestions
        suggestions={suggestions}
        recentSearches={recentSearches}
        onSuggestionPress={handleSuggestionPress}
        onRecentPress={handleRecentPress}
        visible={showSuggestions && (suggestions.length > 0 || recentSearches.length > 0)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientContainer: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  sparkleContainer: {
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
