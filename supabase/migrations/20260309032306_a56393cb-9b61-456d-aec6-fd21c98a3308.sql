-- Add owner reply fields to reviews
ALTER TABLE public.reviews 
  ADD COLUMN IF NOT EXISTS owner_reply text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS owner_reply_created_at timestamptz DEFAULT NULL;

-- Allow establishment owners to update the owner_reply on reviews for their establishment
CREATE POLICY "Owners can reply to reviews on their establishments"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.establishment_id = reviews.establishment_id
        AND ue.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_establishments ue
      WHERE ue.establishment_id = reviews.establishment_id
        AND ue.user_id = auth.uid()
    )
  );

-- Prevent owners from reviewing their own establishment (DB-level safety)
CREATE OR REPLACE FUNCTION public.prevent_owner_self_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_establishments
    WHERE establishment_id = NEW.establishment_id
      AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Você não pode avaliar sua própria empresa.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_owner_self_review_trigger
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_owner_self_review();