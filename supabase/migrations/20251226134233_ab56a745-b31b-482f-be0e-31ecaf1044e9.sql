-- Criar tabela para registrar tentativas de login (sucesso e falha)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode inserir tentativas (para registrar no login)
CREATE POLICY "Anyone can log login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);

-- Apenas ADM pode ver tentativas de login
CREATE POLICY "Admins can view login attempts"
ON public.login_attempts
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'adm_master')
);

-- Índice para buscas por email
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_attempted_at ON public.login_attempts(attempted_at DESC);