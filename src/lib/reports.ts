// Denúncias de empresas e produtos. A equipe analisa cada caso (não é só filtro automático).

export type ReportTarget = 'establishment' | 'product';

export type ReportReason =
  | 'produto_proibido'
  | 'falsificado'
  | 'golpe_fraude'
  | 'informacao_falsa'
  | 'conteudo_ofensivo'
  | 'outro';

export const REPORT_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: 'produto_proibido', label: 'Produto proibido ou ilegal', hint: 'Drogas, armas, medicamentos irregulares, itens roubados...' },
  { value: 'falsificado', label: 'Produto falsificado', hint: 'Imitação vendida como original' },
  { value: 'golpe_fraude', label: 'Golpe ou fraude', hint: 'Cobrança indevida, empresa que não existe...' },
  { value: 'informacao_falsa', label: 'Informação falsa ou enganosa', hint: 'Preço, endereço ou descrição que não conferem' },
  { value: 'conteudo_ofensivo', label: 'Conteúdo ofensivo', hint: 'Texto ou imagem inadequados' },
  { value: 'outro', label: 'Outro motivo', hint: 'Descreva o problema' },
];

export const REPORT_DETAILS_MAX = 1000;
export const REPORT_CONTACT_MAX = 200;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[0-9()+\-\s]{8,20}$/;

export interface ReportInput {
  reason: ReportReason | '';
  details: string;
  contact: string;
}

export interface ReportErrors {
  reason?: string;
  details?: string;
  contact?: string;
}

/** Mesmas regras do banco, para avisar a pessoa antes de enviar. */
export function validateReport(input: ReportInput): ReportErrors {
  const errors: ReportErrors = {};
  const details = input.details.trim();
  const contact = input.contact.trim();

  if (!input.reason) errors.reason = 'Escolha um motivo.';
  if (details.length > REPORT_DETAILS_MAX) errors.details = `Use no máximo ${REPORT_DETAILS_MAX} caracteres.`;
  if (input.reason === 'outro' && !details) errors.details = 'Descreva o problema para podermos analisar.';
  if (contact && (contact.length > REPORT_CONTACT_MAX || !(EMAIL.test(contact) || PHONE.test(contact)))) {
    errors.contact = 'Informe um e-mail ou telefone válido, ou deixe em branco.';
  }
  return errors;
}

/** Traduz o erro do banco em texto para a pessoa (sem vazar detalhes técnicos). */
export function reportErrorMessage(message: string | undefined): string {
  const m = message ?? '';
  if (/Muitas denúncias/i.test(m)) return 'Você enviou muitas denúncias em pouco tempo. Tente de novo mais tarde.';
  if (/Não encontramos/i.test(m)) return 'Não encontramos mais este item. Ele pode ter sido removido.';
  if (/Descreva o problema|Escolha um motivo|e-mail ou telefone|1000 caracteres/i.test(m)) {
    return m.replace(/^.*?:\s*/, '');
  }
  return 'Não foi possível enviar a denúncia agora. Tente novamente em instantes.';
}
