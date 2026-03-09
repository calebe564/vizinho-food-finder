
-- Plan configurations table
CREATE TABLE public.plan_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text UNIQUE NOT NULL,
  max_products integer NOT NULL DEFAULT 5,
  visibility_weight integer NOT NULL DEFAULT 5,
  promotion_boost numeric NOT NULL DEFAULT 1.0,
  display_label text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plan_configurations ENABLE ROW LEVEL SECURITY;

-- Everyone can read plan configs
CREATE POLICY "Anyone can view plan configurations"
  ON public.plan_configurations FOR SELECT
  USING (true);

-- Only adm_master can manage
CREATE POLICY "Only adm_master can manage plan configurations"
  ON public.plan_configurations FOR ALL
  USING (public.is_adm_master(auth.uid()))
  WITH CHECK (public.is_adm_master(auth.uid()));

-- Insert default plans
INSERT INTO public.plan_configurations (plan_name, max_products, visibility_weight, promotion_boost, display_label) VALUES
  ('gratuito', 5, 5, 1.0, 'Free'),
  ('basico', 20, 20, 1.5, 'Basic'),
  ('pro', -1, 80, 2.5, 'Pro');

-- Function to enforce product limit per plan
CREATE OR REPLACE FUNCTION public.enforce_product_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_plan text;
  max_allowed integer;
  current_count integer;
BEGIN
  -- Get the establishment's plan
  SELECT plan INTO current_plan
  FROM public.establishments
  WHERE id = NEW.establishment_id;

  -- Get the max products for this plan
  SELECT max_products INTO max_allowed
  FROM public.plan_configurations
  WHERE plan_name = current_plan;

  -- -1 means unlimited
  IF max_allowed IS NULL OR max_allowed = -1 THEN
    RETURN NEW;
  END IF;

  -- Count current products
  SELECT COUNT(*) INTO current_count
  FROM public.products
  WHERE establishment_id = NEW.establishment_id;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Limite de produtos atingido para o plano "%". Máximo permitido: %', current_plan, max_allowed;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to enforce on INSERT
CREATE TRIGGER enforce_product_limit_trigger
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_product_limit();
