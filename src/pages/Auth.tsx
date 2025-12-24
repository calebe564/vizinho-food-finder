import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordInput } from "@/components/PasswordInput";
import { 
  validatePassword, 
  isLockedOut, 
  recordFailedAttempt, 
  clearLoginAttempts,
  getLoginAttempts,
  MAX_LOGIN_ATTEMPTS
} from "@/lib/passwordValidation";
import logo from "@/assets/logo.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Auth() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, signIn, signUp, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const checkLockout = (): boolean => {
    const lockout = isLockedOut();
    if (lockout.locked) {
      toast.error(`Conta bloqueada. Tente novamente em ${lockout.remainingTime} minutos.`);
      return true;
    }
    return false;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (checkLockout()) return;
    
    if (!email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        recordFailedAttempt();
        const attempts = getLoginAttempts();
        const remaining = MAX_LOGIN_ATTEMPTS - attempts.count;
        
        if (error.message.includes("Invalid login credentials")) {
          if (remaining > 0) {
            toast.error(`Email ou senha incorretos. ${remaining} tentativas restantes.`);
          } else {
            toast.error("Conta bloqueada por 15 minutos devido a múltiplas tentativas incorretas.");
          }
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Confirme seu email antes de fazer login. Verifique sua caixa de entrada.");
        } else {
          toast.error(error.message);
        }
      } else {
        clearLoginAttempts();
        toast.success("Login realizado com sucesso!");
        navigate("/");
      }
    } catch (error) {
      recordFailedAttempt();
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast.error("Senha não atende aos requisitos de segurança");
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este email já está cadastrado. Tente fazer login.");
          setActiveTab("login");
        } else if (error.message.includes("Password")) {
          toast.error("A senha não atende aos requisitos mínimos de segurança.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Conta criada com sucesso! Você já está logado.");
        navigate("/");
      }
    } catch (error) {
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Digite seu email");
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        toast.error("Erro ao enviar email de recuperação. Verifique se o email está correto.");
      } else {
        setResetEmailSent(true);
        toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      }
    } catch (error) {
      toast.error("Erro ao processar solicitação.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Forgot password view
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            onClick={() => {
              setShowForgotPassword(false);
              setResetEmailSent(false);
            }}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <img 
                  src={logo} 
                  alt="Comércio Vizinho" 
                  className="h-20 w-20 object-contain"
                />
              </div>
              <CardTitle className="text-2xl text-center">Recuperar Senha</CardTitle>
              <CardDescription className="text-center">
                Digite seu email para receber instruções de recuperação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetEmailSent ? (
                <Alert className="border-green-500 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">
                    Email enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar Email de Recuperação"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <img 
                src={logo} 
                alt="Comércio Vizinho" 
                className="h-20 w-20 object-contain"
              />
            </div>
            <CardTitle className="text-2xl text-center">Bem-vindo</CardTitle>
            <CardDescription className="text-center">
              Faça login ou crie sua conta para desbloquear funcionalidades extras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <PasswordInput
                    id="login-password"
                    label="Senha"
                    value={password}
                    onChange={setPassword}
                    required
                    showRequirements={false}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="link" 
                    className="w-full text-sm"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Esqueceu sua senha?
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <Alert className="border-primary/50 bg-primary/5">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-xs">
                      Para sua segurança, a senha deve ser forte e única.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <PasswordInput
                    id="signup-password"
                    label="Senha"
                    value={password}
                    onChange={setPassword}
                    placeholder="Crie uma senha forte"
                    required
                    showRequirements={true}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !validatePassword(password).isValid}
                  >
                    {loading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">
          O login libera funcionalidades extras como ver telefones e contato WhatsApp
        </p>
      </div>
    </div>
  );
}
