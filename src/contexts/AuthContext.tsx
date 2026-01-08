import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { hashPin, SignupFormData, LoginFormData, RecoveryFormData } from '@/lib/authUtils';

export type UserRole = 'adm_master' | 'admin' | 'pre_adm' | 'empresario' | 'user';

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
  userRole: UserRole;
  signUp: (data: SignupFormData) => Promise<{ success: boolean; message: string }>;
  signIn: (data: LoginFormData) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  signOut: () => Promise<void>;
  recoverPassword: (data: RecoveryFormData) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<void>;
  refetchRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('user');

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

  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase.rpc('get_user_role', {
        _user_id: userId
      });

      if (error) {
        console.error('Error fetching user role:', error);
        return 'user';
      }
      
      const role = (data as UserRole) || 'user';
      setUserRole(role);
      setIsAdmin(role === 'adm_master' || role === 'admin');
      return role;
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      return 'user';
    }
  }, []);

  const refetchRole = useCallback(async () => {
    if (user) {
      await fetchUserRole(user.id);
    }
  }, [user, fetchUserRole]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setUserRole('user');
        }
        
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchUserRole(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchUserRole]);

  const signUp = async (formData: SignupFormData): Promise<{ success: boolean; message: string }> => {
    try {
      const normalizedEmail = formData.email.toLowerCase().trim();

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingProfile) {
        return { success: false, message: 'Este email já está cadastrado' };
      }

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

      const pinHash = await hashPin(formData.recoveryPin);

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

  const signIn = async (formData: LoginFormData): Promise<{ success: boolean; message: string; role?: UserRole }> => {
    try {
      const normalizedEmail = formData.email.toLowerCase().trim();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.password,
      });

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

      // Atualizar last_login_at no profile
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('user_id', data.user.id);
      }

      // Buscar a role do usuário para redirecionamento
      let role: UserRole = 'user';
      if (data.user) {
        role = await fetchUserRole(data.user.id);
      }

      return { success: true, message: 'Login realizado com sucesso!', role };
    } catch (error) {
      console.error('SignIn error:', error);
      return { success: false, message: 'Erro ao fazer login' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
    setUserRole('user');
  };

  const recoverPassword = async (formData: RecoveryFormData): Promise<{ success: boolean; message: string }> => {
    try {
      const normalizedEmail = formData.email.toLowerCase().trim();
      const pinHash = await hashPin(formData.recoveryPin);

      const { data: userId, error: verifyError } = await supabase
        .rpc('verify_recovery_pin_enhanced', {
          _email: normalizedEmail,
          _pin_hash: pinHash,
          _full_name: formData.fullName,
          _birth_date: formData.birthDate,
        });

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
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.recoveryPin,
      });

      if (!signInError) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (!updateError) {
          await supabase.auth.signOut();
          return { success: true, message: 'Senha atualizada com sucesso! Faça login com sua nova senha.' };
        }
      }

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
      userRole,
      signUp,
      signIn,
      signOut,
      recoverPassword,
      signInWithGoogle,
      refetchRole,
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
