import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function RoleBasedRoute({ 
  children, 
  allowedRoles,
  redirectTo = "/auth" 
}: RoleBasedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Redirecionar baseado na role do usuário
    const redirectPath = getRedirectForRole(role);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

export function getRedirectForRole(role: UserRole): string {
  switch (role) {
    case 'adm_master':
      return '/admin/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'pre_adm':
      return '/admin/dashboard';
    case 'empresario':
      return '/minha-empresa';
    case 'user':
    default:
      return '/';
  }
}
