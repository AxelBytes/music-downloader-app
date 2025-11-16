import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { ActivationKeyManager } from '@/lib/activationKeys';
import { API_URL } from '@/lib/apiConfig';

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
  const [loading, setLoading] = useState(false); // CAMBIO: Iniciar en false

  // CARGAR USUARIO AL INICIAR - LÓGICA DE SUPABASE COMENTADA
  /*
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('🔐 [AuthContext] Cargando sesión existente...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔐 [AuthContext] Error cargando sesión:', error);
        } else if (session) {
          console.log('🔐 [AuthContext] Sesión encontrada:', session.user.email);
          setUser(session.user);
          setSession(session);
        } else {
          console.log('🔐 [AuthContext] No hay sesión activa');
        }
      } catch (error) {
        console.error('🔐 [AuthContext] Error en loadUser:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);
  */

  // useEffect(() => {
    // Limpiar cualquier sesión existente y forzar registro
    /* const clearExistingSessions = async () => {
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
  }, []); */

  const validateActivationKey = async (key: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_URL}/auth/validate-key?key=${encodeURIComponent(key)}`, {
        method: 'POST',
      });
      if (!res.ok) return { isValid: false, error: `HTTP ${res.status}` };
      const data = await res.json();
      return { isValid: !!data.isValid, error: data.error };
    } catch (error) {
      return { isValid: false, error: 'Error de red validando key' };
    }
  };

  const signUp = async (email: string, _password: string, username: string, activationKey: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/sign-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email, username, activationKey
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { error: { message: `Error backend: ${text}` } };
      }
      const data = await res.json();
      const userId = data?.user?.id || `local-${Date.now()}`;

      const mockSession: Session = {
        user: {
          id: userId,
          email: email,
          user_metadata: { display_name: username },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as User,
        access_token: 'mock-token-' + userId,
        refresh_token: 'mock-refresh-' + userId,
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };
      setSession(mockSession);
      setUser(mockSession.user);
      return { error: null };
    } catch (_e) {
      return { error: { message: 'Error de red al registrar' } };
    }
  };

  // Al iniciar la app, ya no necesitamos cargar nada, así que quitamos el loading.
  useEffect(() => {
    setLoading(false);
  }, []);


  const signIn = async (activationKey: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/sign-in?activationKey=${encodeURIComponent(activationKey)}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const text = await res.text();
        return { error: { message: `Error backend: ${text}` } };
      }
      const data = await res.json();
      const u = data.user || {};
      const userId = u.id || `local-${Date.now()}`;
      const email = u.email || '';
      const username = u.username || 'user';

      const mockSession: Session = {
        user: {
          id: userId,
          email: email,
          user_metadata: { display_name: username },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as User,
        access_token: 'mock-token-' + userId,
        refresh_token: 'mock-refresh-' + userId,
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };
      setSession(mockSession);
      setUser(mockSession.user);
      return { error: null };
    } catch (_e) {
      return { error: { message: 'Error de red al iniciar sesión' } };
    }
  };

  const signOut = async () => {
    console.log('🔐 [AuthContext] Cerrando sesión');
    setUser(null);
    setSession(null);
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
