
-- Function to cleanup expired promotions (can be called periodically or via cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_promotions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.products
  SET 
    is_promotion = false,
    promotion_description = NULL,
    promotion_expiration = NULL
  WHERE 
    is_promotion = true 
    AND promotion_expiration IS NOT NULL 
    AND promotion_expiration < now();
  
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- Replace the existing trigger to also handle expiration check on SELECT-time
-- Create a trigger that runs cleanup before any product query via RPC
-- Better approach: trigger on product access to auto-clean expired ones

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS check_promotion_expiration ON public.products;
DROP FUNCTION IF EXISTS public.expire_promotions();

-- New trigger function: on any UPDATE to products, clean expired promos
CREATE OR REPLACE FUNCTION public.auto_expire_promotion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If this product has an expired promotion, clear it
  IF NEW.is_promotion = true 
     AND NEW.promotion_expiration IS NOT NULL 
     AND NEW.promotion_expiration < now() THEN
    NEW.is_promotion := false;
    NEW.promotion_description := NULL;
    NEW.promotion_expiration := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_expire_promotion_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_expire_promotion();
