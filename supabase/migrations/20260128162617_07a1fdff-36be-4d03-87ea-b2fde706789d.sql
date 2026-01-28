-- =====================================================
-- COMPLETE CLAIM FLOW MIGRATION
-- Implementing proper separation between ADM and Owner
-- =====================================================

-- 1. Add requester_data column to establishment_claims for private info
-- This stores private requester information (never public)
ALTER TABLE public.establishment_claims
ADD COLUMN IF NOT EXISTS requester_name TEXT,
ADD COLUMN IF NOT EXISTS requester_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS requester_email TEXT,
ADD COLUMN IF NOT EXISTS requester_role TEXT;

-- 2. Add constraint to prevent admins from owning establishments
-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'adm_master', 'pre_adm')
  )
$$;

-- 3. Create trigger to prevent admins from being linked to establishments as owners
CREATE OR REPLACE FUNCTION public.prevent_admin_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user being added as owner is an admin
  IF NEW.role = 'owner' AND public.is_admin_user(NEW.user_id) THEN
    RAISE EXCEPTION 'Administrators cannot own establishments. ADMs are moderators only.';
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS check_admin_ownership ON public.user_establishments;
CREATE TRIGGER check_admin_ownership
  BEFORE INSERT OR UPDATE ON public.user_establishments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_admin_ownership();

-- 4. Create trigger to prevent claim approval for admins
CREATE OR REPLACE FUNCTION public.prevent_admin_claim_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When approving a claim, check if claimant is an admin
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    IF public.is_admin_user(NEW.user_id) THEN
      RAISE EXCEPTION 'Cannot approve claim for administrator. ADMs cannot own establishments.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_claim_approval ON public.establishment_claims;
CREATE TRIGGER check_claim_approval
  BEFORE UPDATE ON public.establishment_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_admin_claim_approval();

-- 5. Add index for faster claim lookups
CREATE INDEX IF NOT EXISTS idx_establishment_claims_status 
ON public.establishment_claims(status);

CREATE INDEX IF NOT EXISTS idx_establishment_claims_user_id 
ON public.establishment_claims(user_id);

-- 6. Update RLS for establishment_claims to properly secure requester data
DROP POLICY IF EXISTS "Users can view their own claims" ON public.establishment_claims;
CREATE POLICY "Users can view their own claims"
ON public.establishment_claims
FOR SELECT
USING (
  user_id = auth.uid() 
  OR can_approve_establishments(auth.uid())
);

-- Ensure insert policy includes new fields
DROP POLICY IF EXISTS "Users can create claims" ON public.establishment_claims;
CREATE POLICY "Users can create claims"
ON public.establishment_claims
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND NOT is_admin_user(auth.uid())
);

-- 7. Add comment for documentation
COMMENT ON COLUMN public.establishment_claims.requester_name IS 'Private: Full name of person claiming the business';
COMMENT ON COLUMN public.establishment_claims.requester_whatsapp IS 'Private: Personal WhatsApp (not public)';
COMMENT ON COLUMN public.establishment_claims.requester_email IS 'Private: Personal email for contact (not public)';
COMMENT ON COLUMN public.establishment_claims.requester_role IS 'Private: Role/position in the company (owner, manager, etc)';