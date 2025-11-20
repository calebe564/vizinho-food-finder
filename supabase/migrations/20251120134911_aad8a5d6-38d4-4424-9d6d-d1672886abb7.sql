-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar tabela de conversas
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  city_neighborhood TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de mensagens
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas para conversas (público pode criar, mas só vê suas próprias)
CREATE POLICY "Anyone can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users and admins can view conversations"
ON public.conversations
FOR SELECT
USING (true);

CREATE POLICY "Admins can update conversations"
ON public.conversations
FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Políticas para mensagens (público pode enviar, admins veem tudo)
CREATE POLICY "Anyone can create messages"
ON public.messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view messages"
ON public.messages
FOR SELECT
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;