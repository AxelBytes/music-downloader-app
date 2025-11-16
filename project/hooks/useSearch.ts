import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Tipos simplificados, ya que el backend nos dará los datos procesados
type Song = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  thumbnail_url: string;
};

type Playlist = {
  id: string;
  name: string;
  user_id: string;
  songs: any;
  created_at: string;
};

const API_URL = 'https://web-production-b6008.up.railway.app'; // URL de nuestro backend

export type SearchResult = {
  songs: Song[];
  playlists: Playlist[];
  artists: string[];
  albums: string[];
};

export type SearchFilters = {
  type: 'all' | 'songs' | 'artists' | 'albums' | 'playlists';
  sort: 'relevance' | 'newest' | 'oldest' | 'popular' | 'duration';
  duration?: { min: number; max: number };
  year?: { min: number; max: number };
};

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({
    songs: [],
    playlists: [],
    artists: [],
    albums: [],
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    sort: 'relevance',
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { user } = useAuth();

  // Cargar búsquedas recientes al inicializar
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      // Simulación temporal sin localStorage (React Native compatible)
      setRecentSearches([]);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    try {
      // Simulación temporal sin localStorage (React Native compatible)
      const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
      setRecentSearches(updated);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const generateSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    // La lógica de sugerencias estaba atada a Supabase.
    // Por ahora, la desactivamos para evitar errores.
    // Se puede implementar en el futuro llamando a un endpoint del backend.
    setSuggestions([]);
  }, []);

  const performSearch = async (searchQuery: string, searchFilters: SearchFilters) => {
    if (!searchQuery.trim()) {
      setResults({ songs: [], playlists: [], artists: [], albums: [] });
      return;
    }

    setLoading(true);
    setQuery(searchQuery);
    await saveRecentSearch(searchQuery);

    try {
      const response = await fetch(`${API_URL}/search?query=${encodeURIComponent(searchQuery)}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success' && data.results) {
        // El backend ahora devuelve una lista unificada de canciones.
        // Podríamos adaptar el backend para devolver también playlists, artistas, etc.
        // Por ahora, solo manejamos las canciones.
        setResults({
          songs: data.results,
          playlists: [], // Vacío por ahora
          artists: [],   // Vacío por ahora
          albums: [],    // Vacío por ahora
        });
      } else {
        setResults({ songs: [], playlists: [], artists: [], albums: [] });
      }
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ songs: [], playlists: [], artists: [], albums: [] });
    setSuggestions([]);
  };

  return {
    query,
    results,
    loading,
    filters,
    suggestions,
    recentSearches,
    setFilters,
    performSearch,
    clearSearch,
    generateSuggestions,
  };
}
