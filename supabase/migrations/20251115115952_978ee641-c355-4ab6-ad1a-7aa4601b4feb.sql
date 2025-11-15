-- Adicionar campos necessários na tabela establishments
ALTER TABLE public.establishments
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS external_link text;

-- Criar tabela para solicitações de cadastro público
CREATE TABLE IF NOT EXISTS public.establishment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category establishment_category NOT NULL,
  neighborhood text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  description text,
  external_link text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  admin_notes text
);

-- RLS para establishment_requests
ALTER TABLE public.establishment_requests ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode criar uma solicitação
CREATE POLICY "Anyone can create establishment requests"
ON public.establishment_requests
FOR INSERT
TO public
WITH CHECK (true);

-- Apenas admins podem ver e gerenciar solicitações
CREATE POLICY "Admins can view all requests"
ON public.establishment_requests
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_users
  WHERE admin_users.id = auth.uid()
));

CREATE POLICY "Admins can update requests"
ON public.establishment_requests
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_users
  WHERE admin_users.id = auth.uid()
));

CREATE POLICY "Admins can delete requests"
ON public.establishment_requests
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_users
  WHERE admin_users.id = auth.uid()
));