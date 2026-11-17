import {
  clientIp,
  handle,
  hmacHex,
  HttpError,
  json,
  randomToken,
  rateLimit,
  readJson,
  requireUser,
  safeEqual,
  serviceClient,
  tooMany,
} from "../_shared/security.ts";

// Ações:
//   login            { password }  -> valida a senha do painel e cria uma sessão (devolve o token)
//   verify           { password }  -> só confere a senha (ações sensíveis), sem criar sessão
//   validate_session { token }     -> confere se a sessão ainda é válida para ESTE usuário
//   logout           { token }     -> revoga a sessão
//
// Todas exigem o login de um usuário com papel admin/adm_master.
// O token enviado ao navegador é o valor aleatório; o banco guarda só um HMAC dele,
// amarrado ao id do usuário (um token roubado não funciona para outra conta).

const SESSION_HOURS = 8;

Deno.serve(handle(async (req) => {
  const user = await requireUser(req);
  const ip = clientIp(req);
  const admin = serviceClient();

  const secret = Deno.env.get("ADMIN_SESSION_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const hashToken = (token: string) => hmacHex(`${user.id}:${token}`, secret);

  // O papel vem do banco, nunca do cliente.
  const { data: role } = await admin.rpc("get_user_role", { _user_id: user.id });
  if (role !== "adm_master" && role !== "admin") {
    console.warn(`validate-admin: usuário ${user.id} sem papel de admin`);
    throw new HttpError(403, "Acesso não autorizado para este usuário");
  }

  const body = await readJson(req, 2_000);
  const action = typeof body.action === "string" ? body.action : "login";

  if (action === "validate_session") {
    const token = typeof body.token === "string" ? body.token : "";
    if (token.length < 32 || token.length > 200) return json(req, { success: false, valid: false });
    const { data } = await admin.rpc("validate_admin_session", { _token_hash: await hashToken(token) });
    const row = Array.isArray(data) ? data[0] : null;
    if (row?.valid) return json(req, { success: true, valid: true, role });
    return json(req, { success: false, valid: false });
  }

  if (action === "logout") {
    const token = typeof body.token === "string" ? body.token : "";
    if (token.length >= 32 && token.length <= 200) {
      await admin.rpc("revoke_admin_session", { _token_hash: await hashToken(token) });
    }
    return json(req, { success: true });
  }

  if (action !== "login" && action !== "verify") throw new HttpError(400, "Ação inválida");

  // Tentativas de senha: limite por IP e por usuário. Se o limitador falhar, bloqueia.
  const okIp = await rateLimit(`admin-pw:ip:${ip}`, 10, 900, true);
  const okUser = await rateLimit(`admin-pw:user:${user.id}`, 6, 900, true);
  if (!okIp || !okUser) return tooMany(req, "Muitas tentativas. Tente novamente em 15 minutos.");

  const adminPassword = Deno.env.get("ADMIN_PASSWORD");
  if (!adminPassword) {
    console.error("ADMIN_PASSWORD não configurada");
    throw new HttpError(500, "Sistema não configurado");
  }

  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  const valid = password.length > 0 && (await safeEqual(password, adminPassword));
  if (!valid) {
    console.warn(`validate-admin: senha incorreta (usuário ${user.id}, ip ${ip})`);
    return json(req, { success: false, sessionToken: null, message: "Senha incorreta" });
  }

  if (action === "verify") return json(req, { success: true, message: "Acesso autorizado" });

  const sessionToken = randomToken(32);
  const { error } = await admin.rpc("create_admin_session", {
    _user_id: user.id,
    _token_hash: await hashToken(sessionToken),
    _ip_address: ip,
    _user_agent: (req.headers.get("user-agent") || "unknown").slice(0, 300),
    _expires_hours: SESSION_HOURS,
  });
  if (error) {
    console.error("create_admin_session falhou:", error);
    throw new HttpError(500, "Erro interno");
  }

  return json(req, { success: true, sessionToken, message: "Acesso autorizado", expiresInHours: SESSION_HOURS });
}));
