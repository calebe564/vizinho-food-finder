import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useEstablishmentRequest } from '@/hooks/useEstablishmentRequest';
import { useActiveEstablishment } from '@/contexts/ActiveEstablishmentContext';
import { accessibleAreas, homeFor, type AccessProfile } from '@/config/areas';

/** Quem é a pessoa para fins de navegação: função, se tem empresa, áreas e página inicial. */
export function useAccess() {
  const { user, isLoading: authLoading } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();
  const { hasApprovedRequest, isLoading: requestLoading } = useEstablishmentRequest();
  const { count, isLoading: establishmentsLoading } = useActiveEstablishment();

  const hasBusiness = !!user && (role === 'empresario' || hasApprovedRequest || count > 0);
  const isLoading = authLoading || (!!user && (roleLoading || requestLoading || establishmentsLoading));

  return useMemo(() => {
    const profile: AccessProfile = { role, hasBusiness };
    return { user, isLoading, profile, areas: accessibleAreas(profile), home: homeFor(profile) };
  }, [user, isLoading, role, hasBusiness]);
}
