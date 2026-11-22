import { describe, it, expect } from 'vitest';
import { REPORT_REASONS, REPORT_DETAILS_MAX, reportErrorMessage, validateReport } from './reports';

describe('validateReport', () => {
  it('exige um motivo', () => {
    expect(validateReport({ reason: '', details: '', contact: '' }).reason).toBeTruthy();
    expect(validateReport({ reason: 'golpe_fraude', details: '', contact: '' })).toEqual({});
  });
  it('motivo "outro" exige descrição', () => {
    expect(validateReport({ reason: 'outro', details: '  ', contact: '' }).details).toBeTruthy();
    expect(validateReport({ reason: 'outro', details: 'Aconteceu isto', contact: '' })).toEqual({});
  });
  it('limita o tamanho da descrição', () => {
    expect(validateReport({ reason: 'golpe_fraude', details: 'x'.repeat(REPORT_DETAILS_MAX + 1), contact: '' }).details).toBeTruthy();
    expect(validateReport({ reason: 'golpe_fraude', details: 'x'.repeat(REPORT_DETAILS_MAX), contact: '' })).toEqual({});
  });
  it('contato é opcional, mas se vier precisa ser e-mail ou telefone', () => {
    expect(validateReport({ reason: 'golpe_fraude', details: '', contact: 'ana@exemplo.com' })).toEqual({});
    expect(validateReport({ reason: 'golpe_fraude', details: '', contact: '(31) 99999-0000' })).toEqual({});
    expect(validateReport({ reason: 'golpe_fraude', details: '', contact: 'qualquer coisa' }).contact).toBeTruthy();
  });
});

describe('motivos', () => {
  it('cobrem o que o documento pede e batem com os valores do banco', () => {
    expect(REPORT_REASONS.map((r) => r.value)).toEqual([
      'produto_proibido', 'falsificado', 'golpe_fraude', 'informacao_falsa', 'conteudo_ofensivo', 'outro',
    ]);
  });
});

describe('reportErrorMessage', () => {
  it('traduz erros conhecidos e esconde os técnicos', () => {
    expect(reportErrorMessage('Muitas denúncias em pouco tempo. Tente de novo mais tarde.')).toMatch(/muitas denúncias/i);
    expect(reportErrorMessage('Não encontramos o item que você quer denunciar.')).toMatch(/removido/);
    expect(reportErrorMessage('duplicate key value violates unique constraint "x"')).toBe(
      'Não foi possível enviar a denúncia agora. Tente novamente em instantes.',
    );
    expect(reportErrorMessage(undefined)).toMatch(/Não foi possível/);
  });
});
