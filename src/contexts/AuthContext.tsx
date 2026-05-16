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
    let cancelled = false;

    async function loadProfile(userId: string, currentSession: Session) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (cancelled) return;

        if (error) {
          console.warn('[AuthContext] Error fetching profile:', error.message);
          // Fallback using auth metadata
          setProfile({
            id: userId,
            email: currentSession.user.email ?? '',
            full_name: currentSession.user.user_metadata?.full_name || currentSession.user.email || 'Utilizador',
            role: (currentSession.user.user_metadata?.role as any) || 'enfermeiro',
            health_unit_id: null,
            health_unit_name: 'Unidade não definida',
            is_active: true,
            created_at: new Date().toISOString()
          });
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('[AuthContext] Profile fetch error:', err);
      }
    }

    // Use onAuthStateChange as the single source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (cancelled) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await loadProfile(currentSession.user.id, currentSession);
      } else {
        setProfile(null);
      }

      if (!cancelled) {
        setLoading(false);
      }
    });

    // Fallback: if onAuthStateChange never fires within 5s, force loading off
    const failsafe = setTimeout(() => {
      if (!cancelled) {
        console.warn('[AuthContext] Failsafe: forcing loading off');
        setLoading(false);
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);


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
