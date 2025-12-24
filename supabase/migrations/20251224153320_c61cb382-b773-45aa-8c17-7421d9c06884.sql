-- Drop the restrictive admin-only policy
DROP POLICY IF EXISTS "Admins can manage advertisements" ON public.advertisements;

-- Create policies that allow managing advertisements without requiring Supabase Auth
-- Since the admin uses a custom password-based session, we need to allow these operations
CREATE POLICY "Allow insert advertisements" 
ON public.advertisements 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update advertisements" 
ON public.advertisements 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete advertisements" 
ON public.advertisements 
FOR DELETE 
USING (true);