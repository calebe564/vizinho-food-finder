import { useEffect } from "react";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, LayoutDashboard, Store, FileText, MessageSquare, Megaphone, Users, Crown, Loader2, ClipboardCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import AdminDashboardHome from "./admin/AdminDashboardHome";
import AdminEstablishments from "./admin/AdminEstablishments";
import AdminEstablishmentForm from "./admin/AdminEstablishmentForm";
import AdminRequests from "./admin/AdminRequests";
import AdminConversations from "./admin/AdminConversations";
import AdminChat from "./admin/AdminChat";
import AdminAdvertisements from "./admin/AdminAdvertisements";
import AdminUsers from "./admin/AdminUsers";
import AdminClaims from "./admin/AdminClaims";

const roleLabels = {
  adm_master: 'ADM Master',
  admin: 'ADM Secundário',
  pre_adm: 'ADM Secundário',
  empresario: 'Empresário',
  user: 'Usuário comum'
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const { role, isAdmMaster, canApproveEstablishments, isLoading: roleLoading } = useUserRole();

  const handleLogout = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Painel Administrativo
              </h1>
              <Badge variant="outline" className={
                isAdmMaster 
                  ? 'bg-purple-500/10 text-purple-700 border-purple-200' 
                  : 'bg-blue-500/10 text-blue-700 border-blue-200'
              }>
                {isAdmMaster && <Crown className="h-3 w-3 mr-1" />}
                {roleLabels[role] || role}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {profile && (
                <span className="text-sm text-muted-foreground hidden md:inline">
                  {profile.full_name}
                </span>
              )}
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
            
            {/* Estabelecimentos - todos admin podem ver */}
            <Link to="/admin/dashboard/estabelecimentos">
              <Button 
                variant={isActive("/admin/dashboard/estabelecimentos") ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <Store className="mr-2 h-4 w-4" />
                Estabelecimentos
              </Button>
            </Link>
            
            {/* Solicitações - apenas quem pode aprovar */}
            {canApproveEstablishments && (
              <Link to="/admin/dashboard/solicitacoes">
                <Button 
                  variant={isActive("/admin/dashboard/solicitacoes") ? "default" : "ghost"} 
                  className="w-full justify-start"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Solicitações
                </Button>
              </Link>
            )}
            
            {/* Conversas */}
            <Link to="/admin/dashboard/conversas">
              <Button 
                variant={isActive("/admin/dashboard/conversas") ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Conversas
              </Button>
            </Link>
            
            {/* Propagandas - apenas admin completo */}
            {canApproveEstablishments && (
              <Link to="/admin/dashboard/propagandas">
                <Button 
                  variant={isActive("/admin/dashboard/propagandas") ? "default" : "ghost"} 
                  className="w-full justify-start"
                >
                  <Megaphone className="mr-2 h-4 w-4" />
                  Propagandas
                </Button>
              </Link>
            )}
            
            {/* Reivindicações de CNPJ - apenas quem pode aprovar */}
            {canApproveEstablishments && (
              <Link to="/admin/dashboard/reivindicacoes">
                <Button 
                  variant={isActive("/admin/dashboard/reivindicacoes") ? "default" : "ghost"} 
                  className="w-full justify-start"
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Reivindicações
                </Button>
              </Link>
            )}
            
            {/* Gerenciar Usuários - apenas ADM_MASTER */}
            {isAdmMaster && (
              <Link to="/admin/dashboard/usuarios">
                <Button 
                  variant={isActive("/admin/dashboard/usuarios") ? "default" : "ghost"} 
                  className="w-full justify-start"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Usuários
                </Button>
              </Link>
            )}
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
            <Route path="propagandas" element={<AdminAdvertisements />} />
            <Route path="reivindicacoes" element={<AdminClaims />} />
            <Route path="usuarios" element={<AdminUsers />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
