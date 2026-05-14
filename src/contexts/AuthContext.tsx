import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, UserProfile } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, metadata: { full_name: string; role: string; health_unit_id: string }) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial session check
    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error fetching initial session:', error);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession();

    // 2. Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching user profile:', error.message);
        // Fallback for demo users or incomplete setups
        if (session?.user) {
           setProfile({
             id: session.user.id,
             email: session.user.email ?? '',
             full_name: session.user.user_metadata?.full_name || session.user.email || 'Utilizador',
             role: (session.user.user_metadata?.role as any) || 'enfermeiro',
             health_unit_id: null,
             health_unit_name: 'Unidade não definida',
             is_active: true,
             created_at: new Date().toISOString()
           });
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch unexpected error:', err);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  }

  async function signUp(
    email: string,
    password: string,
    metadata: { full_name: string; role: string; health_unit_id: string }
  ) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin + '/login',
      },
    });
    if (error) {
      const msgs: Record<string, string> = {
        'User already registered': 'Este email já está registado.',
        'Password should be at least 6 characters': 'Senha demasiado curta.',
        'Unable to validate email address': 'Email inválido.',
        'Signup requires a valid password': 'Palavra-passe inválida.',
      };
      return { error: msgs[error.message] ?? error.message };
    }
    return { error: null };
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) {
      const msgs: Record<string, string> = {
        'User not found': 'Não existe conta com este email.',
        'Email rate limit exceeded': 'Demasiados pedidos. Aguarde alguns minutos.',
        'For security purposes, you can only request this once every 60 seconds': 'Aguarde 60 segundos antes de tentar novamente.',
      };
      return { error: msgs[error.message] ?? error.message };
    }
    return { error: null };
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      toast.success('Sessão terminada com sucesso');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
