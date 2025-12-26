-- Adicionar novos campos à tabela de propagandas para suportar funcionalidades avançadas
ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS size TEXT DEFAULT 'small' CHECK (size IN ('small', 'medium', 'large')),
ADD COLUMN IF NOT EXISTS behavior TEXT DEFAULT 'static' CHECK (behavior IN ('static', 'fixed', 'floating', 'carousel')),
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES public.establishments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN public.advertisements.size IS 'Tamanho: small, medium, large';
COMMENT ON COLUMN public.advertisements.behavior IS 'Comportamento: static (padrão), fixed (fixa), floating (flutuante), carousel (rotativa)';
COMMENT ON COLUMN public.advertisements.display_order IS 'Ordem de exibição (menor = primeiro)';
COMMENT ON COLUMN public.advertisements.establishment_id IS 'Empresa vinculada (opcional, para monetização futura)';
COMMENT ON COLUMN public.advertisements.start_date IS 'Data de início da exibição (opcional)';
COMMENT ON COLUMN public.advertisements.end_date IS 'Data de fim da exibição (opcional)';

-- Índice para otimizar consultas por posição e ordem
CREATE INDEX IF NOT EXISTS idx_advertisements_position_order ON public.advertisements(position, display_order);

-- Atualizar política de SELECT para incluir verificação de datas
DROP POLICY IF EXISTS "Anyone can view active advertisements" ON public.advertisements;
CREATE POLICY "Anyone can view active advertisements"
ON public.advertisements
FOR SELECT
USING (
  active = true 
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
);