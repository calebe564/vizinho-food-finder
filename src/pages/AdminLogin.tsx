import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import logo from "@/assets/logo.png";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading, login } = useAdmin();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAdmin) {
      navigate("/admin/dashboard");
    }
  }, [isAdmin, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error("Digite a senha administrativa");
      return;
    }

    setLoading(true);

    try {
      const result = await login(password);
      
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

  if (isLoading) {
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
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Área Administrativa</CardTitle>
            </div>
            <CardDescription className="text-center">
              Digite a senha administrativa para acessar o painel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha Administrativa</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Acesso restrito ao proprietário da plataforma
        </p>
      </div>
    </div>
  );
}