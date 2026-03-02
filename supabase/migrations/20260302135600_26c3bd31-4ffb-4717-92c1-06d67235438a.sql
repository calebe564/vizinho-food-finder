
-- Create establishment_photos table
CREATE TABLE public.establishment_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_main BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_establishment_photos_establishment ON public.establishment_photos(establishment_id);
CREATE INDEX idx_establishment_photos_main ON public.establishment_photos(establishment_id, is_main) WHERE is_main = true;

-- Enable RLS
ALTER TABLE public.establishment_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view photos of active establishments
CREATE POLICY "Anyone can view establishment photos"
ON public.establishment_photos
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.establishments e
  WHERE e.id = establishment_photos.establishment_id AND e.active = true
));

-- Owners and admins can insert photos
CREATE POLICY "Owners and admins can insert photos"
ON public.establishment_photos
FOR INSERT
WITH CHECK (
  is_adm_master(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.establishment_id = establishment_photos.establishment_id
    AND ue.user_id = auth.uid()
  )
);

-- Owners and admins can update photos
CREATE POLICY "Owners and admins can update photos"
ON public.establishment_photos
FOR UPDATE
USING (
  is_adm_master(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.establishment_id = establishment_photos.establishment_id
    AND ue.user_id = auth.uid()
  )
);

-- Owners and admins can delete photos
CREATE POLICY "Owners and admins can delete photos"
ON public.establishment_photos
FOR DELETE
USING (
  is_adm_master(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.user_establishments ue
    WHERE ue.establishment_id = establishment_photos.establishment_id
    AND ue.user_id = auth.uid()
  )
);

-- Trigger to ensure only one main photo per establishment
CREATE OR REPLACE FUNCTION public.ensure_single_main_photo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_main = true THEN
    UPDATE public.establishment_photos
    SET is_main = false, updated_at = now()
    WHERE establishment_id = NEW.establishment_id
    AND id != NEW.id
    AND is_main = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_ensure_single_main_photo
BEFORE INSERT OR UPDATE ON public.establishment_photos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_main_photo();

-- Trigger for updated_at
CREATE TRIGGER update_establishment_photos_updated_at
BEFORE UPDATE ON public.establishment_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for establishment_photos, establishments, highlight_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.establishment_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.establishments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.highlight_requests;
