-- CORREÇÃO DOS WARNINGS RESTANTES

-- 1. CORRIGIR login_attempts - INSERT com WITH CHECK true é necessário para logs pré-autenticação
-- Mas vamos remover a possibilidade de SELECT público (já está correto)
-- O warning é sobre o INSERT WITH CHECK (true) - isso é necessário por design para logs de auditoria

-- 2. CORRIGIR recovery_attempts - mesmo caso
-- O INSERT público é necessário para registrar tentativas antes da autenticação

-- 3. CORRIGIR product_variations - SELECT público com USING (true)
DROP POLICY IF EXISTS "Anyone can view product variations" ON public.product_variations;

-- Variações só visíveis se o produto pertence a estabelecimento ativo
CREATE POLICY "Anyone can view active product variations"
ON public.product_variations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM products p
        JOIN establishments e ON e.id = p.establishment_id
        WHERE p.id = product_variations.product_id AND e.active = true
    )
);

-- 4. REMOVER policy duplicada de profiles (a antiga que expunha dados)
-- Já foi removida na migração anterior, mas garantir
DROP POLICY IF EXISTS "Anyone can check if email exists" ON public.profiles;