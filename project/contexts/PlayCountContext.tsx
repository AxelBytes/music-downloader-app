import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PlayCount {
  id: string;
  title: string;
  artist: string;
  playCount: number;
  lastPlayed: number;
  thumbnail?: string;
  url?: string;
}

interface PlayCountContextType {
  playCounts: PlayCount[];
  incrementPlayCount: (song: {
    id: string;
    title: string;
    artist: string;
    thumbnail?: string;
    url?: string;
  }) => void;
  getMostPlayed: (limit?: number) => PlayCount[];
  getTotalPlays: () => number;
  clearPlayCounts: () => void;
}

const PlayCountContext = createContext<PlayCountContextType | undefined>(undefined);

export function PlayCountProvider({ children }: { children: React.ReactNode }) {
  const [playCounts, setPlayCounts] = useState<PlayCount[]>([]);

  // Cargar datos al inicializar
  useEffect(() => {
    loadPlayCounts();
  }, []);

  // Guardar datos cuando cambien
  useEffect(() => {
    savePlayCounts();
  }, [playCounts]);

  const loadPlayCounts = async () => {
    try {
      const stored = await AsyncStorage.getItem('playCounts');
      if (stored) {
        setPlayCounts(JSON.parse(stored));
        console.log('📊 Cargados conteos de reproducción');
      }
    } catch (error) {
      console.error('Error cargando conteos de reproducción:', error);
    }
  };

  const savePlayCounts = async () => {
    try {
      await AsyncStorage.setItem('playCounts', JSON.stringify(playCounts));
    } catch (error) {
      console.error('Error guardando conteos de reproducción:', error);
    }
  };

  const incrementPlayCount = (song: {
    id: string;
    title: string;
    artist: string;
    thumbnail?: string;
    url?: string;
  }) => {
    setPlayCounts(prev => {
      const existingIndex = prev.findIndex(pc => pc.id === song.id);
      
      if (existingIndex >= 0) {
        // Actualizar existente
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          playCount: updated[existingIndex].playCount + 1,
          lastPlayed: Date.now()
        };
        return updated;
      } else {
        // Agregar nuevo
        const newPlayCount: PlayCount = {
          id: song.id,
          title: song.title,
          artist: song.artist,
          playCount: 1,
          lastPlayed: Date.now(),
          thumbnail: song.thumbnail,
          url: song.url
        };
        return [...prev, newPlayCount];
      }
    });
  };

  const getMostPlayed = (limit: number = 10): PlayCount[] => {
    return playCounts
      .sort((a, b) => {
        // Primero por número de reproducciones, luego por última vez reproducida
        if (b.playCount !== a.playCount) {
          return b.playCount - a.playCount;
        }
        return b.lastPlayed - a.lastPlayed;
      })
      .slice(0, limit);
  };

  const getTotalPlays = (): number => {
    return playCounts.reduce((total, song) => total + song.playCount, 0);
  };

  const clearPlayCounts = async () => {
    setPlayCounts([]);
    try {
      await AsyncStorage.removeItem('playCounts');
      console.log('🗑️ Conteos de reproducción limpiados');
    } catch (error) {
      console.error('Error limpiando conteos de reproducción:', error);
    }
  };

  return (
    <PlayCountContext.Provider
      value={{
        playCounts,
        incrementPlayCount,
        getMostPlayed,
        getTotalPlays,
        clearPlayCounts
      }}
    >
      {children}
    </PlayCountContext.Provider>
  );
}

export function usePlayCount() {
  const context = useContext(PlayCountContext);
  if (context === undefined) {
    throw new Error('usePlayCount must be used within a PlayCountProvider');
  }
  return context;
}
