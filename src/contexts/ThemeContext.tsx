import React, { createContext, useContext, useEffect, useState } from "react";
import {
  THEME_STORAGE_KEY,
  applyTheme,
  readStoredPreference,
  resolveTheme,
  systemPrefersDark,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

interface ThemeContextType {
  /** Tema que está valendo agora (claro ou escuro). */
  theme: ResolvedTheme;
  /** O que o usuário escolheu: claro, escuro ou automático. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** Alterna entre claro e escuro (fica salvo como escolha manual). */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() => readStoredPreference());
  const [systemDark, setSystemDark] = useState<boolean>(() => systemPrefersDark());

  // Acompanha a preferência do aparelho (vale quando está em "automático").
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const theme = resolveTheme(preference, systemDark);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch (e) {
      console.warn("Could not save theme to localStorage", e);
    }
  }, [preference]);

  const toggleTheme = React.useCallback(() => {
    setPreference(theme === "light" ? "dark" : "light");
  }, [theme]);

  const value = React.useMemo(
    () => ({ theme, preference, setPreference, toggleTheme }),
    [theme, preference, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
