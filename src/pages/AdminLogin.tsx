import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAdmin: isAdminSession, isLoading: adminLoading, login } = useAdmin();
  const { user, isAdmin: hasAdminRole, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!adminLoading && isAdminSession) {
      navigate('/admin/dashboard');
    }
  }, [isAdminSession, adminLoading, navigate]);

  // Auto-redirect if user is admin and already has session
  useEffect(() => {
    if (!authLoading && user && hasAdminRole && isAdminSession) {
      navigate('/admin/dashboard');
    }
  }, [user, hasAdminRole, isAdminSession, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Digite a senha administrativa');
      return;
    }
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }
    if (!hasAdminRole) {
      toast.error('Sem permissão de administrador');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await login(password);
      if (result.success) {
        toast.success(result.message);
        navigate('/admin/dashboard');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Erro ao fazer login');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (adminLoading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // If user is not logged in at all, redirect to auth
  if (!user) {
    return (
      <>
        <Helmet><title>Painel Administrativo | Comércio Vizinho</title></Helmet>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md border-0 shadow-elevated rounded-3xl">
            <CardHeader className="text-center">
              <img src={logo} alt="Logo" className="h-16 w-16 rounded-2xl mx-auto mb-4" />
              <CardTitle>Painel Administrativo</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2 text-amber-600"><AlertTriangle className="h-4 w-4" />Login necessário</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full"><Link to="/auth" state={{ from: '/admin/login' }}>Fazer Login</Link></Button>
              <Button variant="outline" asChild className="w-full"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // If user doesn't have admin role
  if (!hasAdminRole) {
    return (
      <>
        <Helmet><title>Acesso Restrito | Comércio Vizinho</title></Helmet>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md border-0 shadow-elevated rounded-3xl">
            <CardHeader className="text-center">
              <img src={logo} alt="Logo" className="h-16 w-16 rounded-2xl mx-auto mb-4" />
              <CardTitle>Acesso Restrito</CardTitle>
              <CardDescription className="text-destructive flex items-center justify-center gap-2"><AlertTriangle className="h-4 w-4" />Área exclusiva para administradores</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Voltar ao início</Link></Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Admin user - show password confirmation
  return (
    <>
      <Helmet><title>Painel Administrativo | Comércio Vizinho</title></Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-0 shadow-elevated rounded-3xl">
          <CardHeader className="text-center">
            <img src={logo} alt="Logo" className="h-16 w-16 rounded-2xl mx-auto mb-4" />
            <CardTitle className="flex items-center justify-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" />Painel Administrativo</CardTitle>
            <CardDescription>Confirme sua senha para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha Administrativa</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" autoFocus />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</> : 'Acessar Painel'}
              </Button>
              <Button variant="outline" asChild className="w-full"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
