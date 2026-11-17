-- =====================================================================
-- AUDITORIA - rode no SQL Editor do backend (Lovable Cloud > Database)
-- Somente leitura. Serve para saber se alguém explorou a falha antiga.
-- =====================================================================

-- 1) Quem tem papel privilegiado? Só você/o dono e pessoas que você conhece
--    deveriam aparecer aqui. Qualquer nome estranho = invasão.
SELECT u.id, u.email, u.created_at, u.last_sign_in_at, ur.role, ur.created_at AS role_granted_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role::text IN ('adm_master', 'admin', 'pre_adm', 'gestor')
ORDER BY ur.created_at DESC;

-- 2) Perfis cujo e-mail NÃO bate com o e-mail real da conta (sinal da fraude antiga).
SELECT p.user_id, p.email AS email_no_perfil, u.email AS email_real, p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE lower(p.email) <> lower(u.email);

-- 3) E-mails duplicados em profiles (impedem o índice único da migration).
SELECT lower(email) AS email, count(*) AS qtd
FROM public.profiles
GROUP BY lower(email)
HAVING count(*) > 1;

-- 4) Sessões administrativas recentes (o nome da tabela pode ser diferente; se der erro, ignore este item).
SELECT *
FROM public.admin_sessions
ORDER BY 1
LIMIT 50;

-- 5) Último login e tentativas de login do e-mail do dono nos últimos 30 dias.
SELECT *
FROM public.login_attempts
WHERE lower(email) = 'johnvictorsf1512@gmail.com'
ORDER BY 1 DESC
LIMIT 100;

-- 6) Se encontrar um papel indevido, remova assim (troque o UUID):
-- DELETE FROM public.user_roles WHERE user_id = '00000000-0000-0000-0000-000000000000' AND role::text IN ('adm_master','admin');
