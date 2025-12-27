-- Remover política antiga que só permite ver propagandas ativas
DROP POLICY IF EXISTS "Anyone can view active advertisements" ON public.advertisements;

-- Criar nova política que permite admin ver todas e usuários verem apenas ativas
CREATE POLICY "Admins can view all advertisements"
ON public.advertisements
FOR SELECT
USING (
  is_admin(auth.uid()) OR 
  has_role(auth.uid(), 'adm_master') OR
  has_role(auth.uid(), 'admin') OR
  (
    active = true AND 
    (start_date IS NULL OR start_date <= now()) AND 
    (end_date IS NULL OR end_date >= now())
  )
);