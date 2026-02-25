
-- Create notifications table for admin notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('conversa', 'solicitacao', 'reivindicacao', 'destaque', 'sistema')),
  referencia_id uuid,
  titulo text NOT NULL,
  descricao_resumida text,
  destino text NOT NULL DEFAULT 'admin',
  lido boolean NOT NULL DEFAULT false,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  lido_em timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications
CREATE POLICY "Admins can view notifications"
ON public.notifications FOR SELECT
USING (can_approve_establishments(auth.uid()));

-- Only admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.notifications FOR UPDATE
USING (can_approve_establishments(auth.uid()));

-- Allow triggers/system to insert (via security definer functions)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_admin_notification(
  _tipo text,
  _referencia_id uuid,
  _titulo text,
  _descricao text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (tipo, referencia_id, titulo, descricao_resumida, destino)
  VALUES (_tipo, _referencia_id, _titulo, _descricao, 'admin');
END;
$$;

-- Trigger: new conversation -> notification
CREATE OR REPLACE FUNCTION public.notify_new_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_admin_notification(
    'conversa',
    NEW.id,
    'Nova conversa de suporte',
    'De: ' || NEW.user_name
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_conversation
AFTER INSERT ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_conversation();

-- Trigger: new establishment request -> notification
CREATE OR REPLACE FUNCTION public.notify_new_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_admin_notification(
    'solicitacao',
    NEW.id,
    'Nova solicitação de cadastro',
    NEW.name
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_request
AFTER INSERT ON public.establishment_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_request();

-- Trigger: new claim -> notification
CREATE OR REPLACE FUNCTION public.notify_new_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_admin_notification(
    'reivindicacao',
    NEW.id,
    'Nova reivindicação de empresa',
    COALESCE(NEW.requester_name, 'Usuário')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_claim
AFTER INSERT ON public.establishment_claims
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_claim();

-- Trigger: new highlight request -> notification
CREATE OR REPLACE FUNCTION public.notify_new_highlight()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_admin_notification(
    'destaque',
    NEW.id,
    'Nova solicitação de destaque',
    NULL
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_highlight
AFTER INSERT ON public.highlight_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_highlight();
