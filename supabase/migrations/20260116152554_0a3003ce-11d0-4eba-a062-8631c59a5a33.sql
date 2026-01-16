-- Make latitude and longitude optional (nullable) with default values
-- This allows the system to work without coordinates when CEP/neighborhood is used

ALTER TABLE public.establishments 
  ALTER COLUMN latitude SET DEFAULT 0,
  ALTER COLUMN longitude SET DEFAULT 0;

-- Add state column if not exists for better location filtering
ALTER TABLE public.establishments 
  ADD COLUMN IF NOT EXISTS state VARCHAR(2) DEFAULT 'SP';

-- Add cep column for better address management
ALTER TABLE public.establishments 
  ADD COLUMN IF NOT EXISTS cep VARCHAR(9);

-- Update establishment_requests table similarly
ALTER TABLE public.establishment_requests 
  ADD COLUMN IF NOT EXISTS state VARCHAR(2) DEFAULT 'SP';

ALTER TABLE public.establishment_requests 
  ADD COLUMN IF NOT EXISTS cep VARCHAR(9);