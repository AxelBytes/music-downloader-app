import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { ActivationKeyManager } from '@/lib/activationKeys';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, activationKey: string) => Promise<{ error: any }>;
  signIn: (activationKey: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  validateActivationKey: (key: string) => Promise<{ isValid: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Limpiar cualquier sesión existente y forzar registro
    const clearExistingSessions = async () => {
      try {
        console.log('🔐 [AuthContext] Iniciando limpieza de sesiones...');
        
        // FORZAR estado sin usuario INMEDIATAMENTE
        setUser(null);
        setSession(null);
        
        // Limpiar sesiones de Supabase
        await supabase.auth.signOut();
        
        // Limpiar localStorage/sessionStorage si existe (web)
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('sb-kejulhhnjbtrwrgnxdww-auth-token');
            sessionStorage.clear();
          } catch (e) {
            // Ignorar errores de storage
          }
        }
        
        // Limpiar AsyncStorage en React Native - MÁS AGRESIVO
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          if (AsyncStorage) {
            // Limpiar TODAS las keys relacionadas con Supabase
            const keys = await AsyncStorage.getAllKeys();
            const supabaseKeys = keys.filter(key => 
              key.includes('supabase') || 
              key.includes('sb-') ||
              key.includes('auth-token') ||
              key.includes('session')
            );
            
            if (supabaseKeys.length > 0) {
              await AsyncStorage.multiRemove(supabaseKeys);
              console.log('🔐 [AuthContext] AsyncStorage limpiado:', supabaseKeys);
            }
            
            // También limpiar keys específicas por si acaso
            await AsyncStorage.multiRemove([
              'sb-kejulhhnjbtrwrgnxdww-auth-token',
              '@supabase/auth-token',
              'supabase.auth.token',
              'supabase.auth.session'
            ]);
          }
        } catch (e) {
          console.warn('Error limpiando AsyncStorage:', e);
        }
        
        console.log('🔐 [AuthContext] Sesiones limpiadas - Forzando registro');
        
        // Pequeño delay para asegurar que la limpieza se complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn('Error clearing sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    clearExistingSessions();

    // No escuchar cambios de autenticación automáticos
    // Solo manejar cambios manuales
  }, []);

  const validateActivationKey = async (key: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
      const result = await ActivationKeyManager.validateKey(key);
      return { isValid: result.isValid, error: result.error };
    } catch (error) {
      return { isValid: false, error: 'Error al validar la key' };
    }
  };

  const signUp = async (email: string, password: string, username: string, activationKey: string) => {
    try {
      // Validar key de activación
      const keyValidation = await validateActivationKey(activationKey);
      if (!keyValidation.isValid) {
        return { error: { message: keyValidation.error } };
      }

      // Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error || !data.user) {
        return { error };
      }

      // Crear usuario en nuestra tabla personalizada
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          username,
          activation_key: activationKey,
        });

      if (userError) {
        return { error: userError };
      }

      // Marcar key como usada
      const keyMarked = await ActivationKeyManager.markKeyAsUsed(activationKey, data.user.id);
      if (!keyMarked) {
        console.warn('Error al marcar key como usada');
      }

      // Crear sesión para el nuevo usuario
      const mockSession: Session = {
        user: {
          id: data.user.id,
          email: data.user.email!,
          user_metadata: { display_name: username }
        },
        access_token: 'mock-token-' + data.user.id,
        refresh_token: 'mock-refresh-' + data.user.id,
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      setSession(mockSession);
      setUser(mockSession.user);

      console.log('✅ [AuthContext] Usuario registrado:', username);
      return { error: null };
    } catch (error) {
      return { error: { message: 'Error inesperado al crear cuenta' } };
    }
  };

  const signIn = async (activationKey: string) => {
    try {
      // Buscar usuario por key de activación
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('activation_key', activationKey)
        .single();

      if (userError || !userData) {
        return { error: { message: 'Key de activación inválida' } };
      }

      // Crear sesión simulada para el usuario
      const mockSession: Session = {
        user: {
          id: userData.id,
          email: userData.email,
          user_metadata: { display_name: userData.username }
        },
        access_token: 'mock-token-' + userData.id,
        refresh_token: 'mock-refresh-' + userData.id,
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      setSession(mockSession);
      setUser(mockSession.user);

      console.log('✅ [AuthContext] Usuario logueado:', userData.username);
      return { error: null };
    } catch (error) {
      return { error: { message: 'Error al iniciar sesión' } };
    }
  };

  const signOut = async () => {
    console.log('🔐 [AuthContext] Cerrando sesión');
    setUser(null);
    setSession(null);
    
    // También limpiar sesión de Supabase si existe
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Error signing out from Supabase:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    validateActivationKey,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}