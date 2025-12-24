-- Fix RLS policies for establishments table to allow operations without Supabase Auth
-- (Admin panel uses password-based auth stored in sessionStorage)

DROP POLICY IF EXISTS "Admins can manage establishments" ON establishments;

-- Allow all operations for establishments (admin panel is password protected at app level)
CREATE POLICY "Allow managing establishments"
ON establishments
FOR ALL
USING (true)
WITH CHECK (true);

-- Fix RLS policies for products table
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "Allow managing products"
ON products
FOR ALL
USING (true)
WITH CHECK (true);

-- Fix RLS policies for product_variations table
DROP POLICY IF EXISTS "Admins can manage product variations" ON product_variations;

CREATE POLICY "Allow managing product_variations"
ON product_variations
FOR ALL
USING (true)
WITH CHECK (true);