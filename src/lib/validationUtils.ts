import { z } from 'zod';

// CNPJ validation
export function validateCNPJ(cnpj: string): boolean {
  // Remove non-digits
  const cleanCnpj = cnpj.replace(/\D/g, '');
  
  // Must have 14 digits
  if (cleanCnpj.length !== 14) return false;
  
  // Check for repeated digits
  if (/^(\d)\1+$/.test(cleanCnpj)) return false;
  
  // Calculate first verification digit
  let sum = 0;
  let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCnpj[i]) * weight[i];
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCnpj[12]) !== digit1) return false;
  
  // Calculate second verification digit
  sum = 0;
  weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCnpj[i]) * weight[i];
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cleanCnpj[13]) === digit2;
}

// Format CNPJ for display
export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return cnpj;
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// Password strength validation for new users
export const strongPasswordSchema = z.string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos 1 letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter pelo menos 1 letra minúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos 1 número');

// Email domain validation
const validEmailDomains = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'outlook.com.br', 
  'yahoo.com', 'yahoo.com.br', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'uol.com.br', 'bol.com.br',
  'terra.com.br', 'globo.com', 'ig.com.br', 'proton.me',
  'protonmail.com', 'zoho.com', 'mail.com', 'aol.com'
];

export function validateEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  // Allow common domains explicitly
  if (validEmailDomains.includes(domain)) return true;
  
  // Allow business domains (assume they're valid)
  // This allows custom company domains
  return domain.includes('.') && domain.length > 3;
}

// Enhanced signup schema with strong password
export const enhancedSignupSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  favoriteColor: z.string().min(1, 'Cor favorita é obrigatória'),
  email: z.string()
    .email('Email inválido')
    .refine(validateEmailDomain, 'Domínio de email inválido ou não reconhecido'),
  password: strongPasswordSchema,
  confirmPassword: z.string(),
  recoveryPin: z.string().min(4, 'Senha secundária deve ter pelo menos 4 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export type EnhancedSignupFormData = z.infer<typeof enhancedSignupSchema>;
