-- Add delivery options to establishments table
ALTER TABLE public.establishments
ADD COLUMN IF NOT EXISTS has_delivery boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_other text DEFAULT NULL;

-- Add same columns to establishment_requests for new submissions
ALTER TABLE public.establishment_requests
ADD COLUMN IF NOT EXISTS has_delivery boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_other text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.establishments.has_delivery IS 'Whether the establishment offers delivery';
COMMENT ON COLUMN public.establishments.delivery_type IS 'Type of delivery: proprio, ifood, uber_eats, outro';
COMMENT ON COLUMN public.establishments.delivery_other IS 'Description when delivery_type is outro';