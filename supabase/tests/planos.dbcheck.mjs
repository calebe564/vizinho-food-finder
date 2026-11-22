import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

// Teste das regras de planos em um Postgres de verdade (PGlite, em memória), sem tocar no banco real.
// Rodar com: npm run test:db
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const migration = readFileSync(resolve(here, '../migrations/20261119000000_planos_start_pro_max.sql'), 'utf8');
const db = new PGlite();

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  ok  ', msg); } else { fail++; console.log('  FAIL', msg); } };
async function throws(sql, msg, match) {
  try { await db.exec(sql); fail++; console.log('  FAIL', msg, '(não deu erro)'); }
  catch (e) { const good = !match || String(e.message).includes(match); good ? (pass++, console.log('  ok  ', msg)) : (fail++, console.log('  FAIL', msg, '->', e.message)); }
}
const q = async (sql) => (await db.query(sql)).rows;
const as = async (uid, role = 'authenticated') => {
  await db.exec(`reset role; select set_config('test.uid', '${uid ?? ''}', false), set_config('test.role', '${role}', false)`);
  await db.exec(role === 'service_role' ? 'set role service_role' : role === 'anon' ? 'set role anon' : 'set role authenticated');
};

const OWNER = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const ADMIN = '33333333-3333-3333-3333-333333333333';
const E1 = 'aaaaaaaa-0000-0000-0000-000000000001';
const E2 = 'aaaaaaaa-0000-0000-0000-000000000002';
const E3 = 'aaaaaaaa-0000-0000-0000-000000000003';

// ---- esquema mínimo parecido com o do Supabase ----
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true),'')::uuid $$;
  create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('test.role', true),''),'anon') $$;
  create type public.app_role as enum ('admin','user','adm_master','gestor','dono_empresa','pre_adm','empresario');
  create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid, role public.app_role);
  create function public.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security definer as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
  create function public.is_adm_master(_user_id uuid) returns boolean language sql stable security definer as $$
    select exists(select 1 from auth.users u join public.user_roles ur on ur.user_id=u.id where u.id=_user_id and lower(u.email)='calebesouzamartins45@gmail.com' and ur.role='adm_master') $$;
  create table public.establishments (id uuid primary key default gen_random_uuid(), name text, plan text not null default 'gratuito', active boolean default true);
  create table public.user_establishments (user_id uuid, establishment_id uuid);
  create table public.products (id uuid primary key default gen_random_uuid(), establishment_id uuid, name text);
  create table public.plan_configurations (id uuid primary key default gen_random_uuid(), plan_name text unique not null, max_products int not null default 5, visibility_weight int not null default 1, promotion_boost numeric not null default 1, display_label text not null, created_at timestamptz default now(), updated_at timestamptz default now());
  insert into public.plan_configurations (plan_name, max_products, visibility_weight, promotion_boost, display_label) values ('gratuito',5,5,1.0,'Free'),('basico',20,20,1.5,'Basic'),('pro',-1,80,2.5,'Pro');
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant all on all tables in schema public to authenticated, service_role;
  grant select on all tables in schema public to anon;
  grant select on auth.users to authenticated, service_role;
  insert into auth.users values ('${OWNER}','dono@x.com'),('${OTHER}','outro@x.com'),('${ADMIN}','admin@x.com');
  insert into public.user_roles (user_id, role) values ('${ADMIN}','admin');
  insert into public.establishments (id, name, plan) values ('${E1}','Loja 1','basico'),('${E2}','Loja 2','gratuito'),('${E3}','Loja 3','gratuito');
  insert into public.user_establishments values ('${OWNER}','${E1}'),('${OWNER}','${E2}'),('${OTHER}','${E3}');
`);

console.log('\n== 1. A migration roda (e roda de novo sem erro)');
await db.exec(migration); ok(true, 'primeira execução');
await db.exec(migration); ok(true, 'segunda execução (idempotente)');
await db.exec('grant all on all tables in schema public to authenticated, service_role; grant select on all tables in schema public to anon;');

console.log('\n== 2. Planos');
let plans = await q(`select plan_name, price_cents, max_products, is_public, visibility_weight, promotion_boost from public.plan_configurations order by sort_order`);
const pub = plans.filter(p => p.is_public);
ok(pub.length === 3, 'três planos públicos');
ok(JSON.stringify(pub.map(p => [p.plan_name, p.price_cents, p.max_products])) === JSON.stringify([['start',2490,15],['pro',3790,30],['max',5370,50]]), 'Start 24,90/15, Pro 37,90/30, Max 53,70/50');
ok(plans.every(p => p.visibility_weight === 1 && Number(p.promotion_boost) === 1), 'pesos de visibilidade neutros (plano não dá vantagem)');
ok((await q(`select plan from public.establishments where id='${E1}'`))[0].plan === 'start', 'plano antigo "basico" migrou para start');

console.log('\n== 3. Dono não troca o próprio plano');
await as(OWNER);
await throws(`update public.establishments set plan='max' where id='${E2}'`, 'dono tenta virar Max: bloqueado', 'só pode ser alterado pela equipe');
await db.exec(`update public.establishments set name='Loja 2 renomeada' where id='${E2}'`); ok(true, 'dono ainda edita outros campos');
await as(ADMIN); await db.exec(`update public.establishments set plan='max' where id='${E3}'`); ok(true, 'admin troca plano diretamente');
await as(OWNER); await db.exec(`insert into public.establishments (id, name, plan) values ('aaaaaaaa-0000-0000-0000-0000000000ff','Nova','max')`);
ok((await q(`select plan from public.establishments where id='aaaaaaaa-0000-0000-0000-0000000000ff'`))[0].plan === 'gratuito', 'empresa nova criada por não-admin sempre nasce "gratuito"');

console.log('\n== 4. Solicitação de plano pelo dono');
await as(OWNER);
await db.exec(`insert into public.subscriptions (establishment_id, plan_name, wants_launch_offer, requested_by) values ('${E2}','start', true, '${OWNER}')`); ok(true, 'dono cria solicitação pendente');
await throws(`insert into public.subscriptions (establishment_id, plan_name, status, requested_by) values ('${E1}','pro','active','${OWNER}')`, 'dono não cria assinatura já ativa', 'row-level security');
await throws(`insert into public.subscriptions (establishment_id, plan_name, price_cents, requested_by) values ('${E1}','pro', 1, '${OWNER}')`, 'dono não define preço', 'row-level security');
await throws(`insert into public.subscriptions (establishment_id, plan_name, requested_by) values ('${E3}','pro','${OWNER}')`, 'dono não pede plano de empresa alheia', 'row-level security');
await throws(`insert into public.subscriptions (establishment_id, plan_name, requested_by) values ('${E1}','gratuito','${OWNER}')`, 'não pede plano que não é público', 'row-level security');
await throws(`insert into public.subscriptions (establishment_id, plan_name, requested_by) values ('${E2}','pro','${OWNER}')`, 'segunda solicitação pendente da mesma empresa é recusada', 'duplicate key');
ok((await q(`select count(*)::int c from public.subscriptions`))[0].c === 1, 'dono enxerga só as próprias solicitações');
await as(OTHER); ok((await q(`select count(*)::int c from public.subscriptions`))[0].c === 0, 'outro dono não enxerga solicitação alheia');

console.log('\n== 5. Campanha de lançamento (vagas reais)');
await as(null, 'anon');
let camp = (await q(`select * from public.get_launch_campaign()`))[0];
ok(camp.spots_total === 50 && camp.spots_used === 0 && camp.spots_remaining === 50 && camp.is_open === true, 'visitante vê 50 vagas, 0 usadas');
ok(camp.promo_price_cents === 1500 && camp.promo_months === 3 && camp.regular_price_cents === 2490, 'promo R$15 por 3 meses; depois R$24,90');
await throws(`select public.activate_subscription((select id from public.subscriptions limit 1))`, 'visitante não ativa plano', 'permission denied');
await as(OWNER);
await throws(`select public.activate_subscription((select id from public.subscriptions limit 1))`, 'dono não ativa o próprio plano', 'Apenas administradores');
await as(ADMIN);
const sub = (await q(`select * from public.activate_subscription((select id from public.subscriptions limit 1))`))[0];
ok(sub.status === 'active' && sub.price_cents === 1500 && sub.campaign_id !== null, 'admin ativa com condição de lançamento: R$15');
ok(new Date(sub.promo_ends_at) > new Date(Date.now() + 80*24*3600*1000), 'promoção dura cerca de 3 meses');
ok((await q(`select plan from public.establishments where id='${E2}'`))[0].plan === 'start', 'plano da empresa virou start');
await as(null, 'anon');
camp = (await q(`select * from public.get_launch_campaign()`))[0];
ok(camp.spots_used === 1 && camp.spots_remaining === 49, 'vagas calculadas pelas adesões reais: 1 usada, 49 restantes');

console.log('\n== 6. Vagas esgotadas');
await as(ADMIN);
await db.exec(`update public.launch_campaigns set spots_total = 1`);
await as(null, 'anon');
camp = (await q(`select * from public.get_launch_campaign()`))[0];
ok(camp.is_open === false && camp.spots_remaining === 0, 'com 1/1 usada, a campanha fecha');
await as(OTHER);
await db.exec(`insert into public.subscriptions (establishment_id, plan_name, wants_launch_offer, requested_by) values ('${E3}','start', true, '${OTHER}')`);
await as(ADMIN);
await throws(`select public.activate_subscription((select id from public.subscriptions where establishment_id='${E3}'))`, 'ativar com promoção sem vaga: bloqueado', 'vagas da campanha');
const sub2 = (await q(`select * from public.activate_subscription((select id from public.subscriptions where establishment_id='${E3}'), false)`))[0];
ok(sub2.price_cents === 2490 && sub2.campaign_id === null, 'sem a promoção: preço normal R$24,90');

console.log('\n== 7. Limite de produtos no banco (tabela products)');
await as(OWNER);
for (let i = 1; i <= 15; i++) await db.exec(`insert into public.products (establishment_id, name) values ('${E2}','p${i}')`);
ok(true, 'plano Start aceita 15 produtos');
await throws(`insert into public.products (establishment_id, name) values ('${E2}','p16')`, 'o 16º produto é bloqueado', 'Limite de 15 produtos');
const firstId = (await q(`select id from public.products where establishment_id='${E2}' limit 1`))[0].id;
await db.exec(`insert into public.products (id, establishment_id, name) values ('${firstId}','${E2}','editado') on conflict (id) do update set name = excluded.name`);
ok((await q(`select name from public.products where id='${firstId}'`))[0].name === 'editado', 'editar um produto no limite (upsert) não é bloqueado');
await db.exec(`delete from public.products where id='${firstId}'`);
await db.exec(`insert into public.products (establishment_id, name) values ('${E2}','novo')`); ok(true, 'remover libera espaço para outro');
await as(ADMIN);
await db.exec(`insert into public.products (establishment_id, name) values ('${E2}','admin-extra')`); ok(true, 'administrador não é limitado');
await db.exec(`update public.establishments set plan='gratuito' where id='${E2}'`);
await as(OWNER);
await throws(`insert into public.products (establishment_id, name) values ('${E2}','depois-do-downgrade')`, 'rebaixado para o plano gratuito: não adiciona mais', 'Limite de 5 produtos');
await as(ADMIN); await db.exec(`update public.establishments set plan='start' where id='${E2}'`);
await as(OWNER);
for (let i = 1; i <= 15; i++) await db.exec(`insert into public.products (establishment_id, name) values ('${E1}','q${i}')`);
ok(true, 'empresa migrada de "basico" para start também tem 15');

console.log('\n== 8. Fim da promoção');
await as(ADMIN);
await db.exec(`update public.subscriptions set promo_ends_at = now() - interval '1 day' where status='active' and campaign_id is not null`);
const n = (await q(`select public.expire_launch_promos() as n`))[0].n;
ok(n === 1, 'uma promoção vencida foi encerrada');
ok((await q(`select plan from public.establishments where id='${E2}'`))[0].plan === 'gratuito', 'empresa volta a "gratuito" até escolher um plano regular');
await as(null, 'anon');
ok((await q(`select spots_used from public.get_launch_campaign()`))[0].spots_used === 1, 'a vaga continua contada como usada (sem falsa disponibilidade)');

console.log(`\nResultado: ${pass} ok, ${fail} falhas`);
process.exit(fail ? 1 : 0);
