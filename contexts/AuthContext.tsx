import React, { createContext, useContext, useEffect, useState } from 'react';
// import { Session, User } from '@supabase/supabase-js'; // Temporalmente comentado
// import { supabase } from '@/lib/supabase'; // Temporalmente comentado

// Tipos temporales
type User = {
  id: string;
  email: string;
  user_metadata?: { display_name?: string };
};

type Session = {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Usuario simulado para desarrollo (sin login)
  const mockUser: User = {
    id: 'dev-user-123',
    email: 'developer@example.com',
    user_metadata: { display_name: 'Developer' }
  };
  
  const mockSession: Session = {
    user: mockUser,
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    expires_at: Date.now() / 1000 + 3600,
    token_type: 'bearer'
  };

  const [user, setUser] = useState<User | null>(mockUser);
  const [session, setSession] = useState<Session | null>(mockSession);
  const [loading, setLoading] = useState(false); // No loading

  // Comentado temporalmente para desarrollo sin login
  /*
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);
  */

  // Funciones de autenticación comentadas temporalmente
  const signUp = async (email: string, password: string, displayName: string) => {
    // Simular éxito para desarrollo
    return { error: null };
    /*
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      return { error };
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        display_name: displayName,
      });

    return { error: profileError };
    */
  };

  const signIn = async (email: string, password: string) => {
    // Simular éxito para desarrollo
    return { error: null };
    /*
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
    */
  };

  const signOut = async () => {
    // Simular logout para desarrollo
    setUser(null);
    setSession(null);
    /*
    await supabase.auth.signOut();
    */
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
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
