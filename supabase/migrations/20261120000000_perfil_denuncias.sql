-- =====================================================================
-- ETAPA 4 - PERFIL DA EMPRESA E DENÚNCIAS
--
-- * Retirada: a empresa informa se trabalha com retirada (além de delivery).
-- * Denúncias de empresas e produtos, com análise humana pela equipe.
--   Qualquer pessoa pode denunciar (com ou sem login) pela função
--   submit_report, que valida os dados, evita duplicidade e limita o volume.
--   Ninguém além do próprio denunciante e da equipe lê as denúncias.
-- =====================================================================

ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS has_pickup boolean;

-- ---------------------------------------------------------------------
-- Denúncias
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('establishment', 'product')),
  target_id uuid NOT NULL,
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (reason IN (
    'produto_proibido', 'falsificado', 'golpe_fraude', 'informacao_falsa', 'conteudo_ofensivo', 'outro'
  )),
  details text CHECK (details IS NULL OR char_length(details) <= 1000),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_contact text CHECK (reporter_contact IS NULL OR char_length(reporter_contact) <= 200),
  status text NOT NULL DEFAULT 'aberta'
    CHECK (status IN ('aberta', 'em_analise', 'procedente', 'improcedente', 'arquivada')),
  handled_by uuid,
  handled_at timestamptz,
  resolution text CHECK (resolution IS NULL OR char_length(resolution) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_status_created_idx ON public.reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_establishment_idx ON public.reports (establishment_id);
CREATE INDEX IF NOT EXISTS reports_target_idx ON public.reports (target_type, target_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Não há política de INSERT: só a função submit_report cria denúncias.
DROP POLICY IF EXISTS "Reporters and admins read reports" ON public.reports;
CREATE POLICY "Reporters and admins read reports"
  ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins manage reports" ON public.reports;
CREATE POLICY "Platform admins manage reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins delete reports" ON public.reports;
CREATE POLICY "Platform admins delete reports"
  ON public.reports FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- Envio de denúncia
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_report(
  _target_type text,
  _target_id uuid,
  _reason text,
  _details text DEFAULT NULL,
  _contact text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  est_id uuid;
  who text;
  ip text;
  details_clean text;
  contact_clean text;
  new_id uuid;
BEGIN
  IF _target_type NOT IN ('establishment', 'product') THEN
    RAISE EXCEPTION 'Tipo de denúncia inválido.';
  END IF;
  IF _reason NOT IN ('produto_proibido', 'falsificado', 'golpe_fraude', 'informacao_falsa', 'conteudo_ofensivo', 'outro') THEN
    RAISE EXCEPTION 'Escolha um motivo para a denúncia.';
  END IF;

  details_clean := nullif(btrim(coalesce(_details, '')), '');
  IF details_clean IS NOT NULL AND char_length(details_clean) > 1000 THEN
    RAISE EXCEPTION 'A descrição pode ter no máximo 1000 caracteres.';
  END IF;
  IF _reason = 'outro' AND details_clean IS NULL THEN
    RAISE EXCEPTION 'Descreva o problema para podermos analisar.';
  END IF;

  contact_clean := nullif(btrim(coalesce(_contact, '')), '');
  IF contact_clean IS NOT NULL AND (
       char_length(contact_clean) > 200
       OR NOT (contact_clean ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' OR contact_clean ~ '^[0-9()+\-\s]{8,20}$')
     ) THEN
    RAISE EXCEPTION 'Informe um e-mail ou telefone válido para retorno, ou deixe em branco.';
  END IF;

  -- o alvo precisa existir e estar visível
  IF _target_type = 'establishment' THEN
    SELECT e.id INTO est_id FROM public.establishments e WHERE e.id = _target_id AND e.active IS NOT FALSE;
  ELSE
    SELECT p.establishment_id INTO est_id
      FROM public.products p
      JOIN public.establishments e ON e.id = p.establishment_id AND e.active IS NOT FALSE
     WHERE p.id = _target_id;
  END IF;
  IF est_id IS NULL THEN
    RAISE EXCEPTION 'Não encontramos o item que você quer denunciar.';
  END IF;

  -- quem está denunciando: a conta, ou o endereço de rede quando não há login
  BEGIN
    ip := split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1);
  EXCEPTION WHEN OTHERS THEN
    ip := '';
  END;
  who := coalesce(auth.uid()::text, nullif(btrim(ip), ''), 'anon');

  -- mesma pessoa denunciando o mesmo item de novo em 24h: já recebemos, não duplica.
  -- (usa o limitador, assim o endereço de rede não é gravado junto da denúncia)
  IF NOT public.rl_hit('reportdup:' || who || ':' || _target_id::text, 1, 86400) THEN
    RETURN NULL;
  END IF;

  IF NOT public.rl_hit('report:' || who, 5, 3600) THEN
    RAISE EXCEPTION 'Muitas denúncias em pouco tempo. Tente de novo mais tarde.';
  END IF;

  INSERT INTO public.reports (target_type, target_id, establishment_id, reason, details, reporter_id, reporter_contact)
  VALUES (_target_type, _target_id, est_id, _reason, details_clean, auth.uid(), contact_clean)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_report(text, uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_report(text, uuid, text, text, text) TO anon, authenticated;
