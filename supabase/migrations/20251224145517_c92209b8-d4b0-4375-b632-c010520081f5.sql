-- Drop restrictive RLS policies on establishment_requests
DROP POLICY IF EXISTS "Admins can view all requests" ON establishment_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON establishment_requests;
DROP POLICY IF EXISTS "Admins can delete requests" ON establishment_requests;

-- Create more permissive read policy (admin panel is password protected at app level)
CREATE POLICY "Allow reading all requests"
ON establishment_requests
FOR SELECT
USING (true);

-- Keep update policy permissive for admin operations
CREATE POLICY "Allow updating requests"
ON establishment_requests
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Keep delete policy permissive for admin operations
CREATE POLICY "Allow deleting requests"
ON establishment_requests
FOR DELETE
USING (true);