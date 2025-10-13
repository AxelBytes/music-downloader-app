import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Configuración de Supabase
const supabaseUrl = 'https://kejulhhnjbtrwrgnxdww.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanVsaGhuamJ0cndyZ254ZHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDExMTAsImV4cCI6MjA3NTc3NzExMH0.-WjzLnD_jNyyV-syfsdY6ATnbGjQ20sn2o8twDCQ9Ik';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          activation_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          activation_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          activation_key?: string;
          created_at?: string;
        };
      };
      user_libraries: {
        Row: {
          id: string;
          user_id: string;
          song_data: any; // JSONB type
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          song_data: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          song_data?: any;
          created_at?: string;
        };
      };
      user_playlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          songs: any; // JSONB type
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          songs?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          songs?: any;
          created_at?: string;
        };
      };
      activation_keys: {
        Row: {
          id: string;
          key: string;
          is_used: boolean;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          is_used?: boolean;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          is_used?: boolean;
          user_id?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      songs: {
        Row: {
          id: string;
          title: string;
          artist: string;
          album: string | null;
          duration: number;
          cover_url: string;
          audio_url: string;
          created_at: string;
        };
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          cover_url: string | null;
          is_favorite_playlist: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          cover_url?: string | null;
          is_favorite_playlist?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          cover_url?: string | null;
          is_favorite_playlist?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      playlist_songs: {
        Row: {
          id: string;
          playlist_id: string;
          song_id: string;
          position: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          song_id: string;
          position?: number;
          added_at?: string;
        };
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          song_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          song_id: string;
          created_at?: string;
        };
      };
    };
  };
};
