
-- Add neighborhood_normalized column to establishments
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS neighborhood_normalized text;

-- Create function to normalize neighborhood names
CREATE OR REPLACE FUNCTION public.normalize_neighborhood(raw_neighborhood text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  normalized text;
BEGIN
  IF raw_neighborhood IS NULL OR raw_neighborhood = '' THEN
    RETURN '';
  END IF;
  
  -- Step 1: lowercase
  normalized := lower(raw_neighborhood);
  
  -- Step 2: Remove accents (NFD normalization approach using translate)
  normalized := translate(normalized, 
    'àáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÑÇ',
    'aaaaaaeeeeiiiioooooouuuuyyncAAAAAAEEEEIIIIOOOOOUUUUYYNC');
  
  -- Step 3: Remove content in parentheses e.g. "(Barreiro)"
  normalized := regexp_replace(normalized, '\([^)]*\)', '', 'g');
  
  -- Step 4: Remove content after dash/traço e.g. "- Vale do Jatobá"  
  normalized := regexp_replace(normalized, '\s*[-–—]\s*.*$', '', 'g');
  
  -- Step 5: Remove special characters except spaces
  normalized := regexp_replace(normalized, '[^a-z0-9\s]', '', 'g');
  
  -- Step 6: Collapse multiple spaces and trim
  normalized := regexp_replace(trim(normalized), '\s+', ' ', 'g');
  
  RETURN normalized;
END;
$$;

-- Create trigger function to auto-populate neighborhood_normalized
CREATE OR REPLACE FUNCTION public.set_neighborhood_normalized()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.neighborhood_normalized := public.normalize_neighborhood(NEW.neighborhood);
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_neighborhood_normalized ON public.establishments;
CREATE TRIGGER trigger_set_neighborhood_normalized
BEFORE INSERT OR UPDATE OF neighborhood ON public.establishments
FOR EACH ROW
EXECUTE FUNCTION public.set_neighborhood_normalized();

-- Backfill existing data
UPDATE public.establishments 
SET neighborhood_normalized = public.normalize_neighborhood(neighborhood)
WHERE neighborhood IS NOT NULL;

-- Add same column to establishment_requests for consistency
ALTER TABLE public.establishment_requests 
ADD COLUMN IF NOT EXISTS neighborhood_normalized text;

CREATE OR REPLACE FUNCTION public.set_request_neighborhood_normalized()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.neighborhood_normalized := public.normalize_neighborhood(NEW.neighborhood);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_request_neighborhood_normalized ON public.establishment_requests;
CREATE TRIGGER trigger_set_request_neighborhood_normalized
BEFORE INSERT OR UPDATE OF neighborhood ON public.establishment_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_request_neighborhood_normalized();

-- Backfill existing request data
UPDATE public.establishment_requests 
SET neighborhood_normalized = public.normalize_neighborhood(neighborhood)
WHERE neighborhood IS NOT NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_establishments_neighborhood_normalized 
ON public.establishments(neighborhood_normalized);
