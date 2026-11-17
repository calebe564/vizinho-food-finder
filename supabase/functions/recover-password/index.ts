import {
  clientIp,
  handle,
  HttpError,
  json,
  rateLimit,
  readJson,
  serviceClient,
  sha256Hex,
  sleep,
  tooMany,
} from "../_shared/security.ts";

// Recuperação de senha feita 100% no servidor:
//  1. limita tentativas (por IP e por e-mail);
//  2. confere e-mail + nome + data de nascimento + senha secundária (PIN) no banco;
//  3. só então troca a senha com a chave de serviço.
// A resposta de erro é sempre a mesma, para não revelar qual dado está errado.

const GENERIC_FAIL = "Dados de recuperação incorretos. Verifique email, nome, data de nascimento e senha secundária.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Mesmo formato usado no cadastro (src/lib/authUtils.ts -> hashPin), para continuar
// compatível com os PINs que já estão salvos.
const hashPin = (pin: string) => sha256Hex(pin + "salt_comercio_vizinho");

Deno.serve(handle(async (req) => {
  const ip = clientIp(req);
  const body = await readJson(req, 4_000);

  const email = typeof body.email === "string" ? body.email.toLowerCase().trim().slice(0, 254) : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  const birthDate = typeof body.birthDate === "string" ? body.birthDate.trim() : "";
  const recoveryPin = typeof body.recoveryPin === "string" ? body.recoveryPin.slice(0, 64) : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword.slice(0, 72) : "";

  if (!EMAIL_RE.test(email) || fullName.length < 3 || !DATE_RE.test(birthDate) || recoveryPin.length < 4) {
    throw new HttpError(400, GENERIC_FAIL);
  }
  if (newPassword.length < 8) throw new HttpError(400, "A nova senha deve ter pelo menos 8 caracteres.");

  // Se o limitador falhar, bloqueia (failClosed): é um endpoint sensível.
  const okIp = await rateLimit(`recover:ip:${ip}`, 8, 900, true);
  const okEmail = await rateLimit(`recover:email:${email}`, 5, 3600, true);
  if (!okIp || !okEmail) return tooMany(req, "Muitas tentativas. Tente novamente mais tarde.");

  const admin = serviceClient();

  const { data: userId, error } = await admin.rpc("verify_recovery_pin_enhanced", {
    _email: email,
    _pin_hash: await hashPin(recoveryPin),
    _full_name: fullName,
    _birth_date: birthDate,
  });

  if (error || !userId || typeof userId !== "string") {
    await sleep(400 + Math.floor(Math.random() * 300)); // dificulta medir tempo de resposta
    throw new HttpError(400, GENERIC_FAIL);
  }

  // Contas administrativas não podem ser recuperadas por este caminho.
  const { data: role } = await admin.rpc("get_user_role", { _user_id: userId });
  if (role === "adm_master" || role === "admin" || role === "pre_adm") {
    console.warn(`recover-password: tentativa em conta administrativa (${userId}) ip ${ip}`);
    await sleep(400);
    throw new HttpError(400, GENERIC_FAIL);
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (updateError) {
    console.error("recover-password: updateUserById falhou:", updateError.message);
    throw new HttpError(500, "Não foi possível atualizar a senha. Entre em contato com o administrador.");
  }

  return json(req, { success: true, message: "Senha atualizada com sucesso! Faça login com sua nova senha." });
}));
