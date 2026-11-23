-- =====================================================================
-- ETAPA 2 - PLANOS (Start, Pro, Max), CAMPANHA DE LANÇAMENTO E ASSINATURAS
--
-- * Planos e preços ficam no banco e são editáveis pelo administrador.
-- * O limite de produtos é aplicado no BANCO (não só na tela).
-- * Dono de empresa NÃO troca mais o próprio plano: ele solicita, a equipe ativa.
-- * Campanha de lançamento: vagas contadas pelas adesões reais.
-- * Plano não dá mais vantagem na ordem dos resultados (pesos neutros).
-- * Não há cobrança automática: não existe integração de pagamento ainda.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Auxiliar: quem é administrador da plataforma
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.is_adm_master(_user_id), false)
      OR coalesce(public.has_role(_user_id, 'admin'), false)
$$;

-- ---------------------------------------------------------------------
-- 1. Configuração dos planos
-- ---------------------------------------------------------------------
ALTER TABLE public.plan_configurations
  ADD COLUMN IF NOT EXISTS price_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS benefits text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  ALTER TABLE public.plan_configurations
    ADD CONSTRAINT plan_configurations_price_nonneg CHECK (price_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Pesos neutros: o plano não influencia a ordem dos resultados orgânicos.
UPDATE public.plan_configurations SET visibility_weight = 1, promotion_boost = 1;

-- Planos antigos deixam de ser vendidos (continuam existindo para dados antigos).
UPDATE public.plan_configurations
   SET is_public = false, is_active = false, sort_order = 90
 WHERE plan_name IN ('basico');

UPDATE public.plan_configurations
   SET is_public = false, is_active = true, sort_order = 0,
       display_label = 'Sem plano', description = 'Cadastro sem plano contratado',
       price_cents = 0, max_products = 5,
       benefits = ARRAY['Até 5 produtos']
 WHERE plan_name = 'gratuito';

-- Plano Start
UPDATE public.plan_configurations SET
  display_label = 'Start', price_cents = 2490, max_products = 15, sort_order = 1,
  is_public = true, is_active = true,
  description = 'Para colocar o seu comércio no mapa do bairro',
  benefits = ARRAY['Até 15 produtos','Perfil do estabelecimento','Fotos dos produtos','Preços','WhatsApp','Endereço','Redes sociais','Informações comerciais']
WHERE plan_name = 'start';
INSERT INTO public.plan_configurations (plan_name, display_label, price_cents, max_products, sort_order, is_public, is_active, description, benefits, visibility_weight, promotion_boost)
SELECT 'start', 'Start', 2490, 15, 1, true, true,
       'Para colocar o seu comércio no mapa do bairro',
       ARRAY['Até 15 produtos','Perfil do estabelecimento','Fotos dos produtos','Preços','WhatsApp','Endereço','Redes sociais','Informações comerciais'],
       1, 1
WHERE NOT EXISTS (SELECT 1 FROM public.plan_configurations WHERE plan_name = 'start');

-- Plano Pro (reaproveita a linha antiga "pro", que era ilimitada)
UPDATE public.plan_configurations SET
  display_label = 'Pro', price_cents = 3790, max_products = 30, sort_order = 2,
  is_public = true, is_active = true,
  description = 'Mais produtos e mais recursos para o seu perfil',
  benefits = ARRAY['Até 30 produtos','Todos os recursos do Start','Mais possibilidades de promoção','Recursos adicionais de personalização','Estatísticas ampliadas, conforme disponibilidade dos dados']
WHERE plan_name = 'pro';
INSERT INTO public.plan_configurations (plan_name, display_label, price_cents, max_products, sort_order, is_public, is_active, description, benefits, visibility_weight, promotion_boost)
SELECT 'pro', 'Pro', 3790, 30, 2, true, true,
       'Mais produtos e mais recursos para o seu perfil',
       ARRAY['Até 30 produtos','Todos os recursos do Start','Mais possibilidades de promoção','Recursos adicionais de personalização','Estatísticas ampliadas, conforme disponibilidade dos dados'],
       1, 1
WHERE NOT EXISTS (SELECT 1 FROM public.plan_configurations WHERE plan_name = 'pro');

-- Plano Max
UPDATE public.plan_configurations SET
  display_label = 'Max', price_cents = 5370, max_products = 50, sort_order = 3,
  is_public = true, is_active = true,
  description = 'Todos os recursos para apresentar bem o seu negócio',
  benefits = ARRAY['Até 50 produtos','Todos os recursos anteriores','Recursos avançados de personalização','Estatísticas ampliadas','Ferramentas adicionais de divulgação, quando implementadas']
WHERE plan_name = 'max';
INSERT INTO public.plan_configurations (plan_name, display_label, price_cents, max_products, sort_order, is_public, is_active, description, benefits, visibility_weight, promotion_boost)
SELECT 'max', 'Max', 5370, 50, 3, true, true,
       'Todos os recursos para apresentar bem o seu negócio',
       ARRAY['Até 50 produtos','Todos os recursos anteriores','Recursos avançados de personalização','Estatísticas ampliadas','Ferramentas adicionais de divulgação, quando implementadas'],
       1, 1
WHERE NOT EXISTS (SELECT 1 FROM public.plan_configurations WHERE plan_name = 'max');

-- Nomes antigos nas empresas
UPDATE public.establishments SET plan = 'start' WHERE plan = 'basico';
UPDATE public.establishments SET plan = 'pro' WHERE plan = 'profissional';

ALTER TABLE public.plan_configurations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view plan configurations" ON public.plan_configurations;
CREATE POLICY "Anyone can view plan configurations"
  ON public.plan_configurations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Platform admins manage plan configurations" ON public.plan_configurations;
CREATE POLICY "Platform admins manage plan configurations"
  ON public.plan_configurations FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- 2. Campanha de lançamento
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.launch_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  spots_total integer NOT NULL CHECK (spots_total >= 0),
  promo_price_cents integer NOT NULL CHECK (promo_price_cents >= 0),
  promo_months integer NOT NULL CHECK (promo_months > 0),
  plan_name text NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.launch_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view launch campaigns" ON public.launch_campaigns;
CREATE POLICY "Anyone can view launch campaigns" ON public.launch_campaigns FOR SELECT USING (true);
DROP POLICY IF EXISTS "Platform admins manage launch campaigns" ON public.launch_campaigns;
CREATE POLICY "Platform admins manage launch campaigns"
  ON public.launch_campaigns FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

INSERT INTO public.launch_campaigns (slug, name, spots_total, promo_price_cents, promo_months, plan_name)
VALUES ('lancamento', 'Campanha de lançamento', 50, 1500, 3, 'start')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. Assinaturas (solicitações de plano e planos ativos)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'rejected', 'cancelled', 'expired')),
  wants_launch_offer boolean NOT NULL DEFAULT false,
  campaign_id uuid REFERENCES public.launch_campaigns(id),
  price_cents integer CHECK (price_cents IS NULL OR price_cents >= 0),
  promo_ends_at timestamptz,
  requested_by uuid REFERENCES auth.users(id),
  decided_by uuid,
  decided_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_active_per_establishment
  ON public.subscriptions (establishment_id) WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_pending_per_establishment
  ON public.subscriptions (establishment_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS subscriptions_campaign_idx ON public.subscriptions (campaign_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners view their subscriptions" ON public.subscriptions;
CREATE POLICY "Owners view their subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (
    public.is_platform_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.establishment_id = subscriptions.establishment_id AND ue.user_id = auth.uid()
    )
  );

-- Dono só cria SOLICITAÇÃO pendente, sem preço nem campanha (quem define é a equipe).
DROP POLICY IF EXISTS "Owners request a plan" ON public.subscriptions;
CREATE POLICY "Owners request a plan"
  ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    status = 'pending'
    AND requested_by = auth.uid()
    AND campaign_id IS NULL AND price_cents IS NULL AND promo_ends_at IS NULL
    AND decided_by IS NULL AND decided_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.establishment_id = subscriptions.establishment_id AND ue.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.plan_configurations pc
      WHERE pc.plan_name = subscriptions.plan_name AND pc.is_active AND pc.is_public
    )
  );

-- Dono pode desistir de uma solicitação ainda pendente.
DROP POLICY IF EXISTS "Owners withdraw pending requests" ON public.subscriptions;
CREATE POLICY "Owners withdraw pending requests"
  ON public.subscriptions FOR DELETE TO authenticated
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.establishment_id = subscriptions.establishment_id AND ue.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Platform admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Platform admins manage subscriptions"
  ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- 4. Vagas da campanha (números reais; só agregados saem do banco)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_launch_campaign()
RETURNS TABLE (
  slug text,
  name text,
  is_open boolean,
  spots_total integer,
  spots_used integer,
  spots_remaining integer,
  promo_price_cents integer,
  promo_months integer,
  plan_name text,
  regular_price_cents integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.slug,
    c.name,
    (c.is_active
      AND (c.starts_at IS NULL OR c.starts_at <= now())
      AND (c.ends_at IS NULL OR c.ends_at > now())
      AND u.used < c.spots_total) AS is_open,
    c.spots_total,
    u.used::integer AS spots_used,
    greatest(c.spots_total - u.used, 0)::integer AS spots_remaining,
    c.promo_price_cents,
    c.promo_months,
    c.plan_name,
    coalesce(pc.price_cents, 0) AS regular_price_cents
  FROM public.launch_campaigns c
  CROSS JOIN LATERAL (
    SELECT count(*) AS used
    FROM public.subscriptions s
    WHERE s.campaign_id = c.id AND s.status IN ('active', 'expired')
  ) u
  LEFT JOIN public.plan_configurations pc ON pc.plan_name = c.plan_name
  ORDER BY c.created_at
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_launch_campaign() TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Plano da empresa: só a equipe (ou as funções abaixo) altera
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_establishment_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  privileged boolean;
BEGIN
  privileged := coalesce(auth.role(), '') = 'service_role'
             OR coalesce(current_setting('app.allow_plan_change', true), '') = 'on'
             OR public.is_platform_admin(auth.uid());

  IF TG_OP = 'INSERT' THEN
    IF NOT privileged THEN
      NEW.plan := 'gratuito';
    END IF;
  ELSIF NEW.plan IS DISTINCT FROM OLD.plan AND NOT privileged THEN
    RAISE EXCEPTION 'O plano da empresa só pode ser alterado pela equipe do Comércio Vizinho.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_establishment_plan_trg ON public.establishments;
CREATE TRIGGER protect_establishment_plan_trg
  BEFORE INSERT OR UPDATE ON public.establishments
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_establishment_plan();

-- ---------------------------------------------------------------------
-- 6. Limite de produtos por plano (aplicado no banco, na tabela products)
--    Só bloqueia ADICIONAR um produto novo além do limite. Editar (inclusive
--    por upsert) ou remover nunca é bloqueado, e administradores não têm limite.
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS enforce_product_limit_trg ON public.establishments;
DROP FUNCTION IF EXISTS public.products_json_count(anyelement);

CREATE OR REPLACE FUNCTION public.enforce_product_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim integer;
  cnt integer;
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' OR public.is_platform_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- upsert de um produto que já existe: é edição, não é produto novo
  IF NEW.id IS NOT NULL AND EXISTS (SELECT 1 FROM public.products WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(pc.max_products, 5) INTO lim
  FROM public.establishments e
  LEFT JOIN public.plan_configurations pc ON pc.plan_name = e.plan
  WHERE e.id = NEW.establishment_id;

  IF lim IS NULL OR lim < 0 THEN
    RETURN NEW; -- sem limite configurado (-1 = ilimitado)
  END IF;

  SELECT count(*) INTO cnt FROM public.products WHERE establishment_id = NEW.establishment_id;
  IF cnt >= lim THEN
    RAISE EXCEPTION 'Limite de % produtos do plano atual atingido. Escolha um plano maior para cadastrar mais.', lim
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_product_limit_trg ON public.products;
CREATE TRIGGER enforce_product_limit_trg
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_product_limit();

-- ---------------------------------------------------------------------
-- 7. Decisões da equipe sobre as solicitações
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_subscription(_subscription_id uuid, _apply_launch_offer boolean DEFAULT true)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.subscriptions;
  plan_row public.plan_configurations;
  camp public.launch_campaigns;
  used integer;
  final_plan text;
  final_price integer;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem ativar planos.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO s FROM public.subscriptions WHERE id = _subscription_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada.'; END IF;
  IF s.status <> 'pending' THEN RAISE EXCEPTION 'Esta solicitação não está pendente.'; END IF;

  SELECT * INTO plan_row FROM public.plan_configurations WHERE plan_name = s.plan_name AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'O plano solicitado não está disponível.'; END IF;

  final_plan := s.plan_name;
  final_price := plan_row.price_cents;

  IF s.wants_launch_offer AND _apply_launch_offer THEN
    SELECT * INTO camp FROM public.launch_campaigns
     WHERE is_active
       AND (starts_at IS NULL OR starts_at <= now())
       AND (ends_at IS NULL OR ends_at > now())
     ORDER BY created_at LIMIT 1 FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Não há campanha de lançamento aberta.';
    END IF;
    IF camp.plan_name <> s.plan_name THEN
      RAISE EXCEPTION 'A campanha de lançamento vale para o plano %.', camp.plan_name;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.subscriptions
       WHERE establishment_id = s.establishment_id AND campaign_id = camp.id AND status IN ('active', 'expired')
    ) THEN
      RAISE EXCEPTION 'Esta empresa já usou a condição de lançamento.';
    END IF;

    SELECT count(*) INTO used FROM public.subscriptions
     WHERE campaign_id = camp.id AND status IN ('active', 'expired');
    IF used >= camp.spots_total THEN
      RAISE EXCEPTION 'As vagas da campanha de lançamento acabaram. Ative sem a condição promocional ou recuse.';
    END IF;

    s.campaign_id := camp.id;
    s.promo_ends_at := now() + make_interval(months => camp.promo_months);
    final_price := camp.promo_price_cents;
  END IF;

  -- encerra o plano ativo anterior, se houver
  UPDATE public.subscriptions
     SET status = 'cancelled', updated_at = now()
   WHERE establishment_id = s.establishment_id AND status = 'active';

  PERFORM set_config('app.allow_plan_change', 'on', true);
  UPDATE public.establishments SET plan = final_plan WHERE id = s.establishment_id;

  UPDATE public.subscriptions
     SET status = 'active', price_cents = final_price, campaign_id = s.campaign_id,
         promo_ends_at = s.promo_ends_at, decided_by = auth.uid(), decided_at = now(), updated_at = now()
   WHERE id = s.id
   RETURNING * INTO s;

  RETURN s;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_subscription(_subscription_id uuid, _note text DEFAULT NULL)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.subscriptions;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem recusar solicitações.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.subscriptions
     SET status = 'rejected', note = left(_note, 500), decided_by = auth.uid(), decided_at = now(), updated_at = now()
   WHERE id = _subscription_id AND status = 'pending'
   RETURNING * INTO s;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada ou já decidida.'; END IF;
  RETURN s;
END;
$$;

-- Encerra assinaturas ativas (cancelamento) ou promoções vencidas: a empresa volta a "gratuito".
CREATE OR REPLACE FUNCTION public.end_subscription(_subscription_id uuid, _new_status text DEFAULT 'cancelled')
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.subscriptions;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem encerrar planos.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF _new_status NOT IN ('cancelled', 'expired') THEN
    RAISE EXCEPTION 'Situação inválida.';
  END IF;
  UPDATE public.subscriptions
     SET status = _new_status, decided_by = auth.uid(), decided_at = now(), updated_at = now()
   WHERE id = _subscription_id AND status = 'active'
   RETURNING * INTO s;
  IF NOT FOUND THEN RAISE EXCEPTION 'Assinatura ativa não encontrada.'; END IF;

  PERFORM set_config('app.allow_plan_change', 'on', true);
  UPDATE public.establishments SET plan = 'gratuito' WHERE id = s.establishment_id;
  RETURN s;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_launch_promos()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  n integer := 0;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem encerrar promoções.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  FOR r IN
    SELECT id FROM public.subscriptions
     WHERE status = 'active' AND campaign_id IS NOT NULL AND promo_ends_at IS NOT NULL AND promo_ends_at < now()
  LOOP
    PERFORM public.end_subscription(r.id, 'expired');
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_subscription(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_subscription(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.end_subscription(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.expire_launch_promos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_subscription(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_launch_promos() TO authenticated;
