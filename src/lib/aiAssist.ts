import { supabase } from '@/integrations/supabase/client';

export type AIAssistInput =
  | { task: 'product_description'; name: string; notes?: string; category?: string }
  | { task: 'promo_text'; productName: string; price?: number | null; idea?: string }
  | { task: 'review_reply'; rating: number; comment?: string; businessName?: string }
  | { task: 'review_summary'; establishmentId: string };

export async function aiAssist(input: AIAssistInput): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-assist', { body: input });
  if (error) {
    let msg = 'Erro ao gerar texto com IA.';
    try { const body = await (error as { context?: Response }).context?.json(); if (body?.error) msg = body.error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data.result as string;
}
