DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can log recovery attempts" ON public.recovery_attempts;

DROP POLICY IF EXISTS "Anyone can log login attempts" ON public.login_attempts;
CREATE POLICY "Log own or failed login attempts" ON public.login_attempts
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(email) BETWEEN 3 AND 254
  AND attempted_at > now() - interval '5 minutes'
  AND (
    success = false
    OR (auth.uid() IS NOT NULL AND lower(email) = lower(coalesce(auth.jwt()->>'email','')))
  )
);

DROP POLICY IF EXISTS "Anyone can view statistics" ON public.establishment_statistics;
CREATE POLICY "Owners can view their statistics" ON public.establishment_statistics
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_establishments ue
          WHERE ue.establishment_id = establishment_statistics.establishment_id
            AND ue.user_id = auth.uid())
  OR public.can_approve_establishments(auth.uid())
);

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews of active establishments" ON public.reviews
FOR SELECT TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.establishments e
          WHERE e.id = reviews.establishment_id AND e.active IS NOT FALSE)
  OR auth.uid() = user_id
);

DROP POLICY IF EXISTS "Authenticated users can upload establishment images" ON storage.objects;
CREATE POLICY "Authenticated users can upload establishment images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'establishment-images' AND owner_id = (select auth.uid()::text));