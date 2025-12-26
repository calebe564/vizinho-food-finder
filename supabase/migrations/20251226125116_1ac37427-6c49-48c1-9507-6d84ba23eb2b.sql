-- Add new columns to profiles table for enhanced recovery
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS favorite_color text;

-- Create a table to log recovery attempts (for admin review)
CREATE TABLE IF NOT EXISTS public.recovery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempted_at timestamp with time zone DEFAULT now(),
  success boolean DEFAULT false,
  ip_address text
);

-- Enable RLS on recovery_attempts
ALTER TABLE public.recovery_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view recovery attempts
CREATE POLICY "Admins can view recovery attempts" 
ON public.recovery_attempts 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Anyone can insert recovery attempts (for logging)
CREATE POLICY "Anyone can log recovery attempts" 
ON public.recovery_attempts 
FOR INSERT 
WITH CHECK (true);

-- Update verify_recovery_pin function to include additional checks
CREATE OR REPLACE FUNCTION public.verify_recovery_pin_enhanced(
  _email text, 
  _pin_hash text,
  _full_name text,
  _birth_date date
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.profiles
  WHERE email = _email
    AND recovery_pin_hash = _pin_hash
    AND full_name = _full_name
    AND birth_date = _birth_date
$$;