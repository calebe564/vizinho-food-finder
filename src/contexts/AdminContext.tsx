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
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas (igual ao servidor)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const clearSession = React.useCallback(() => {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
    } catch (e) {
      console.warn("Could not clear session", e);
    }
    setIsAdmin(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        if (!user) {
          clearSession();
          return;
        }

        const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
        const expiry = sessionStorage.getItem(ADMIN_SESSION_EXPIRY_KEY);

        if (!token || !expiry || Date.now() >= parseInt(expiry, 10)) {
          clearSession();
          return;
        }

        // O servidor confere a sessão (amarrada a este usuário). Se a validação
        // falhar por qualquer motivo, NÃO damos acesso: o admin entra de novo.
        const { data, error } = await supabase.functions.invoke("validate-admin", {
          body: { action: "validate_session", token },
        });

        if (cancelled) return;
        if (!error && data?.valid) {
          setIsAdmin(true);
        } else {
          clearSession();
        }
      } catch (error) {
        console.error("Error checking session:", error);
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [user, clearSession]);

  const login = React.useCallback(async (password: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) {
        return { success: false, message: "Usuário não autenticado" };
      }

      const { data, error } = await supabase.functions.invoke("validate-admin", {
        body: { action: "login", password },
      });

      if (error) {
        console.error("Login error:", error);
        return { success: false, message: "Erro ao verificar senha" };
      }

      if (data?.success && data.sessionToken) {
        try {
          sessionStorage.setItem(ADMIN_SESSION_KEY, data.sessionToken);
          sessionStorage.setItem(ADMIN_SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION).toString());
        } catch (e) {
          console.warn("Could not save session", e);
        }
        setIsAdmin(true);
        return { success: true, message: data.message };
      }

      return { success: false, message: data?.message || data?.error || "Senha incorreta" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Erro de conexão" };
    }
  }, [user]);

  const logout = React.useCallback(async () => {
    try {
      const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (token) {
        await supabase.functions.invoke("validate-admin", {
          body: { action: "logout", token },
        });
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
    clearSession();
  }, [clearSession]);

  // Confere só a senha (ações sensíveis), sem criar uma nova sessão.
  const validateSensitiveAction = React.useCallback(async (password: string): Promise<boolean> => {
    try {
      if (!user) return false;

      const { data, error } = await supabase.functions.invoke("validate-admin", {
        body: { action: "verify", password },
      });

      if (error) return false;
      return data?.success === true;
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
