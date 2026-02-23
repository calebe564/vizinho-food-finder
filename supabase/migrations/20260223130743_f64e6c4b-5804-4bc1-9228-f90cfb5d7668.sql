
-- Add monetization fields to establishments
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'gratuito',
ADD COLUMN IF NOT EXISTS is_destaque boolean NOT NULL DEFAULT false;

-- Add terms acceptance fields to establishment_requests
ALTER TABLE public.establishment_requests
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS terms_version text DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS terms_ip text;
