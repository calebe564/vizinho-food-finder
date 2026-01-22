-- =====================================================
-- CORREÇÃO COMPLETA DE SEGURANÇA - COMÉRCIO VIZINHO
-- =====================================================

-- 1. CORRIGIR TABELA PROFILES - REMOVER ACESSO PÚBLICO
-- A policy "Anyone can check if email exists" expõe TODOS os dados pessoais
DROP POLICY IF EXISTS "Anyone can check if email exists" ON public.profiles;

-- Admins podem ver todos os perfis (necessário para gerenciamento)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_adm_master(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- 2. CORRIGIR STORAGE - RESTRINGIR UPLOADS A USUÁRIOS AUTENTICADOS
DROP POLICY IF EXISTS "Anyone can upload establishment images" ON storage.objects;

CREATE POLICY "Authenticated users can upload establishment images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'establishment-images');

-- 3. CRIAR TABELA PARA SESSÕES DE ADMIN (TOKENS SEGUROS)
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_active_session UNIQUE (user_id, token_hash)
);

-- Habilitar RLS na tabela de sessões
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para sessões admin
CREATE POLICY "Admins can manage their own sessions"
ON public.admin_sessions FOR ALL
TO authenticated
USING (user_id = auth.uid() AND (is_adm_master(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))
WITH CHECK (user_id = auth.uid() AND (is_adm_master(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));

-- 4. CRIAR TABELA PARA RATE LIMITING DE LOGIN ADMIN
CREATE TABLE IF NOT EXISTS public.admin_rate_limit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    attempt_count INTEGER DEFAULT 1,
    first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index para busca rápida por IP
CREATE INDEX IF NOT EXISTS idx_admin_rate_limit_ip ON public.admin_rate_limit(ip_address);

-- Habilitar RLS
ALTER TABLE public.admin_rate_limit ENABLE ROW LEVEL SECURITY;

-- Apenas o sistema pode gerenciar rate limiting
CREATE POLICY "Service role only for rate limiting"
ON public.admin_rate_limit FOR ALL
USING (false)
WITH CHECK (false);

-- 5. FUNÇÃO PARA VERIFICAR E REGISTRAR RATE LIMIT
CREATE OR REPLACE FUNCTION public.check_admin_rate_limit(
    _ip_address TEXT,
    _max_attempts INTEGER DEFAULT 5,
    _window_minutes INTEGER DEFAULT 15
)
RETURNS TABLE(allowed BOOLEAN, attempts_remaining INTEGER, blocked_until TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record admin_rate_limit%ROWTYPE;
    v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    v_window_start := now() - (_window_minutes || ' minutes')::INTERVAL;
    
    -- Buscar registro existente
    SELECT * INTO v_record
    FROM admin_rate_limit
    WHERE ip_address = _ip_address
    AND first_attempt_at > v_window_start
    ORDER BY first_attempt_at DESC
    LIMIT 1;
    
    -- Se não existe registro ou expirou a janela
    IF v_record IS NULL THEN
        INSERT INTO admin_rate_limit (ip_address, attempt_count)
        VALUES (_ip_address, 1);
        
        RETURN QUERY SELECT true, _max_attempts - 1, NULL::TIMESTAMP WITH TIME ZONE;
        RETURN;
    END IF;
    
    -- Se está bloqueado
    IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > now() THEN
        RETURN QUERY SELECT false, 0, v_record.blocked_until;
        RETURN;
    END IF;
    
    -- Incrementar contador
    UPDATE admin_rate_limit
    SET attempt_count = attempt_count + 1,
        blocked_until = CASE 
            WHEN attempt_count + 1 >= _max_attempts 
            THEN now() + '15 minutes'::INTERVAL 
            ELSE NULL 
        END
    WHERE id = v_record.id;
    
    IF v_record.attempt_count + 1 >= _max_attempts THEN
        RETURN QUERY SELECT false, 0, now() + '15 minutes'::INTERVAL;
    ELSE
        RETURN QUERY SELECT true, _max_attempts - v_record.attempt_count - 1, NULL::TIMESTAMP WITH TIME ZONE;
    END IF;
END;
$$;

-- 6. FUNÇÃO PARA VALIDAR SESSÃO ADMIN
CREATE OR REPLACE FUNCTION public.validate_admin_session(_token_hash TEXT)
RETURNS TABLE(valid BOOLEAN, user_id UUID, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true AS valid,
        s.user_id,
        get_user_role(s.user_id) AS role
    FROM admin_sessions s
    WHERE s.token_hash = _token_hash
    AND s.expires_at > now()
    AND s.revoked_at IS NULL
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT;
    END IF;
END;
$$;

-- 7. FUNÇÃO PARA CRIAR SESSÃO ADMIN
CREATE OR REPLACE FUNCTION public.create_admin_session(
    _user_id UUID,
    _token_hash TEXT,
    _ip_address TEXT,
    _user_agent TEXT,
    _expires_hours INTEGER DEFAULT 24
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Revogar sessões anteriores do usuário
    UPDATE admin_sessions
    SET revoked_at = now()
    WHERE user_id = _user_id AND revoked_at IS NULL;
    
    -- Criar nova sessão
    INSERT INTO admin_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
    VALUES (_user_id, _token_hash, _ip_address, _user_agent, now() + (_expires_hours || ' hours')::INTERVAL)
    RETURNING id INTO v_session_id;
    
    RETURN v_session_id;
END;
$$;

-- 8. FUNÇÃO PARA REVOGAR SESSÃO ADMIN
CREATE OR REPLACE FUNCTION public.revoke_admin_session(_token_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE admin_sessions
    SET revoked_at = now()
    WHERE token_hash = _token_hash AND revoked_at IS NULL;
    
    RETURN FOUND;
END;
$$;

-- 9. LIMPAR RATE LIMITS ANTIGOS (executar periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_admin_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM admin_rate_limit
    WHERE first_attempt_at < now() - '1 day'::INTERVAL;
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- 10. CRIAR FUNÇÃO PARA VERIFICAÇÃO SEGURA DE EMAIL (sem expor dados)
CREATE OR REPLACE FUNCTION public.check_email_exists(_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE email = lower(trim(_email))
    )
$$;