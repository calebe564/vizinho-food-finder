import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Eye, EyeOff, Loader2, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { loginSchema, recoverySchema } from '@/lib/authUtils';
import { enhancedSignupSchema, validateEmailDomain } from '@/lib/validationUtils';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { homeForRole } from '@/config/areas';
import { BrandLogo } from '@/components/BrandLogo';

export default function Auth() {
  const { user, isLoading, signUp, signIn, recoverPassword, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mode, setMode] = useState<'login' | 'signup' | 'recovery'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [saveLogin, setSaveLogin] = useState(false);

  const from = (location.state as { from?: string })?.from || '/';

  // Form states - carregar email salvo do localStorage
  const [loginForm, setLoginForm] = useState(() => {
    const savedEmail = localStorage.getItem('comercio_vizinho_saved_email');
    return { email: savedEmail || '', password: '' };
  });
  const [signupForm, setSignupForm] = useState({ 
    fullName: '', 
    birthDate: '',
    favoriteColor: '',
    email: '', 
    password: '', 
    confirmPassword: '',
    recoveryPin: '' 
  });
  const [recoveryForm, setRecoveryForm] = useState({ 
    email: '', 
    fullName: '',
    birthDate: '',
    recoveryPin: '', 
    newPassword: '',
    confirmNewPassword: '' 
  });

  // Form errors
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [recoveryErrors, setRecoveryErrors] = useState<Record<string, string>>({});

  // Carregar preferência de salvar login
  useEffect(() => {
    const savedEmail = localStorage.getItem('comercio_vizinho_saved_email');
    if (savedEmail) {
      setSaveLogin(true);
    }
  }, []);

  useEffect(() => {
    if (user && userRole) {
      // Redirecionar baseado na role do usuário
      const redirectPath = homeForRole(userRole);
      navigate(redirectPath, { replace: true });
    }
  }, [user, userRole, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    setShowRecoveryPrompt(false);
    
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
      // Salvar ou remover email do localStorage
      if (saveLogin) {
        localStorage.setItem('comercio_vizinho_saved_email', loginForm.email.toLowerCase().trim());
      } else {
        localStorage.removeItem('comercio_vizinho_saved_email');
      }
      toast.success(result.message);
      setLoginFailed(false);
      
      // Redirecionar baseado na role retornada
      if (result.role) {
        const redirectPath = homeForRole(result.role);
        navigate(redirectPath, { replace: true });
      }
    } else {
      toast.error(result.message);
      setLoginFailed(true);
      setShowRecoveryPrompt(true);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    
    try {
      enhancedSignupSchema.parse(signupForm);
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
      setMode('login');
      setSignupForm({ fullName: '', birthDate: '', favoriteColor: '', email: '', password: '', confirmPassword: '', recoveryPin: '' });
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
      setMode('login');
      setRecoveryForm({ email: '', fullName: '', birthDate: '', recoveryPin: '', newPassword: '', confirmNewPassword: '' });
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
        <title>{mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Recuperar Senha'} | Comércio Vizinho</title>
        <meta name="description" content="Faça login ou crie sua conta no Comércio Vizinho" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0 shadow-elevated rounded-3xl">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <BrandLogo size="lg" />
              </div>
              <CardTitle className="sr-only">Comércio Vizinho</CardTitle>
              <CardDescription>
                {mode === 'login' && 'Entre na sua conta'}
                {mode === 'signup' && 'Crie sua conta'}
                {mode === 'recovery' && 'Recupere sua senha'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Login Form */}
              {mode === 'login' && (
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

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="save-login"
                      checked={saveLogin}
                      onCheckedChange={(checked) => setSaveLogin(checked === true)}
                    />
                    <Label htmlFor="save-login" className="text-sm font-normal cursor-pointer">
                      Salvar login neste dispositivo
                    </Label>
                  </div>

                  {showRecoveryPrompt && loginFailed && (
                    <Alert variant="destructive" className="bg-destructive/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="flex flex-col gap-2">
                        <span>Email ou senha incorretos.</span>
                        <Button 
                          type="button" 
                          variant="link" 
                          className="p-0 h-auto text-destructive underline"
                          onClick={() => {
                            setMode('recovery');
                            setRecoveryForm(prev => ({ ...prev, email: loginForm.email }));
                          }}
                        >
                          Deseja recuperar sua senha?
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Entrar
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <Button 
                      type="button" 
                      variant="link" 
                      onClick={() => setMode('signup')}
                      className="text-sm"
                    >
                      Não tem conta? Criar conta
                    </Button>
                  </div>
                </form>
              )}

              {/* Signup Form */}
              {mode === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome completo *</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, fullName: e.target.value }))}
                      className={signupErrors.fullName ? 'border-destructive' : ''}
                    />
                    {signupErrors.fullName && (
                      <p className="text-sm text-destructive">{signupErrors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-birthdate">Data de nascimento *</Label>
                    <Input
                      id="signup-birthdate"
                      type="date"
                      value={signupForm.birthDate}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, birthDate: e.target.value }))}
                      className={signupErrors.birthDate ? 'border-destructive' : ''}
                    />
                    {signupErrors.birthDate && (
                      <p className="text-sm text-destructive">{signupErrors.birthDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-color">Cor favorita *</Label>
                    <Input
                      id="signup-color"
                      type="text"
                      placeholder="Ex: Azul"
                      value={signupForm.favoriteColor}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, favoriteColor: e.target.value }))}
                      className={signupErrors.favoriteColor ? 'border-destructive' : ''}
                    />
                    {signupErrors.favoriteColor && (
                      <p className="text-sm text-destructive">{signupErrors.favoriteColor}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
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
                    <Label htmlFor="signup-password">Senha principal *</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 8 caracteres"
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
                    <PasswordStrengthIndicator password={signupForm.password} />
                    {signupErrors.password && (
                      <p className="text-sm text-destructive">{signupErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmar senha *</Label>
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
                    <Label htmlFor="signup-pin">Senha secundária (PIN de recuperação) *</Label>
                    <Input
                      id="signup-pin"
                      type="password"
                      placeholder="Usada para recuperar acesso"
                      value={signupForm.recoveryPin}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, recoveryPin: e.target.value }))}
                      className={signupErrors.recoveryPin ? 'border-destructive' : ''}
                    />
                    <p className="text-xs text-muted-foreground">
                      Guarde essa senha! Será usada para recuperar seu acesso.
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
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Criar conta
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <Button 
                      type="button" 
                      variant="link" 
                      onClick={() => setMode('login')}
                      className="text-sm"
                    >
                      Já tem conta? Entrar
                    </Button>
                  </div>
                </form>
              )}

              {/* Recovery Form */}
              {mode === 'recovery' && (
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
                    <Label htmlFor="recovery-name">Nome completo</Label>
                    <Input
                      id="recovery-name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={recoveryForm.fullName}
                      onChange={(e) => setRecoveryForm(prev => ({ ...prev, fullName: e.target.value }))}
                      className={recoveryErrors.fullName ? 'border-destructive' : ''}
                    />
                    {recoveryErrors.fullName && (
                      <p className="text-sm text-destructive">{recoveryErrors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recovery-birthdate">Data de nascimento</Label>
                    <Input
                      id="recovery-birthdate"
                      type="date"
                      value={recoveryForm.birthDate}
                      onChange={(e) => setRecoveryForm(prev => ({ ...prev, birthDate: e.target.value }))}
                      className={recoveryErrors.birthDate ? 'border-destructive' : ''}
                    />
                    {recoveryErrors.birthDate && (
                      <p className="text-sm text-destructive">{recoveryErrors.birthDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recovery-pin">Senha secundária (PIN)</Label>
                    <Input
                      id="recovery-pin"
                      type="password"
                      placeholder="Sua senha secundária"
                      value={recoveryForm.recoveryPin}
                      onChange={(e) => setRecoveryForm(prev => ({ ...prev, recoveryPin: e.target.value }))}
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
                        Verificando...
                      </>
                    ) : (
                      'Redefinir senha'
                    )}
                  </Button>

                  <div className="text-center">
                    <Button 
                      type="button" 
                      variant="link" 
                      onClick={() => setMode('login')}
                      className="text-sm"
                    >
                      Voltar ao login
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
}
