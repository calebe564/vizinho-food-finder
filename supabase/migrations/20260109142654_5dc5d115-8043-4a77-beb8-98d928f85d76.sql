-- Add CNPJ field to establishment_requests table
ALTER TABLE public.establishment_requests 
ADD COLUMN IF NOT EXISTS cnpj text;

-- Add CNPJ field to establishments table  
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS cnpj text;

-- Create index for CNPJ lookup
CREATE INDEX IF NOT EXISTS idx_establishments_cnpj ON public.establishments(cnpj);
CREATE INDEX IF NOT EXISTS idx_establishment_requests_cnpj ON public.establishment_requests(cnpj);

-- Create table for establishment claims (reivindicação)
CREATE TABLE IF NOT EXISTS public.establishment_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE,
  cnpj text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);

-- Enable RLS on claims table
ALTER TABLE public.establishment_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY "Users can view their own claims" 
ON public.establishment_claims 
FOR SELECT 
USING (user_id = auth.uid() OR can_approve_establishments(auth.uid()));

-- Users can create claims
CREATE POLICY "Users can create claims" 
ON public.establishment_claims 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can update claims
CREATE POLICY "Admins can update claims" 
ON public.establishment_claims 
FOR UPDATE 
USING (can_approve_establishments(auth.uid()));

-- Admins can delete claims
CREATE POLICY "Admins can delete claims" 
ON public.establishment_claims 
FOR DELETE 
USING (can_approve_establishments(auth.uid()));