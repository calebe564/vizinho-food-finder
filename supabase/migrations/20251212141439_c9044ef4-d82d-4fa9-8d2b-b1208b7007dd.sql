-- Remove the old recursive policy
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

-- Update other tables to use the is_admin function instead of querying admin_users directly

-- Fix conversations policies
DROP POLICY IF EXISTS "Admins can update conversations" ON public.conversations;
CREATE POLICY "Admins can update conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Fix establishment_requests policies
DROP POLICY IF EXISTS "Admins can delete requests" ON public.establishment_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON public.establishment_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.establishment_requests;

CREATE POLICY "Admins can view all requests"
ON public.establishment_requests
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update requests"
ON public.establishment_requests
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete requests"
ON public.establishment_requests
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Fix establishment_statistics policies
DROP POLICY IF EXISTS "Admins can manage statistics" ON public.establishment_statistics;
CREATE POLICY "Admins can manage statistics"
ON public.establishment_statistics
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Fix establishments policies
DROP POLICY IF EXISTS "Admins can manage establishments" ON public.establishments;
CREATE POLICY "Admins can manage establishments"
ON public.establishments
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Fix product_variations policies
DROP POLICY IF EXISTS "Admins can manage product variations" ON public.product_variations;
CREATE POLICY "Admins can manage product variations"
ON public.product_variations
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Fix products policies
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));