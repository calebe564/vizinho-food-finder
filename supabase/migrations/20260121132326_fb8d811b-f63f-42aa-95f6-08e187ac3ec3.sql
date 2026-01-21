-- =====================================================
-- MIGRAÇÃO DE SEGURANÇA COMPLETA - COMÉRCIO VIZINHO
-- =====================================================

-- =====================================================
-- 1. ESTABLISHMENTS (Dados comerciais públicos)
-- Leitura: PÚBLICA (dados são de fontes públicas como Google Maps)
-- Escrita: APENAS ADMs
-- =====================================================

-- Remover política permissiva antiga
DROP POLICY IF EXISTS "Allow managing establishments" ON public.establishments;

-- Manter SELECT público para dados comerciais (essencial para o app)
-- A política "Anyone can view active establishments" já existe e está correta

-- Criar política para INSERT apenas por ADMs
CREATE POLICY "Admins can create establishments" 
ON public.establishments 
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin')
);

-- Criar política para UPDATE apenas por ADMs ou proprietário via user_establishments
CREATE POLICY "Admins and owners can update establishments" 
ON public.establishments 
FOR UPDATE
TO authenticated
USING (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.establishment_id = establishments.id 
    AND ue.user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.establishment_id = establishments.id 
    AND ue.user_id = auth.uid()
  )
);

-- Criar política para DELETE apenas por ADMs
CREATE POLICY "Admins can delete establishments" 
ON public.establishments 
FOR DELETE
TO authenticated
USING (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin')
);

-- =====================================================
-- 2. PRODUCTS (Produtos são dados públicos comerciais)
-- Leitura: PÚBLICA
-- Escrita: ADMs ou proprietários
-- =====================================================

DROP POLICY IF EXISTS "Allow managing products" ON public.products;

-- INSERT produtos apenas por ADMs ou proprietários
CREATE POLICY "Admins and owners can create products" 
ON public.products 
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.establishment_id = products.establishment_id 
    AND ue.user_id = auth.uid()
  )
);

-- UPDATE produtos apenas por ADMs ou proprietários
CREATE POLICY "Admins and owners can update products" 
ON public.products 
FOR UPDATE
TO authenticated
USING (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.establishment_id = products.establishment_id 
    AND ue.user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.establishment_id = products.establishment_id 
    AND ue.user_id = auth.uid()
  )
);

-- DELETE produtos apenas por ADMs ou proprietários
CREATE POLICY "Admins and owners can delete products" 
ON public.products 
FOR DELETE
TO authenticated
USING (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.establishment_id = products.establishment_id 
    AND ue.user_id = auth.uid()
  )
);

-- =====================================================
-- 3. PRODUCT_VARIATIONS
-- Mesma lógica dos produtos
-- =====================================================

DROP POLICY IF EXISTS "Allow managing product_variations" ON public.product_variations;

-- INSERT variações apenas por ADMs ou proprietários
CREATE POLICY "Admins and owners can create variations" 
ON public.product_variations 
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_establishments ue ON ue.establishment_id = p.establishment_id
    WHERE p.id = product_variations.product_id 
    AND ue.user_id = auth.uid()
  )
);

-- UPDATE variações apenas por ADMs ou proprietários
CREATE POLICY "Admins and owners can update variations" 
ON public.product_variations 
FOR UPDATE
TO authenticated
USING (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_establishments ue ON ue.establishment_id = p.establishment_id
    WHERE p.id = product_variations.product_id 
    AND ue.user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_establishments ue ON ue.establishment_id = p.establishment_id
    WHERE p.id = product_variations.product_id 
    AND ue.user_id = auth.uid()
  )
);

-- DELETE variações apenas por ADMs ou proprietários
CREATE POLICY "Admins and owners can delete variations" 
ON public.product_variations 
FOR DELETE
TO authenticated
USING (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_establishments ue ON ue.establishment_id = p.establishment_id
    WHERE p.id = product_variations.product_id 
    AND ue.user_id = auth.uid()
  )
);

-- =====================================================
-- 4. ADVERTISEMENTS (CRÍTICO - APENAS ADMs)
-- =====================================================

DROP POLICY IF EXISTS "Allow insert advertisements" ON public.advertisements;
DROP POLICY IF EXISTS "Allow update advertisements" ON public.advertisements;
DROP POLICY IF EXISTS "Allow delete advertisements" ON public.advertisements;

-- INSERT anúncios apenas por ADMs
CREATE POLICY "Only admins can create advertisements" 
ON public.advertisements 
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin')
);

-- UPDATE anúncios apenas por ADMs
CREATE POLICY "Only admins can update advertisements" 
ON public.advertisements 
FOR UPDATE
TO authenticated
USING (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin')
);

-- DELETE anúncios apenas por ADMs
CREATE POLICY "Only admins can delete advertisements" 
ON public.advertisements 
FOR DELETE
TO authenticated
USING (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin')
);

-- =====================================================
-- 5. ESTABLISHMENT_REQUESTS (Dados internos - RESTRITO)
-- Leitura: Apenas ADMs e criador da solicitação
-- =====================================================

DROP POLICY IF EXISTS "Allow reading all requests" ON public.establishment_requests;
DROP POLICY IF EXISTS "Allow updating requests" ON public.establishment_requests;
DROP POLICY IF EXISTS "Allow deleting requests" ON public.establishment_requests;

-- SELECT apenas para ADMs e criador
-- Nota: A política "Users can view their own requests" já existe e está correta

-- UPDATE apenas por ADMs
CREATE POLICY "Only admins can update requests" 
ON public.establishment_requests 
FOR UPDATE
TO authenticated
USING (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin') OR
  public.can_approve_establishments(auth.uid())
)
WITH CHECK (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin') OR
  public.can_approve_establishments(auth.uid())
);

-- DELETE apenas por ADMs
CREATE POLICY "Only admins can delete requests" 
ON public.establishment_requests 
FOR DELETE
TO authenticated
USING (
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin') OR
  public.can_approve_establishments(auth.uid())
);

-- =====================================================
-- 6. CONVERSATIONS (Privado para usuário e ADMs)
-- =====================================================

DROP POLICY IF EXISTS "Users and admins can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.conversations;

-- SELECT: Usuário vê apenas suas conversas, ADMs veem todas
CREATE POLICY "Users view own conversations, admins view all" 
ON public.conversations 
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.is_adm_master(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin')
);

-- INSERT: Apenas usuários autenticados para suas próprias conversas
CREATE POLICY "Users can create own conversations" 
ON public.conversations 
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- UPDATE já está correto (admins apenas)

-- =====================================================
-- 7. MESSAGES (Restrito à conversa do usuário)
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can create messages" ON public.messages;

-- SELECT: Ver mensagens apenas de conversas que o usuário participa
CREATE POLICY "Users view messages from their conversations" 
ON public.messages 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.user_id = auth.uid() OR public.is_adm_master(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  )
);

-- INSERT: Apenas em conversas que o usuário participa
CREATE POLICY "Users can send messages to their conversations" 
ON public.messages 
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.user_id = auth.uid() OR public.is_adm_master(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  )
);

-- =====================================================
-- 8. PROFILES (Dados pessoais - MUITO RESTRITO)
-- Cada usuário acessa apenas seus próprios dados
-- =====================================================

-- A política "Anyone can check if email exists" é necessária para recuperação
-- Mas vamos garantir que não exponha dados sensíveis desnecessariamente
-- As políticas existentes já estão corretas para profiles

-- =====================================================
-- 9. Função auxiliar para verificar se é admin de forma segura
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_authenticated_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    auth.uid() IS NOT NULL AND
    (
      public.is_adm_master(auth.uid()) OR 
      public.has_role(auth.uid(), 'admin')
    )
$$;