-- Create storage bucket for establishment images
INSERT INTO storage.buckets (id, name, public) VALUES ('establishment-images', 'establishment-images', true);

-- Storage policies for establishment images
CREATE POLICY "Anyone can view establishment images"
ON storage.objects FOR SELECT
USING (bucket_id = 'establishment-images');

CREATE POLICY "Anyone can upload establishment images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'establishment-images');

-- Add images columns to establishments table
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS favorite_images JSONB DEFAULT '[]'::jsonb;

-- Add images columns to establishment_requests table
ALTER TABLE public.establishment_requests 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS favorite_images JSONB DEFAULT '[]'::jsonb;

-- Create advertisements table
CREATE TABLE public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image TEXT NOT NULL,
  title TEXT,
  text TEXT,
  link TEXT,
  position TEXT NOT NULL CHECK (position IN ('top', 'middle', 'bottom')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on advertisements
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Anyone can view active advertisements
CREATE POLICY "Anyone can view active advertisements"
ON public.advertisements
FOR SELECT
USING (active = true);

-- Admins can manage advertisements
CREATE POLICY "Admins can manage advertisements"
ON public.advertisements
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));