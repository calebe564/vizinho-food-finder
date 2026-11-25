-- =====================================================================
-- ETAPA 6 - PERSONALIZAÇÃO VISUAL DA PÁGINA DO COMERCIANTE
--
-- * Cada empresa pode ter cores próprias na SUA página pública (não afeta o site
--   nem outras empresas). Guarda só: cor principal, cor secundária e estilo dos cantos.
-- * O plano define o que é permitido (coluna customization_level em plan_configurations,
--   editável pelo administrador):  none = tema padrão;  basic = cor principal;
--   advanced = cor principal, cor secundária e estilo dos cantos.
-- * O banco só aceita cores no formato #RRGGBB (nada de texto livre) e confere o plano.
--   A legibilidade (contraste) é garantida na hora de mostrar a página: a cor é ajustada
--   automaticamente se ficar ilegível.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Nível de personalização de cada plano
-- ---------------------------------------------------------------------
ALTER TABLE public.plan_configurations
  ADD COLUMN IF NOT EXISTS customization_level text NOT NULL DEFAULT 'none';

DO $$
BEGIN
  ALTER TABLE public.plan_configurations
    ADD CONSTRAINT plan_configurations_customization_level_check
    CHECK (customization_level IN ('none', 'basic', 'advanced'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

UPDATE public.plan_configurations SET customization_level = 'none'
 WHERE plan_name IN ('gratuito', 'basico', 'start');
UPDATE public.plan_configurations SET customization_level = 'basic' WHERE plan_name = 'pro';
UPDATE public.plan_configurations SET customization_level = 'advanced' WHERE plan_name = 'max';

-- ---------------------------------------------------------------------
-- 2. Tema da empresa
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.establishment_themes (
  establishment_id uuid PRIMARY KEY REFERENCES public.establishments(id) ON DELETE CASCADE,
  primary_color text CHECK (primary_color IS NULL OR primary_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text CHECK (secondary_color IS NULL OR secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  corner_style text NOT NULL DEFAULT 'padrao' CHECK (corner_style IN ('padrao', 'reto', 'arredondado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.establishment_themes ENABLE ROW LEVEL SECURITY;

-- A página pública precisa ler o tema de empresas ativas.
DROP POLICY IF EXISTS "Anyone can view themes of active establishments" ON public.establishment_themes;
CREATE POLICY "Anyone can view themes of active establishments"
  ON public.establishment_themes FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.establishments e
    WHERE e.id = establishment_themes.establishment_id AND e.active IS NOT FALSE
  ));

DROP POLICY IF EXISTS "Owners and admins manage their theme" ON public.establishment_themes;
CREATE POLICY "Owners and admins manage their theme"
  ON public.establishment_themes FOR ALL TO authenticated
  USING (
    public.is_platform_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_establishments ue
                WHERE ue.establishment_id = establishment_themes.establishment_id AND ue.user_id = auth.uid())
  )
  WITH CHECK (
    public.is_platform_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_establishments ue
                WHERE ue.establishment_id = establishment_themes.establishment_id AND ue.user_id = auth.uid())
  );

-- O plano da empresa define o que ela pode guardar.
CREATE OR REPLACE FUNCTION public.enforce_theme_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lvl text;
BEGIN
  NEW.updated_at := now();

  IF coalesce(auth.role(), '') = 'service_role' OR public.is_platform_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(pc.customization_level, 'none') INTO lvl
    FROM public.establishments e
    LEFT JOIN public.plan_configurations pc ON pc.plan_name = e.plan
   WHERE e.id = NEW.establishment_id;

  IF coalesce(lvl, 'none') = 'none' THEN
    RAISE EXCEPTION 'O plano atual não inclui personalização visual. Veja os planos Pro e Max.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF lvl = 'basic' AND (NEW.secondary_color IS NOT NULL OR NEW.corner_style <> 'padrao') THEN
    RAISE EXCEPTION 'A cor secundária e o estilo dos cantos fazem parte do plano Max.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_theme_plan_trg ON public.establishment_themes;
CREATE TRIGGER enforce_theme_plan_trg
  BEFORE INSERT OR UPDATE ON public.establishment_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_theme_plan();
