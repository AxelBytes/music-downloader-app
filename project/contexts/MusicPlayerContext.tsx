import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Database } from '@/lib/supabase';
import { usePlayCount } from './PlayCountContext';
import { useEqualizer } from './EqualizerContext';
import { useRealEqualizer } from './RealEqualizerContext';

// type Song = Database['public']['Tables']['songs']['Row']; // Tabla no existe
type Song = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  thumbnail_url: string;
  cover_url?: string;
  albumArt?: string;
  duration?: number;
};

type MusicPlayerContextType = {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  queue: Song[];
  currentIndex: number;
  playSong: (song: Song, queue?: Song[]) => Promise<void>;
  pauseSong: () => Promise<void>;
  resumeSong: () => Promise<void>;
  nextSong: () => Promise<void>;
  previousSong: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  setQueue: (songs: Song[], startIndex?: number) => void;
};

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueueState] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const { incrementPlayCount } = usePlayCount();
  const { applyAudioEffects, equalizerValues } = useEqualizer();
  const { applyRealAudioEffects, isRealEqualizerAvailable } = useRealEqualizer();

  const setupAudio = async () => {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
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

  const playSong = async (song: Song, newQueue?: Song[]) => {
    try {
      // PREVENIR REPRODUCCIÓN MÚLTIPLE
      if (currentSong?.id === song.id && isPlaying) {
        console.log('🎵 [MusicPlayer] Ya se está reproduciendo esta canción');
        return;
      }

      if (isLoading) {
        console.log('🎵 [MusicPlayer] Ya hay una reproducción en progreso');
        return;
      }

      setIsLoading(true);
      console.log('🎵 [MusicPlayer] Iniciando reproducción:', song.title);
      await setupAudio();

      // DETENER REPRODUCCIÓN ANTERIOR COMPLETAMENTE
      if (soundRef.current) {
        console.log('🛑 [MusicPlayer] Deteniendo reproducción anterior');
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        stopProgressUpdates();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: song.audio_url },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setCurrentSong(song);
      setIsPlaying(true);
      startProgressUpdates();

      // Incrementar conteo de reproducciones
      incrementPlayCount({
        id: song.id,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail_url,
        url: song.audio_url,
      });

      if (newQueue) {
        setQueueState(newQueue);
        const index = newQueue.findIndex(s => s.id === song.id);
        setCurrentIndex(index >= 0 ? index : 0);
      }
    } catch (error) {
      console.error('Error playing song:', error);
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
    if (progress > 3) {
      await seekTo(0);
    } else if (queue.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      await playSong(queue[prevIndex], queue);
    }
  };

  const seekTo = async (position: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(position * 1000);
      setProgress(position);
    }
  };

  const setQueue = (songs: Song[], startIndex: number = 0) => {
    setQueueState(songs);
    setCurrentIndex(startIndex);
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        nextSong();
      }
    }
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
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}
