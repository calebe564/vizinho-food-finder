-- Add region and google_maps_link columns to establishments table
ALTER TABLE public.establishments
ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE public.establishments
ADD COLUMN IF NOT EXISTS google_maps_link text;

-- Add region and google_maps_link to establishment_requests table for new submissions
ALTER TABLE public.establishment_requests
ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE public.establishment_requests
ADD COLUMN IF NOT EXISTS google_maps_link text;