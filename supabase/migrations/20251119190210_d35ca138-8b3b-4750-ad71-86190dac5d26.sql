-- Add city field to establishments table
ALTER TABLE public.establishments 
ADD COLUMN city text NOT NULL DEFAULT 'São Paulo';

-- Add reference_point field to establishments table
ALTER TABLE public.establishments 
ADD COLUMN reference_point text;

-- Update existing records to have a default city
UPDATE public.establishments 
SET city = 'São Paulo' 
WHERE city IS NULL;