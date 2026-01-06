-- Tabela para notas internas do empresário
CREATE TABLE public.business_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  establishment_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_notes ENABLE ROW LEVEL SECURITY;

-- Policy: usuários podem ver suas próprias notas
CREATE POLICY "Users can view their own notes"
ON public.business_notes
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: usuários podem criar suas próprias notas
CREATE POLICY "Users can create their own notes"
ON public.business_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: usuários podem atualizar suas próprias notas
CREATE POLICY "Users can update their own notes"
ON public.business_notes
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: usuários podem deletar suas próprias notas
CREATE POLICY "Users can delete their own notes"
ON public.business_notes
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_business_notes_updated_at
BEFORE UPDATE ON public.business_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();