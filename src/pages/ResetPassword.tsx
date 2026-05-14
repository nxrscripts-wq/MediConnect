import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import {
  Activity, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, Check, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';

/*
 * SUPABASE CONFIGURATION REQUIRED:
 * 1. Dashboard → Authentication → URL Configuration
 *    Site URL: https://medi-connect-vert.vercel.app
 *    Redirect URLs:
 *      https://medi-connect-vert.vercel.app/login
 *      https://medi-connect-vert.vercel.app/reset-password
 *
 * 2. Dashboard → Authentication → Email Templates
 *    Ensure "Reset password" template is active with correct redirect
 *
 * 3. Dashboard → Authentication → Providers → Email
 *    Ensure "Enable email confirmations" is active
 */

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Deve conter pelo menos um número'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'As senhas não coincidem',
    path: ['confirm_password'],
  });
type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm_password: '' },
  });

  // Check if the user has an active session from the email link
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });

    // Listen for PASSWORD_RECOVERY event when Supabase processes the token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const watchedPassword = form.watch('password') ?? '';
  const pwReqs = [
    { ok: watchedPassword.length >= 8, label: 'Mínimo 8 caracteres' },
    { ok: /[A-Z]/.test(watchedPassword), label: 'Uma letra maiúscula' },
    { ok: /[0-9]/.test(watchedPassword), label: 'Um número' },
  ];

  const handleSubmit = async (data: ResetValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) {
        const msgs: Record<string, string> = {
          'New password should be different from the old password.': 'A nova senha deve ser diferente da senha anterior.',
          'Auth session missing!': 'Sessão expirada. Solicite um novo link de recuperação.',
        };
        setError(msgs[error.message] ?? error.message);
      } else {
        setSuccess(true);
        await supabase.auth.signOut();
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking session
  if (hasSession === null) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-4">A verificar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8 gap-3">
        <div className="bg-primary/10 p-3 rounded-2xl">
          <Activity className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">MediConnect</h1>
      </div>

      <Card className="w-full max-w-sm border-border/50 shadow-xl shadow-primary/5">
        {/* ─── NO SESSION (invalid/expired link) ─── */}
        {!hasSession && !success && (
          <>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl font-bold">Link inválido</CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest font-semibold text-muted-foreground/70">
                Recuperação de senha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="bg-destructive/10 p-3 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-destructive/60" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold">Link inválido ou expirado</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    O link de recuperação que utilizou já não é válido.
                    <br />
                    Solicite um novo link na página de login.
                  </p>
                </div>
                <Button onClick={() => navigate('/login')} className="w-full h-11 font-bold">
                  Ir para o login
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* ─── RESET FORM ─── */}
        {hasSession && !success && (
          <>
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-xl font-bold tracking-tight">Definir nova senha</CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest font-semibold text-muted-foreground/70">
                Introduza a sua nova senha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {error && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-xs text-destructive font-medium text-center">
                    {error}
                  </div>
                )}
                {/* Password */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      className="bg-muted/30 border-border/50 h-11 pr-10"
                      disabled={isLoading}
                      {...form.register('password')}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
                  <div className="space-y-0.5 pt-1">
                    {pwReqs.map((r) => (
                      <div key={r.label} className="flex items-center gap-1.5">
                        {r.ok ? <Check className="h-3 w-3 text-emerald-500" /> : <X className="h-3 w-3 text-muted-foreground/40" />}
                        <span className={`text-[11px] ${r.ok ? 'text-emerald-600' : 'text-muted-foreground'}`}>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Confirm */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      className="bg-muted/30 border-border/50 h-11 pr-10"
                      disabled={isLoading}
                      {...form.register('confirm_password')}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.confirm_password && <p className="text-xs text-destructive">{form.formState.errors.confirm_password.message}</p>}
                </div>
                <Button type="submit" className="w-full h-11 font-bold transition-all shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A guardar...</> : 'Guardar nova senha'}
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {/* ─── SUCCESS STATE ─── */}
        {success && (
          <>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl font-bold">Senha actualizada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="bg-emerald-500/10 p-3 rounded-full">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">Senha actualizada com sucesso!</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pode agora fazer login com a sua nova senha.
                  </p>
                </div>
                <Button onClick={() => navigate('/login')} className="w-full h-11 font-bold">
                  Ir para o login
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      <div className="mt-8 text-center space-y-1 opacity-50">
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">MINSA — Ministério da Saúde</p>
        <p className="text-[10px] text-muted-foreground">República de Angola</p>
      </div>
    </div>
  );
}
