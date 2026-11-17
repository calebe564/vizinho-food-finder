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

// Os dados do cadastro viajam nos metadados do usuário só até o perfil ser criado;
// depois são apagados dos metadados (eles também vão dentro do token de login).
async function scrubPendingProfileMetadata() {
  try {
    await supabase.auth.updateUser({
      data: { recovery_pin_hash: null, birth_date: null, favorite_color: null },
    });
  } catch (err) {
    console.warn('Could not clear pending profile metadata', err);
  }
}

/** Lê a mensagem de erro devolvida por uma edge function (respostas não-2xx). */
async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  try {
    const ctx = (error as { context?: Response })?.context;
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.json();
      if (body && typeof body.error === 'string') return body.error;
    }
  } catch {
    // usa a mensagem padrão
  }
  return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('user');

  const fetchProfile = useCallback(async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as UserProfile);
        return;
      }

      // Cadastro feito com confirmação de e-mail: o perfil ainda não existe.
      // Cria agora (primeiro login) a partir dos dados guardados no cadastro.
      const meta = authUser.user_metadata ?? {};
      if (!error && !data && typeof meta.recovery_pin_hash === 'string') {
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: authUser.id,
            full_name: meta.full_name ?? '',
            email: (authUser.email ?? '').toLowerCase(),
            recovery_pin_hash: meta.recovery_pin_hash,
            birth_date: meta.birth_date ?? null,
            favorite_color: meta.favorite_color ?? null,
          })
          .select('*')
          .maybeSingle();

        if (!insertError && created) {
          setProfile(created as UserProfile);
          await scrubPendingProfileMetadata();
        } else if (insertError) {
          console.error('Error creating profile:', insertError);
        }
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
        setUserRole('user');
        setIsAdmin(false);
        return 'user';
      }

      const role = (data as UserRole) || 'user';
      setUserRole(role);
      setIsAdmin(role === 'adm_master' || role === 'admin');
      return role;
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      setUserRole('user');
      setIsAdmin(false);
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
          const authUser = session.user;
          setTimeout(() => {
            fetchProfile(authUser);
            fetchUserRole(authUser.id);
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
        fetchProfile(session.user);
        fetchUserRole(session.user.id);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchUserRole]);

  const signUp = async (formData: SignupFormData): Promise<{ success: boolean; message: string }> => {
    try {
      const normalizedEmail = formData.email.toLowerCase().trim();
      const pinHash = await hashPin(formData.recoveryPin);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            birth_date: formData.birthDate,
            favorite_color: formData.favoriteColor,
            recovery_pin_hash: pinHash,
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        if (/already|registered|exists/i.test(authError.message)) {
          return { success: false, message: 'Este email já está cadastrado' };
        }
        return { success: false, message: authError.message };
      }

      if (!authData.user) {
        return { success: false, message: 'Erro ao criar usuário' };
      }

      // Com confirmação de e-mail ligada, e-mail já existente volta sem "identities".
      if (authData.user.identities && authData.user.identities.length === 0) {
        return { success: false, message: 'Este email já está cadastrado' };
      }

      // Sem sessão = confirmação de e-mail pendente. O perfil é criado no primeiro login.
      if (!authData.session) {
        return { success: true, message: 'Conta criada! Confirme seu email para poder entrar.' };
      }

      // O e-mail do perfil é sempre ajustado no banco para o e-mail real da conta.
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
        return { success: false, message: 'Erro ao criar perfil. Tente novamente.' };
      }

      await scrubPendingProfileMetadata();

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

  // A verificação e a troca de senha acontecem no servidor (edge function
  // `recover-password`), com limite de tentativas. O navegador nunca recebe o
  // resultado da verificação nem consegue trocar a senha por conta própria.
  const recoverPassword = async (formData: RecoveryFormData): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('recover-password', {
        body: {
          email: formData.email.toLowerCase().trim(),
          fullName: formData.fullName,
          birthDate: formData.birthDate,
          recoveryPin: formData.recoveryPin,
          newPassword: formData.newPassword,
        },
      });

      if (error) {
        return {
          success: false,
          message: await functionErrorMessage(
            error,
            'Dados de recuperação incorretos. Verifique email, nome, data de nascimento e senha secundária.'
          ),
        };
      }

      if (data?.success) {
        await supabase.auth.signOut();
        return { success: true, message: data.message || 'Senha atualizada com sucesso! Faça login com sua nova senha.' };
      }

      return { success: false, message: data?.error || 'Não foi possível recuperar a senha.' };
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
