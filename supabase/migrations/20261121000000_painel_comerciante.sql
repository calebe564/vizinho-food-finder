-- =====================================================================
-- ETAPA 5 - PAINEL DO COMERCIANTE
--
-- 1) Produtos: disponibilidade e categoria; o dono gerencia os próprios produtos.
-- 2) Estatísticas REAIS e à prova de adulteração: eventos registrados pelo servidor
--    (visita ao perfil, visualização de produto, cliques), sem gravar IP.
-- 3) Busca: produto indisponível não aparece, e o plano NÃO dá vantagem na ordem.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Produtos
-- ---------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS category text;

DO $$
BEGIN
  ALTER TABLE public.products
    ADD CONSTRAINT products_category_len CHECK (category IS NULL OR char_length(category) <= 60);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Owners manage their products" ON public.products;
CREATE POLICY "Owners manage their products"
  ON public.products FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.establishment_id = products.establishment_id AND ue.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.establishment_id = products.establishment_id AND ue.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Owners manage their product variations" ON public.product_variations;
CREATE POLICY "Owners manage their product variations"
  ON public.product_variations FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_establishments ue ON ue.establishment_id = p.establishment_id
    WHERE p.id = product_variations.product_id AND ue.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.user_establishments ue ON ue.establishment_id = p.establishment_id
    WHERE p.id = product_variations.product_id AND ue.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------
-- 2. Eventos de estatística
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.establishment_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'profile_view', 'product_view', 'whatsapp_click', 'phone_click',
    'site_click', 'instagram_click', 'directions_click'
  )),
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS establishment_events_est_time_idx
  ON public.establishment_events (establishment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS establishment_events_est_type_time_idx
  ON public.establishment_events (establishment_id, event_type, created_at DESC);

ALTER TABLE public.establishment_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.establishment_events FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Platform admins read events" ON public.establishment_events;
CREATE POLICY "Platform admins read events"
  ON public.establishment_events FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));
GRANT SELECT ON public.establishment_events TO authenticated;

-- O contador antigo era gravado pelo navegador de qualquer visitante (dava para inflar).
-- Agora só o servidor escreve nele.
REVOKE INSERT, UPDATE, DELETE ON public.establishment_statistics FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.track_event(
  _establishment_id uuid,
  _event_type text,
  _product_id uuid DEFAULT NULL,
  _session_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_view boolean;
  target text;
BEGIN
  IF _event_type NOT IN ('profile_view', 'product_view', 'whatsapp_click', 'phone_click',
                         'site_click', 'instagram_click', 'directions_click') THEN
    RETURN false;
  END IF;
  IF _session_id IS NULL OR _session_id !~ '^[A-Za-z0-9_-]{8,64}$' THEN
    RETURN false;
  END IF;

  -- a empresa precisa existir e estar visível; o produto, ser dela
  IF NOT EXISTS (SELECT 1 FROM public.establishments e WHERE e.id = _establishment_id AND e.active IS NOT FALSE) THEN
    RETURN false;
  END IF;
  IF _product_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM public.products p WHERE p.id = _product_id AND p.establishment_id = _establishment_id) THEN
    RETURN false;
  END IF;
  IF _event_type = 'product_view' AND _product_id IS NULL THEN
    RETURN false;
  END IF;

  -- visitas do próprio dono e da equipe não contam
  IF auth.uid() IS NOT NULL AND (
       public.is_platform_admin(auth.uid())
       OR EXISTS (SELECT 1 FROM public.user_establishments ue
                   WHERE ue.establishment_id = _establishment_id AND ue.user_id = auth.uid())) THEN
    RETURN false;
  END IF;

  -- anti-inflação: a mesma pessoa conta 1 visualização por item a cada 30 min
  -- (cliques: até 3 a cada 10 min) e no máximo 300 eventos por hora
  is_view := _event_type IN ('profile_view', 'product_view');
  target := coalesce(_product_id::text, _establishment_id::text);
  IF NOT public.rl_hit('ev:' || _session_id || ':' || _event_type || ':' || target,
                       CASE WHEN is_view THEN 1 ELSE 3 END,
                       CASE WHEN is_view THEN 1800 ELSE 600 END) THEN
    RETURN false;
  END IF;
  IF NOT public.rl_hit('evvol:' || _session_id, 300, 3600) THEN
    RETURN false;
  END IF;

  INSERT INTO public.establishment_events (establishment_id, product_id, event_type, session_id)
  VALUES (_establishment_id, _product_id, _event_type, _session_id);

  -- mantém os contadores antigos (painel do administrador), agora com escrita atômica
  IF _event_type = 'profile_view' THEN
    UPDATE public.establishment_statistics
       SET page_views = coalesce(page_views, 0) + 1, last_updated = now()
     WHERE establishment_id = _establishment_id;
  ELSIF _event_type IN ('whatsapp_click', 'phone_click') THEN
    UPDATE public.establishment_statistics
       SET phone_clicks = coalesce(phone_clicks, 0) + 1, last_updated = now()
     WHERE establishment_id = _establishment_id;
  END IF;

  -- limpeza de eventos muito antigos (mais de ~13 meses)
  IF random() < 0.002 THEN
    DELETE FROM public.establishment_events WHERE created_at < now() - interval '400 days';
  END IF;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.track_event(uuid, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_event(uuid, text, uuid, text) TO anon, authenticated;

-- Números do painel: só o dono da empresa (ou a equipe) consulta
CREATE OR REPLACE FUNCTION public.get_establishment_metrics(_establishment_id uuid, _days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d integer := least(greatest(coalesce(_days, 30), 1), 365);
  since timestamptz;
  result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT (
       public.is_platform_admin(auth.uid())
       OR EXISTS (SELECT 1 FROM public.user_establishments ue
                   WHERE ue.establishment_id = _establishment_id AND ue.user_id = auth.uid())) THEN
    RAISE EXCEPTION 'Sem permissão para ver estes números.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  since := now() - make_interval(days => d);

  SELECT jsonb_build_object(
    'days', d,
    'since', since,
    'first_event_at', (SELECT min(created_at) FROM public.establishment_events WHERE establishment_id = _establishment_id),
    'totals', coalesce((
      SELECT jsonb_object_agg(event_type, n) FROM (
        SELECT event_type, count(*) AS n
          FROM public.establishment_events
         WHERE establishment_id = _establishment_id AND created_at >= since
         GROUP BY event_type) t), '{}'::jsonb),
    'unique_visitors', (
      SELECT count(DISTINCT session_id) FROM public.establishment_events
       WHERE establishment_id = _establishment_id AND created_at >= since AND event_type = 'profile_view'),
    'daily', coalesce((
      SELECT jsonb_agg(jsonb_build_object('day', g.day, 'profile_view', coalesce(c.pv, 0), 'whatsapp_click', coalesce(c.wa, 0)) ORDER BY g.day)
      FROM (SELECT generate_series(
                     (since AT TIME ZONE 'America/Sao_Paulo')::date,
                     (now() AT TIME ZONE 'America/Sao_Paulo')::date, interval '1 day')::date AS day) g
      LEFT JOIN (
        SELECT (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS day,
               count(*) FILTER (WHERE event_type = 'profile_view') AS pv,
               count(*) FILTER (WHERE event_type = 'whatsapp_click') AS wa
          FROM public.establishment_events
         WHERE establishment_id = _establishment_id AND created_at >= since
         GROUP BY 1) c ON c.day = g.day), '[]'::jsonb),
    'top_products', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', t.product_id, 'name', t.name, 'views', t.views) ORDER BY t.views DESC)
      FROM (SELECT ev.product_id, p.name, count(*) AS views
              FROM public.establishment_events ev
              JOIN public.products p ON p.id = ev.product_id
             WHERE ev.establishment_id = _establishment_id AND ev.created_at >= since AND ev.event_type = 'product_view'
             GROUP BY ev.product_id, p.name
             ORDER BY count(*) DESC
             LIMIT 5) t), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_establishment_metrics(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_establishment_metrics(uuid, integer) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. Busca: sem produtos indisponíveis e SEM vantagem de plano ou destaque
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_directory(
  _query text,
  _category text DEFAULT NULL,
  _categories text[] DEFAULT NULL,
  _limit integer DEFAULT 24,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  kind text,
  id uuid,
  establishment_id uuid,
  establishment_name text,
  name text,
  category text,
  neighborhood text,
  city text,
  image text,
  price numeric,
  unit text,
  description text,
  rating_average numeric,
  rating_count integer,
  is_paid boolean,
  is_destaque boolean,
  plan text,
  score real
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  WITH q AS (SELECT public.norm_text(trim(_query)) AS t),
  est AS (
    SELECT
      'empresa'::text AS kind, e.id, e.id AS establishment_id, e.name AS establishment_name, e.name, e.category::text AS category,
      e.neighborhood, e.city, e.profile_image AS image, NULL::numeric AS price, NULL::text AS unit,
      e.description, e.rating_average, e.rating_count, e.is_paid, e.is_destaque, e.plan,
      greatest(
        word_similarity(q.t, public.norm_text(e.name)),
        CASE WHEN strpos(public.norm_text(e.name), q.t) > 0 THEN 1.0 ELSE 0 END,
        word_similarity(q.t, public.norm_text(coalesce(e.description, ''))) * 0.5,
        CASE WHEN strpos(public.norm_text(e.category::text || ' ' || coalesce(e.category_2, '') || ' ' || coalesce(e.category_3, '')), q.t) > 0 THEN 0.7 ELSE 0 END,
        CASE WHEN strpos(public.norm_text(coalesce(e.neighborhood, '') || ' ' || coalesce(e.city, '')), q.t) > 0 THEN 0.5 ELSE 0 END
      )::real AS score
    FROM public.establishments e, q
    WHERE e.active IS NOT FALSE
      AND q.t <> ''
      AND (_category IS NULL OR e.category::text = _category OR e.category_2 = _category OR e.category_3 = _category)
      AND (_categories IS NULL OR e.category::text = ANY(_categories))
  ),
  prod AS (
    SELECT
      'produto'::text AS kind, p.id, p.establishment_id, e.name AS establishment_name, p.name, e.category::text AS category,
      e.neighborhood, e.city, coalesce(p.image, e.profile_image) AS image, p.price, p.unit,
      p.description, e.rating_average, e.rating_count, e.is_paid, e.is_destaque, e.plan,
      greatest(
        word_similarity(q.t, public.norm_text(p.name)),
        CASE WHEN strpos(public.norm_text(p.name), q.t) > 0 THEN 1.0 ELSE 0 END,
        word_similarity(q.t, public.norm_text(coalesce(p.description, ''))) * 0.5
      )::real AS score
    FROM public.products p
    JOIN public.establishments e ON e.id = p.establishment_id, q
    WHERE e.active IS NOT FALSE
      AND p.is_available IS NOT FALSE
      AND q.t <> ''
      AND (_category IS NULL OR e.category::text = _category OR e.category_2 = _category OR e.category_3 = _category)
      AND (_categories IS NULL OR e.category::text = ANY(_categories))
  )
  SELECT r.kind, r.id, r.establishment_id, r.establishment_name, r.name, r.category, r.neighborhood, r.city, r.image,
         r.price, r.unit, r.description, r.rating_average, r.rating_count, r.is_paid, r.is_destaque,
         r.plan, r.score
  FROM (SELECT * FROM est UNION ALL SELECT * FROM prod) r
  WHERE r.score >= 0.45
  -- Ordem orgânica: só relevância. Plano pago e destaque NÃO influenciam (anúncios ficam em espaço próprio).
  ORDER BY r.score DESC, r.name
  LIMIT least(greatest(_limit, 1), 50)
  OFFSET greatest(_offset, 0)
$$;

GRANT EXECUTE ON FUNCTION public.search_directory(text, text, text[], integer, integer) TO anon, authenticated;
