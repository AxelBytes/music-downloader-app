import { useState, useEffect, useCallback } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Song = Database['public']['Tables']['songs']['Row'];
type Playlist = Database['public']['Tables']['playlists']['Row'];

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

    try {
      // Buscar sugerencias de canciones, artistas y álbumes
      const [songsResult, artistsResult, albumsResult] = await Promise.all([
        supabase
          .from('songs')
          .select('title, artist, album')
          .or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%,album.ilike.%${searchQuery}%`)
          .limit(5),
        
        supabase
          .from('songs')
          .select('artist')
          .ilike('artist', `%${searchQuery}%`)
          .limit(3),
        
        supabase
          .from('songs')
          .select('album')
          .ilike('album', `%${searchQuery}%`)
          .limit(3),
      ]);

      const suggestions: string[] = [];
      
      // Agregar títulos de canciones
      if (songsResult.data) {
        songsResult.data.forEach(song => {
          if (song.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            suggestions.push(song.title);
          }
        });
      }

      // Agregar artistas
      if (artistsResult.data) {
        artistsResult.data.forEach(song => {
          if (song.artist.toLowerCase().includes(searchQuery.toLowerCase())) {
            suggestions.push(song.artist);
          }
        });
      }

      // Agregar álbumes
      if (albumsResult.data) {
        albumsResult.data.forEach(song => {
          if (song.album && song.album.toLowerCase().includes(searchQuery.toLowerCase())) {
            suggestions.push(song.album);
          }
        });
      }

      // Eliminar duplicados y limitar
      const uniqueSuggestions = [...new Set(suggestions)].slice(0, 8);
      setSuggestions(uniqueSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  }, []);

  const searchSongs = async (searchQuery: string, searchFilters: SearchFilters): Promise<Song[]> => {
    let query = supabase.from('songs').select('*');

    // Aplicar filtro de texto
    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%,album.ilike.%${searchQuery}%`);
    }

    // Aplicar filtros de duración
    if (searchFilters.duration) {
      query = query
        .gte('duration', searchFilters.duration.min)
        .lte('duration', searchFilters.duration.max);
    }

    // Aplicar ordenamiento
    switch (searchFilters.sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'duration':
        query = query.order('duration', { ascending: true });
        break;
      case 'popular':
        // Ordenar por número de favoritos (implementar si tienes esa funcionalidad)
        query = query.order('created_at', { ascending: false });
        break;
      default: // relevance
        if (searchQuery.trim()) {
          // Para relevancia, podrías implementar un algoritmo más sofisticado
          query = query.order('created_at', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }
    }

    const { data, error } = await query.limit(50);
    
    if (error) {
      console.error('Error searching songs:', error);
      return [];
    }

    return data || [];
  };

  const searchPlaylists = async (searchQuery: string, searchFilters: SearchFilters): Promise<Playlist[]> => {
    if (!user) return [];

    let query = supabase
      .from('playlists')
      .select('*')
      .eq('user_id', user.id);

    // Aplicar filtro de texto
    if (searchQuery.trim()) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    // Aplicar ordenamiento
    switch (searchFilters.sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(20);
    
    if (error) {
      console.error('Error searching playlists:', error);
      return [];
    }

    return data || [];
  };

  const searchArtists = async (searchQuery: string): Promise<string[]> => {
    if (!searchQuery.trim()) return [];

    const { data, error } = await supabase
      .from('songs')
      .select('artist')
      .ilike('artist', `%${searchQuery}%`)
      .limit(20);

    if (error) {
      console.error('Error searching artists:', error);
      return [];
    }

    // Eliminar duplicados
    const uniqueArtists = [...new Set(data?.map(song => song.artist) || [])];
    return uniqueArtists;
  };

  const searchAlbums = async (searchQuery: string): Promise<string[]> => {
    if (!searchQuery.trim()) return [];

    const { data, error } = await supabase
      .from('songs')
      .select('album')
      .ilike('album', `%${searchQuery}%`)
      .not('album', 'is', null)
      .limit(20);

    if (error) {
      console.error('Error searching albums:', error);
      return [];
    }

    // Eliminar duplicados y valores nulos
    const uniqueAlbums = [...new Set(data?.map(song => song.album).filter(Boolean) || [])];
    return uniqueAlbums;
  };

  const performSearch = async (searchQuery: string, searchFilters: SearchFilters) => {
    if (!searchQuery.trim()) {
      setResults({ songs: [], playlists: [], artists: [], albums: [] });
      return;
    }

    setLoading(true);
    setQuery(searchQuery);

    try {
      const searchPromises = [];

      // Buscar según el tipo de filtro
      if (searchFilters.type === 'all' || searchFilters.type === 'songs') {
        searchPromises.push(searchSongs(searchQuery, searchFilters));
      }

      if (searchFilters.type === 'all' || searchFilters.type === 'playlists') {
        searchPromises.push(searchPlaylists(searchQuery, searchFilters));
      }

      if (searchFilters.type === 'all' || searchFilters.type === 'artists') {
        searchPromises.push(searchArtists(searchQuery));
      }

      if (searchFilters.type === 'all' || searchFilters.type === 'albums') {
        searchPromises.push(searchAlbums(searchQuery));
      }

      const results = await Promise.all(searchPromises);

      const [songs, playlists, artists, albums] = results;

      setResults({
        songs: songs as Song[] || [],
        playlists: playlists as Playlist[] || [],
        artists: artists as string[] || [],
        albums: albums as string[] || [],
      });

      // Guardar búsqueda reciente
      await saveRecentSearch(searchQuery);
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
