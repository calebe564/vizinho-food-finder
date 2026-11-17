import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'adm_master' | 'admin' | 'pre_adm' | 'empresario' | 'user';

interface UseUserRoleReturn {
  role: UserRole;
  isLoading: boolean;
  isAdmMaster: boolean;
  isAdmin: boolean;
  isPreAdm: boolean;
  isEmpresario: boolean;
  canApproveEstablishments: boolean;
  canManageRoles: boolean;
  refetch: () => Promise<void>;
}

export function useUserRole(): UseUserRoleReturn {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = useCallback(async (isStale: () => boolean = () => false) => {
    if (!user) {
      setRole('user');
      setIsLoading(false);
      return;
    }

    // Enquanto a role do novo usuário carrega, as rotas protegidas devem esperar
    // (antes, isLoading ficava false e um admin podia ser mandado para a home).
    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_user_role', {
        _user_id: user.id
      });
      if (isStale()) return;

      if (error) {
        console.error('Error fetching user role:', error);
        setRole('user');
      } else {
        setRole((data as UserRole) || 'user');
      }
    } catch (err) {
      if (isStale()) return;
      console.error('Error in fetchRole:', err);
      setRole('user');
    } finally {
      if (!isStale()) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    fetchRole(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fetchRole]);

  const isAdmMaster = role === 'adm_master';
  const isAdmin = role === 'admin' || role === 'adm_master';
  const isPreAdm = role === 'pre_adm';
  const isEmpresario = role === 'empresario';
  const canApproveEstablishments = isAdmMaster || role === 'admin';
  const canManageRoles = isAdmMaster;

  return {
    role,
    isLoading,
    isAdmMaster,
    isAdmin,
    isPreAdm,
    isEmpresario,
    canApproveEstablishments,
    canManageRoles,
    refetch: () => fetchRole(),
  };
}
