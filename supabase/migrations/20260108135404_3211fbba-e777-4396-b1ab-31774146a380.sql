-- Add last_login_at to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create admin_permissions table for storing admin limitations
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_edit_establishments BOOLEAN DEFAULT true,
  can_approve_requests BOOLEAN DEFAULT false,
  can_manage_ads BOOLEAN DEFAULT false,
  can_view_conversations BOOLEAN DEFAULT true,
  can_manage_users BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_permissions
CREATE POLICY "ADM_MASTER can manage all permissions"
ON public.admin_permissions
FOR ALL
USING (public.is_adm_master(auth.uid()))
WITH CHECK (public.is_adm_master(auth.uid()));

CREATE POLICY "Users can view their own permissions"
ON public.admin_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user_id ON public.admin_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login_at DESC);