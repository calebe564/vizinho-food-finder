-- Permitir deletar conversas
CREATE POLICY "Users can delete their own conversations" 
ON public.conversations 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can delete conversations" 
ON public.conversations 
FOR DELETE 
USING (can_approve_establishments(auth.uid()));

-- Permitir deletar mensagens (para quando conversa é deletada)
CREATE POLICY "Users can delete their own messages" 
ON public.messages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = conversation_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete messages" 
ON public.messages 
FOR DELETE 
USING (can_approve_establishments(auth.uid()));