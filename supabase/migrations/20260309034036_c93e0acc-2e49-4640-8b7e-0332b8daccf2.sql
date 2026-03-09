
-- Add promotion fields to products table
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS is_promotion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promotion_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS promotion_expiration timestamptz DEFAULT NULL;

-- Create function to auto-expire promotions
CREATE OR REPLACE FUNCTION public.expire_promotions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- On any update, check if promotion has expired
  IF NEW.is_promotion = true AND NEW.promotion_expiration IS NOT NULL AND NEW.promotion_expiration < now() THEN
    NEW.is_promotion := false;
    NEW.promotion_description := NULL;
    NEW.promotion_expiration := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_promotion_expiration
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.expire_promotions();
