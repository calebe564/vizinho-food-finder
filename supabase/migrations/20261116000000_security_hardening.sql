-- =====================================================================
-- COMÉRCIO VIZINHO - ENDURECIMENTO DE SEGURANÇA
-- Aplique esta migration ANTES de publicar as edge functions novas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CRÍTICO: impedir que qualquer usuário se torne adm_master
--
-- Antes: o papel adm_master era concedido por um trigger quando uma linha
-- de `profiles` era inserida com o e-mail do dono, e is_adm_master()/
-- get_user_role() olhavam o e-mail de `profiles`. Como o cliente escolhe o
-- e-mail ao inserir o próprio perfil, qualquer pessoa cadastrada podia se
-- passar pelo dono e virar administradora geral.
--
-- Agora: nada concede adm_master automaticamente, e a checagem usa o e-mail
-- de auth.users (que o usuário não consegue forjar) junto com a linha de papel.
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS ensure_adm_master_on_profile ON public.profiles;
DROP FUNCTION IF EXISTS public.ensure_adm_master_role();

CREATE OR REPLACE FUNCTION public.is_adm_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.user_roles ur ON ur.user_id = u.id
    WHERE u.id = _user_id
      AND lower(u.email) = 'johnvictorsf1512@gmail.com'
      AND ur.role = 'adm_master'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_adm_master(_user_id) THEN 'adm_master'
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'pre_adm') THEN 'pre_adm'
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'empresario') THEN 'empresario'
    ELSE 'user'
  END
$$;

-- ---------------------------------------------------------------------
-- 2. O e-mail do perfil passa a vir sempre de auth.users
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_email text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT lower(email) INTO auth_email FROM auth.users WHERE id = NEW.user_id;
    IF auth_email IS NULL THEN
      RAISE EXCEPTION 'Usuário inexistente';
    END IF;
    NEW.email := auth_email;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Só o servidor (service_role) pode mudar e-mail ou dono do perfil.
    IF coalesce(auth.role(), '') <> 'service_role' THEN
      NEW.email := OLD.email;
      NEW.user_id := OLD.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_email_trg ON public.profiles;
CREATE TRIGGER enforce_profile_email_trg
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_email();

-- E-mail único (ignora maiúsculas). Se já existirem duplicados, avisa e segue.
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_unique ON public.profiles (lower(email));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Não foi possível criar o índice único de e-mail (provavelmente há e-mails duplicados em profiles): %', SQLERRM;
END $$;

-- ---------------------------------------------------------------------
-- 3. Rate limit compartilhado entre as edge functions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  key          text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  hits         integer     NOT NULL DEFAULT 0
);

ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_rate_limits FROM PUBLIC, anon, authenticated;

-- Retorna true se a tentativa está dentro do limite.
CREATE OR REPLACE FUNCTION public.rl_hit(_key text, _max integer, _window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_hits integer;
BEGIN
  INSERT INTO public.security_rate_limits AS r (key, window_start, hits)
  VALUES (_key, now(), 1)
  ON CONFLICT (key) DO UPDATE
    SET hits         = CASE WHEN r.window_start < now() - make_interval(secs => _window_seconds)
                            THEN 1 ELSE r.hits + 1 END,
        window_start = CASE WHEN r.window_start < now() - make_interval(secs => _window_seconds)
                            THEN now() ELSE r.window_start END
  RETURNING hits INTO current_hits;

  -- limpeza ocasional de registros antigos
  IF random() < 0.01 THEN
    DELETE FROM public.security_rate_limits WHERE window_start < now() - interval '2 days';
  END IF;

  RETURN current_hits <= _max;
END;
$$;

-- ---------------------------------------------------------------------
-- 4. Funções internas só podem ser chamadas pelo servidor (service_role).
--    Hoje elas ficam abertas para qualquer visitante via API pública.
--    (O front-end só usa get_user_role e cleanup_expired_promotions.)
-- ---------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN (
        'rl_hit',
        'check_email_exists',
        'verify_recovery_pin',
        'verify_recovery_pin_enhanced',
        'check_admin_rate_limit',
        'validate_admin_session',
        'create_admin_session',
        'revoke_admin_session'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 5. Chat de suporte: só administradores podem enviar mensagens como "admin"
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_message_sender_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.sender_type = 'admin'
     AND NOT (public.is_adm_master(auth.uid()) OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Não autorizado a enviar mensagens como administrador';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_message_sender_type_trg ON public.messages;
CREATE TRIGGER enforce_message_sender_type_trg
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_message_sender_type();
