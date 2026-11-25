// Teste das regras de personalização visual em um Postgres de verdade (PGlite, em memória).
// Rodar com: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const migration = readFileSync(resolve(here, '../migrations/20261122000000_personalizacao_visual.sql'), 'utf8');
const db = new PGlite();

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  ok  ', msg); } else { fail++; console.log('  FAIL', msg); } };
async function throws(sql, msg, match) {
  const wanted = [].concat(match ?? []);
  try { await db.exec(sql); fail++; console.log('  FAIL', msg, '(não deu erro)'); }
  catch (e) { const good = wanted.length === 0 || wanted.some((m) => String(e.message).includes(m)); good ? (pass++, console.log('  ok  ', msg)) : (fail++, console.log('  FAIL', msg, '->', String(e.message).slice(0, 120))); }
}
const q = async (sql) => { try { return (await db.query(sql)).rows; } catch (e) { throw new Error(`${e.message} | SQL: ${sql.slice(0, 110)}`); } };
const as = async (uid, role = 'authenticated') => {
  await db.exec(`reset role; select set_config('test.uid', '${uid ?? ''}', false), set_config('test.role', '${role}', false)`);
  await db.exec(role === 'anon' ? 'set role anon' : 'set role authenticated');
};

const OWN_START = '11111111-1111-1111-1111-111111111111';
const OWN_PRO = '22222222-2222-2222-2222-222222222222';
const OWN_MAX = '33333333-3333-3333-3333-333333333333';
const ADMIN = '44444444-4444-4444-4444-444444444444';
const E_START = 'aaaaaaaa-0000-0000-0000-000000000001';
const E_PRO = 'aaaaaaaa-0000-0000-0000-000000000002';
const E_MAX = 'aaaaaaaa-0000-0000-0000-000000000003';
const E_OFF = 'aaaaaaaa-0000-0000-0000-000000000009';

try {
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true),'')::uuid $$;
  create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('test.role', true),''),'anon') $$;
  create function public.is_platform_admin(_u uuid) returns boolean language sql stable security definer as $$ select _u = '${ADMIN}'::uuid $$;
  create table public.plan_configurations (plan_name text primary key, max_products int not null default 5);
  insert into public.plan_configurations (plan_name) values ('gratuito'),('basico'),('start'),('pro'),('max');
  create table public.establishments (id uuid primary key, name text, plan text not null default 'gratuito', active boolean default true);
  create table public.user_establishments (user_id uuid, establishment_id uuid);
  grant usage on schema public, auth to anon, authenticated, service_role;
  insert into public.establishments values ('${E_START}','Loja Start','start',true),('${E_PRO}','Loja Pro','pro',true),('${E_MAX}','Loja Max','max',true),('${E_OFF}','Inativa','max',false);
  insert into public.user_establishments values ('${OWN_START}','${E_START}'),('${OWN_PRO}','${E_PRO}'),('${OWN_MAX}','${E_MAX}'),('${OWN_MAX}','${E_OFF}');
`);

console.log('\n== 1. A migration roda (e roda de novo)');
await db.exec(migration); ok(true, 'primeira execução');
await db.exec(migration); ok(true, 'segunda execução (idempotente)');
await db.exec(`grant all on public.establishment_themes to authenticated, service_role; grant select on public.establishment_themes to anon;
               grant select on public.plan_configurations, public.establishments, public.user_establishments to anon, authenticated;
               grant update on public.establishments to authenticated; -- (no banco real a equipe tem política para isso)`);

console.log('\n== 2. Nível de personalização de cada plano');
const lv = Object.fromEntries((await q(`select plan_name, customization_level from public.plan_configurations`)).map(r => [r.plan_name, r.customization_level]));
ok(lv.gratuito === 'none' && lv.start === 'none' && lv.basico === 'none', 'sem plano, gratuito e Start: tema padrão');
ok(lv.pro === 'basic' && lv.max === 'advanced', 'Pro: básico; Max: avançado');

console.log('\n== 3. Cada plano só guarda o que pode');
await as(OWN_START);
await throws(`insert into public.establishment_themes (establishment_id, primary_color) values ('${E_START}','#1048E8')`, 'Start não personaliza', 'não inclui personalização');
await as(OWN_PRO);
await db.exec(`insert into public.establishment_themes (establishment_id, primary_color) values ('${E_PRO}','#DB2777')`); ok(true, 'Pro guarda a cor principal');
await throws(`update public.establishment_themes set secondary_color='#F59E0B' where establishment_id='${E_PRO}'`, 'Pro não guarda cor secundária', 'plano Max');
await throws(`update public.establishment_themes set corner_style='reto' where establishment_id='${E_PRO}'`, 'Pro não muda o estilo dos cantos', 'plano Max');
await db.exec(`update public.establishment_themes set primary_color='#15803D' where establishment_id='${E_PRO}'`); ok(true, 'Pro troca a cor principal');
await as(OWN_MAX);
await db.exec(`insert into public.establishment_themes (establishment_id, primary_color, secondary_color, corner_style) values ('${E_MAX}','#7C3AED','#10B981','arredondado')`); ok(true, 'Max guarda cor principal, secundária e cantos');

console.log('\n== 4. Só cores válidas entram (nada de texto livre)');
for (const bad of ['red', '#fff', '#12345', '#1234567', '#GGGGGG', "#1048E8'; drop table x;--", '#1048E8;background:url(http://x)', 'javascript:alert(1)']) {
  await throws(`update public.establishment_themes set primary_color='${bad.replace(/'/g, "''")}' where establishment_id='${E_MAX}'`, `recusa "${bad.slice(0, 30)}"`, 'check');
}
await throws(`update public.establishment_themes set corner_style='redondo' where establishment_id='${E_MAX}'`, 'estilo de cantos inválido', 'check');

console.log('\n== 5. Quem pode mexer em quê');
await as(OWN_PRO);
await throws(`insert into public.establishment_themes (establishment_id, primary_color) values ('${E_MAX}','#000000')`, 'dono não personaliza a empresa de outro', 'row-level security');
await db.exec(`update public.establishment_themes set primary_color='#000000' where establishment_id='${E_MAX}'`);
await as(ADMIN);
ok((await q(`select primary_color from public.establishment_themes where establishment_id='${E_MAX}'`))[0].primary_color === '#7C3AED', 'dono não altera tema de outra empresa');
await as(null, 'anon');
await throws(`insert into public.establishment_themes (establishment_id, primary_color) values ('${E_PRO}','#000000')`, 'visitante não grava tema', ['row-level security', 'permission denied']);
ok((await q(`select count(*)::int c from public.establishment_themes`))[0].c === 2, 'visitante lê o tema das empresas ativas (a página pública precisa)');
await as(OWN_MAX);
await db.exec(`insert into public.establishment_themes (establishment_id, primary_color) values ('${E_OFF}','#DB2777')`);
await as(null, 'anon');
ok((await q(`select count(*)::int c from public.establishment_themes where establishment_id='${E_OFF}'`))[0].c === 0, 'tema de empresa inativa não aparece para visitantes');
await as(ADMIN);
await db.exec(`update public.establishment_themes set primary_color='#0D9488', secondary_color='#E11D48' where establishment_id='${E_PRO}'`); ok(true, 'equipe ajusta o tema de qualquer empresa');

console.log('\n== 6. Plano rebaixado e voltar ao padrão');
await as(ADMIN);
await db.exec(`update public.establishments set plan='start' where id='${E_MAX}'`);
await as(OWN_MAX);
ok((await q(`select count(*)::int c from public.establishment_themes where establishment_id='${E_MAX}'`))[0].c === 1, 'o tema guardado continua lá depois de rebaixar (a página decide o que mostrar pelo plano atual)');
await throws(`update public.establishment_themes set primary_color='#15803D' where establishment_id='${E_MAX}'`, 'rebaixado a Start não edita mais', 'não inclui personalização');
await db.exec(`delete from public.establishment_themes where establishment_id='${E_MAX}'`);
ok((await q(`select count(*)::int c from public.establishment_themes where establishment_id='${E_MAX}'`))[0].c === 0, 'mesmo rebaixado, o dono pode voltar ao tema padrão');

console.log(`\nResultado: ${pass} ok, ${fail} falhas`);
process.exit(fail ? 1 : 0);
} catch (e) {
  console.log('\nERRO INESPERADO NO TESTE:', String(e.message).slice(0, 300));
  process.exit(1);
}
