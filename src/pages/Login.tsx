import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Activity, Eye, EyeOff, Loader2, CheckCircle2, Mail, ArrowLeft, Check, X, ShieldCheck, FileText, Info, Circle, AlertCircle
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

  // --- Title / subtitle per mode ---
  const titles: Record<string, { title: string; subtitle: string }> = {
    login: { title: 'Entrar no sistema', subtitle: 'Sistema Nacional de Saúde — Angola' },
    register: { title: 'Criar conta', subtitle: 'Sistema Nacional de Saúde — Angola' },
    forgot: { title: 'Recuperar senha', subtitle: 'Introduza o seu email para receber o link de recuperação' },
  };

  if (mode === 'register') {
    if (registerSuccess) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 py-12 px-4 animate-fade-in">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl shadow-primary/5 flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 ring-8 ring-emerald-500/10 mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Conta criada com sucesso!</h2>
            <div className="mt-3 px-4 py-1.5 bg-primary/10 rounded-full">
              <span className="text-sm font-medium text-primary">{registerEmail}</span>
            </div>
            <div className="h-px bg-border w-full my-6" />
            <div className="w-full text-left space-y-4">
              <h3 className="text-sm font-semibold mb-3">Próximos passos</h3>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</div>
                <div>
                  <h4 className="text-sm font-medium">Verifique o seu email</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Enviámos um link de confirmação para o seu email. Clique no link para activar a conta.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">2</div>
                <div>
                  <h4 className="text-sm font-medium">Aguarde a aprovação</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Um administrador irá validar os seus dados e activar o acesso ao sistema.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">3</div>
                <div>
                  <h4 className="text-sm font-medium">Aceda ao sistema</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Após activação, poderá fazer login com o seu email e senha.</p>
                </div>
              </div>
            </div>
            <div className="mt-6 w-full p-3 bg-muted/50 rounded-lg border flex gap-3 text-left">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">Não recebeu o email? Verifique a pasta de spam ou lixo electrónico.</p>
            </div>
            <Button variant="outline" className="mt-6 w-full h-11" onClick={() => changeMode('login')}>
              Ir para o login
            </Button>
          </div>
        </div>
      );
    }

    let score = 0;
    if (watchedPassword.length > 0) {
      if (watchedPassword.length < 8) score = 1;
      else {
        const hasUpper = /[A-Z]/.test(watchedPassword);
        const hasNumber = /[0-9]/.test(watchedPassword);
        if (!hasUpper && !hasNumber) score = 2;
        else if (hasUpper && hasNumber && watchedPassword.length >= 12) score = 4;
        else score = 3;
      }
    }

    const pwColors = [
      ['bg-muted', 'bg-muted', 'bg-muted', 'bg-muted'],
      ['bg-destructive', 'bg-muted', 'bg-muted', 'bg-muted'],
      ['bg-amber-500', 'bg-amber-500', 'bg-muted', 'bg-muted'],
      ['bg-primary', 'bg-primary', 'bg-primary', 'bg-muted'],
      ['bg-emerald-500', 'bg-emerald-500', 'bg-emerald-500', 'bg-emerald-500'],
    ];
    const pwLabels = ["", "Senha fraca", "Senha razoável", "Senha boa", "Senha forte"];
    const pwLabelColors = ["", "text-destructive", "text-amber-600", "text-primary", "text-emerald-600"];

    const pwReqs2 = [
      { ok: watchedPassword.length >= 8, label: 'Pelo menos 8 caracteres' },
      { ok: /[A-Z]/.test(watchedPassword), label: 'Uma letra maiúscula' },
      { ok: /[0-9]/.test(watchedPassword), label: 'Um número' },
      { ok: /[^A-Za-z0-9]/.test(watchedPassword), label: 'Um caractere especial (recomendado)' },
    ];

    return (
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-gray-50 animate-fade-in">
        <div className="md:hidden flex flex-col items-center py-8 px-6 bg-[#0e7490] text-white text-center pb-12">
          <div className="bg-white/10 p-3 rounded-2xl mb-3">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">MediConnect</h1>
          <p className="text-xs text-white/70 mt-1">Sistema Nacional de Saúde — Angola</p>
        </div>

        <div className="hidden md:flex flex-col bg-[#0e7490] h-screen sticky top-0 overflow-y-auto w-[30%] lg:w-[40%] text-white">
          <div className="pt-12 px-6 lg:px-10">
            <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/20 shadow-2xl">
              <Activity className="h-10 w-10 text-[#0e7490]" />
            </div>
            <div className="text-xs font-bold tracking-[0.2em] text-white/70 mt-4">REPÚBLICA DE ANGOLA</div>
            <div className="text-sm font-medium text-white/90 mt-1">Ministério da Saúde</div>
            <div className="h-px bg-white/20 my-6 mx-0" />
            <div className="text-2xl font-bold text-white mt-0">MediConnect</div>
            <div className="text-sm text-white/80 mt-1 leading-relaxed">Sistema Nacional de Gestão de Saúde</div>
            
            <div className="hidden lg:block mt-10">
              <h3 className="text-base font-semibold text-white mb-4">Acesso para Profissionais de Saúde</h3>
              <div className="space-y-3">
                {[
                  "Gestão integrada de pacientes e prontuários",
                  "Acesso ao Registo Nacional de Saúde",
                  "Boletins epidemiológicos e relatórios oficiais",
                  "Coordenação entre unidades sanitárias"
                ].map(text => (
                  <div key={text} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-white/70 shrink-0 mt-0.5" />
                    <span className="text-sm text-white/80 leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-auto pb-10 px-6 lg:px-10">
            <div className="h-px bg-white/20 mb-6" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-white/60 shrink-0" />
              <span className="text-xs text-white/60">Sistema protegido e sujeito a auditoria</span>
            </div>
            <div className="text-xs text-white/50 mt-1 ml-7">Uso exclusivo de profissionais autorizados pelo MINSA</div>
          </div>
        </div>

        <div className="w-full md:w-[70%] lg:w-[60%] bg-gray-50 overflow-y-auto min-h-screen relative">
          <div className="max-w-xl mx-auto px-6 md:px-8 py-8 md:py-10 bg-gray-50 rounded-t-3xl -mt-4 md:mt-0 relative z-10">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2 mb-6" onClick={() => changeMode('login')}>
              <ArrowLeft className="h-4 w-4" /> Voltar ao login
            </Button>
            
            <h2 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight">Criar conta institucional</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Preencha os dados abaixo para solicitar acesso ao sistema.
            </p>
            
            <div className="h-px bg-border mt-6 mb-8" />

            <form onSubmit={registerForm.handleSubmit(handleRegister)}>
              {error && (
                <div className="mb-6 flex gap-3 items-start border border-destructive/20 bg-destructive/5 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span className="text-sm text-destructive font-medium">{error}</span>
                </div>
              )}

              {/* SECÇÃO 1 */}
              <div role="group" aria-labelledby="sec1" className="mb-8">
                <div className="flex items-center gap-2 mb-4" id="sec1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                  <span className="text-sm font-semibold text-foreground">Identificação Profissional</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name" className="text-xs font-bold uppercase text-muted-foreground">Nome completo</Label>
                    <Input id="reg-name" placeholder="Ex: Dr. João Manuel da Silva" className="bg-white border-border/50 h-11" disabled={isLoading} {...registerForm.register('full_name')} />
                    {registerForm.formState.errors.full_name && <p role="alert" className="text-xs text-destructive">{registerForm.formState.errors.full_name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-xs font-bold uppercase text-muted-foreground">Email institucional</Label>
                    <Input id="reg-email" type="email" placeholder="utilizador@saude.gov.ao" className="bg-white border-border/50 h-11" disabled={isLoading} {...registerForm.register('email')} />
                    {registerForm.formState.errors.email && <p role="alert" className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Use o email institucional do MINSA ou da sua unidade sanitária</p>
                  </div>
                </div>
              </div>

              {/* SECÇÃO 2 */}
              <div role="group" aria-labelledby="sec2" className="mb-8">
                <div className="flex items-center gap-2 mb-4" id="sec2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                  <span className="text-sm font-semibold text-foreground">Função e Unidade</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Papel no sistema</Label>
                    <Select value={registerForm.watch('role') ?? ''} onValueChange={(v) => registerForm.setValue('role', v as any, { shouldValidate: true })} disabled={isLoading}>
                      <SelectTrigger aria-label="Seleccionar papel" className="bg-white border-border/50 h-11">
                        <SelectValue placeholder="Seleccione o seu papel" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {registerForm.formState.errors.role && <p role="alert" className="text-xs text-destructive">{registerForm.formState.errors.role.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Unidade sanitária</Label>
                    <Select value={registerForm.watch('health_unit_id') ?? ''} onValueChange={(v) => registerForm.setValue('health_unit_id', v, { shouldValidate: true })} disabled={isLoading || loadingUnits}>
                      <SelectTrigger aria-label="Seleccionar unidade" className="bg-white border-border/50 h-11">
                        <SelectValue placeholder={loadingUnits ? 'A carregar...' : 'Seleccione a sua unidade'} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingUnits ? <SelectItem value="_loading" disabled>A carregar...</SelectItem> : healthUnits.length === 0 ? <SelectItem value="_empty" disabled>Sem unidades disponíveis</SelectItem> : healthUnits.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {registerForm.formState.errors.health_unit_id && <p role="alert" className="text-xs text-destructive">{registerForm.formState.errors.health_unit_id.message}</p>}
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    A sua conta ficará associada à unidade seleccionada. Apenas terá acesso aos dados da sua unidade sanitária.
                  </p>
                </div>
              </div>

              {/* SECÇÃO 3 */}
              <div role="group" aria-labelledby="sec3" className="mb-6">
                <div className="flex items-center gap-2 mb-4" id="sec3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                  <span className="text-sm font-semibold text-foreground">Credenciais de Acesso</span>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-pw" className="text-xs font-bold uppercase text-muted-foreground">Senha</Label>
                    <div className="relative">
                      <Input id="reg-pw" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" className="bg-white border-border/50 h-11 pr-10" disabled={isLoading} {...registerForm.register('password')} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && <p role="alert" className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>}
                    
                    {watchedPassword.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${pwColors[score][i]}`} />)}
                        </div>
                        <p className={`text-xs mt-1 font-medium ${pwLabelColors[score]}`}>{pwLabels[score]}</p>
                      </div>
                    )}
                    
                    <div className="mt-3 space-y-1.5">
                      {pwReqs2.map((r) => (
                        <div key={r.label} className="flex items-center gap-2">
                          {r.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 transition-colors duration-200" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground transition-colors duration-200" />}
                          <span className={`text-xs transition-colors duration-200 ${r.ok ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-cpw" className="text-xs font-bold uppercase text-muted-foreground">Confirmar Senha</Label>
                    <div className="relative">
                      <Input id="reg-cpw" type={showConfirmPassword ? 'text' : 'password'} placeholder="Repita a senha" className="bg-white border-border/50 h-11 pr-10" disabled={isLoading} {...registerForm.register('confirm_password')} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.confirm_password && <p role="alert" className="text-xs text-destructive">{registerForm.formState.errors.confirm_password.message}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ao criar esta conta, confirma que é um profissional de saúde autorizado e que os dados introduzidos são verídicos. O acesso indevido a este sistema é punível nos termos da legislação angolana.
                </p>
              </div>

              <Button type="submit" className="w-full h-11 mt-6 font-bold" aria-busy={isLoading} disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A criar conta...</> : <><ShieldCheck className="mr-2 h-4 w-4" /> Criar conta institucional</>}
              </Button>
            </form>

            <div className="mt-auto pt-8 border-t border-border/50 mt-12 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} MediConnect · República de Angola · Ministério da Saúde
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-gray-50 animate-fade-in">
      {/* Mobile Header */}
      <div className="md:hidden flex flex-col items-center py-8 px-6 bg-[#0e7490] text-white text-center pb-12">
        <div className="bg-white/10 p-3 rounded-2xl mb-3">
          <Activity className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">MediConnect</h1>
        <p className="text-xs text-white/70 mt-1">Sistema Nacional de Saúde — Angola</p>
      </div>

      {/* Desktop Left Panel */}
      <div className="hidden md:flex flex-col bg-[#0e7490] h-screen sticky top-0 overflow-y-auto w-[30%] lg:w-[40%] text-white">
        <div className="pt-12 px-6 lg:px-10">
          <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/20 shadow-2xl">
            <Activity className="h-10 w-10 text-[#0e7490]" />
          </div>
          <div className="text-xs font-bold tracking-[0.2em] text-white/70 mt-4">REPÚBLICA DE ANGOLA</div>
          <div className="text-sm font-medium text-white/90 mt-1">Ministério da Saúde</div>
          <div className="h-px bg-white/20 my-6 mx-0" />
          <div className="text-2xl font-bold text-white mt-0">MediConnect</div>
          <div className="text-sm text-white/80 mt-1 leading-relaxed">Sistema Nacional de Gestão de Saúde</div>
          
          <div className="hidden lg:block mt-10">
            <h3 className="text-base font-semibold text-white mb-4">Acesso para Profissionais de Saúde</h3>
            <div className="space-y-3">
              {[
                "Gestão integrada de pacientes e prontuários",
                "Acesso ao Registo Nacional de Saúde",
                "Boletins epidemiológicos e relatórios oficiais",
                "Coordenação entre unidades sanitárias"
              ].map(text => (
                <div key={text} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-white/70 shrink-0 mt-0.5" />
                  <span className="text-sm text-white/80 leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-auto pb-10 px-6 lg:px-10">
          <div className="h-px bg-white/20 mb-6" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-white/60 shrink-0" />
            <span className="text-xs text-white/60">Sistema protegido e sujeito a auditoria</span>
          </div>
          <div className="text-xs text-white/50 mt-1 ml-7">Uso exclusivo de profissionais autorizados pelo MINSA</div>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full md:w-[70%] lg:w-[60%] bg-gray-50 overflow-y-auto min-h-screen relative flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto px-6 md:px-8 py-8 md:py-10 bg-gray-50 rounded-t-3xl -mt-4 md:mt-0 relative z-10">
          <h2 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight">{titles[mode].title}</h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{titles[mode].subtitle}</p>
          
          <div className="h-px bg-border mt-6 mb-8" />

          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
              {error && (
                <div className="flex gap-3 items-start border border-destructive/20 bg-destructive/5 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span className="text-sm text-destructive font-medium">{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-bold uppercase text-muted-foreground">Email Institucional</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="utilizador@saude.gov.ao"
                  autoComplete="email"
                  className="bg-white border-border/50 h-11"
                  disabled={isLoading}
                  {...loginForm.register('email')}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-pw" className="text-xs font-bold uppercase text-muted-foreground">Palavra-passe</Label>
                <div className="relative">
                  <Input
                    id="login-pw"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Introduza a sua senha"
                    className="bg-white border-border/50 h-11 pr-10"
                    disabled={isLoading}
                    {...loginForm.register('password')}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => changeMode('forgot')} className="text-xs font-semibold text-primary hover:underline transition-colors">
                  Esqueceu a senha?
                </button>
              </div>
              <Button type="submit" className="w-full h-11 mt-2 font-bold" aria-busy={isLoading} disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A autenticar...</> : 'Entrar no sistema'}
              </Button>
            </form>
          )}

          {mode === 'forgot' && !forgotSuccess && (
            <form onSubmit={forgotForm.handleSubmit(handleForgot)} className="space-y-5">
              {error && (
                <div className="flex gap-3 items-start border border-destructive/20 bg-destructive/5 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span className="text-sm text-destructive font-medium">{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-xs font-bold uppercase text-muted-foreground">Email Institucional</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="email@saude.gov.ao"
                  className="bg-white border-border/50 h-11"
                  disabled={isLoading}
                  {...forgotForm.register('email')}
                />
                {forgotForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full h-11 mt-2 font-bold" aria-busy={isLoading} disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A enviar...</> : 'Enviar link de recuperação'}
              </Button>
            </form>
          )}

          {mode === 'forgot' && forgotSuccess && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5 mb-2">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Email enviado!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed px-4">
                  Enviámos um link de recuperação para <br/>
                  <span className="font-semibold text-primary">{forgotEmail}</span>.
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Clique no link do email para definir uma nova senha. O link expira em 1 hora.
                </p>
              </div>
              <div className="mt-6 w-full p-3 bg-muted/50 rounded-lg border flex gap-3 text-left">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">Se não receber o email em 5 minutos, verifique a pasta de spam ou tente novamente.</p>
              </div>
              <Button onClick={() => setForgotSuccess(false)} variant="outline" className="w-full h-11 mt-2">
                Reenviar email
              </Button>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-border/50 flex flex-col items-center gap-4">
            {mode === 'login' && (
              <p className="text-center text-xs text-muted-foreground">
                Para criar uma conta, contacte o administrador do sistema.
              </p>
            )}
            {mode === 'forgot' && !forgotSuccess && (
              <button
                type="button"
                onClick={() => changeMode('login')}
                className="text-sm text-muted-foreground hover:text-primary font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar ao login
              </button>
            )}
            
            {mode === 'forgot' && forgotSuccess && (
              <Button onClick={() => changeMode('login')} className="w-full h-11 font-bold">
                Voltar ao login
              </Button>
            )}
          </div>
          
          <div className="mt-8 text-center text-[10px] text-muted-foreground/60 font-medium">
            <p>Acesso restrito a profissionais de saúde autorizados.</p>
            <p className="mt-1">© {new Date().getFullYear()} MINSA — Ministério da Saúde</p>
          </div>
        </div>
      </div>
    </div>
  );}
