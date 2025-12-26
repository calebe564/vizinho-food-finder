import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Eye, EyeOff, Loader2, UserPlus, LogIn, KeyRound } from 'lucide-react';
import { signupSchema, loginSchema, recoverySchema } from '@/lib/authUtils';
import { z } from 'zod';

type AuthTab = 'login' | 'signup' | 'recovery';

export default function Auth() {
  const { user, isLoading, signUp, signIn, recoverPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get redirect path from state
  const from = (location.state as { from?: string })?.from || '/';

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    recoveryPin: '' 
  });
  const [recoveryForm, setRecoveryForm] = useState({ 
    email: '', 
    recoveryPin: '', 
    newPassword: '',
    confirmNewPassword: '' 
  });

  // Form errors
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [recoveryErrors, setRecoveryErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    
    try {
      loginSchema.parse(loginForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) errors[err.path[0] as string] = err.message;
        });
        setLoginErrors(errors);
        return;
      }
    }

    setIsSubmitting(true);
    const result = await signIn(loginForm);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    
    try {
      signupSchema.parse(signupForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) errors[err.path[0] as string] = err.message;
        });
        setSignupErrors(errors);
        return;
      }
    }

    setIsSubmitting(true);
    const result = await signUp(signupForm);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      setActiveTab('login');
      setSignupForm({ fullName: '', email: '', password: '', confirmPassword: '', recoveryPin: '' });
    } else {
      toast.error(result.message);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryErrors({});
    
    try {
      recoverySchema.parse(recoveryForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) errors[err.path[0] as string] = err.message;
        });
        setRecoveryErrors(errors);
        return;
      }
    }

    setIsSubmitting(true);
    const result = await recoverPassword(recoveryForm);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      setActiveTab('login');
      setRecoveryForm({ email: '', recoveryPin: '', newPassword: '', confirmNewPassword: '' });
    } else {
      toast.error(result.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Entrar | Comércio Vizinho</title>
        <meta name="description" content="Faça login ou crie sua conta para cadastrar empresas" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0 shadow-elevated rounded-3xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">Comércio Vizinho</CardTitle>
              <CardDescription>
                Acesse sua conta ou crie uma nova
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AuthTab)}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="login" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Entrar</span>
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Criar</span>
                  </TabsTrigger>
                  <TabsTrigger value="recovery" className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    <span className="hidden sm:inline">Recuperar</span>
                  </TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        className={loginErrors.email ? 'border-destructive' : ''}
                      />
                      {loginErrors.email && (
                        <p className="text-sm text-destructive">{loginErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                          className={loginErrors.password ? 'border-destructive pr-10' : 'pr-10'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {loginErrors.password && (
                        <p className="text-sm text-destructive">{loginErrors.password}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        'Entrar'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nome completo</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome"
                        value={signupForm.fullName}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className={signupErrors.fullName ? 'border-destructive' : ''}
                      />
                      {signupErrors.fullName && (
                        <p className="text-sm text-destructive">{signupErrors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                        className={signupErrors.email ? 'border-destructive' : ''}
                      />
                      {signupErrors.email && (
                        <p className="text-sm text-destructive">{signupErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          value={signupForm.password}
                          onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                          className={signupErrors.password ? 'border-destructive pr-10' : 'pr-10'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {signupErrors.password && (
                        <p className="text-sm text-destructive">{signupErrors.password}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirmar senha</Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Repita a senha"
                          value={signupForm.confirmPassword}
                          onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className={signupErrors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {signupErrors.confirmPassword && (
                        <p className="text-sm text-destructive">{signupErrors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-pin">PIN de recuperação (4-6 dígitos)</Label>
                      <Input
                        id="signup-pin"
                        type="password"
                        placeholder="Ex: 1234"
                        maxLength={6}
                        value={signupForm.recoveryPin}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, recoveryPin: e.target.value.replace(/\D/g, '') }))}
                        className={signupErrors.recoveryPin ? 'border-destructive' : ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        Guarde esse PIN! Ele será usado para recuperar sua senha.
                      </p>
                      {signupErrors.recoveryPin && (
                        <p className="text-sm text-destructive">{signupErrors.recoveryPin}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Criar conta'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Recovery Tab */}
                <TabsContent value="recovery">
                  <form onSubmit={handleRecovery} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recovery-email">Email</Label>
                      <Input
                        id="recovery-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={recoveryForm.email}
                        onChange={(e) => setRecoveryForm(prev => ({ ...prev, email: e.target.value }))}
                        className={recoveryErrors.email ? 'border-destructive' : ''}
                      />
                      {recoveryErrors.email && (
                        <p className="text-sm text-destructive">{recoveryErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recovery-pin">PIN de recuperação</Label>
                      <Input
                        id="recovery-pin"
                        type="password"
                        placeholder="Seu PIN de 4-6 dígitos"
                        maxLength={6}
                        value={recoveryForm.recoveryPin}
                        onChange={(e) => setRecoveryForm(prev => ({ ...prev, recoveryPin: e.target.value.replace(/\D/g, '') }))}
                        className={recoveryErrors.recoveryPin ? 'border-destructive' : ''}
                      />
                      {recoveryErrors.recoveryPin && (
                        <p className="text-sm text-destructive">{recoveryErrors.recoveryPin}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recovery-new-password">Nova senha</Label>
                      <div className="relative">
                        <Input
                          id="recovery-new-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          value={recoveryForm.newPassword}
                          onChange={(e) => setRecoveryForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className={recoveryErrors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {recoveryErrors.newPassword && (
                        <p className="text-sm text-destructive">{recoveryErrors.newPassword}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recovery-confirm">Confirmar nova senha</Label>
                      <div className="relative">
                        <Input
                          id="recovery-confirm"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Repita a nova senha"
                          value={recoveryForm.confirmNewPassword}
                          onChange={(e) => setRecoveryForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                          className={recoveryErrors.confirmNewPassword ? 'border-destructive pr-10' : 'pr-10'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {recoveryErrors.confirmNewPassword && (
                        <p className="text-sm text-destructive">{recoveryErrors.confirmNewPassword}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Recuperando...
                        </>
                      ) : (
                        'Redefinir senha'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    </>
  );
}
