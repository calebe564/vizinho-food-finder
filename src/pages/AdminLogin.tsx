import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, Mail, Lock } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const ADMIN_EMAIL = "comerciovizinho1@gmail.com";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading, login } = useAdmin();
  const { isAuthenticated, user, isLoading: authLoading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"login" | "admin-password">("login");

  const isAdminEmail = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      navigate("/admin/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    // If user is logged in with admin email, go to step 2
    if (isAuthenticated && isAdminEmail) {
      setStep("admin-password");
    } else if (isAuthenticated && !isAdminEmail) {
      // User is logged in but not with admin email
      toast.error("Este email não tem permissão de administrador");
      setStep("login");
    } else {
      setStep("login");
    }
  }, [isAuthenticated, isAdminEmail]);

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !userPassword.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      toast.error("Este email não tem permissão de administrador");
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, userPassword);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Login realizado! Agora digite a senha administrativa.");
        setStep("admin-password");
      }
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminPassword.trim()) {
      toast.error("Digite a senha administrativa");
      return;
    }

    setLoading(true);

    try {
      const result = await login(adminPassword);
      
      if (result.success) {
        toast.success("Acesso autorizado!");
        navigate("/admin/dashboard");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erro ao verificar senha");
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            <CardTitle className="text-2xl text-center">Área Administrativa</CardTitle>
            <CardDescription className="text-center">
              {step === "login" 
                ? "Faça login com a conta de administrador" 
                : "Digite a senha administrativa para continuar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "login" ? (
              <form onSubmit={handleUserLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email do Administrador</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-password">Senha da Conta</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="user-password"
                      type="password"
                      placeholder="••••••••"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verificando..." : "Continuar"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-3 mb-4">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium">Logado como administrador</p>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Senha Administrativa</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verificando..." : "Acessar Painel"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Acesso restrito ao proprietário da plataforma
        </p>
      </div>
    </div>
  );
}
