import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Configuración de Supabase para Groovify
const supabaseUrl = 'https://kejulhhnjbtrwrgnxdww.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanVsaGhuamJ0cndyZ254ZHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDExMTAsImV4cCI6MjA3NTc3NzExMH0.-WjzLnD_jNyyV-syfsdY6ATnbGjQ20sn2o8twDCQ9Ik';

console.log('🔗 [Supabase] URL:', supabaseUrl);
console.log('🔗 [Supabase] Key:', supabaseAnonKey.substring(0, 20) + '...');

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
          song_data: any;
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
          songs: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          songs: any;
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
    };
  };
};