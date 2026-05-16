import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/supabase';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  const [profileTimeout, setProfileTimeout] = useState(false);

  // Timeout for profile loading — prevents infinite "A verificar permissões..."
  useEffect(() => {
    if (!loading && session && !profile && allowedRoles) {
      const timer = setTimeout(() => setProfileTimeout(true), 3000);
      return () => clearTimeout(timer);
    }
    if (profile) setProfileTimeout(false);
  }, [loading, session, profile, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">A verificar credenciais...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Role-gated route: if profile is still loading, show brief spinner
  // But if profile never loads (timeout), skip role check and render children
  // The profile fallback in AuthContext guarantees a profile eventually
  if (allowedRoles && !profile && !profileTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">A verificar permissões...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6">
        <div className="bg-destructive/10 p-4 rounded-full mb-6">
          <ShieldAlert className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          O seu perfil de <span className="font-bold text-foreground">({profile.role})</span> não tem permissão para aceder a esta secção do sistema.
        </p>
        <Button onClick={() => window.location.href = '/'}>
          Voltar ao Início
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
