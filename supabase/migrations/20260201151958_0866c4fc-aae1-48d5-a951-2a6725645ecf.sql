-- Adicionar suporte para até 3 categorias por estabelecimento
-- category (existente) = principal
-- category_2 e category_3 = secundárias

ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS category_2 text,
ADD COLUMN IF NOT EXISTS category_3 text;

-- Adicionar o mesmo para establishment_requests
ALTER TABLE public.establishment_requests 
ADD COLUMN IF NOT EXISTS category_2 text,
ADD COLUMN IF NOT EXISTS category_3 text;

-- Criar índice para busca por categoria em qualquer posição
CREATE INDEX IF NOT EXISTS idx_establishments_categories 
ON public.establishments (category, category_2, category_3);

-- Comentários de documentação
COMMENT ON COLUMN public.establishments.category IS 'Categoria principal do estabelecimento';
COMMENT ON COLUMN public.establishments.category_2 IS 'Segunda categoria do estabelecimento (opcional)';
COMMENT ON COLUMN public.establishments.category_3 IS 'Terceira categoria do estabelecimento (opcional)';