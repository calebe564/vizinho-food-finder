-- Add 'images' column (JSONB) to products table for multiple images
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Add 'unit' column to products table (ex: unidade, kg, litro)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit text DEFAULT 'unidade';

-- Migrate existing single image to images array if exists
UPDATE public.products 
SET images = jsonb_build_array(image) 
WHERE image IS NOT NULL AND image != '' AND (images IS NULL OR images = '[]'::jsonb);