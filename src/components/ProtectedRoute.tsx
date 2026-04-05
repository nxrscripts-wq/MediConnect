import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
    children,
    allowedRoles,
}: ProtectedRouteProps) {
    const { session, profile, loading } = useAuth();
    const location = useLocation();

    // Still checking session — show centered spinner
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Not authenticated — redirect to login
    if (!session) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // RBAC check
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        const roleLabel = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
                <ShieldAlert className="h-12 w-12 text-destructive" />
                <h1 className="text-xl font-semibold">Acesso negado</h1>
                <p className="max-w-md text-sm text-muted-foreground">
                    O seu perfil (<span className="font-medium">{roleLabel}</span>) não
                    tem permissão para esta secção.
                </p>
                <Button asChild variant="outline">
                    <Link to="/">Voltar ao início</Link>
                </Button>
            </div>
        );
    }

    return <>{children}</>;
}
