-- =====================================================
-- CORREÇÃO FINAL DE POLÍTICAS RESTANTES
-- =====================================================

-- 1. ESTABLISHMENT_REQUESTS: Apenas usuários autenticados podem criar
DROP POLICY IF EXISTS "Anyone can create establishment requests" ON public.establishment_requests;

CREATE POLICY "Authenticated users can create establishment requests" 
ON public.establishment_requests 
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

-- 2. LOGIN_ATTEMPTS: Este é um log de auditoria que precisa registrar 
-- tentativas de login ANTES da autenticação (por design de segurança)
-- Mantendo público, mas garantindo que é apenas INSERT (sem leitura pública)
-- A política existente está correta para este caso de uso de auditoria

-- 3. RECOVERY_ATTEMPTS: Mesmo caso - log de auditoria pré-autenticação
-- Necessário para rastrear tentativas de recuperação
-- A política existente está correta para este caso de uso

-- Vamos garantir que login_attempts e recovery_attempts
-- tenham apenas INSERT público (já é o caso) mas reforçar segurança

-- Garantir que não há políticas SELECT públicas em login_attempts
-- (já está correto - SELECT apenas para admins)

-- Garantir que não há políticas SELECT públicas em recovery_attempts
-- (já está correto - SELECT apenas para admins)