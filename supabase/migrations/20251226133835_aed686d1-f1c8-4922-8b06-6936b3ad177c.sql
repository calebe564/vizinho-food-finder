-- Criar tabela de vinculação usuário-empresa
CREATE TABLE IF NOT EXISTS public.user_establishments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE (user_id, establishment_id)
);

-- Enable RLS
ALTER TABLE public.user_establishments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- ADM_MASTER e GESTOR podem ver todos os vínculos
CREATE POLICY "Admins and gestors can view all user_establishments"
ON public.user_establishments
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'adm_master') OR 
  public.has_role(auth.uid(), 'gestor')
);

-- Usuários podem ver seus próprios vínculos
CREATE POLICY "Users can view their own establishments"
ON public.user_establishments
FOR SELECT
USING (user_id = auth.uid());

-- ADM_MASTER e GESTOR podem criar vínculos
CREATE POLICY "Admins and gestors can create user_establishments"
ON public.user_establishments
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'adm_master') OR 
  public.has_role(auth.uid(), 'gestor')
);

-- ADM_MASTER e GESTOR podem atualizar vínculos
CREATE POLICY "Admins and gestors can update user_establishments"
ON public.user_establishments
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'adm_master') OR 
  public.has_role(auth.uid(), 'gestor')
);

-- ADM_MASTER pode deletar vínculos
CREATE POLICY "Admins can delete user_establishments"
ON public.user_establishments
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'adm_master')
);