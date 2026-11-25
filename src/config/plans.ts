// Planos comerciais. Os valores vivem no banco (tabela plan_configurations) e o
// administrador pode alterá-los; esta lista é só o "plano B" quando o banco não responde,
// e deve refletir o que foi definido como proposta inicial do negócio.

import type { CustomizationLevel } from '@/lib/themeColors';

export interface PlanDefinition {
  plan_name: string;
  display_label: string;
  price_cents: number;
  max_products: number; // -1 = ilimitado
  description: string;
  benefits: string[];
  sort_order: number;
  is_active: boolean;
  is_public: boolean;
  /** Personalização visual da página: none = tema padrão, basic = cor principal, advanced = + secundária e cantos. */
  customization_level: CustomizationLevel;
}

export const DEFAULT_PLANS: PlanDefinition[] = [
  {
    plan_name: 'start',
    display_label: 'Start',
    price_cents: 2490,
    max_products: 15,
    description: 'Para colocar o seu comércio no mapa do bairro',
    benefits: [
      'Até 15 produtos',
      'Perfil do estabelecimento',
      'Fotos dos produtos',
      'Preços',
      'WhatsApp',
      'Endereço',
      'Redes sociais',
      'Informações comerciais',
    ],
    sort_order: 1,
    is_active: true,
    is_public: true,
    customization_level: 'none',
  },
  {
    plan_name: 'pro',
    display_label: 'Pro',
    price_cents: 3790,
    max_products: 30,
    description: 'Mais produtos e mais recursos para o seu perfil',
    benefits: [
      'Até 30 produtos',
      'Todos os recursos do Start',
      'Mais possibilidades de promoção',
      'Recursos adicionais de personalização',
      'Estatísticas ampliadas, conforme disponibilidade dos dados',
    ],
    sort_order: 2,
    is_active: true,
    is_public: true,
    customization_level: 'basic',
  },
  {
    plan_name: 'max',
    display_label: 'Max',
    price_cents: 5370,
    max_products: 50,
    description: 'Todos os recursos para apresentar bem o seu negócio',
    benefits: [
      'Até 50 produtos',
      'Todos os recursos anteriores',
      'Recursos avançados de personalização',
      'Estatísticas ampliadas',
      'Ferramentas adicionais de divulgação, quando implementadas',
    ],
    sort_order: 3,
    is_active: true,
    is_public: true,
    customization_level: 'advanced',
  },
  {
    plan_name: 'gratuito',
    display_label: 'Sem plano',
    price_cents: 0,
    max_products: 5,
    description: 'Cadastro sem plano contratado',
    benefits: ['Até 5 produtos'],
    sort_order: 0,
    is_active: true,
    is_public: false,
    customization_level: 'none',
  },
];

/** 2490 -> "R$ 24,90". */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Planos que podem ser contratados, na ordem de exibição. */
export function sellablePlans(plans: PlanDefinition[]): PlanDefinition[] {
  return plans
    .filter((p) => p.is_public && p.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function productLimitLabel(max: number): string {
  return max < 0 ? 'ilimitados' : String(max);
}

/** Quantos produtos ainda cabem no plano (null se ilimitado). */
export function productsRemaining(max: number, used: number): number | null {
  return max < 0 ? null : Math.max(max - used, 0);
}

export function isAtProductLimit(max: number, used: number): boolean {
  return max >= 0 && used >= max;
}

/** "24,90", "R$ 24,90" ou "24.90" -> 2490. Devolve null se não for um valor válido. */
export function parsePriceToCents(input: string): number | null {
  const cleaned = input.replace(/[^\d,.]/g, '').trim();
  if (!cleaned) return null;
  // se tem vírgula, ela é o separador decimal e o ponto é de milhar
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0 || value > 100000) return null;
  return Math.round(value * 100);
}

/** Cada linha do texto vira um benefício (sem linhas vazias, no máximo 15, até 120 caracteres). */
export function parseBenefits(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, 15);
}

/** Valor de "centavos" para o campo de texto do administrador: 2490 -> "24,90". */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}
