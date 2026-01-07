-- Add unread count tracking to conversations
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS unread_count integer DEFAULT 0;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_at timestamp with time zone DEFAULT now();
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user_id uuid;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);

-- Create function to update unread count when new message is inserted
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    updated_at = now(),
    last_message_at = now(),
    unread_count = CASE 
      WHEN NEW.sender_type = 'user' THEN unread_count + 1
      ELSE unread_count
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for message insert
DROP TRIGGER IF EXISTS on_message_insert ON public.messages;
CREATE TRIGGER on_message_insert
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_on_message();

-- Enable realtime for conversations if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;