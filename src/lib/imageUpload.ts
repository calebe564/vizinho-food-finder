import { supabase } from '@/integrations/supabase/client';

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Devolve a mensagem de erro, ou null se o arquivo pode ser enviado. */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED[file.type]) return 'Use uma imagem JPG, PNG ou WebP.';
  if (file.size > IMAGE_MAX_BYTES) return 'A imagem pode ter no máximo 5 MB.';
  if (file.size === 0) return 'O arquivo está vazio.';
  return null;
}

/** A extensão vem do tipo verificado, nunca do nome do arquivo. */
export function extensionFor(type: string): string | null {
  return ALLOWED[type] ?? null;
}

/** Envia a imagem para o armazenamento público e devolve o endereço. Lança erro com mensagem amigável. */
export async function uploadPublicImage(file: File, folder: 'products' | 'covers'): Promise<string> {
  const problem = validateImageFile(file);
  if (problem) throw new Error(problem);

  const path = `${folder}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
  const { error } = await supabase.storage.from('establishment-images').upload(path, file, { contentType: file.type });
  if (error) throw new Error('Não foi possível enviar a imagem. Tente de novo.');

  return supabase.storage.from('establishment-images').getPublicUrl(path).data.publicUrl;
}
