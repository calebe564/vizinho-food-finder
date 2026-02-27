
-- Remove defaults incorretos
ALTER TABLE establishments ALTER COLUMN city SET DEFAULT 'Belo Horizonte';
ALTER TABLE establishments ALTER COLUMN state SET DEFAULT 'MG';

-- Adicionar constraint de tamanho no estado
ALTER TABLE establishments ADD CONSTRAINT state_two_chars CHECK (char_length(state::text) = 2);

-- Criar função de validação de UF
CREATE OR REPLACE FUNCTION public.validate_state_uf()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  valid_ufs text[] := ARRAY['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
BEGIN
  -- Normalizar estado
  NEW.state := UPPER(TRIM(NEW.state::text));
  
  -- Validar UF
  IF NEW.state IS NULL OR NOT (NEW.state::text = ANY(valid_ufs)) THEN
    RAISE EXCEPTION 'Estado inválido: %. Deve ser uma UF válida do Brasil.', NEW.state;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para establishments
CREATE TRIGGER validate_establishment_state
BEFORE INSERT OR UPDATE ON establishments
FOR EACH ROW
EXECUTE FUNCTION public.validate_state_uf();

-- Mesmo para establishment_requests
ALTER TABLE establishment_requests ALTER COLUMN state SET DEFAULT 'MG';

CREATE OR REPLACE FUNCTION public.validate_request_state_uf()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  valid_ufs text[] := ARRAY['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
BEGIN
  IF NEW.state IS NOT NULL THEN
    NEW.state := UPPER(TRIM(NEW.state::text));
    IF NOT (NEW.state::text = ANY(valid_ufs)) THEN
      RAISE EXCEPTION 'Estado inválido: %. Deve ser uma UF válida do Brasil.', NEW.state;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_request_state
BEFORE INSERT OR UPDATE ON establishment_requests
FOR EACH ROW
EXECUTE FUNCTION public.validate_request_state_uf();
