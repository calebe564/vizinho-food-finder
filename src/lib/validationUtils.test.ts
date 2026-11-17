import { describe, it, expect } from 'vitest';
import {
  detectDocumentType,
  validateCPF,
  validateCNPJ,
  validateDocument,
  validateAge,
} from './validationUtils';

describe('detectDocumentType', () => {
  it('identifica CPF (11 dígitos) e CNPJ (14 dígitos), ignorando pontuação', () => {
    expect(detectDocumentType('529.982.247-25')).toBe('cpf');
    expect(detectDocumentType('11.222.333/0001-81')).toBe('cnpj');
    expect(detectDocumentType('123')).toBe('unknown');
  });
});

describe('validateCPF', () => {
  it('aceita CPF válido, com ou sem máscara', () => {
    expect(validateCPF('529.982.247-25')).toBe(true);
    expect(validateCPF('52998224725')).toBe(true);
  });
  it('rejeita dígito verificador errado e sequências repetidas', () => {
    expect(validateCPF('529.982.247-24')).toBe(false);
    expect(validateCPF('111.111.111-11')).toBe(false);
  });
});

describe('validateCNPJ', () => {
  it('aceita CNPJ válido', () => {
    expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
  });
  it('rejeita CNPJ inválido e sequências repetidas', () => {
    expect(validateCNPJ('11.222.333/0001-80')).toBe(false);
    expect(validateCNPJ('00.000.000/0000-00')).toBe(false);
  });
});

describe('validateDocument', () => {
  it('valida e informa o tipo', () => {
    expect(validateDocument('529.982.247-25')).toEqual({ isValid: true, type: 'cpf' });
    expect(validateDocument('11.222.333/0001-81')).toEqual({ isValid: true, type: 'cnpj' });
    expect(validateDocument('123').isValid).toBe(false);
  });
});

describe('validateAge', () => {
  it('exige 18 anos completos', () => {
    const today = new Date();
    const adult = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    const minor = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    const almost = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() + 1);
    expect(validateAge(adult)).toBe(true);
    expect(validateAge(minor)).toBe(false);
    expect(validateAge(almost)).toBe(false);
  });
});
