// Teste das regras do painel do comerciante em um Postgres de verdade (PGlite, em memória).
// Rodar com: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const mig = (name) => readFileSync(resolve(here, '../migrations', name), 'utf8');
const db = new PGlite({ extensions: { pg_trgm, unaccent } });

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  ok  ', msg); } else { fail++; console.log('  FAIL', msg); } };
async function throws(sql, msg, match) {
  const wanted = [].concat(match ?? []);
  try { await db.exec(sql); fail++; console.log('  FAIL', msg, '(não deu erro)'); }
  catch (e) { const good = wanted.length === 0 || wanted.some((m) => String(e.message).includes(m)); good ? (pass++, console.log('  ok  ', msg)) : (fail++, console.log('  FAIL', msg, '->', e.message)); }
}
const q = async (sql) => (await db.query(sql)).rows;
const as = async (uid, role = 'authenticated') => {
  await db.exec(`reset role; select set_config('test.uid', '${uid ?? ''}', false), set_config('test.role', '${role}', false)`);
  await db.exec(role === 'anon' ? 'set role anon' : 'set role authenticated');
};

const OWNER = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const ADMIN = '33333333-3333-3333-3333-333333333333';
const E1 = 'aaaaaaaa-0000-0000-0000-000000000001';
const E2 = 'aaaaaaaa-0000-0000-0000-000000000002';
const E_OFF = 'aaaaaaaa-0000-0000-0000-000000000009';
const P1 = 'bbbbbbbb-0000-0000-0000-000000000001';
const P2 = 'bbbbbbbb-0000-0000-0000-000000000002';
const P_OTHER = 'bbbbbbbb-0000-0000-0000-000000000003';

try {
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth; create schema extensions;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true),'')::uuid $$;
  create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('test.role', true),''),'anon') $$;
  create function public.is_platform_admin(_u uuid) returns boolean language sql stable security definer as $$ select _u = '${ADMIN}'::uuid $$;
  create type public.establishment_category as enum ('restaurante','pizzaria','padaria');
  create table public.establishments (id uuid primary key, name text, category public.establishment_category default 'restaurante', category_2 text, category_3 text,
    neighborhood text, city text, profile_image text, description text, rating_average numeric, rating_count integer default 0,
    is_paid boolean default false, is_destaque boolean default false, plan text default 'gratuito', active boolean default true);
  create table public.user_establishments (user_id uuid, establishment_id uuid);
  create table public.products (id uuid primary key default gen_random_uuid(), establishment_id uuid not null, name text not null, price numeric not null default 1, unit text, description text, image text);
  create table public.product_variations (id uuid primary key default gen_random_uuid(), product_id uuid not null, name text, price numeric);
  create table public.establishment_statistics (id uuid primary key default gen_random_uuid(), establishment_id uuid, page_views integer default 0, phone_clicks integer default 0, banner_views integer default 0, last_updated timestamptz);
  create table public.security_rate_limits (key text primary key, window_start timestamptz not null default now(), hits integer not null default 0);
  create function public.rl_hit(_key text, _max integer, _window_seconds integer) returns boolean language plpgsql security definer set search_path = public as $$
  declare current_hits integer; begin
    insert into public.security_rate_limits as r (key, window_start, hits) values (_key, now(), 1)
    on conflict (key) do update set hits = case when r.window_start < now() - make_interval(secs => _window_seconds) then 1 else r.hits + 1 end,
      window_start = case when r.window_start < now() - make_interval(secs => _window_seconds) then now() else r.window_start end
    returning hits into current_hits;
    return current_hits <= _max; end $$;
  revoke all on table public.security_rate_limits from public, anon, authenticated;
  revoke execute on function public.rl_hit(text, integer, integer) from public, anon, authenticated;
  grant usage on schema public, auth, extensions to anon, authenticated, service_role;
  grant all on all tables in schema public to authenticated, service_role;
  grant select, insert, update, delete on public.establishment_statistics to anon, authenticated;
  grant select on all tables in schema public to anon;
  revoke all on table public.security_rate_limits from public, anon, authenticated;
  alter table public.products enable row level security;
  alter table public.product_variations enable row level security;
  create policy "Anyone can view products" on public.products for select using (true);
  create policy "Anyone can view variations" on public.product_variations for select using (true);
  create policy "Admins manage products" on public.products for all to authenticated using (public.is_platform_admin(auth.uid())) with check (public.is_platform_admin(auth.uid()));
  create policy "Admins manage variations" on public.product_variations for all to authenticated using (public.is_platform_admin(auth.uid())) with check (public.is_platform_admin(auth.uid()));
  insert into auth.users values ('${OWNER}','dono@x.com'),('${OTHER}','outro@x.com'),('${ADMIN}','adm@x.com');
  insert into public.establishments (id, name, active) values ('${E1}','Loja 1',true),('${E2}','Loja 2',true),('${E_OFF}','Inativa',false);
  insert into public.user_establishments values ('${OWNER}','${E1}'),('${OTHER}','${E2}');
  insert into public.products (id, establishment_id, name) values ('${P1}','${E1}','Produto 1'),('${P2}','${E1}','Produto 2'),('${P_OTHER}','${E2}','Produto da Loja 2');
  insert into public.establishment_statistics (establishment_id) values ('${E1}');
`);

console.log('\n== 1. Migrations (a da busca e a do painel) rodam, e rodam de novo');
await db.exec(mig('20261117000000_comercio_servicos_bussola.sql')); ok(true, 'migration da busca (base)');
await db.exec(mig('20261121000000_painel_comerciante.sql')); ok(true, 'migration do painel');
await db.exec(mig('20261121000000_painel_comerciante.sql')); ok(true, 'painel: segunda execução (idempotente)');
// (no Supabase, tabelas novas já nascem com permissões padrão; aqui só repetimos isso para as que a migration não restringe)
await db.exec(`grant all on public.products, public.product_variations, public.user_establishments, public.establishments to authenticated, service_role;
               grant select on public.products, public.product_variations, public.establishments to anon;`);

console.log('\n== 2. Dono gerencia os próprios produtos');
await as(OWNER);
await db.exec(`insert into public.products (establishment_id, name, category) values ('${E1}','Novo','Bebidas')`); ok(true, 'dono cadastra produto na própria empresa');
await db.exec(`update public.products set is_available = false where id='${P1}'`);
ok((await q(`select is_available from public.products where id='${P1}'`))[0].is_available === false, 'dono marca produto como indisponível');
await throws(`insert into public.products (establishment_id, name) values ('${E2}','Invasor')`, 'dono não cadastra em empresa alheia', 'row-level security');
await db.exec(`update public.products set name='Hackeado' where id='${P_OTHER}'`);
await as(ADMIN);
ok((await q(`select name from public.products where id='${P_OTHER}'`))[0].name === 'Produto da Loja 2', 'dono não altera produto alheio');
await as(OWNER);
await db.exec(`insert into public.product_variations (product_id, name, price) values ('${P2}','Grande', 10)`); ok(true, 'dono cria variação no próprio produto');
await throws(`insert into public.product_variations (product_id, name, price) values ('${P_OTHER}','X', 1)`, 'dono não cria variação em produto alheio', 'row-level security');
await db.exec(`delete from public.products where name='Novo'`); ok(true, 'dono apaga o próprio produto');
await as(null, 'anon');
await throws(`insert into public.products (establishment_id, name) values ('${E1}','Anônimo')`, 'visitante não cadastra produto', ['row-level security', 'permission denied']);

console.log('\n== 3. Registro de eventos (visitas e cliques)');
await as(null, 'anon');
const ev = async (type, sess, est = E1, prod = 'null') =>
  (await q(`select public.track_event('${est}','${type}',${prod === 'null' ? 'null' : `'${prod}'`}::uuid,'${sess}') as r`))[0].r;
ok(await ev('profile_view', 'sessao-aaaaaaaa') === true, 'visita ao perfil é registrada');
ok(await ev('profile_view', 'sessao-aaaaaaaa') === false, 'a mesma pessoa recarregando em 30 min não conta de novo');
ok(await ev('profile_view', 'sessao-bbbbbbbb') === true, 'outra pessoa conta');
ok(await ev('product_view', 'sessao-aaaaaaaa', E1, P2) === true, 'visualização de produto é registrada');
ok(await ev('product_view', 'sessao-aaaaaaaa', E1, P_OTHER) === false, 'produto de outra empresa não vale');
ok(await ev('product_view', 'sessao-cccccccc') === false, 'visualização de produto sem produto não vale');
ok(await ev('whatsapp_click', 'sessao-aaaaaaaa') === true, 'clique no WhatsApp 1/3');
ok(await ev('whatsapp_click', 'sessao-aaaaaaaa') === true, 'clique no WhatsApp 2/3');
ok(await ev('whatsapp_click', 'sessao-aaaaaaaa') === true, 'clique no WhatsApp 3/3');
ok(await ev('whatsapp_click', 'sessao-aaaaaaaa') === false, 'o 4º clique seguido é ignorado');
ok(await ev('inventado', 'sessao-dddddddd') === false, 'tipo de evento desconhecido é recusado');
ok(await ev('profile_view', 'curto') === false, 'identificador de sessão inválido é recusado');
ok(await ev('profile_view', 'sessao-eeeeeeee', E_OFF) === false, 'empresa inativa não registra');
ok(await ev('profile_view', 'sessao-eeeeeeee', 'cccccccc-0000-0000-0000-000000000000') === false, 'empresa inexistente não registra');
await as(OWNER);
ok(await ev('profile_view', 'sessao-ffffffff') === false, 'visita do próprio dono não conta');
await as(ADMIN);
ok(await ev('profile_view', 'sessao-gggggggg') === false, 'visita da equipe não conta');
await as(OTHER);
ok(await ev('profile_view', 'sessao-hhhhhhhh') === true, 'dono de OUTRA empresa conta como visitante');

console.log('\n== 4. Ninguém escreve estatística por fora');
await as(null, 'anon');
await throws(`insert into public.establishment_events (establishment_id, event_type) values ('${E1}','profile_view')`, 'visitante não grava evento direto', 'permission denied');
await throws(`update public.establishment_statistics set page_views = 999999`, 'visitante não infla o contador antigo', 'permission denied');
await as(OWNER);
await throws(`update public.establishment_statistics set page_views = 999999`, 'nem o dono infla o contador antigo', 'permission denied');
ok((await q(`select count(*)::int c from public.establishment_events`))[0].c === 0, 'dono não lê eventos brutos (a tabela só mostra algo à equipe)');
await as(ADMIN);
const legacy = (await q(`select page_views, phone_clicks from public.establishment_statistics where establishment_id='${E1}'`))[0];
ok(legacy.page_views === 3 && legacy.phone_clicks === 3, 'contadores antigos acompanham os eventos reais (3 visitas, 3 cliques)');

console.log('\n== 5. Números do painel');
await as(OWNER);
const m = (await q(`select public.get_establishment_metrics('${E1}', 30) as m`))[0].m;
ok(m.totals.profile_view === 3, 'visitas ao perfil: 3 (só as que contaram)');
ok(m.totals.product_view === 1 && m.totals.whatsapp_click === 3, 'visualizações de produto: 1; cliques no WhatsApp: 3');
ok(m.unique_visitors === 3, 'visitantes distintos: 3');
ok(m.days === 30 && Array.isArray(m.daily) && m.daily.length >= 30, 'série diária cobre o período');
ok(m.daily[m.daily.length - 1].profile_view === 3, 'as visitas de hoje aparecem no último dia');
ok(m.top_products.length === 1 && m.top_products[0].name === 'Produto 2', 'produto mais visto');
ok(!!m.first_event_at, 'informa desde quando há dados');
await as(OTHER);
const mine = (await q(`select public.get_establishment_metrics('${E2}', 7) as m`))[0].m;
ok((mine.totals.profile_view ?? 0) === 0 && mine.days === 7, 'a outra empresa só vê os próprios números (zero visitas na dela)');
await throws(`select public.get_establishment_metrics('${E1}', 30)`, 'dono não vê números de empresa alheia', 'Sem permissão');
await as(null, 'anon');
await throws(`select public.get_establishment_metrics('${E1}', 30)`, 'visitante não vê números', 'permission denied');
await as(ADMIN);
ok((await q(`select public.get_establishment_metrics('${E1}', 9999) as m`))[0].m.days === 365, 'administrador consulta; período limitado a 365 dias');

console.log('\n== 6. Busca: disponibilidade e ordem justa');
await as(ADMIN);
await db.exec(`insert into public.establishments (id, name, active, is_destaque, is_paid, plan) values
  ('dddddddd-0000-0000-0000-000000000001','Pizza Zeta',true,true,true,'max'),
  ('dddddddd-0000-0000-0000-000000000002','Pizza Alfa',true,false,false,'gratuito')`);
await db.exec(`insert into public.products (establishment_id, name, is_available) values ('${E1}','Pizza de calabresa', true), ('${E1}','Pizza de queijo', false)`);
await as(null, 'anon');
let res = await q(`select kind, name from public.search_directory('pizza')`);
ok(res.findIndex(r => r.name === 'Pizza Alfa') < res.findIndex(r => r.name === 'Pizza Zeta'), 'empresa paga e em destaque NÃO passa na frente (empate decide por nome)');
ok(res.some(r => r.name === 'Pizza de calabresa'), 'produto disponível aparece');
ok(!res.some(r => r.name === 'Pizza de queijo'), 'produto indisponível NÃO aparece');

console.log(`\nResultado: ${pass} ok, ${fail} falhas`);
process.exit(fail ? 1 : 0);
} catch (e) {
  console.log('\nERRO INESPERADO NO TESTE:', String(e.message).slice(0, 300));
  process.exit(1);
}
