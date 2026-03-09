
-- Create function to expire old promotions
CREATE OR REPLACE FUNCTION public.cleanup_expired_promotions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.products
  SET is_promotion = false,
      promotion_description = NULL,
      promotion_expiration = NULL
  WHERE is_promotion = true
    AND promotion_expiration IS NOT NULL
    AND promotion_expiration < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
