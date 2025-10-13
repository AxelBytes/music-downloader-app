import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@expo/vector-icons';

interface NativeSearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: () => void;
  disabled?: boolean;
}

export default function NativeSearchBar({ 
  placeholder = "Buscar...", 
  value, 
  onChangeText, 
  onSearch,
  disabled = false 
}: NativeSearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
        />
      </View>
      <TouchableOpacity 
        style={[styles.searchButton, disabled && styles.disabledButton]} 
        onPress={onSearch}
        disabled={disabled}
      >
        <Icon name="search" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    color: '#fff',
    fontSize: 16,
    height: 48,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

