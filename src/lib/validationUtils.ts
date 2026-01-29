import { z } from 'zod';

// Document type detection (auto-detect based on length)
export type DocumentType = 'cpf' | 'cnpj' | 'unknown';

export function detectDocumentType(document: string): DocumentType {
  const clean = document.replace(/\D/g, '');
  if (clean.length === 11) return 'cpf';
  if (clean.length === 14) return 'cnpj';
  return 'unknown';
}

// CPF validation
export function validateCPF(cpf: string): boolean {
  // Remove non-digits
  const cleanCpf = cpf.replace(/\D/g, '');
  
  // Must have 11 digits
  if (cleanCpf.length !== 11) return false;
  
  // Check for repeated digits (e.g., 111.111.111-11)
  if (/^(\d)\1+$/.test(cleanCpf)) return false;
  
  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf[9])) return false;
  
  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  
  return remainder === parseInt(cleanCpf[10]);
}

// Format CPF for display
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

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

// Unified document validation (CPF or CNPJ)
export function validateDocument(document: string): { isValid: boolean; type: DocumentType } {
  const type = detectDocumentType(document);
  
  if (type === 'cpf') {
    return { isValid: validateCPF(document), type: 'cpf' };
  }
  if (type === 'cnpj') {
    return { isValid: validateCNPJ(document), type: 'cnpj' };
  }
  
  return { isValid: false, type: 'unknown' };
}

// Format document based on type
export function formatDocument(document: string): string {
  const type = detectDocumentType(document);
  if (type === 'cpf') return formatCPF(document);
  if (type === 'cnpj') return formatCNPJ(document);
  return document;
}

// Age validation (must be 18+)
export function validateAge(birthDate: string | Date): boolean {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
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
