# Comércio Vizinho – correções de segurança

> Aplicado sobre o repositório `calebe564/vizinho-food-finder` (Remix do Comércio Vizinho, backend `khnhzqpqumzligzjjhtc`). O passo 6 (patch do ai-search) já está feito neste commit, e o `tools/` não é necessário aqui.

Pacote com o código corrigido. A estrutura de pastas é a mesma do projeto: copie por cima do repositório.

## O que foi corrigido

| # | Gravidade | Problema | Correção |
|---|-----------|----------|----------|
| 1 | Crítico | `setup-admin` e `create-initial-admin` tinham senha/PIN do admin escritos no código e estavam públicas (qualquer um podia redefinir a senha do admin) | Funções apagadas e removidas do `config.toml` |
| 2 | Crítico | **Qualquer usuário cadastrado podia virar `adm_master`**: o papel era concedido por trigger quando um perfil era inserido com o e-mail do dono, e o e-mail do perfil é escolhido pelo próprio usuário | Trigger removido; `is_adm_master`/`get_user_role` usam o e-mail de `auth.users`; e-mail do perfil forçado pelo banco; índice único de e-mail |
| 3 | Crítico | Funções internas do banco (`create_admin_session`, `verify_recovery_pin_enhanced`, `check_email_exists`…) chamáveis por visitantes | `REVOKE` para anon/authenticated; só `service_role` executa |
| 4 | Alto | Funções de IA públicas, sem limite e com `messages` livres (inclusive `role: system`) | Validação de entrada, limite de tamanho, limite de uso por IP/usuário (no banco), `max_tokens` |
| 5 | Alto | Recuperação de senha quebrada (tentava logar com o PIN como senha) e verificável pelo navegador | Nova função `recover-password`: verifica e troca a senha no servidor, com limite de tentativas; contas admin não podem ser recuperadas por ela |
| 6 | Alto | `validate-admin`: comparação de senha não constante, limitador "falha aberta", token = hash guardado no banco, fallback no front que dava acesso sem sessão | Reescrita: exige login de admin, comparação em tempo constante, limitador "falha fechada", token aleatório com HMAC amarrado ao usuário, fallback removido |
| 7 | Médio | `ai-search`/`ai-location-suggest` usavam a chave de serviço (ignora RLS) e devolviam mensagens internas de erro | Chave pública (RLS vale), erros genéricos |
| 8 | Médio | Cadastro: checagem de e-mail vazava existência; perfil não era criado com confirmação de e-mail | Cadastro revisado; perfil criado no primeiro login se necessário |
| 9 | Médio | Mensagens do suporte: usuário comum podia enviar como `sender_type = 'admin'` | Trigger bloqueia |
| 10 | Baixo | `useUserRole` podia redirecionar admin por um instante | Corrigido |
| 11 | Baixo | `check-email` (sem uso) permitia descobrir e-mails cadastrados | Função apagada |

## Ordem para aplicar (importante)

1. **Troque agora a senha e o PIN do admin** (e qualquer outro lugar onde `Jv151206@`, `Jo151206@` ou `151206` sejam usados). O histórico do git guarda os valores antigos mesmo depois de apagar.
2. **Aplique a migration** `supabase/migrations/20261116000000_security_hardening.sql` (antes das funções novas).
3. **Rode `supabase/audit.sql`** e confira se existe algum administrador que você não reconhece. Se existir, remova o papel e troque as senhas.
4. **Apague** as pastas `supabase/functions/setup-admin`, `supabase/functions/create-initial-admin` e `supabase/functions/check-email` (e as funções já publicadas).
5. **Copie** os arquivos deste pacote por cima do projeto.
6. **Rode o patch do ai-search** (arquivo grande, alterado por script): `python3 tools/patch_ai_search.py supabase/functions/ai-search/index.ts`. Se algum trecho não casar, o script para sem alterar nada.
7. **Secrets das funções:** confirme `ADMIN_PASSWORD` (a nova senha do admin). Opcionais: `ADMIN_SESSION_SECRET` (texto longo aleatório) e `ALLOWED_ORIGINS` (ex.: `https://seusite.com.br,*.lovable.app`). Sem `ALLOWED_ORIGINS` o CORS continua aberto como antes.
8. Publique e teste: login, busca, assistente, cadastro de empresa, recuperação de senha e login no painel admin.

## O que mudou no comportamento

- Recuperação de senha agora funciona de verdade. Contas admin não recuperam por ali.
- Sessão do painel admin dura 8 horas (antes 24) e é amarrada ao usuário.
- Visitantes sem login ainda usam busca, assistente e o ajudante de cadastro, mas com limite por IP.
- Novos cadastros exigem senha com 8+ caracteres e PIN com 6+ (contas antigas não são afetadas).

## Não alterado / pontos de atenção

- Não li todas as 50 migrations nem todas as páginas. As políticas de RLS que revisei estão boas, exceto o item 2.
- O hash do PIN continua SHA-256 com sal fixo (compatível com os PINs já salvos). Vale migrar para um esquema mais forte numa próxima etapa.
- `login_attempts` é gravado pelo navegador; serve só como registro, não como proteção.
- Teste feito: checagem de tipos das edge functions (Deno) e dos arquivos do front, e testes das funções auxiliares. Não rodei contra o banco real.
