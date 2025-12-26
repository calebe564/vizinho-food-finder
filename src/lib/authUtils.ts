import { z } from 'zod';

// Schema for signup validation with new fields
export const signupSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  favoriteColor: z.string().min(1, 'Cor favorita é obrigatória'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  recoveryPin: z.string().min(4, 'Senha secundária deve ter pelo menos 4 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Enhanced recovery schema with additional verification
export const recoverySchema = z.object({
  email: z.string().email('Email inválido'),
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  recoveryPin: z.string().min(4, 'Senha secundária é obrigatória'),
  newPassword: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmNewPassword'],
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RecoveryFormData = z.infer<typeof recoverySchema>;

// Hash function for PIN (consistent with backend)
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'salt_comercio_vizinho');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
