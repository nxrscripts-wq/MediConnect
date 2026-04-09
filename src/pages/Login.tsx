import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const from =
        (location.state as { from?: string } | null)?.from ?? "/";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password.trim()) {
            setError("Preencha todos os campos.");
            return;
        }

        setIsLoading(true);
        const result = await signIn(email, password);
        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            navigate(from, { replace: true });
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-6">
                {/* Logo */}
                <div className="flex flex-col items-center gap-2">
                    <Activity className="h-10 w-10 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">MediConnect</h1>
                </div>

                {/* Card */}
                <Card className="border shadow-sm">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-lg">Entrar no sistema</CardTitle>
                        <CardDescription>
                            Sistema Nacional de Saúde — Angola
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="utilizador@saude.gov.ao"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Palavra-passe</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                        aria-label={
                                            showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        A autenticar...
                                    </>
                                ) : (
                                    "Entrar"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground">
                    Acesso restrito a profissionais de saúde autorizados.
                </p>
                <p className="text-center text-xs text-muted-foreground">
                    Para criar uma conta, contacte o administrador do sistema.
                </p>
            </div>
        </div>
    );
}
