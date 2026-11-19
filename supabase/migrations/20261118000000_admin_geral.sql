-- Troca o administrador geral (adm_master) para o e-mail do dono deste app.
-- O papel continua exigindo DUAS coisas: o e-mail de auth.users E uma linha
-- adm_master em user_roles. Esta migration NÃO concede o papel a ninguém:
-- depois que a pessoa se cadastrar, o papel é dado por um administrador.
CREATE OR REPLACE FUNCTION public.is_adm_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.user_roles ur ON ur.user_id = u.id
    WHERE u.id = _user_id
      AND lower(u.email) = 'calebesouzamartins45@gmail.com'
      AND ur.role = 'adm_master'
  )
$$;
