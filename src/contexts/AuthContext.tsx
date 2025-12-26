import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { hashPin, SignupFormData, LoginFormData, RecoveryFormData } from '@/lib/authUtils';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  birth_date?: string;
  favorite_color?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signUp: (data: SignupFormData) => Promise<{ success: boolean; message: string }>;
  signIn: (data: LoginFormData) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  recoverPassword: (data: RecoveryFormData) => Promise<{ success: boolean; message: string }>;
  // Keep Google sign in available in code but not exposed in UI
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      // Verificar se é admin ou adm_master
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['admin', 'adm_master'])
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error checking admin role:', err);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdminRole(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, checkAdminRole]);

  const signUp = async (formData: SignupFormData): Promise<{ success: boolean; message: string }> => {
    try {
      // Normalizar email: lowercase e sem espaços
      const normalizedEmail = formData.email.toLowerCase().trim();

      // Check if email already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingProfile) {
        return { success: false, message: 'Este email já está cadastrado' };
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { success: false, message: authError.message };
      }

      if (!authData.user) {
        return { success: false, message: 'Erro ao criar usuário' };
      }

      // Hash the recovery PIN
      const pinHash = await hashPin(formData.recoveryPin);

      // Create profile with all fields (email já está normalizado acima)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          full_name: formData.fullName,
          email: normalizedEmail,
          recovery_pin_hash: pinHash,
          birth_date: formData.birthDate,
          favorite_color: formData.favoriteColor,
        });

      if (profileError) {
        console.error('Profile error:', profileError);
        return { success: false, message: 'Erro ao criar perfil: ' + profileError.message };
      }

      return { success: true, message: 'Conta criada com sucesso!' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Erro ao criar conta' };
    }
  };

  const signIn = async (formData: LoginFormData): Promise<{ success: boolean; message: string }> => {
    try {
      // Normalizar email: lowercase e sem espaços
      const normalizedEmail = formData.email.toLowerCase().trim();

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.password,
      });

      // Registrar tentativa de login
      await supabase.from('login_attempts').insert({
        email: normalizedEmail,
        success: !error,
        user_agent: navigator.userAgent,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, message: 'Email ou senha incorretos' };
        }
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Login realizado com sucesso!' };
    } catch (error) {
      console.error('SignIn error:', error);
      return { success: false, message: 'Erro ao fazer login' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
  };

  const recoverPassword = async (formData: RecoveryFormData): Promise<{ success: boolean; message: string }> => {
    try {
      // Normalizar email: lowercase e sem espaços
      const normalizedEmail = formData.email.toLowerCase().trim();

      // Hash the provided PIN
      const pinHash = await hashPin(formData.recoveryPin);

      // Verify all data matches using the enhanced function
      const { data: userId, error: verifyError } = await supabase
        .rpc('verify_recovery_pin_enhanced', {
          _email: normalizedEmail,
          _pin_hash: pinHash,
          _full_name: formData.fullName,
          _birth_date: formData.birthDate,
        });

      // Log the attempt
      await supabase.from('recovery_attempts').insert({
        email: normalizedEmail,
        success: !!userId,
      });

      if (verifyError || !userId) {
        return { 
          success: false, 
          message: 'Dados de recuperação incorretos. Verifique email, nome, data de nascimento e senha secundária.' 
        };
      }

      // Since we verified the user, we can try to update the password
      // For this to work, we need to use service role or admin API
      // For MVP, we'll inform the user that they can now login with new credentials
      // by using the updateUser method if they're logged in
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.recoveryPin, // Try with recovery pin as temporary auth
      });

      if (!signInError) {
        // If they can sign in, update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (!updateError) {
          await supabase.auth.signOut();
          return { success: true, message: 'Senha atualizada com sucesso! Faça login com sua nova senha.' };
        }
      }

      // If we can't automatically update, inform user
      return { 
        success: false, 
        message: 'Dados verificados, mas não foi possível atualizar automaticamente. Entre em contato com o administrador.' 
      };
    } catch (error) {
      console.error('Recovery error:', error);
      return { success: false, message: 'Erro ao recuperar senha' };
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile,
      isLoading, 
      isAdmin,
      signUp,
      signIn,
      signOut,
      recoverPassword,
      signInWithGoogle 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
