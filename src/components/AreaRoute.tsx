import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAccess } from '@/hooks/useAccess';
import { canAccess, type Area } from '@/config/areas';

interface AreaRouteProps {
  /** Área protegida: "comerciante" ou "admin". */
  area: Exclude<Area, 'consumidor'>;
  children: React.ReactNode;
}

const DENIED_MESSAGE: Record<AreaRouteProps['area'], string> = {
  comerciante: 'O painel do comerciante é só para quem tem uma empresa cadastrada e aprovada.',
  admin: 'Esta área é restrita à equipe administrativa.',
};

function DeniedRedirect({ to, area }: { to: string; area: AreaRouteProps['area'] }) {
  useEffect(() => {
    toast.info(DENIED_MESSAGE[area]);
  }, [area]);
  return <Navigate to={to} replace />;
}

/**
 * Guarda de rota por área. Sem login, vai para o login e volta para cá depois.
 * Logado sem permissão, vai para a página inicial da própria área da pessoa.
 * Isto organiza a navegação; a proteção dos dados é feita pelo banco (RLS).
 */
export function AreaRoute({ area, children }: AreaRouteProps) {
  const location = useLocation();
  const { user, isLoading, profile, home } = useAccess();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" aria-hidden="true" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!canAccess(area, profile)) {
    return <DeniedRedirect to={home} area={area} />;
  }

  return <>{children}</>;
}
