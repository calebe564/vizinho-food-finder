-- Criar função para verificar se é ADM_MASTER (email fixo)
CREATE OR REPLACE FUNCTION public.is_adm_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = _user_id
      AND p.email = 'johnvictorsf1512@gmail.com'
      AND ur.role = 'adm_master'
  )
$$;

-- Criar função para obter a role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = _user_id
        AND p.email = 'johnvictorsf1512@gmail.com'
        AND ur.role = 'adm_master'
    ) THEN 'adm_master'
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'
    ) THEN 'admin'
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'pre_adm'
    ) THEN 'pre_adm'
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'empresario'
    ) THEN 'empresario'
    ELSE 'user'
  END
$$;

-- Criar função para verificar se pode gerenciar roles (apenas ADM_MASTER)
CREATE OR REPLACE FUNCTION public.can_manage_roles(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_adm_master(_user_id)
$$;

-- Criar função para verificar se pode aprovar empresas (ADM_MASTER ou ADM)
CREATE OR REPLACE FUNCTION public.can_approve_establishments(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_adm_master(_user_id) OR public.has_role(_user_id, 'admin')
$$;

-- Adicionar colunas para rastreamento de aprovação
ALTER TABLE public.establishment_requests 
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Atualizar políticas RLS de user_roles para permitir ADM_MASTER gerenciar
DROP POLICY IF EXISTS "ADM_MASTER can manage all roles" ON public.user_roles;
CREATE POLICY "ADM_MASTER can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_adm_master(auth.uid()))
WITH CHECK (public.is_adm_master(auth.uid()));

-- Atualizar políticas de establishment_requests para usuários verem suas próprias
DROP POLICY IF EXISTS "Users can view their own requests" ON public.establishment_requests;
CREATE POLICY "Users can view their own requests"
ON public.establishment_requests
FOR SELECT
USING (user_id = auth.uid() OR public.can_approve_establishments(auth.uid()));

-- Criar trigger para atribuir role empresario quando empresa é aprovada
CREATE OR REPLACE FUNCTION public.handle_establishment_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') AND NEW.user_id IS NOT NULL THEN
    -- Verificar se já tem role de empresario
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = NEW.user_id AND role = 'empresario'
    ) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'empresario');
    END IF;
    
    -- Registrar data de aprovação
    NEW.approved_at := now();
  END IF;
  
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    NEW.rejected_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_establishment_approval ON public.establishment_requests;
CREATE TRIGGER on_establishment_approval
  BEFORE UPDATE ON public.establishment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_establishment_approval();

-- Garantir que o email do ADM_MASTER sempre tenha role adm_master ao criar perfil
CREATE OR REPLACE FUNCTION public.ensure_adm_master_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'johnvictorsf1512@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'adm_master')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_adm_master_on_profile ON public.profiles;
CREATE TRIGGER ensure_adm_master_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_adm_master_role();