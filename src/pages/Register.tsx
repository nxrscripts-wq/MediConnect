import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Activity,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle2,
} from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/supabase";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
    { value: "medico", label: "Médico" },
    { value: "enfermeiro", label: "Enfermeiro" },
    { value: "farmaceutico", label: "Farmacêutico" },
    { value: "gestor", label: "Gestor" },
    { value: "admin", label: "Administrador" },
];

export default function Register() {
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState<UserRole | "">("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // Validation
        if (!fullName.trim() || !email.trim() || !password.trim() || !role) {
            setError("Preencha todos os campos obrigatórios.");
            return;
        }

        if (password.length < 6) {
            setError("A palavra-passe deve ter pelo menos 6 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            setError("As palavras-passe não coincidem.");
            return;
        }

        setIsLoading(true);
        const result = await signUp(email, password, fullName, role as UserRole);
        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
        }
    }

    // Success screen
    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="w-full max-w-sm space-y-6">
                    <div className="flex flex-col items-center gap-2">
                        <Activity className="h-10 w-10 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight">MediConnect</h1>
                    </div>

                    <Card className="border shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <CheckCircle2 className="h-12 w-12 text-green-500" />
                                <h2 className="text-lg font-semibold">Conta criada com sucesso!</h2>
                                <p className="text-sm text-muted-foreground">
                                    Verifique o seu e-mail para confirmar a conta antes de iniciar sessão.
                                </p>
                                <Button className="w-full" onClick={() => navigate("/login")}>
                                    Ir para o login
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
            <div className="w-full max-w-sm space-y-6">
                {/* Logo */}
                <div className="flex flex-col items-center gap-2">
                    <Activity className="h-10 w-10 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">MediConnect</h1>
                </div>

                {/* Card */}
                <Card className="border shadow-sm">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-lg">Criar conta</CardTitle>
                        <CardDescription>
                            Sistema Nacional de Saúde — Angola
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Nome completo</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="Ex: Dr. João Silva"
                                    autoComplete="name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>

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

                            {/* Role */}
                            <div className="space-y-2">
                                <Label htmlFor="role">Função</Label>
                                <Select
                                    value={role}
                                    onValueChange={(val) => setRole(val as UserRole)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Selecione a sua função" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLE_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Palavra-passe</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Mínimo 6 caracteres"
                                        autoComplete="new-password"
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
                                            showPassword
                                                ? "Ocultar palavra-passe"
                                                : "Mostrar palavra-passe"
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

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar palavra-passe</Label>
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Repita a palavra-passe"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                />
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
                                        A criar conta...
                                    </>
                                ) : (
                                    "Criar conta"
                                )}
                            </Button>

                            {/* Link to Login */}
                            <p className="text-center text-sm text-muted-foreground">
                                Já tem conta?{" "}
                                <Link
                                    to="/login"
                                    className="font-medium text-primary hover:underline"
                                >
                                    Entrar
                                </Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground">
                    Acesso restrito a profissionais de saúde autorizados.
                </p>
            </div>
        </div>
    );
}
