import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  validateSensitiveAction: (password: string) => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | null>(null);

const ADMIN_SESSION_KEY = "admin_session_token";
const ADMIN_SESSION_EXPIRY_KEY = "admin_session_expiry";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    checkSession();
  }, [user]);

  const checkSession = async () => {
    try {
      // First check if user is authenticated
      if (!user) {
        clearSession();
        setIsLoading(false);
        return;
      }

      const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
      const expiry = sessionStorage.getItem(ADMIN_SESSION_EXPIRY_KEY);
      
      if (token && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() < expiryTime) {
          // Validate session on server
          try {
            const { data, error } = await supabase.functions.invoke("validate-admin", {
              body: { password: token, action: 'validate_session' }
            });
            
            if (!error && data?.valid) {
              setIsAdmin(true);
            } else {
              // Session invalid on server - clear local session
              clearSession();
            }
          } catch {
            // Fallback to database role check
            const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
              _user_id: user.id
            });
            
            if (!roleError && (roleData === 'adm_master' || roleData === 'admin')) {
              setIsAdmin(true);
            } else {
              clearSession();
            }
          }
        } else {
          // Session expired locally
          clearSession();
        }
      }
    } catch (error) {
      console.error("Error checking session:", error);
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
    } catch (e) {
      console.warn("Could not clear session", e);
    }
    setIsAdmin(false);
  };

  const login = React.useCallback(async (password: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Ensure user is authenticated before attempting admin login
      if (!user) {
        return { success: false, message: "Usuário não autenticado" };
      }

      // Get current session for authorization header
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke("validate-admin", {
        body: { password },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined
      });

      if (error) {
        console.error("Login error:", error);
        return { success: false, message: "Erro ao verificar senha" };
      }

      if (data.success && data.sessionToken) {
        try {
          sessionStorage.setItem(ADMIN_SESSION_KEY, data.sessionToken);
          sessionStorage.setItem(ADMIN_SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION).toString());
        } catch (e) {
          console.warn("Could not save session", e);
        }
        setIsAdmin(true);
        return { success: true, message: data.message };
      }

      return { success: false, message: data.message || "Senha incorreta" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Erro de conexão" };
    }
  }, [user]);

  const logout = React.useCallback(async () => {
    try {
      const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (token) {
        // Revoke session on server
        await supabase.functions.invoke("validate-admin", {
          body: { password: token, action: 'logout' }
        });
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
    clearSession();
  }, []);

  const validateSensitiveAction = React.useCallback(async (password: string): Promise<boolean> => {
    try {
      // Ensure user is authenticated
      if (!user) {
        return false;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke("validate-admin", {
        body: { password },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined
      });

      if (error) {
        return false;
      }

      return data.success === true;
    } catch (error) {
      console.error("Validation error:", error);
      return false;
    }
  }, [user]);

  const value = React.useMemo(() => ({
    isAdmin,
    isLoading,
    login,
    logout,
    validateSensitiveAction
  }), [isAdmin, isLoading, login, logout, validateSensitiveAction]);

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
