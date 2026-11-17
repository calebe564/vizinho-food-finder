import { z } from 'zod';

// Schema for signup validation with new fields
export const signupSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(120, 'Nome muito longo'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  favoriteColor: z.string().min(1, 'Cor favorita é obrigatória').max(40, 'Texto muito longo'),
  email: z.string().email('Email inválido').max(254, 'Email muito longo'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(72, 'Senha muito longa'),
  confirmPassword: z.string(),
  recoveryPin: z.string().min(6, 'Senha secundária deve ter pelo menos 6 caracteres').max(64, 'Senha secundária muito longa'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Recuperação: o PIN mínimo continua 4 para quem se cadastrou antes da regra nova.
export const recoverySchema = z.object({
  email: z.string().email('Email inválido'),
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  recoveryPin: z.string().min(4, 'Senha secundária é obrigatória'),
  newPassword: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(72, 'Senha muito longa'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmNewPassword'],
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RecoveryFormData = z.infer<typeof recoverySchema>;

// Hash do PIN. IMPORTANTE: precisa continuar idêntico ao da edge function
// `recover-password`, porque os PINs já cadastrados foram salvos assim.
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'salt_comercio_vizinho');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
