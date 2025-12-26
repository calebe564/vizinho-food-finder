import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { hashPin, SignupFormData, LoginFormData, RecoveryFormData } from '@/lib/authUtils';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
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
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
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
          // Defer data fetching to avoid deadlock
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
      // Check if email already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingProfile) {
        return { success: false, message: 'Este email já está cadastrado' };
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
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

      // Create profile with recovery PIN
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          recovery_pin_hash: pinHash,
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
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
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
      // Hash the provided PIN
      const pinHash = await hashPin(formData.recoveryPin);

      // Verify PIN matches
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, recovery_pin_hash')
        .eq('email', formData.email)
        .maybeSingle();

      if (!profileData) {
        return { success: false, message: 'Email não encontrado' };
      }

      if (profileData.recovery_pin_hash !== pinHash) {
        return { success: false, message: 'PIN de recuperação incorreto' };
      }

      // Sign in with a temporary session to update password
      // First, we need to use the admin API or a workaround
      // Since we can't directly update password without being signed in,
      // we'll use a different approach: store the new password hash request
      
      // For now, we'll use updateUser if the user can be authenticated
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) {
        // If user is not signed in, we need to handle this differently
        // For MVP, inform user to contact support or use a different flow
        return { 
          success: false, 
          message: 'Para redefinir sua senha, faça login primeiro ou entre em contato com o suporte' 
        };
      }

      return { success: true, message: 'Senha atualizada com sucesso!' };
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
