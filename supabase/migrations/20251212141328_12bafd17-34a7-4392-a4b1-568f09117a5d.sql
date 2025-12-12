-- Drop existing policies on admin_users that cause recursion
DROP POLICY IF EXISTS "Admin users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can view admin_users" ON public.admin_users;

-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = _user_id
  )
$$;

-- Create a simple policy that allows users to check if they are in admin_users
-- This policy allows a user to read their own row only
CREATE POLICY "Users can read their own admin status"
ON public.admin_users
FOR SELECT
TO authenticated
USING (id = auth.uid());