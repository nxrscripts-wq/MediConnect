import React from 'react';
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
    // Redirect to login but save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // 403 Forbidden page inline
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
