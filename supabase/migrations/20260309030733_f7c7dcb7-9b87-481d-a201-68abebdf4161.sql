
CREATE OR REPLACE FUNCTION public.check_duplicate_establishment_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  clean_phone text;
  clean_whatsapp text;
BEGIN
  clean_phone := regexp_replace(COALESCE(NEW.phone, ''), '\D', '', 'g');
  clean_whatsapp := regexp_replace(COALESCE(NEW.whatsapp, ''), '\D', '', 'g');

  -- Check against existing establishments
  IF length(clean_phone) >= 10 THEN
    IF EXISTS (
      SELECT 1 FROM public.establishments
      WHERE regexp_replace(phone, '\D', '', 'g') = clean_phone
         OR regexp_replace(COALESCE(whatsapp, ''), '\D', '', 'g') = clean_phone
    ) THEN
      RAISE EXCEPTION 'Já existe uma empresa cadastrada com este telefone/WhatsApp.';
    END IF;
  END IF;

  IF length(clean_whatsapp) >= 10 AND clean_whatsapp != clean_phone THEN
    IF EXISTS (
      SELECT 1 FROM public.establishments
      WHERE regexp_replace(phone, '\D', '', 'g') = clean_whatsapp
         OR regexp_replace(COALESCE(whatsapp, ''), '\D', '', 'g') = clean_whatsapp
    ) THEN
      RAISE EXCEPTION 'Já existe uma empresa cadastrada com este telefone/WhatsApp.';
    END IF;
  END IF;

  -- Check against pending requests
  IF length(clean_phone) >= 10 THEN
    IF EXISTS (
      SELECT 1 FROM public.establishment_requests
      WHERE status = 'pending'
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (regexp_replace(phone, '\D', '', 'g') = clean_phone
          OR regexp_replace(COALESCE(whatsapp, ''), '\D', '', 'g') = clean_phone)
    ) THEN
      RAISE EXCEPTION 'Já existe uma solicitação pendente com este telefone/WhatsApp.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_duplicate_request_before_insert
  BEFORE INSERT ON public.establishment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_duplicate_establishment_request();
