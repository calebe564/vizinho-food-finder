// Teste das regras de denúncias em um Postgres de verdade (PGlite, em memória).
// Rodar com: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const migration = readFileSync(resolve(here, '../migrations/20261120000000_perfil_denuncias.sql'), 'utf8');
const db = new PGlite();

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  ok  ', msg); } else { fail++; console.log('  FAIL', msg); } };
async function throws(sql, msg, match) {
  try { await db.exec(sql); fail++; console.log('  FAIL', msg, '(não deu erro)'); }
  catch (e) { const good = !match || String(e.message).includes(match); good ? (pass++, console.log('  ok  ', msg)) : (fail++, console.log('  FAIL', msg, '->', e.message)); }
}
const q = async (sql) => (await db.query(sql)).rows;
const as = async (uid, role = 'authenticated', headers = '') => {
  await db.exec(`reset role; select set_config('test.uid', '${uid ?? ''}', false), set_config('test.role', '${role}', false), set_config('request.headers', '${headers}', false)`);
  await db.exec(role === 'anon' ? 'set role anon' : 'set role authenticated');
};

const USER_A = '11111111-1111-1111-1111-111111111111';
const USER_B = '22222222-2222-2222-2222-222222222222';
const ADMIN = '33333333-3333-3333-3333-333333333333';
const E1 = 'aaaaaaaa-0000-0000-0000-000000000001';
const E_OFF = 'aaaaaaaa-0000-0000-0000-000000000009';
const P1 = 'bbbbbbbb-0000-0000-0000-000000000001';

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true),'')::uuid $$;
  create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('test.role', true),''),'anon') $$;
  create function public.is_platform_admin(_u uuid) returns boolean language sql stable security definer as $$ select _u = '${ADMIN}'::uuid $$;
  create table public.establishments (id uuid primary key, name text, active boolean default true);
  create table public.products (id uuid primary key, establishment_id uuid, name text);
  -- limitador (cópia do que a migration de segurança cria)
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
  grant usage on schema public, auth to anon, authenticated, service_role;
  insert into auth.users values ('${USER_A}','a@x.com'),('${USER_B}','b@x.com'),('${ADMIN}','adm@x.com');
  insert into public.establishments values ('${E1}','Loja 1',true),('${E_OFF}','Loja inativa',false);
  insert into public.products values ('${P1}','${E1}','Produto 1');
`);

console.log('\n== 1. A migration roda (e roda de novo)');
await db.exec(migration); ok(true, 'primeira execução');
await db.exec(migration); ok(true, 'segunda execução (idempotente)');
await db.exec(`grant all on all tables in schema public to authenticated, service_role; grant select on all tables in schema public to anon;
               revoke all on table public.security_rate_limits from public, anon, authenticated;`);

console.log('\n== 2. Enviar denúncia');
await as(null, 'anon');
const r1 = (await q(`select public.submit_report('establishment','${E1}','golpe_fraude','Pediu pagamento adiantado','11999990000') as id`))[0].id;
ok(typeof r1 === 'string' && r1.length > 10, 'visitante sem login consegue denunciar uma empresa');
await as(ADMIN);
let rows = await q(`select * from public.reports`);
ok(rows.length === 1 && rows[0].status === 'aberta' && rows[0].reporter_id === null && rows[0].establishment_id === E1, 'denúncia nasce "aberta", sem conta e ligada à empresa');
await as(USER_A);
const r2 = (await q(`select public.submit_report('product','${P1}','produto_proibido','Vende item proibido', null) as id`))[0].id;
ok(!!r2, 'usuário logado denuncia um produto');
await as(ADMIN);
rows = await q(`select establishment_id, reporter_id from public.reports where target_type='product'`);
ok(rows[0].establishment_id === E1 && rows[0].reporter_id === USER_A, 'a empresa do produto é preenchida pelo servidor e a conta fica registrada');

console.log('\n== 3. Validações');
await as(USER_B);
await throws(`select public.submit_report('establishment','${E1}','motivo_inventado')`, 'motivo inválido', 'motivo');
await throws(`select public.submit_report('loja','${E1}','outro','x')`, 'tipo inválido', 'Tipo de denúncia');
await throws(`select public.submit_report('establishment','${E1}','outro')`, 'motivo "outro" exige descrição', 'Descreva o problema');
await throws(`select public.submit_report('establishment','${E1}','golpe_fraude','${'x'.repeat(1001)}')`, 'descrição acima de 1000', '1000 caracteres');
await throws(`select public.submit_report('establishment','${E1}','golpe_fraude','x','nao-e-contato')`, 'contato inválido', 'e-mail ou telefone');
await throws(`select public.submit_report('establishment','cccccccc-0000-0000-0000-000000000000','golpe_fraude','x')`, 'item inexistente', 'Não encontramos');
await throws(`select public.submit_report('establishment','${E_OFF}','golpe_fraude','x')`, 'empresa inativa não aparece para denúncia', 'Não encontramos');

console.log('\n== 4. Segurança dos dados');
await as(USER_B);
await throws(`insert into public.reports (target_type, target_id, reason) values ('establishment','${E1}','outro')`, 'não dá para inserir direto na tabela', 'row-level security');
ok((await q(`select count(*)::int c from public.reports`))[0].c === 0, 'outra pessoa não enxerga denúncias alheias');
await as(USER_A);
ok((await q(`select count(*)::int c from public.reports`))[0].c === 1, 'quem denunciou enxerga a própria');
await db.exec(`update public.reports set status='arquivada'`);
await as(ADMIN);
ok((await q(`select status from public.reports where reporter_id='${USER_A}'`))[0].status === 'aberta', 'denunciante não consegue alterar o andamento');
await db.exec(`update public.reports set status='procedente', handled_by='${ADMIN}', handled_at=now(), resolution='Anúncio removido'`);
ok((await q(`select count(*)::int c from public.reports where status='procedente'`))[0].c === 2, 'administrador analisa e registra o resultado');
ok((await q(`select count(*)::int c from public.reports`))[0].c === 2, 'administrador enxerga todas');
await as(null, 'anon');
ok((await q(`select count(*)::int c from public.reports`))[0].c === 0, 'visitante sem login não enxerga nenhuma denúncia');

console.log('\n== 5. Duplicidade e limite de volume');
await as(USER_B);
const first = (await q(`select public.submit_report('establishment','${E1}','falsificado','x') as id`))[0].id;
const again = (await q(`select public.submit_report('establishment','${E1}','falsificado','x') as id`))[0].id;
ok(!!first && again === null, 'mesma pessoa, mesmo item, em 24h: segunda vez não duplica');
await as(ADMIN);
ok((await q(`select count(*)::int c from public.reports where reporter_id='${USER_B}'`))[0].c === 1, 'só uma linha foi criada');
// 5 por hora por pessoa
await as(USER_B);
const alvos = [];
for (let i = 2; i <= 6; i++) {
  const id = `bbbbbbbb-0000-0000-0000-00000000000${i}`;
  alvos.push(id);
  await as(ADMIN); await db.exec(`insert into public.products values ('${id}','${E1}','P${i}')`); await as(USER_B);
}
for (let i = 0; i < 4; i++) await db.exec(`select public.submit_report('product','${alvos[i]}','falsificado','x')`);
ok(true, 'até 5 denúncias por hora são aceitas');
await throws(`select public.submit_report('product','${alvos[4]}','falsificado','x')`, 'a 6ª denúncia na hora é barrada', 'Muitas denúncias');
// anônimo: o limite usa o endereço de rede
await as(null, 'anon', '{"x-forwarded-for":"9.9.9.9, 10.0.0.1"}');
for (let i = 0; i < 5; i++) {
  await as(ADMIN); await db.exec(`insert into public.products values ('dddddddd-0000-0000-0000-00000000000${i}','${E1}','D${i}')`);
  await as(null, 'anon', '{"x-forwarded-for":"9.9.9.9, 10.0.0.1"}');
  await db.exec(`select public.submit_report('product','dddddddd-0000-0000-0000-00000000000${i}','golpe_fraude','x')`);
}
await as(ADMIN); await db.exec(`insert into public.products values ('dddddddd-0000-0000-0000-0000000000ff','${E1}','Dx')`);
await as(null, 'anon', '{"x-forwarded-for":"9.9.9.9, 10.0.0.1"}');
await throws(`select public.submit_report('product','dddddddd-0000-0000-0000-0000000000ff','golpe_fraude','x')`, 'visitante: o 6º envio do mesmo endereço é barrado', 'Muitas denúncias');
await as(null, 'anon', '{"x-forwarded-for":"8.8.8.8"}');
await db.exec(`select public.submit_report('product','dddddddd-0000-0000-0000-0000000000ff','golpe_fraude','x')`); ok(true, 'outro endereço não é afetado');
await as(ADMIN);
ok((await q(`select count(*)::int c from public.reports where reporter_id is null and reporter_contact is distinct from '11999990000'`))[0].c >= 6, 'denúncias anônimas registradas');
const cols = (await q(`select column_name from information_schema.columns where table_name='reports'`)).map(r => r.column_name);
ok(!cols.some(c => /ip|address|header/.test(c)), 'o endereço de rede não é gravado na denúncia');

console.log(`\nResultado: ${pass} ok, ${fail} falhas`);
process.exit(fail ? 1 : 0);
