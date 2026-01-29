-- Add CPF and document type support to establishment_requests
ALTER TABLE public.establishment_requests 
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'cnpj' CHECK (document_type IN ('cnpj', 'cpf')),
ADD COLUMN IF NOT EXISTS cpf_hash TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS data_origin TEXT DEFAULT 'api' CHECK (data_origin IN ('api', 'manual'));

-- Add CPF and document type support to establishment_claims  
ALTER TABLE public.establishment_claims
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'cnpj' CHECK (document_type IN ('cnpj', 'cpf')),
ADD COLUMN IF NOT EXISTS cpf_hash TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Create a view for establishment_requests that hides sensitive CPF data for public access
-- Note: The base table already has proper RLS, this is additional protection
CREATE OR REPLACE VIEW public.establishment_requests_public
WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  category,
  neighborhood,
  address,
  phone,
  whatsapp,
  description,
  external_link,
  status,
  profile_image,
  schedule,
  region,
  google_maps_link,
  images,
  favorite_images,
  products_json,
  has_delivery,
  delivery_type,
  delivery_other,
  state,
  cep,
  created_at,
  -- Document type exposed but not the actual values
  document_type,
  data_origin,
  -- Hide: cnpj, cpf_hash, birth_date, user_id, admin_notes, approved_by, rejected_by, rejection_reason
  CASE WHEN cnpj IS NOT NULL THEN 'CNPJ verificado' ELSE NULL END AS document_status
FROM public.establishment_requests;

-- Create a view for establishment_claims that hides private requester data
CREATE OR REPLACE VIEW public.establishment_claims_public  
WITH (security_invoker=on) AS
SELECT
  id,
  establishment_id,
  status,
  created_at,
  reviewed_at,
  document_type,
  -- Hide: cnpj, cpf_hash, birth_date, user_id, requester_name, requester_whatsapp, requester_email, requester_role, admin_notes
  CASE WHEN cnpj IS NOT NULL THEN 'Documento enviado' ELSE NULL END AS document_status
FROM public.establishment_claims;

-- Add comment for documentation
COMMENT ON TABLE public.establishment_requests IS 'Business registration requests. CPF/birth_date are private fields only accessible to owner and admins.';
COMMENT ON TABLE public.establishment_claims IS 'Business claiming requests. CPF/birth_date and requester data are private fields only accessible to owner and admins.';
COMMENT ON COLUMN public.establishment_requests.cpf_hash IS 'Hashed CPF for privacy. Never expose raw CPF in public queries.';
COMMENT ON COLUMN public.establishment_claims.cpf_hash IS 'Hashed CPF for privacy. Never expose raw CPF in public queries.';