import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

interface DownloadedFile {
  filename: string;
  file_path: string;
  file_size: number;
  created_at: number;
}

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  url: string;
  view_count: number;
  isLocal?: boolean; // Indica si es un archivo local
}

type DownloadsContextType = {
  downloadedFiles: DownloadedFile[];
  downloadingItems: { [key: string]: number };
  searchResults: SearchResult[];
  searchQuery: string;
  searching: boolean;
  isOnline: boolean; // Estado de conexión
  loadDownloadedFiles: () => Promise<void>;
  searchMusic: (query: string) => Promise<void>;
  downloadMusic: (result: SearchResult) => Promise<void>;
  deleteFile: (filename: string) => Promise<void>;
  isDownloaded: (url: string) => boolean;
  setSearchQuery: (query: string) => void;
};

const DownloadsContext = createContext<DownloadsContextType | undefined>(undefined);

const API_URL = 'https://web-production-b6008.up.railway.app';

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
  const [downloadedFiles, setDownloadedFiles] = useState<DownloadedFile[]>([]);
  const [downloadingItems, setDownloadingItems] = useState<{ [key: string]: number }>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [isOnline, setIsOnline] = useState(true); // Estado de conexión

  useEffect(() => {
    loadDownloadedFiles();
  }, []);

  const loadDownloadedFiles = async () => {
    try {
      console.log('📥 Cargando archivos descargados...');
      
      // Primero intentar cargar desde el backend
      try {
        const response = await fetch(`${API_URL}/downloads`, {
          timeout: 5000,
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.downloads) {
            // Convertir formato del backend al formato esperado por la app
            const backendFiles = data.downloads.map((file: any) => ({
              filename: file.filename,
              file_path: file.path, // Ruta del backend
              file_size: file.size,
              created_at: file.modified,
            }));
            
            setDownloadedFiles(backendFiles);
            console.log(`✅ ${backendFiles.length} archivos cargados desde el backend`);
            return;
          }
        }
      } catch (error) {
        console.log('⚠️ No se pudo cargar desde el backend, usando archivos locales...');
      }
      
      // Fallback: cargar archivos locales del dispositivo
      const docDir = FileSystem.documentDirectory || '';
      const files = await FileSystem.readDirectoryAsync(docDir);
      
      const audioFiles = files.filter(file => 
        file.endsWith('.mp3') || 
        file.endsWith('.m4a') || 
        file.endsWith('.webm')
      );
      
      const filesWithInfo = await Promise.all(
        audioFiles.map(async (filename) => {
          const fileUri = `${docDir}${filename}`;
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          
          return {
            filename: filename,
            file_path: fileUri,
            file_size: fileInfo.exists && !fileInfo.isDirectory ? fileInfo.size || 0 : 0,
            created_at: fileInfo.exists && !fileInfo.isDirectory ? (fileInfo.modificationTime || Date.now() / 1000) : Date.now() / 1000,
          };
        })
      );
      
      setDownloadedFiles(filesWithInfo);
      console.log(`✅ ${filesWithInfo.length} archivos locales cargados (OFFLINE)`);
      
    } catch (error) {
      console.error('❌ Error cargando archivos:', error);
    }
  };

  const searchMusic = async (query: string) => {
    if (!query.trim()) {
      return;
    }

    setSearching(true);
    try {
      // Intentar buscar en el backend primero
      const response = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query }),
        timeout: 5000, // 5 segundos de timeout
      });
      
      if (!response.ok) {
        throw new Error('Backend no disponible');
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && data.results) {
        setSearchResults(data.results);
      } else {
        // No mostrar error, simplemente no hay resultados de YouTube
        setSearchResults([]);
      }
    } catch (error: any) {
      console.log('🔌 Modo offline: Backend no disponible, buscando en archivos locales...');
      setIsOnline(false); // Marcar como offline
      
      // MODO OFFLINE: Buscar en archivos descargados localmente
      const localResults = downloadedFiles.filter(file => 
        file.filename.toLowerCase().includes(query.toLowerCase())
      ).map(file => ({
        id: file.filename,
        title: file.filename.replace(/\.(mp3|m4a|webm)$/i, ''),
        artist: 'Archivo Local',
        duration: 0,
        thumbnail: '',
        url: file.file_path,
        view_count: 0,
        isLocal: true // Marcar como archivo local
      }));
      
      setSearchResults(localResults);
      console.log(`📱 Encontrados ${localResults.length} archivos locales`);
    } finally {
      setSearching(false);
    }
  };

  const downloadMusic = async (result: SearchResult) => {
    try {
      console.log('🔽 Iniciando descarga mejorada:', result.title);
      
      // Validar que no sea un archivo local
      if (result.isLocal) {
        Alert.alert('ℹ️ Información', 'Este archivo ya está en tu dispositivo');
        return;
      }
      
      setDownloadingItems(prev => ({
        ...prev,
        [result.id]: 0
      }));
      
      // Mostrar que está iniciando
      console.log('📡 Conectando con el servidor...');
      
      const response = await fetch(`${API_URL}/download?url=${encodeURIComponent(result.url)}&quality=best`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Aumentar timeout para descargas largas
        signal: AbortSignal.timeout(300000) // 5 minutos
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del servidor (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        console.log('✅ Descarga completada:', data.file.title);
        
        setDownloadingItems(prev => ({
          ...prev,
          [result.id]: 100
        }));
        
        // Simular progreso de guardado
        setTimeout(() => {
          setDownloadingItems(prev => {
            const newState = { ...prev };
            delete newState[result.id];
            return newState;
          });
          
          // Recargar archivos descargados
          loadDownloadedFiles();
          
          // Mostrar mensaje de éxito
          Alert.alert(
            '🎵 ¡Éxito!', 
            `Música descargada correctamente:\n\n"${data.file.title}"\npor ${data.file.artist}\n\nTamaño: ${formatFileSize(data.file.file_size)}`,
            [{ text: '¡Genial!', style: 'default' }]
          );
        }, 1000);
        
      } else {
        throw new Error(data.message || 'Error desconocido en la descarga');
      }
      
    } catch (error: any) {
      console.error('❌ Error en descarga:', error);
      
      setDownloadingItems(prev => {
        const newState = { ...prev };
        delete newState[result.id];
        return newState;
      });
      
      // Determinar tipo de error y mostrar mensaje apropiado
      let errorMessage = 'Error desconocido';
      
      if (error.name === 'AbortError') {
        errorMessage = 'La descarga tardó demasiado. Intenta con otra canción.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'No hay conexión al servidor. Verifica tu conexión a internet.';
      } else if (error.message.includes('404')) {
        errorMessage = 'El video no se encontró en YouTube.';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'El video está restringido o no disponible.';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = 'Error del servidor. Intenta más tarde.';
      } else {
        errorMessage = error.message;
      }
      
      Alert.alert(
        '❌ Error en la descarga', 
        `${errorMessage}\n\nIntenta:\n• Verificar tu conexión a internet\n• Probar con otra canción\n• Reiniciar la app`,
        [{ text: 'Entendido', style: 'default' }]
      );
    }
  };

  // Función auxiliar para formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const deleteFile = async (filename: string) => {
    try {
      const response = await fetch(`${API_URL}/download/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadDownloadedFiles();
        Alert.alert('Éxito', 'Archivo eliminado correctamente');
      } else {
        Alert.alert('Error', 'No se pudo eliminar el archivo');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el archivo');
    }
  };

  const isDownloaded = (url: string): boolean => {
    // Verificar si la URL ya fue descargada comparando con los archivos
    return downloadedFiles.some(file => file.file_path.includes(url) || url.includes(file.filename));
  };

  const value = {
    downloadedFiles,
    downloadingItems,
    searchResults,
    searchQuery,
    searching,
    isOnline,
    loadDownloadedFiles,
    searchMusic,
    downloadMusic,
    deleteFile,
    isDownloaded,
    setSearchQuery,
  };

  return (
    <DownloadsContext.Provider value={value}>
      {children}
    </DownloadsContext.Provider>
  );
}

export function useDownloads() {
  const context = useContext(DownloadsContext);
  if (context === undefined) {
    throw new Error('useDownloads must be used within a DownloadsProvider');
  }
  return context;
}

