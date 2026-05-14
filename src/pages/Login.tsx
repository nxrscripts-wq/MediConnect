import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Activity, Eye, EyeOff, Loader2, CheckCircle2, Mail, ArrowLeft, Check, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Introduza a senha'),
});
type LoginValues = z.infer<typeof loginSchema>;

const registerSchema = z
  .object({
    full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
    email: z.string().email('Email inválido'),
    role: z.enum(['medico', 'enfermeiro', 'farmaceutico', 'gestor', 'admin'], {
      required_error: 'Seleccione um papel',
    }),
    health_unit_id: z.string().min(1, 'Seleccione uma unidade de saúde'),
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
type RegisterValues = z.infer<typeof registerSchema>;

const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
});
type ForgotValues = z.infer<typeof forgotSchema>;

// ---------------------------------------------------------------------------
// Role labels
// ---------------------------------------------------------------------------

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'medico', label: 'Médico(a)' },
  { value: 'enfermeiro', label: 'Enfermeiro(a)' },
  { value: 'farmaceutico', label: 'Farmacêutico(a)' },
  { value: 'gestor', label: 'Gestor(a)' },
  { value: 'admin', label: 'Administrador' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [healthUnits, setHealthUnits] = useState<{ id: string; name: string }[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  // --- Forms ---
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '', email: '', role: undefined as any,
      health_unit_id: '', password: '', confirm_password: '',
    },
  });

  const forgotForm = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  // --- Mode switching ---
  function changeMode(newMode: 'login' | 'register' | 'forgot') {
    setMode(newMode);
    setError(null);
    setIsLoading(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setRegisterSuccess(false);
    setForgotSuccess(false);
    loginForm.reset();
    registerForm.reset();
    forgotForm.reset();
  }

  // --- Load health units when switching to register ---
  useEffect(() => {
    if (mode !== 'register') return;
    setLoadingUnits(true);
    supabase
      .from('health_units')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setHealthUnits(data ?? []);
        setLoadingUnits(false);
      });
  }, [mode]);

  // --- Handlers ---
  const handleLogin = async (data: LoginValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn(data.email, data.password);
      if (result.error) {
        setError('Credenciais inválidas. Verifique o email e a senha.');
      } else {
        navigate(from, { replace: true });
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signUp(data.email, data.password, {
        full_name: data.full_name,
        role: data.role,
        health_unit_id: data.health_unit_id,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setRegisterEmail(data.email);
        setRegisterSuccess(true);
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (data: ForgotValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await resetPassword(data.email);
      if (result.error) {
        setError(result.error);
      } else {
        setForgotEmail(data.email);
        setForgotSuccess(true);
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Password requirements (for register mode) ---
  const watchedPassword = registerForm.watch('password') ?? '';
  const pwReqs = [
    { ok: watchedPassword.length >= 8, label: 'Mínimo 8 caracteres' },
    { ok: /[A-Z]/.test(watchedPassword), label: 'Uma letra maiúscula' },
    { ok: /[0-9]/.test(watchedPassword), label: 'Um número' },
  ];

  // --- Title / subtitle per mode ---
  const titles: Record<string, { title: string; subtitle: string }> = {
    login: { title: 'Entrar no sistema', subtitle: 'Sistema Nacional de Saúde — Angola' },
    register: { title: 'Criar conta', subtitle: 'Sistema Nacional de Saúde — Angola' },
    forgot: { title: 'Recuperar senha', subtitle: 'Introduza o seu email para receber o link de recuperação' },
  };

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
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-xl font-bold tracking-tight">
            {titles[mode].title}
          </CardTitle>
          <CardDescription className="text-xs uppercase tracking-widest font-semibold text-muted-foreground/70">
            {titles[mode].subtitle}
          </CardDescription>
          {/* Mode indicator dots */}
          <div className="flex justify-center gap-1.5 pt-2">
            {(['login', 'register', 'forgot'] as const).map((m) => (
              <div
                key={m}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  m === mode ? 'bg-primary' : 'bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* ─── LOGIN MODE ─── */}
          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              {error && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-xs text-destructive font-medium text-center animate-shake">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Institucional</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="utilizador@saude.gov.ao"
                  autoComplete="email"
                  className="bg-muted/30 focus-visible:ring-primary/20 border-border/50 h-11"
                  disabled={isLoading}
                  {...loginForm.register('email')}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-pw" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Palavra-passe</Label>
                <div className="relative">
                  <Input
                    id="login-pw"
                    type={showPassword ? 'text' : 'password'}
                    className="bg-muted/30 focus-visible:ring-primary/20 border-border/50 h-11 pr-10"
                    disabled={isLoading}
                    {...loginForm.register('password')}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => changeMode('forgot')} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Esqueceu a senha?
                </button>
              </div>
              <Button type="submit" className="w-full h-11 font-bold transition-all shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A autenticar...</> : 'Entrar'}
              </Button>
            </form>
          )}

          {/* ─── REGISTER MODE ─── */}
          {mode === 'register' && !registerSuccess && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-3">
              {error && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-xs text-destructive font-medium text-center">
                  {error}
                </div>
              )}
              {/* Full name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                <Input placeholder="Nome completo" className="bg-muted/30 border-border/50 h-10" disabled={isLoading} {...registerForm.register('full_name')} />
                {registerForm.formState.errors.full_name && <p className="text-xs text-destructive">{registerForm.formState.errors.full_name.message}</p>}
              </div>
              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input type="email" placeholder="email@saude.gov.ao" className="bg-muted/30 border-border/50 h-10" disabled={isLoading} {...registerForm.register('email')} />
                {registerForm.formState.errors.email && <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>}
              </div>
              {/* Role */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Papel no Sistema</Label>
                <Select
                  value={registerForm.watch('role') ?? ''}
                  onValueChange={(v) => registerForm.setValue('role', v as any, { shouldValidate: true })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="bg-muted/30 border-border/50 h-10">
                    <SelectValue placeholder="Seleccionar papel" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {registerForm.formState.errors.role && <p className="text-xs text-destructive">{registerForm.formState.errors.role.message}</p>}
              </div>
              {/* Health unit */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unidade de Saúde</Label>
                <Select
                  value={registerForm.watch('health_unit_id') ?? ''}
                  onValueChange={(v) => registerForm.setValue('health_unit_id', v, { shouldValidate: true })}
                  disabled={isLoading || loadingUnits}
                >
                  <SelectTrigger className="bg-muted/30 border-border/50 h-10">
                    <SelectValue placeholder={loadingUnits ? 'A carregar unidades...' : 'Seleccionar unidade'} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingUnits ? (
                      <SelectItem value="_loading" disabled>A carregar unidades...</SelectItem>
                    ) : healthUnits.length === 0 ? (
                      <SelectItem value="_empty" disabled>Sem unidades disponíveis</SelectItem>
                    ) : (
                      healthUnits.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {registerForm.formState.errors.health_unit_id && <p className="text-xs text-destructive">{registerForm.formState.errors.health_unit_id.message}</p>}
              </div>
              {/* Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Senha</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} className="bg-muted/30 border-border/50 h-10 pr-10" disabled={isLoading} {...registerForm.register('password')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.password && <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>}
                {/* Password requirements */}
                <div className="space-y-0.5 pt-1">
                  {pwReqs.map((r) => (
                    <div key={r.label} className="flex items-center gap-1.5">
                      {r.ok ? <Check className="h-3 w-3 text-emerald-500" /> : <X className="h-3 w-3 text-muted-foreground/40" />}
                      <span className={`text-[11px] ${r.ok ? 'text-emerald-600' : 'text-muted-foreground'}`}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirmar Senha</Label>
                <div className="relative">
                  <Input type={showConfirmPassword ? 'text' : 'password'} className="bg-muted/30 border-border/50 h-10 pr-10" disabled={isLoading} {...registerForm.register('confirm_password')} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.confirm_password && <p className="text-xs text-destructive">{registerForm.formState.errors.confirm_password.message}</p>}
              </div>
              <Button type="submit" className="w-full h-11 font-bold transition-all shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A processar...</> : 'Criar conta'}
              </Button>
            </form>
          )}

          {/* ─── REGISTER SUCCESS ─── */}
          {mode === 'register' && registerSuccess && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="bg-emerald-500/10 p-3 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Conta criada com sucesso!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enviámos um email de confirmação para{' '}
                  <span className="font-semibold text-foreground">{registerEmail}</span>.
                  <br />
                  Verifique a sua caixa de entrada e clique no link para activar a sua conta antes de fazer login.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Se não receber o email em 5 minutos, verifique a pasta de spam.
                </p>
              </div>
              <Button onClick={() => changeMode('login')} className="w-full h-11 font-bold">
                Ir para o login
              </Button>
            </div>
          )}

          {/* ─── FORGOT MODE ─── */}
          {mode === 'forgot' && !forgotSuccess && (
            <form onSubmit={forgotForm.handleSubmit(handleForgot)} className="space-y-4">
              {error && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-xs text-destructive font-medium text-center">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input type="email" placeholder="email@saude.gov.ao" className="bg-muted/30 border-border/50 h-11" disabled={isLoading} {...forgotForm.register('email')} />
                {forgotForm.formState.errors.email && <p className="text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full h-11 font-bold transition-all shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A enviar...</> : 'Enviar link de recuperação'}
              </Button>
            </form>
          )}

          {/* ─── FORGOT SUCCESS ─── */}
          {mode === 'forgot' && forgotSuccess && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Mail className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Email enviado!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enviámos um link de recuperação para{' '}
                  <span className="font-semibold text-foreground">{forgotEmail}</span>.
                  <br />
                  Clique no link do email para definir uma nova senha.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  O link expira em 1 hora. Se não receber o email, verifique a pasta de spam.
                </p>
              </div>
              <Button onClick={() => changeMode('login')} className="w-full h-11 font-bold">
                Voltar ao login
              </Button>
              <button
                type="button"
                onClick={() => setForgotSuccess(false)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Reenviar email
              </button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t pt-5">
          {mode === 'login' && (
            <p className="text-sm text-muted-foreground text-center">
              Não tem conta?{' '}
              <button type="button" onClick={() => changeMode('register')} className="text-primary font-semibold hover:underline">
                Criar conta
              </button>
            </p>
          )}
          {mode === 'register' && !registerSuccess && (
            <p className="text-sm text-muted-foreground text-center">
              Já tem conta?{' '}
              <button type="button" onClick={() => changeMode('login')} className="text-primary font-semibold hover:underline">
                Entrar
              </button>
            </p>
          )}
          {mode === 'forgot' && !forgotSuccess && (
            <button
              type="button"
              onClick={() => changeMode('login')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Voltar ao login
            </button>
          )}
          <p className="text-[10px] text-center text-muted-foreground/60 font-medium">
            Acesso restrito a profissionais de saúde autorizados pela Direcção Nacional de Saúde.
          </p>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center space-y-1 opacity-50">
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">MINSA — Ministério da Saúde</p>
        <p className="text-[10px] text-muted-foreground">República de Angola</p>
      </div>
    </div>
  );
}
