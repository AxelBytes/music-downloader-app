import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { usePlayCount } from './PlayCountContext';
import { useEqualizer } from './EqualizerContext';
import { useRealEqualizer } from './RealEqualizerContext';
import { useOffline } from './OfflineContext';

interface DownloadedFile {
  filename: string;
  file_path: string;
  file_size: number;
  created_at: number;
}

type DownloaderMusicPlayerContextType = {
  currentSong: DownloadedFile | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  queue: DownloadedFile[];
  currentIndex: number;
  playSong: (song: DownloadedFile, queue?: DownloadedFile[]) => Promise<void>;
  pauseSong: () => Promise<void>;
  resumeSong: () => Promise<void>;
  nextSong: () => Promise<void>;
  previousSong: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  setQueue: (songs: DownloadedFile[], startIndex?: number) => void;
};

const DownloaderMusicPlayerContext = createContext<DownloaderMusicPlayerContextType | undefined>(undefined);

export function DownloaderMusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<DownloadedFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueueState] = useState<DownloadedFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const { incrementPlayCount } = usePlayCount();
  const { applyAudioEffects, equalizerValues } = useEqualizer();
  const { applyRealAudioEffects, isRealEqualizerAvailable } = useRealEqualizer();
  const { isOfflineMode, isOnline } = useOffline();

  const API_URL = 'https://web-production-b6008.up.railway.app';

  const updateProgress = async () => {
    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        setProgress(status.positionMillis / 1000);
        setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
      }
    }
  };

  const startProgressUpdates = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    progressInterval.current = setInterval(updateProgress, 1000) as any;
  };

  const stopProgressUpdates = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  // Aplicar efectos del ecualizador REAL cuando cambien los valores
  useEffect(() => {
    if (soundRef.current && isPlaying) {
      // Aplicar ecualizador real si está disponible
      if (isRealEqualizerAvailable) {
        applyRealAudioEffects(soundRef.current);
      } else {
        // Fallback al ecualizador simulado
        applyAudioEffects(soundRef.current);
      }
    }
  }, [equalizerValues, isPlaying, isRealEqualizerAvailable]);

  const normalizeUrl = (url: string): string => {
    if (!url.match(/\.(mp3|mp4|wav|m4a|aac)$/i)) {
      return url + '.mp3';
    }
    return url;
  };

  const setupAudio = async () => {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      allowsRecordingIOS: false,
      playThroughEarpieceAndroid: false,
    });
  };

  const playSong = async (song: DownloadedFile, newQueue?: DownloadedFile[]) => {
    try {
      // PREVENIR REPRODUCCIÓN MÚLTIPLE
      if (currentSong?.filename === song.filename && isPlaying) {
        console.log('🎵 [DownloaderPlayer] Ya se está reproduciendo esta canción');
        return;
      }

      if (isLoading) {
        console.log('🎵 [DownloaderPlayer] Ya hay una reproducción en progreso');
        return;
      }

      setIsLoading(true);
      console.log('🎵 [DownloaderPlayer] Iniciando reproducción:', song.filename);
      
      // Verificar modo offline
      if (isOfflineMode && !isOnline) {
        console.log('📱 [OfflineMode] Reproduciendo en modo offline');
        Alert.alert(
          '📱 Modo Offline',
          'Reproduciendo archivo local en modo offline',
          [{ text: 'Entendido', style: 'default' }]
        );
      }

      await setupAudio();

      // DETENER REPRODUCCIÓN ANTERIOR COMPLETAMENTE
      if (soundRef.current) {
        console.log('🛑 [DownloaderPlayer] Deteniendo reproducción anterior');
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        stopProgressUpdates();
      }

      // SOLUCIÓN HÍBRIDA: Funciona tanto en Expo Go como en builds nativos
      let realAudioUri = song.file_path;
      
      if (!realAudioUri.startsWith('http')) {
        // Detectar si estamos en Expo Go (desarrollo) o build nativo
        // Si la ruta contiene '/tmp/' o empieza con '/download/', es del backend
        const isFromBackend = realAudioUri.includes('/tmp/') || realAudioUri.startsWith('/download/') || realAudioUri.includes('C:\\');
        const isExpoGo = __DEV__; // En desarrollo siempre usar servidor backend
        
        // EN MODO OFFLINE: Solo usar archivos locales
        if (isOfflineMode && !isOnline) {
          // EN MODO OFFLINE: Intentar usar archivo local
          realAudioUri = `file://${encodeURI(realAudioUri)}`;
          console.log('📱 [OFFLINE] Reproduciendo archivo LOCAL:', realAudioUri);
        } else if (isFromBackend || isExpoGo) {
          // EN EXPO GO O ARCHIVOS DEL BACKEND: Usar el servidor backend para servir el archivo
          const filename = song.filename;
          realAudioUri = `https://web-production-b6008.up.railway.app/file/${encodeURIComponent(filename)}`;
          console.log('🎵 [BACKEND] Reproduciendo vía servidor:', realAudioUri);
        } else {
          // EN BUILD NATIVO: Usar ruta local directa
          realAudioUri = `file://${encodeURI(realAudioUri)}`;
          console.log('🎵 [NATIVO] Reproduciendo archivo LOCAL:', realAudioUri);
        }
      }
      
      console.log('🎵 Reproduciendo archivo:', realAudioUri);

      const { sound } = await Audio.Sound.createAsync(
        {
          uri: realAudioUri,
          overrideFileExtensionAndroid: 'mp3'
        },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setDuration(status.durationMillis || 0);
            setProgress(status.positionMillis || 0);
            setIsPlaying(status.isPlaying || false);
            
            if (status.didJustFinish) {
              setIsPlaying(false);
              setProgress(0);
              nextSong();
            }
          }
        }
      );

      soundRef.current = sound;
      setCurrentSong(song);
      setIsPlaying(true);
      startProgressUpdates();

      // Incrementar conteo de reproducciones
      const title = song.filename.replace(/\.(mp3|m4a|webm)$/i, '');
      incrementPlayCount({
        id: song.filename,
        title: title,
        artist: 'Descarga Local',
        thumbnail: '',
        url: song.file_path,
      });

      if (newQueue) {
        setQueueState(newQueue);
        const index = newQueue.findIndex(s => s.filename === song.filename);
        setCurrentIndex(index >= 0 ? index : 0);
      }
    } catch (error: any) {
      console.error('Error playing song:', error);
      Alert.alert('Error', `No se puede reproducir el archivo: ${error.message}`);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSong = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      stopProgressUpdates();
    }
  };

  const resumeSong = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
      startProgressUpdates();
    }
  };

  const nextSong = async () => {
    if (queue.length > 0 && currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      await playSong(queue[nextIndex], queue);
    }
  };

  const previousSong = async () => {
    if (progress / 1000 > 3) {
      await seekTo(0);
    } else if (queue.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      await playSong(queue[prevIndex], queue);
    }
  };

  const seekTo = async (position: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(position);
      setProgress(position);
    }
  };

  const setQueue = (songs: DownloadedFile[], startIndex: number = 0) => {
    setQueueState(songs);
    setCurrentIndex(startIndex);
  };

  const value = {
    currentSong,
    isPlaying,
    progress,
    duration,
    queue,
    currentIndex,
    playSong,
    pauseSong,
    resumeSong,
    nextSong,
    previousSong,
    seekTo,
    setQueue,
  };

  return (
    <DownloaderMusicPlayerContext.Provider value={value}>
      {children}
    </DownloaderMusicPlayerContext.Provider>
  );
}

export function useDownloaderMusicPlayer() {
  const context = useContext(DownloaderMusicPlayerContext);
  if (context === undefined) {
    throw new Error('useDownloaderMusicPlayer must be used within a DownloaderMusicPlayerProvider');
  }
  return context;
}

