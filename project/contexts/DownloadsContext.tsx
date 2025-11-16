import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from './AuthContext';
import { usePremiumNotification } from './PremiumNotificationContext';
import { API_URL } from '@/lib/apiConfig';

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

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showNotification } = usePremiumNotification();
  const [downloadedFiles, setDownloadedFiles] = useState<DownloadedFile[]>([]);
  const [downloadingItems, setDownloadingItems] = useState<{ [key: string]: number }>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [isOnline, setIsOnline] = useState(true); // Estado de conexión

  useEffect(() => {
    if (user) {
      loadDownloadedFiles();
    }
  }, [user]);

  const loadDownloadedFiles = async () => {
    if (!user) return;
    
    try {
      console.log('📥 Cargando archivos descargados para usuario:', user.id);
      
      // Cargar directamente desde el endpoint /downloads del backend
      try {
        const response = await fetch(`${API_URL}/downloads`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.downloads) {
            // Convertir formato del backend al formato esperado por la app
            const backendFiles = data.downloads.map((file: any) => ({
              filename: file.filename,
              file_path: file.path, // El backend envía 'path'
              file_size: file.size,
              created_at: file.modified,
            }));
            
            setDownloadedFiles(backendFiles);
            console.log(`✅ ${backendFiles.length} archivos cargados desde el backend`);
            return;
          }
        }
      } catch (error) {
        console.log('⚠️ No se pudo cargar desde el backend. Puede que esté offline.');
        // En caso de error (ej. offline), limpiar la lista para no mostrar datos viejos.
        setDownloadedFiles([]);
      }
      
    } catch (error) {
      console.error('❌ Error cargando archivos:', error);
    }
  };

  const searchMusic = async (query: string) => {
    if (!query.trim()) {
      return;
    }

    setSearching(true);
    console.log('🔍 Iniciando búsqueda:', query);
    console.log('🌐 URL del backend:', API_URL);
    
    try {
      // Intentar buscar en el backend primero
      const searchUrl = `${API_URL}/search?query=${encodeURIComponent(query)}`;
      console.log('📡 Enviando request a:', searchUrl);
      
      // Crear AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
      
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 Status de respuesta:', response.status);
      console.log('📡 Headers:', response.headers);
      
      if (!response.ok) {
        console.error('❌ Error en respuesta:', response.status, response.statusText);
        throw new Error(`Backend error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📡 Respuesta del servidor:', data);
      
      if (data.status === 'success' && data.results) {
        console.log('✅ Resultados encontrados:', data.results.length);
        console.log('🎵 Primer resultado:', data.results[0]);
        setSearchResults(data.results);
        setIsOnline(true); // Marcar como online
      } else {
        console.log('⚠️ No hay resultados o formato incorrecto');
        console.log('📊 Datos recibidos:', data);
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('❌ Error en búsqueda:', error);
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
    if (!user) {
      showNotification({
        type: 'error',
        title: 'Acceso Denegado',
        message: 'Debes iniciar sesión para descargar música',
        duration: 3000,
      });
      return;
    }

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
      
      // Crear AbortController con timeout manual (AbortSignal.timeout no está soportado en React Native)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutos
      
      const response = await fetch(`${API_URL}/download?url=${encodeURIComponent(result.url)}&quality=best`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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
          
          // Mostrar notificación premium de éxito
          showNotification({
            type: 'success',
            title: '🎵 Descarga Completada',
            message: `"${data.file.title}" por ${data.file.artist}\nTamaño: ${formatFileSize(data.file.file_size)}`,
            duration: 4000,
          });
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
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para eliminar archivos');
      return;
    }

    try {
      // Eliminar directamente desde el backend
      try {
        const response = await fetch(`${API_URL}/download/${encodeURIComponent(filename)}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error del servidor (${response.status}): ${errorText}`);
        }
        console.log(`✅ Archivo ${filename} eliminado del backend.`);
      } catch (error) {
        console.warn('Error eliminando del backend:', error);
      }
      
      // Recargar archivos
      await loadDownloadedFiles();
      showNotification({
        type: 'success',
        title: '🗑️ Archivo Eliminado',
        message: `Se ha eliminado "${filename}"`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      showNotification({
        type: 'error',
        title: '❌ Error de Eliminación',
        message: 'No se pudo eliminar el archivo de tu biblioteca',
        duration: 3000,
      });
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
    API_URL,
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
