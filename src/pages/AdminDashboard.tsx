import { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, LayoutDashboard, Store, FileText, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import AdminDashboardHome from "./admin/AdminDashboardHome";
import AdminEstablishments from "./admin/AdminEstablishments";
import AdminEstablishmentForm from "./admin/AdminEstablishmentForm";
import AdminRequests from "./admin/AdminRequests";
import AdminConversations from "./admin/AdminConversations";
import AdminChat from "./admin/AdminChat";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/admin/login");
      return;
    }

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!adminUser) {
      await supabase.auth.signOut();
      toast.error("Acesso não autorizado");
      navigate("/admin/login");
      return;
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/20 p-4">
          <nav className="space-y-2">
            <Link to="/admin/dashboard">
              <Button 
                variant={location.pathname === "/admin/dashboard" ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/admin/dashboard/estabelecimentos">
              <Button 
                variant={isActive("/admin/dashboard/estabelecimentos") ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <Store className="mr-2 h-4 w-4" />
                Estabelecimentos
              </Button>
            </Link>
            <Link to="/admin/dashboard/solicitacoes">
              <Button 
                variant={isActive("/admin/dashboard/solicitacoes") ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <FileText className="mr-2 h-4 w-4" />
                Solicitações
              </Button>
            </Link>
            <Link to="/admin/dashboard/conversas">
              <Button 
                variant={isActive("/admin/dashboard/conversas") ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Conversas
              </Button>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Routes>
            <Route index element={<AdminDashboardHome />} />
            <Route path="estabelecimentos" element={<AdminEstablishments />} />
            <Route path="estabelecimentos/adicionar" element={<AdminEstablishmentForm />} />
            <Route path="estabelecimentos/editar/:id" element={<AdminEstablishmentForm />} />
            <Route path="solicitacoes" element={<AdminRequests />} />
            <Route path="conversas" element={<AdminConversations />} />
            <Route path="conversas/:id" element={<AdminChat />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
