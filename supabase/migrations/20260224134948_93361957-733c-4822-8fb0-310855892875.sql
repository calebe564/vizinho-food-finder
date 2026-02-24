
-- Table for highlight/destaque requests
CREATE TABLE public.highlight_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE NULL,
  reviewed_by UUID NULL,
  starts_at TIMESTAMP WITH TIME ZONE NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  admin_notes TEXT NULL
);

ALTER TABLE public.highlight_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own highlight requests"
  ON public.highlight_requests FOR SELECT
  USING (user_id = auth.uid() OR public.can_approve_establishments(auth.uid()));

-- Users can create highlight requests for their establishments
CREATE POLICY "Users can create highlight requests"
  ON public.highlight_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.establishment_id = highlight_requests.establishment_id
      AND ue.user_id = auth.uid()
    )
  );

-- Admins can update highlight requests
CREATE POLICY "Admins can update highlight requests"
  ON public.highlight_requests FOR UPDATE
  USING (public.can_approve_establishments(auth.uid()));

-- Admins can delete highlight requests
CREATE POLICY "Admins can delete highlight requests"
  ON public.highlight_requests FOR DELETE
  USING (public.can_approve_establishments(auth.uid()));
