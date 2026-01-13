import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    // Se já está autenticado como admin, redirecionar para dashboard
    if (!authLoading && !roleLoading && user && isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não está logado, redirecionar para auth
  if (!user) {
    return (
      <>
        <Helmet><title>Painel Administrativo | Comércio Vizinho</title></Helmet>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md border-0 shadow-elevated rounded-3xl">
            <CardHeader className="text-center">
              <img src={logo} alt="Logo" className="h-16 w-16 rounded-2xl mx-auto mb-4" />
              <CardTitle>Painel Administrativo</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                Login necessário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/auth" state={{ from: '/admin/dashboard' }}>Fazer Login</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Se está logado mas não é admin
  if (!isAdmin) {
    return (
      <>
        <Helmet><title>Acesso Restrito | Comércio Vizinho</title></Helmet>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md border-0 shadow-elevated rounded-3xl">
            <CardHeader className="text-center">
              <img src={logo} alt="Logo" className="h-16 w-16 rounded-2xl mx-auto mb-4" />
              <CardTitle>Acesso Restrito</CardTitle>
              <CardDescription className="text-destructive flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Área exclusiva para administradores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Voltar ao início</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // É admin - redirecionar para dashboard
  return (
    <>
      <Helmet><title>Painel Administrativo | Comércio Vizinho</title></Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-0 shadow-elevated rounded-3xl">
          <CardHeader className="text-center">
            <img src={logo} alt="Logo" className="h-16 w-16 rounded-2xl mx-auto mb-4" />
            <CardTitle className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Painel Administrativo
            </CardTitle>
            <CardDescription>Redirecionando...</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
