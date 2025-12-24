import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = () => {
    try {
      const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
      const expiry = sessionStorage.getItem(ADMIN_SESSION_EXPIRY_KEY);
      
      if (token && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() < expiryTime) {
          setIsAdmin(true);
        } else {
          // Session expired
          clearSession();
        }
      }
    } catch (error) {
      console.error("Error checking session:", error);
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
      const { data, error } = await supabase.functions.invoke("validate-admin", {
        body: { password }
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
  }, []);

  const logout = React.useCallback(() => {
    clearSession();
  }, []);

  const validateSensitiveAction = React.useCallback(async (password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("validate-admin", {
        body: { password }
      });

      if (error) {
        return false;
      }

      return data.success === true;
    } catch (error) {
      console.error("Validation error:", error);
      return false;
    }
  }, []);

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
