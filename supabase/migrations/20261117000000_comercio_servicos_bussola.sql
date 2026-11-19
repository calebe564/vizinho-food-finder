-- =====================================================================
-- COMÉRCIO E SERVIÇOS + BÚSSOLA (busca no servidor)
-- 1) novas categorias (comércio e serviços)
-- 2) campos de perfil estilo "ficha do Google" (site, Instagram, e-mail)
-- 3) busca tolerante a erro de digitação, no banco, com paginação
-- =====================================================================

-- 1) Categorias novas -------------------------------------------------
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'moda';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'calcados';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'farmacia';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'pet_shop';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'papelaria';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'eletronicos';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'casa_construcao';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'floricultura';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'salao_beleza';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'barbearia';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'mecanica';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'academia';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'saude';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'educacao';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'assistencia_tecnica';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'reparos_manutencao';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'lavanderia';
ALTER TYPE public.establishment_category ADD VALUE IF NOT EXISTS 'servicos_profissionais';

-- 2) Ficha da empresa -------------------------------------------------
ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS contact_email text;

-- 3) Busca ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.norm_text(_t text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT lower(extensions.unaccent(coalesce(_t, '')))
$$;

DROP FUNCTION IF EXISTS public.search_directory(text, text, text[], integer, integer);

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
      AND q.t <> ''
      AND (_category IS NULL OR e.category::text = _category OR e.category_2 = _category OR e.category_3 = _category)
      AND (_categories IS NULL OR e.category::text = ANY(_categories))
  )
  SELECT r.kind, r.id, r.establishment_id, r.establishment_name, r.name, r.category, r.neighborhood, r.city, r.image,
         r.price, r.unit, r.description, r.rating_average, r.rating_count, r.is_paid, r.is_destaque,
         r.plan, r.score
  FROM (SELECT * FROM est UNION ALL SELECT * FROM prod) r
  WHERE r.score >= 0.45
  ORDER BY (r.score
            + CASE WHEN r.is_destaque IS TRUE THEN 0.15 ELSE 0 END
            + CASE WHEN r.is_paid IS TRUE THEN 0.05 ELSE 0 END) DESC,
           r.name
  LIMIT least(greatest(_limit, 1), 50)
  OFFSET greatest(_offset, 0)
$$;

GRANT EXECUTE ON FUNCTION public.search_directory(text, text, text[], integer, integer) TO anon, authenticated;
