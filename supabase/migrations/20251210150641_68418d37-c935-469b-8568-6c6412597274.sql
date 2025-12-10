-- Criar tabela de variações de produtos
CREATE TABLE IF NOT EXISTS public.product_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view product variations"
ON public.product_variations
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage product variations"
ON public.product_variations
FOR ALL
USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()));

-- Adicionar coluna profile_image na tabela establishment_requests para a logo
ALTER TABLE public.establishment_requests 
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS products_json JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS schedule TEXT;