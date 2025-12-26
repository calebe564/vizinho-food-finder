import { z } from 'zod';

// Schema for signup validation
export const signupSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  recoveryPin: z.string().min(4, 'PIN deve ter 4-6 dígitos').max(6, 'PIN deve ter 4-6 dígitos').regex(/^\d+$/, 'PIN deve conter apenas números'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const recoverySchema = z.object({
  email: z.string().email('Email inválido'),
  recoveryPin: z.string().min(4, 'PIN deve ter 4-6 dígitos').max(6, 'PIN deve ter 4-6 dígitos').regex(/^\d+$/, 'PIN deve conter apenas números'),
  newPassword: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmNewPassword'],
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RecoveryFormData = z.infer<typeof recoverySchema>;

// Simple hash function for PIN (in production, use bcrypt on server)
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'salt_comercio_vizinho');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
