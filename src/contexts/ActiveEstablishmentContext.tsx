import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUserEstablishments, UserEstablishment } from '@/hooks/useUserEstablishments';

interface ActiveEstablishmentContextType {
  activeEstablishment: UserEstablishment | null;
  setActiveEstablishment: (est: UserEstablishment) => void;
  establishments: UserEstablishment[];
  count: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const ActiveEstablishmentContext = createContext<ActiveEstablishmentContextType | undefined>(undefined);

export function ActiveEstablishmentProvider({ children }: { children: React.ReactNode }) {
  const { establishments, isLoading, count, refetch } = useUserEstablishments();
  const [activeEstablishment, setActiveEstablishmentState] = useState<UserEstablishment | null>(null);

  // Auto-select first establishment when loaded
  useEffect(() => {
    if (!isLoading && establishments.length > 0 && !activeEstablishment) {
      // Try to restore from sessionStorage
      const savedId = sessionStorage.getItem('activeEstablishmentId');
      const found = savedId ? establishments.find(e => e.establishment_id === savedId) : null;
      setActiveEstablishmentState(found || establishments[0]);
    }
    if (!isLoading && establishments.length === 0) {
      setActiveEstablishmentState(null);
    }
  }, [establishments, isLoading]);

  const setActiveEstablishment = useCallback((est: UserEstablishment) => {
    setActiveEstablishmentState(est);
    sessionStorage.setItem('activeEstablishmentId', est.establishment_id);
  }, []);

  return (
    <ActiveEstablishmentContext.Provider value={{
      activeEstablishment,
      setActiveEstablishment,
      establishments,
      count,
      isLoading,
      refetch,
    }}>
      {children}
    </ActiveEstablishmentContext.Provider>
  );
}

export function useActiveEstablishment() {
  const context = useContext(ActiveEstablishmentContext);
  if (context === undefined) {
    throw new Error('useActiveEstablishment must be used within an ActiveEstablishmentProvider');
  }
  return context;
}
